-- Make savings skills affect payout instead of maturity time.
-- Run this after growth-missions.sql / growth-missions-fix2.sql.

create or replace function create_investment(
  p_project_id uuid,
  p_child_id   uuid,
  p_amount     integer,
  p_skill_bonus_percent integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project investment_projects%rowtype;
  v_child_family uuid;
  v_balance integer;
  v_effective_bonus_percent integer;
  v_payout integer;
  v_matures_at timestamptz;
  v_investment_id uuid;
  v_tx_id uuid;
begin
  select family_id into v_child_family
  from children
  where id = p_child_id;

  if v_child_family is null then
    raise exception 'child_not_found';
  end if;

  select * into v_project
  from investment_projects
  where id = p_project_id
    and family_id = v_child_family
    and status = 'active';

  if not found then
    raise exception 'project_not_found';
  end if;

  if p_amount < v_project.min_amount or p_amount > v_project.max_amount then
    raise exception 'amount_out_of_range';
  end if;

  select coalesce(sum(points), 0) into v_balance
  from point_transactions
  where child_id = p_child_id;

  if v_balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  v_effective_bonus_percent :=
    least(25, v_project.bonus_percent + greatest(0, coalesce(p_skill_bonus_percent, 0)));
  v_payout := p_amount + floor(p_amount::numeric * v_effective_bonus_percent / 100)::integer;
  v_matures_at := now() + (v_project.duration_days || ' days')::interval;

  insert into child_investments (
    project_id, child_id, family_id,
    amount, bonus_percent, payout_amount,
    matures_at
  )
  values (
    p_project_id, p_child_id, v_child_family,
    p_amount, v_effective_bonus_percent, v_payout,
    v_matures_at
  )
  returning id into v_investment_id;

  insert into point_transactions (
    child_id, family_id, title, points, type,
    source_task_submission_id, source_reward_redemption_id, created_by
  )
  values (
    p_child_id, v_child_family,
    'Копилка: ' || v_project.title,
    -p_amount,
    'investment_deposit',
    null, null, null
  )
  returning id into v_tx_id;

  update child_investments
  set deposit_tx_id = v_tx_id
  where id = v_investment_id;

  return v_investment_id;
end;
$$;

grant execute on function create_investment(uuid, uuid, integer, integer) to anon, authenticated;
