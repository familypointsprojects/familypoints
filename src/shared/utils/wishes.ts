import { Reward, RewardRedemption, Wish } from '@/shared/types/family';

const getWishIdentity = (wish: Wish): string => wish.titleKey ?? wish.title ?? '';

const getRewardIdentity = (reward: Reward): string => reward.titleKey ?? reward.title ?? '';

const normalizeIdentity = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();

export const rewardMatchesWish = (reward: Reward, wish: Wish): boolean =>
  (!reward.childId || !wish.childId || reward.childId === wish.childId) &&
  normalizeIdentity(getRewardIdentity(reward)) === normalizeIdentity(getWishIdentity(wish)) &&
  (reward.type === 'wish' || reward.price === wish.price);

export const isWishHandledByRewardFlow = (
  wish: Wish,
  rewards: Reward[],
  rewardRedemptions: RewardRedemption[],
): boolean => {
  if (wish.status !== 'approved') {
    return false;
  }

  const reward = rewards.find((item) => rewardMatchesWish(item, wish));

  if (!reward) {
    return false;
  }

  return rewardRedemptions.some(
    (redemption) =>
      redemption.rewardId === reward.id &&
      (!wish.childId || redemption.childId === wish.childId) &&
      redemption.status !== 'rejected',
  );
};

export const getVisibleWishes = (
  wishes: Wish[],
  rewards: Reward[],
  rewardRedemptions: RewardRedemption[],
): Wish[] =>
  wishes.filter((wish) => !isWishHandledByRewardFlow(wish, rewards, rewardRedemptions));
