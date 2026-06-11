-- Reward child assignment
-- null child_id means the reward is available to every child in the family.

alter table rewards
  add column if not exists child_id uuid references children(id) on delete set null;

create index if not exists rewards_child_id_idx
  on rewards(child_id);

create or replace function public.approve_wish(
  wish_id_input uuid,
  price_input integer,
  profile_id_input uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wish wishes%rowtype;
  v_membership family_members%rowtype;
  v_reward_id uuid;
begin
  if price_input <= 0 then
    return json_build_object('error', 'Price must be greater than 0');
  end if;

  select * into v_wish
  from wishes
  where id = wish_id_input;

  if not found then
    return json_build_object('error', 'Wish not found');
  end if;

  select * into v_membership
  from family_members
  where profile_id = profile_id_input
  limit 1;

  if not found then
    return json_build_object('error', 'Parent family not found');
  end if;

  if not exists (
    select 1
    from children
    where id = v_wish.child_id
      and family_id = v_membership.family_id
  ) then
    return json_build_object('error', 'Wish does not belong to this family');
  end if;

  update wishes
  set status = 'approved',
      price = price_input,
      updated_at = now()
  where id = wish_id_input;

  select id into v_reward_id
  from rewards
  where family_id = v_membership.family_id
    and type = 'wish'
    and lower(trim(title)) = lower(trim(v_wish.title))
    and (child_id is null or child_id = v_wish.child_id)
  order by case when child_id = v_wish.child_id then 0 else 1 end
  limit 1;

  if found then
    update rewards
    set child_id = v_wish.child_id,
        price = price_input,
        is_active = true,
        updated_at = now()
    where id = v_reward_id;
  else
    insert into rewards (family_id, child_id, title, price, type, is_active, created_by)
    values (v_membership.family_id, v_wish.child_id, v_wish.title, price_input, 'wish', true, profile_id_input);
  end if;

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.approve_wish(uuid, integer, uuid) to anon, authenticated;

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
