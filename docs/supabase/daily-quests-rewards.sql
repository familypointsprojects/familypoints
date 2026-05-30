-- ─── Migration: Daily Quests & Daily Rewards ─────────────────────────────────
-- Run this migration once in Supabase SQL editor.
-- Safe to run on a fresh or existing database.

-- ─── 1. tasks: add daily quest fields ────────────────────────────────────────

alter table tasks
  add column if not exists is_daily boolean not null default false,
  add column if not exists available_days text[] not null default '{}';

-- available_days values: 'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
-- empty array = available every day

-- ─── 2. rewards: add daily reward fields ─────────────────────────────────────

alter table rewards
  add column if not exists is_daily_reward boolean not null default false,
  add column if not exists available_days text[] not null default '{}',
  add column if not exists requires_daily_quests_completed boolean not null default false;

-- ─── 3. Indexes ───────────────────────────────────────────────────────────────

create index if not exists tasks_family_id_is_daily_idx
  on tasks(family_id, is_daily)
  where is_daily = true;

create index if not exists rewards_family_id_is_daily_idx
  on rewards(family_id, is_daily_reward)
  where is_daily_reward = true;

-- Index to speed up "did child submit this daily task today?" check
create index if not exists task_submissions_task_child_submitted_idx
  on task_submissions(task_id, child_id, submitted_at desc);

-- ─── 4. Helper: has_submitted_daily_task_today ───────────────────────────────
-- Returns true if child already has a pending/approved submission for this task today.

create or replace function has_submitted_daily_task_today(
  task_id_input uuid,
  child_id_input uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from task_submissions
    where task_id = task_id_input
      and child_id = child_id_input
      and status in ('pending', 'approved')
      and submitted_at::date = (now() at time zone 'utc')::date
  );
$$;

-- ─── 5. Helper: count_approved_daily_quests_today ────────────────────────────
-- Returns number of daily tasks that have an approved submission today for the child.

create or replace function count_approved_daily_quests_today(
  child_id_input uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct ts.task_id)::integer
  from task_submissions ts
  join tasks t on t.id = ts.task_id
  where ts.child_id = child_id_input
    and ts.status = 'approved'
    and ts.submitted_at::date = (now() at time zone 'utc')::date
    and t.is_daily = true
    and t.status = 'active';
$$;

-- ─── 6. Helper: count_daily_quests_due_today ─────────────────────────────────
-- Returns number of active daily tasks available today for the child's family.
-- Pass the day-of-week as a lowercase English string, e.g. 'monday'.

create or replace function count_daily_quests_due_today(
  family_id_input uuid,
  day_of_week text  -- e.g. 'monday'
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from tasks
  where family_id = family_id_input
    and is_daily = true
    and status = 'active'
    and (
      array_length(available_days, 1) is null
      or array_length(available_days, 1) = 0
      or day_of_week = any(available_days)
    );
$$;

-- ─── 7. purchase_daily_reward (RPC for children) ─────────────────────────────
-- Server-side validation for buying a daily reward.
-- Call via supabase.rpc('purchase_daily_reward', {...})

create or replace function purchase_daily_reward(
  reward_id_input uuid,
  child_id_input  uuid,
  profile_id_input uuid,
  day_of_week     text  -- lowercase English: 'monday', 'tuesday', ...
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward          rewards%rowtype;
  v_family_id       uuid;
  v_balance         integer;
  v_approved_count  integer;
  v_due_count       integer;
  v_redemption_id   uuid;
begin
  -- 1. Verify caller owns the child profile
  select family_id into v_family_id
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if v_family_id is null then
    return jsonb_build_object('error', 'Child not found or access denied');
  end if;

  -- 2. Load reward
  select * into v_reward from rewards where id = reward_id_input;

  if not found then
    return jsonb_build_object('error', 'Reward not found');
  end if;

  -- 3. Reward must belong to the same family
  if v_reward.family_id <> v_family_id then
    return jsonb_build_object('error', 'Reward does not belong to this family');
  end if;

  -- 4. Reward must be active
  if not v_reward.is_active then
    return jsonb_build_object('error', 'Reward is not active');
  end if;

  -- 5. Reward must be a daily reward
  if not v_reward.is_daily_reward then
    return jsonb_build_object('error', 'Reward is not a daily reward');
  end if;

  -- 6. Check day availability
  if array_length(v_reward.available_days, 1) > 0
     and not (day_of_week = any(v_reward.available_days)) then
    return jsonb_build_object('error', 'Reward is not available today');
  end if;

  -- 7. Check daily quests requirement
  if v_reward.requires_daily_quests_completed then
    select count_approved_daily_quests_today(child_id_input) into v_approved_count;
    select count_daily_quests_due_today(v_family_id, day_of_week) into v_due_count;

    if v_approved_count < v_due_count then
      return jsonb_build_object('error', 'Complete all daily quests first');
    end if;
  end if;

  -- 8. Check balance
  select coalesce(sum(points), 0)::integer into v_balance
  from point_transactions
  where child_id = child_id_input;

  if v_balance < v_reward.price then
    return jsonb_build_object('error', 'Not enough points');
  end if;

  -- 9. Create redemption (status = 'requested', spend tx created immediately)
  insert into reward_redemptions(reward_id, child_id, points_spent, status)
  values (reward_id_input, child_id_input, v_reward.price, 'requested')
  returning id into v_redemption_id;

  insert into point_transactions(child_id, title, points, type, source_reward_redemption_id, created_by)
  values (child_id_input, v_reward.title, -v_reward.price, 'spend', v_redemption_id, profile_id_input);

  return jsonb_build_object('redemption_id', v_redemption_id);
end;
$$;
