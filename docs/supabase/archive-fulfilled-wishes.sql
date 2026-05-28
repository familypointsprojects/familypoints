-- ============================================================
-- Archive Fulfilled Wishes
-- Run this once if older fulfilled wish rewards still appear in
-- the child wishlist as approved wishes.
-- ============================================================

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
