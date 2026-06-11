create table if not exists favorite_goals (
  child_id uuid primary key references children(id) on delete cascade,
  target_type text not null check (target_type in ('reward', 'wish')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists favorite_goals_target_idx
on favorite_goals(target_type, target_id);

alter table favorite_goals enable row level security;

drop policy if exists "Members can read favorite goals" on favorite_goals;
create policy "Members can read favorite goals"
on favorite_goals for select
using (can_access_child(child_id));

drop policy if exists "Children can create favorite goals" on favorite_goals;
create policy "Children can create favorite goals"
on favorite_goals for insert
with check (can_access_child(child_id));

drop policy if exists "Children can update favorite goals" on favorite_goals;
create policy "Children can update favorite goals"
on favorite_goals for update
using (can_access_child(child_id))
with check (can_access_child(child_id));

drop policy if exists "Children can delete favorite goals" on favorite_goals;
create policy "Children can delete favorite goals"
on favorite_goals for delete
using (can_access_child(child_id));

create or replace function get_child_family_state(
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
  v_family families%rowtype;
begin
  select * into v_child
  from children
  where id = child_id_input
    and profile_id = profile_id_input;

  if not found then
    return json_build_object('error', 'Child session not found');
  end if;

  select * into v_family
  from families
  where id = v_child.family_id;

  return json_build_object(
    'family', row_to_json(v_family),
    'child', row_to_json(v_child),
    'tasks', coalesce((
      select json_agg(tasks order by tasks.created_at desc)
      from tasks
      where tasks.family_id = v_child.family_id
        and tasks.status = 'active'
        and (tasks.child_id is null or tasks.child_id = v_child.id)
    ), '[]'::json),
    'taskSubmissions', coalesce((
      select json_agg(task_submissions order by task_submissions.submitted_at desc)
      from task_submissions
      where task_submissions.child_id = v_child.id
    ), '[]'::json),
    'rewards', coalesce((
      select json_agg(rewards order by rewards.created_at desc)
      from rewards
      where rewards.family_id = v_child.family_id
        and (rewards.child_id is null or rewards.child_id = v_child.id)
    ), '[]'::json),
    'wishes', coalesce((
      select json_agg(wishes order by wishes.created_at desc)
      from wishes
      where wishes.child_id = v_child.id
        and wishes.is_archived = false
    ), '[]'::json),
    'pointTransactions', coalesce((
      select json_agg(point_transactions order by point_transactions.created_at desc)
      from point_transactions
      where point_transactions.child_id = v_child.id
    ), '[]'::json),
    'rewardRedemptions', coalesce((
      select json_agg(reward_redemptions order by reward_redemptions.requested_at desc)
      from reward_redemptions
      where reward_redemptions.child_id = v_child.id
    ), '[]'::json),
    'favoriteGoals', coalesce((
      select json_agg(favorite_goals order by favorite_goals.updated_at desc)
      from favorite_goals
      where favorite_goals.child_id = v_child.id
    ), '[]'::json)
  );
end;
$$;

grant execute on function get_child_family_state(uuid, uuid) to anon, authenticated;

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

grant execute on function set_child_favorite_goal(uuid, uuid, text, uuid) to anon, authenticated;
grant execute on function clear_child_favorite_goal(uuid, uuid) to anon, authenticated;
