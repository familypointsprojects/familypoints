-- ─────────────────────────────────────────────────────────────────────────────
-- Growth Missions (Копилки роста) — DB migration
-- Run this in the Supabase SQL editor after the base schema.sql + rls.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend point_transactions.type to include investment events
-- (drop existing CHECK, re-add with two new values)
alter table point_transactions
  drop constraint if exists point_transactions_type_check;

alter table point_transactions
  add constraint point_transactions_type_check
  check (type in (
    'earn',
    'spend',
    'penalty',
    'manual_adjustment',
    'investment_deposit',
    'investment_payout'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. investment_projects — parent-created missions
-- ─────────────────────────────────────────────────────────────────────────────
create table investment_projects (
  id            uuid        primary key default gen_random_uuid(),
  family_id     uuid        not null references families(id)   on delete cascade,
  created_by    uuid        not null references profiles(id),
  title         text        not null,
  description   text,
  duration_days integer     not null check (duration_days  > 0),
  bonus_percent integer     not null check (bonus_percent >= 0 and bonus_percent <= 1000),
  min_amount    integer     not null check (min_amount    > 0),
  max_amount    integer     not null check (max_amount   >= min_amount),
  status        text        not null default 'active'
                            check (status in ('active', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index investment_projects_family_id_idx on investment_projects(family_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. child_investments — per-child deposits
-- child_id references children(id) (same as other tables in this schema)
-- bonus_percent and payout_amount are ALWAYS set server-side via RPC
-- ─────────────────────────────────────────────────────────────────────────────
create table child_investments (
  id            uuid        primary key default gen_random_uuid(),
  project_id    uuid        not null references investment_projects(id) on delete restrict,
  child_id      uuid        not null references children(id)   on delete cascade,
  family_id     uuid        not null references families(id)   on delete cascade,

  amount        integer     not null check (amount        > 0),
  -- snapshot values locked at deposit time — never supplied by client directly
  bonus_percent integer     not null check (bonus_percent >= 0),
  payout_amount integer     not null check (payout_amount >= amount),

  deposited_at  timestamptz not null default now(),
  matures_at    timestamptz not null,   -- deposited_at + duration_days
  claimed_at    timestamptz,            -- null until claimed

  deposit_tx_id uuid        references point_transactions(id) on delete set null,
  payout_tx_id  uuid        references point_transactions(id) on delete set null,

  created_at    timestamptz not null default now()
);

create index child_investments_child_id_idx   on child_investments(child_id);
create index child_investments_project_id_idx on child_investments(project_id);
create index child_investments_family_id_idx  on child_investments(family_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table investment_projects enable row level security;
alter table child_investments   enable row level security;

-- investment_projects: any family member can read active projects
create policy "Members read investment projects"
  on investment_projects for select
  using (is_family_member(family_id));

-- only the parent who created the family can insert
create policy "Parents insert investment projects"
  on investment_projects for insert
  with check (
    created_by = auth.uid()
    and is_family_member(family_id)
    and exists (
      select 1 from family_members
      where family_members.family_id  = investment_projects.family_id
        and family_members.profile_id = auth.uid()
        and family_members.role       = 'parent'
    )
  );

-- parents can update (title, description, duration, bonus, amounts, status)
create policy "Parents update investment projects"
  on investment_projects for update
  using (
    is_family_member(family_id)
    and exists (
      select 1 from family_members
      where family_members.family_id  = investment_projects.family_id
        and family_members.profile_id = auth.uid()
        and family_members.role       = 'parent'
    )
  );

-- child_investments: parents see all in family, children see only their own
create policy "Read child investments"
  on child_investments for select
  using (
    -- parent in same family
    (
      is_family_member(family_id)
      and exists (
        select 1 from family_members
        where family_members.family_id  = child_investments.family_id
          and family_members.profile_id = auth.uid()
          and family_members.role       = 'parent'
      )
    )
    -- or the child themselves
    or can_access_child(child_id)
  );

-- Direct INSERT/UPDATE on child_investments is BLOCKED.
-- All writes go through security-definer RPCs below.

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC: create_investment
--    Called by a child. Validates, deducts points, creates investment row.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function create_investment(
  p_project_id uuid,
  p_child_id   uuid,   -- children.id (from AuthSession.childId)
  p_amount     integer
)
returns uuid   -- child_investments.id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project       investment_projects%rowtype;
  v_child_family  uuid;
  v_balance       integer;
  v_payout        integer;
  v_matures_at    timestamptz;
  v_investment_id uuid;
  v_tx_id         uuid;
begin
  -- 1. Verify caller owns this children record
  --    (children.profile_id must match auth.uid())
  select family_id into v_child_family
  from children
  where id = p_child_id
    and profile_id = auth.uid();

  if v_child_family is null then
    raise exception 'not_your_child_record';
  end if;

  -- 2. Load and validate project belongs to the same family and is active
  select * into v_project
  from investment_projects
  where id = p_project_id
    and family_id = v_child_family
    and status    = 'active';

  if not found then
    raise exception 'project_not_found';
  end if;

  -- 3. Validate amount
  if p_amount < v_project.min_amount or p_amount > v_project.max_amount then
    raise exception 'amount_out_of_range';
  end if;

  -- 4. Check balance (sum of all point_transactions for this child)
  select coalesce(sum(points), 0) into v_balance
  from point_transactions
  where child_id = p_child_id;

  if v_balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  -- 5. Compute payout: amount + floor(amount * bonus_percent / 100)
  v_payout     := p_amount + floor(p_amount::numeric * v_project.bonus_percent / 100)::integer;
  v_matures_at := now() + (v_project.duration_days || ' days')::interval;

  -- 6. Insert investment row (bonus_percent + payout_amount are server-set)
  insert into child_investments (
    project_id, child_id, family_id,
    amount, bonus_percent, payout_amount,
    matures_at
  )
  values (
    p_project_id, p_child_id, v_child_family,
    p_amount, v_project.bonus_percent, v_payout,
    v_matures_at
  )
  returning id into v_investment_id;

  -- 7. Deduct points via point_transactions
  insert into point_transactions (
    child_id, family_id, title, points, type,
    source_task_submission_id, source_reward_redemption_id, created_by
  )
  values (
    p_child_id, v_child_family,
    'Копилка: ' || v_project.title,
    -p_amount,
    'investment_deposit',
    null, null, auth.uid()
  )
  returning id into v_tx_id;

  -- 8. Back-link transaction to investment
  update child_investments
  set deposit_tx_id = v_tx_id
  where id = v_investment_id;

  return v_investment_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RPC: claim_investment
--    Called by a child after matures_at. Pays out and marks as claimed.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function claim_investment(
  p_investment_id uuid,
  p_child_id      uuid   -- children.id
)
returns integer   -- new balance after payout
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv         child_investments%rowtype;
  v_project_title text;
  v_tx_id       uuid;
  v_balance     integer;
begin
  -- 1. Load + lock row (prevents double-claim race)
  select * into v_inv
  from child_investments
  where id = p_investment_id
  for update;

  if not found then
    raise exception 'investment_not_found';
  end if;

  -- 2. Verify caller owns the children record
  if not exists (
    select 1 from children
    where id = p_child_id and profile_id = auth.uid()
  ) then
    raise exception 'not_your_child_record';
  end if;

  -- 3. Verify ownership of the investment
  if v_inv.child_id <> p_child_id then
    raise exception 'not_your_investment';
  end if;

  -- 4. Already claimed?
  if v_inv.claimed_at is not null then
    raise exception 'already_claimed';
  end if;

  -- 5. Maturity check
  if now() < v_inv.matures_at then
    raise exception 'not_matured_yet';
  end if;

  -- 6. Payout transaction
  select title into v_project_title
  from investment_projects where id = v_inv.project_id;

  insert into point_transactions (
    child_id, family_id, title, points, type,
    source_task_submission_id, source_reward_redemption_id, created_by
  )
  values (
    p_child_id, v_inv.family_id,
    'Выплата копилки: ' || v_project_title,
    v_inv.payout_amount,
    'investment_payout',
    null, null, auth.uid()
  )
  returning id into v_tx_id;

  -- 7. Mark claimed
  update child_investments
  set claimed_at   = now(),
      payout_tx_id = v_tx_id
  where id = p_investment_id;

  -- 8. Return new balance
  select coalesce(sum(points), 0) into v_balance
  from point_transactions
  where child_id = p_child_id;

  return v_balance;
end;
$$;
