-- ============================================================
-- Child Session State
-- Allows a child session created from an invite to read family data
-- without requiring a Supabase auth.users account.
-- ============================================================

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
