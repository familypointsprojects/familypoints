import type { FamilyPointsState } from '@/shared/state/types';
import type { AuthSession } from '@/shared/auth/types';
import type {
  ChildRow,
  FavoriteGoalRow,
  FamilyRow,
  PointTransactionRow,
  RewardRedemptionRow,
  RewardRow,
  TaskRow,
  TaskSubmissionRow,
  WishRow,
} from '@/shared/services/familyPoints/supabaseDtos';
import {
  mapChildRowToChildProfile,
  mapFavoriteGoalRowToFavoriteGoal,
  mapPointTransactionRowToPointTransaction,
  mapRewardRowToReward,
  mapTaskRowToTask,
  mapTaskSubmissionRowToTaskSubmission,
  mapWishRowToWish,
} from '@/shared/services/familyPoints/mappers';

import { getSupabaseClient } from './client';

type ChildFamilyStateResponse = {
  error?: string;
  family: FamilyRow;
  child: ChildRow;
  tasks: TaskRow[];
  taskSubmissions: TaskSubmissionRow[];
  rewards: RewardRow[];
  wishes: WishRow[];
  pointTransactions: PointTransactionRow[];
  rewardRedemptions: RewardRedemptionRow[];
  favoriteGoals?: FavoriteGoalRow[];
};

const mapRewardRedemptionRow = (redemption: RewardRedemptionRow) => ({
  id: redemption.id,
  rewardId: redemption.reward_id,
  childId: redemption.child_id,
  pointsSpent: redemption.points_spent,
  status: redemption.status,
  requestedAt: redemption.requested_at,
});

export const loadChildFamilyState = async (
  session: AuthSession,
): Promise<FamilyPointsState> => {
  const supabase = getSupabaseClient();
  const childId = session.childId ?? session.profileId;

  const { data, error } = await supabase.rpc('get_child_family_state', {
    child_id_input: childId,
    profile_id_input: session.profileId,
  });

  if (error) {
    throw new Error(`Failed to load child family state: ${error.message}`);
  }

  const result = data as ChildFamilyStateResponse;

  if (result.error) {
    throw new Error(result.error);
  }

  const rewardRedemptions = result.rewardRedemptions.map(mapRewardRedemptionRow);
  const favoriteGoalRows = result.favoriteGoals ?? [];

  return {
    tasks: result.tasks.map(mapTaskRowToTask),
    taskSubmissions: result.taskSubmissions.map(mapTaskSubmissionRowToTaskSubmission),
    rewards: result.rewards.map(mapRewardRowToReward),
    rewardRedemptions,
    wishes: result.wishes.map(mapWishRowToWish),
    favoriteGoals: favoriteGoalRows.map(mapFavoriteGoalRowToFavoriteGoal),
    pointTransactions: result.pointTransactions.map(mapPointTransactionRowToPointTransaction),
    redeemedRewardIds: rewardRedemptions.map((redemption) => redemption.rewardId),
    children: [mapChildRowToChildProfile(result.child)],
    activeFamilyId: result.family.id,
    activeChildId: result.child.id,
    familyName: result.family.name,
  };
};
