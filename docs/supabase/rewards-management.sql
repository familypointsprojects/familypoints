-- ============================================================
-- Rewards Management
-- Allows parents in a family to create rewards and toggle any
-- family reward active/inactive, including rewards created from
-- approved wishes.
-- ============================================================

alter table rewards drop constraint if exists rewards_type_check;
alter table rewards add constraint rewards_type_check
  check (type in ('screen_time', 'experience', 'toy', 'treat', 'wish'));

drop policy if exists "Parents can manage rewards" on rewards;
drop policy if exists "Parents can create rewards" on rewards;
drop policy if exists "Parents can update rewards" on rewards;
drop policy if exists "Parents can delete rewards" on rewards;

create policy "Parents can create rewards"
on rewards for insert
with check (created_by = auth.uid() and is_family_member(family_id));

create policy "Parents can update rewards"
on rewards for update
using (is_family_member(family_id))
with check (is_family_member(family_id));

create policy "Parents can delete rewards"
on rewards for delete
using (is_family_member(family_id));
