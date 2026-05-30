import type {
  PointTransactionRow,
  RewardRedemptionRow,
  RewardRow,
  TaskRow,
  TaskSubmissionRow,
  WishRow,
} from './supabaseDtos';

export type CreateTaskPayload = Pick<
  TaskRow,
  'family_id' | 'child_id' | 'title' | 'description' | 'points' | 'created_by'
> & {
  status?: TaskRow['status'];
  is_daily?: boolean;
  available_days?: string[];
};

export type UpdateTaskPayload = Partial<
  Pick<TaskRow, 'title' | 'description' | 'points' | 'status' | 'child_id' | 'is_daily' | 'available_days'>
>;

export type CreateTaskSubmissionPayload = Pick<
  TaskSubmissionRow,
  'task_id' | 'child_id'
> &
  Partial<Pick<TaskSubmissionRow, 'photo_url'>>;

export type ReviewTaskSubmissionPayload = Pick<TaskSubmissionRow, 'status'> &
  Partial<Pick<TaskSubmissionRow, 'reviewed_by' | 'reviewed_at'>>;

export type CreateRewardPayload = Pick<
  RewardRow,
  'family_id' | 'title' | 'price' | 'type' | 'created_by'
> &
  Partial<Pick<RewardRow, 'is_active' | 'is_daily_reward' | 'available_days' | 'requires_daily_quests_completed'>>;

export type UpdateRewardPayload = Partial<
  Pick<RewardRow, 'title' | 'price' | 'type' | 'is_active' | 'is_daily_reward' | 'available_days' | 'requires_daily_quests_completed'>
>;

export type CreateWishPayload = Pick<WishRow, 'child_id' | 'title' | 'price'>;

export type UpdateWishPayload = Partial<Pick<WishRow, 'title' | 'price' | 'is_archived'>>;

export type CreatePointTransactionPayload = Pick<
  PointTransactionRow,
  'child_id' | 'title' | 'points' | 'type'
> &
  Partial<
    Pick<
      PointTransactionRow,
      'source_task_submission_id' | 'source_reward_redemption_id' | 'created_by'
    >
  >;

export type CreateRewardRedemptionPayload = Pick<
  RewardRedemptionRow,
  'reward_id' | 'child_id' | 'points_spent'
>;

export type ReviewRewardRedemptionPayload = Pick<RewardRedemptionRow, 'status'> &
  Partial<Pick<RewardRedemptionRow, 'reviewed_by' | 'reviewed_at'>>;
