alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table children enable row level security;
alter table tasks enable row level security;
alter table task_submissions enable row level security;
alter table rewards enable row level security;
alter table wishes enable row level security;
alter table point_transactions enable row level security;
alter table reward_redemptions enable row level security;

create or replace function is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from family_members
    where family_members.family_id = target_family_id
      and family_members.profile_id = auth.uid()
  );
$$;

create or replace function can_access_child(target_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from children
    join family_members on family_members.family_id = children.family_id
    where children.id = target_child_id
      and family_members.profile_id = auth.uid()
  );
$$;

create policy "Profiles are visible to themselves"
on profiles for select
using (id = auth.uid());

create policy "Users can insert their own profile"
on profiles for insert
with check (id = auth.uid());

create policy "Authenticated users can create child profiles"
on profiles for insert
with check (role = 'child' and auth.uid() is not null);

create policy "Authenticated users can create families"
on families for insert
with check (created_by = auth.uid());

create policy "Family creator can add members"
on family_members for insert
with check (
  exists (
    select 1 from families
    where families.id = family_id
      and families.created_by = auth.uid()
  )
);

create policy "Family members can add children"
on children for insert
with check (is_family_member(family_id));

create policy "Members can read their families"
on families for select
using (is_family_member(id));

create policy "Members can read family membership"
on family_members for select
using (is_family_member(family_id));

create policy "Members can read children"
on children for select
using (is_family_member(family_id));

create policy "Members can read tasks"
on tasks for select
using (is_family_member(family_id));

create policy "Parents can create tasks"
on tasks for insert
with check (
  created_by = auth.uid()
  and is_family_member(family_id)
);

create policy "Parents can update tasks"
on tasks for update
using (created_by = auth.uid() and is_family_member(family_id))
with check (created_by = auth.uid() and is_family_member(family_id));

create policy "Members can read task submissions"
on task_submissions for select
using (can_access_child(child_id));

create policy "Children can create task submissions"
on task_submissions for insert
with check (can_access_child(child_id));

create policy "Parents can review task submissions"
on task_submissions for update
using (can_access_child(child_id))
with check (can_access_child(child_id));

create policy "Members can read rewards"
on rewards for select
using (is_family_member(family_id));

create policy "Parents can manage rewards"
on rewards for all
using (created_by = auth.uid() and is_family_member(family_id))
with check (created_by = auth.uid() and is_family_member(family_id));

create policy "Members can read wishes"
on wishes for select
using (can_access_child(child_id));

create policy "Children can create wishes"
on wishes for insert
with check (can_access_child(child_id));

create policy "Children can update wishes"
on wishes for update
using (can_access_child(child_id))
with check (can_access_child(child_id));

create policy "Members can read point transactions"
on point_transactions for select
using (can_access_child(child_id));

create policy "Members can create point transactions"
on point_transactions for insert
with check (can_access_child(child_id));

create policy "Members can read reward redemptions"
on reward_redemptions for select
using (can_access_child(child_id));

create policy "Children can request reward redemptions"
on reward_redemptions for insert
with check (can_access_child(child_id));

create policy "Parents can review reward redemptions"
on reward_redemptions for update
using (can_access_child(child_id))
with check (can_access_child(child_id));
