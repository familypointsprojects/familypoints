-- ============================================================
-- Child Session Actions
-- Allows invite-based child sessions to submit tasks, add wishes,
-- and request rewards without auth.users accounts.
-- ============================================================

create or replace function submit_child_task(
  child_id_input uuid,
  profile_id_input uuid,
  task_id_input uuid,
  proof_note_input text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child children%rowtype;
  v_task tasks%rowtype;
begin
  select * into v_child
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if not found then
    return json_build_object('error', 'Child session not found');
  end if;

  select * into v_task
  from tasks
  where id = task_id_input
    and family_id = v_child.family_id
    and status = 'active'
    and (child_id is null or child_id = v_child.id);

  if not found then
    return json_build_object('error', 'Task is not available');
  end if;

  if exists (
    select 1
    from task_submissions
    where task_id = v_task.id
      and child_id = v_child.id
      and status = 'pending'
  ) then
    return json_build_object('ok', true);
  end if;

  insert into task_submissions (task_id, child_id, status, photo_url)
  values (v_task.id, v_child.id, 'pending', nullif(trim(proof_note_input), ''));

  return json_build_object('ok', true);
end;
$$;

create or replace function add_child_wish(
  child_id_input uuid,
  profile_id_input uuid,
  title_input text,
  price_input integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child children%rowtype;
begin
  select * into v_child
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if not found then
    return json_build_object('error', 'Child session not found');
  end if;

  if length(trim(title_input)) = 0 then
    return json_build_object('error', 'Invalid wish');
  end if;

  insert into wishes (child_id, title, price, is_archived)
  values (v_child.id, trim(title_input), greatest(price_input, 0), false);

  return json_build_object('ok', true);
end;
$$;

create or replace function create_child_reward_redemption(
  child_id_input uuid,
  profile_id_input uuid,
  reward_id_input uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child children%rowtype;
  v_reward rewards%rowtype;
  v_redemption reward_redemptions%rowtype;
  v_balance integer;
begin
  select * into v_child
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if not found then
    return json_build_object('error', 'Child session not found');
  end if;

  select * into v_reward
  from rewards
  where id = reward_id_input
    and family_id = v_child.family_id
    and is_active = true;

  if not found then
    return json_build_object('error', 'Reward is not available');
  end if;

  select coalesce(sum(points), 0) into v_balance
  from point_transactions
  where child_id = v_child.id;

  if v_balance < v_reward.price then
    return json_build_object('error', 'Not enough points');
  end if;

  if exists (
    select 1
    from reward_redemptions
    where reward_id = v_reward.id
      and child_id = v_child.id
      and status in ('requested', 'approved')
  ) then
    return json_build_object('ok', true);
  end if;

  insert into reward_redemptions (reward_id, child_id, points_spent, status)
  values (v_reward.id, v_child.id, v_reward.price, 'requested')
  returning * into v_redemption;

  insert into point_transactions (
    child_id,
    title,
    points,
    type,
    source_task_submission_id,
    source_reward_redemption_id,
    created_by
  )
  values (
    v_child.id,
    v_reward.title,
    -v_reward.price,
    'spend',
    null,
    v_redemption.id,
    null
  );

  return json_build_object('ok', true);
end;
$$;

create or replace function set_child_favorite_goal(
  child_id_input uuid,
  profile_id_input uuid,
  target_type_input text,
  target_id_input uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child children%rowtype;
begin
  select * into v_child
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if not found then
    return json_build_object('error', 'Child session not found');
  end if;

  if target_type_input not in ('reward', 'wish') then
    return json_build_object('error', 'Invalid favorite goal');
  end if;

  if target_type_input = 'reward' and not exists (
    select 1
    from rewards
    where id = target_id_input
      and family_id = v_child.family_id
      and is_active = true
  ) then
    return json_build_object('error', 'Reward is not available');
  end if;

  if target_type_input = 'wish' and not exists (
    select 1
    from wishes
    where id = target_id_input
      and child_id = v_child.id
      and status = 'approved'
      and is_archived = false
  ) then
    return json_build_object('error', 'Wish is not available');
  end if;

  insert into favorite_goals (child_id, target_type, target_id)
  values (v_child.id, target_type_input, target_id_input)
  on conflict (child_id) do update
  set
    target_type = excluded.target_type,
    target_id = excluded.target_id,
    updated_at = now();

  return json_build_object('ok', true);
end;
$$;

create or replace function clear_child_favorite_goal(
  child_id_input uuid,
  profile_id_input uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child children%rowtype;
begin
  select * into v_child
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if not found then
    return json_build_object('error', 'Child session not found');
  end if;

  delete from favorite_goals
  where child_id = v_child.id;

  return json_build_object('ok', true);
end;
$$;

grant execute on function submit_child_task(uuid, uuid, uuid, text) to anon, authenticated;
grant execute on function add_child_wish(uuid, uuid, text, integer) to anon, authenticated;
grant execute on function create_child_reward_redemption(uuid, uuid, uuid) to anon, authenticated;
grant execute on function set_child_favorite_goal(uuid, uuid, text, uuid) to anon, authenticated;
grant execute on function clear_child_favorite_goal(uuid, uuid) to anon, authenticated;
