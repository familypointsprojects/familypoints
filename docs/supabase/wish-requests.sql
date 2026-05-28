-- ============================================================
-- Wish Requests
-- Lets children submit wishes without a final price and lets
-- parents approve wishes, assign the final point price, and
-- create a redeemable reward from the approved wish.
-- ============================================================

alter table wishes add column if not exists status text default 'pending';

alter table wishes drop constraint if exists wishes_price_check;
alter table wishes add constraint wishes_price_check check (price >= 0);

alter table rewards drop constraint if exists rewards_type_check;
alter table rewards add constraint rewards_type_check
  check (type in ('screen_time', 'experience', 'toy', 'treat', 'wish'));

update wishes
set status = 'pending'
where status is null;

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

  insert into rewards (family_id, title, price, type, is_active, created_by)
  values (v_membership.family_id, v_wish.title, price_input, 'wish', true, profile_id_input);

  return json_build_object('ok', true);
end;
$$;

create or replace function public.reject_wish(
  wish_id_input uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update wishes
  set status = 'rejected',
      updated_at = now()
  where id = wish_id_input;

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.approve_wish(uuid, integer, uuid) to anon, authenticated;
grant execute on function public.reject_wish(uuid) to anon, authenticated;

-- Backfill: hide wishes that were already fulfilled through the reward flow.
update wishes
set is_archived = true,
    updated_at = now()
from rewards
join reward_redemptions on reward_redemptions.reward_id = rewards.id
where rewards.type = 'wish'
  and reward_redemptions.status = 'fulfilled'
  and reward_redemptions.child_id = wishes.child_id
  and wishes.status = 'approved'
  and lower(trim(rewards.title)) = lower(trim(wishes.title))
  and rewards.price = wishes.price;
