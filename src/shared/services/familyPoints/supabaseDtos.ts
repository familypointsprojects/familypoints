import type {
  PointTransactionType,
  RewardType,
  SubmissionStatus,
  TaskStatus,
  UserRole,
} from '@/shared/types/family';
import type { FavoriteGoalType } from '@/shared/state/types';

export type ProfileRow = {
  id: string;
  name: string;
  role: UserRole;
  avatar_color: string | null;
  has_full_permissions?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type FamilyRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type FamilyMemberRow = {
  id: string;
  family_id: string;
  profile_id: string;
  role: UserRole;
  created_at: string;
};

export type ChildRow = {
  id: string;
  family_id: string;
  profile_id: string;
  display_name: string;
  avatar_color: string;
  avatar_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
  is_daily: boolean;
  available_days: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TaskSubmissionRow = {
  id: string;
  task_id: string;
  child_id: string;
  status: SubmissionStatus;
  photo_url: string | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type RewardRow = {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  price: number;
  type: RewardType;
  is_active: boolean;
  is_daily_reward: boolean;
  available_days: string[];
  requires_daily_quests_completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WishRow = {
  id: string;
  child_id: string;
  title: string;
  price: number;
  is_archived: boolean;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export type PointTransactionRow = {
  id: string;
  child_id: string;
  title: string;
  points: number;
  type: PointTransactionType;
  source_task_submission_id: string | null;
  source_reward_redemption_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type RewardRedemptionRow = {
  id: string;
  reward_id: string;
  child_id: string;
  points_spent: number;
  status: 'requested' | 'approved' | 'rejected' | 'fulfilled';
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type FavoriteGoalRow = {
  child_id: string;
  target_type: FavoriteGoalType;
  target_id: string;
  created_at: string;
  updated_at: string;
};
