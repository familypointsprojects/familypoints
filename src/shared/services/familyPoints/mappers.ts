import type {
  ChildProfile,
  DayOfWeek,
  Family,
  ParentProfile,
  PointTransaction,
  Reward,
  Task,
  TaskSubmission,
  Wish,
  WishStatus,
} from '@/shared/types/family';
import type { FavoriteGoal } from '@/shared/state/types';

import type {
  ChildRow,
  FavoriteGoalRow,
  FamilyRow,
  PointTransactionRow,
  ProfileRow,
  RewardRow,
  TaskRow,
  TaskSubmissionRow,
  WishRow,
} from './supabaseDtos';
import type {
  CreatePointTransactionPayload,
  CreateRewardPayload,
  CreateTaskPayload,
  CreateTaskSubmissionPayload,
  CreateWishPayload,
} from './supabasePayloads';

export const mapProfileRowToParentProfile = (row: ProfileRow, ownerId?: string): ParentProfile => ({
  id: row.id,
  name: row.name,
  role: 'parent',
  isOwner: ownerId ? row.id === ownerId : false,
  hasFullPermissions: row.has_full_permissions ?? false,
});

export const mapChildRowToChildProfile = (row: ChildRow): ChildProfile => ({
  id: row.id,
  name: row.display_name,
  role: 'child',
  avatarColor: row.avatar_color,
});

export const mapFamilyRowToFamily = (
  row: FamilyRow,
  childIds: string[],
  parentIds: string[] = [],
): Family => ({
  id: row.id,
  nameKey: 'family.parkers',
  parentIds: parentIds.length > 0 ? parentIds : [row.created_by],
  childIds,
});

export const mapTaskRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  childId: row.child_id ?? undefined,
  title: row.title,
  description: row.description,
  points: row.points,
  status: row.status,
  isDaily: row.is_daily ?? false,
  availableDays: (row.available_days ?? []) as DayOfWeek[],
  createdBy: row.created_by,
});

export const mapTaskToCreateTaskPayload = (
  task: Task,
  familyId: string,
  createdBy: string,
  childId: string | null = null,
): CreateTaskPayload => ({
  family_id: familyId,
  child_id: childId,
  title: task.title ?? '',
  description: task.description ?? '',
  points: task.points,
  status: task.status,
  created_by: createdBy,
});

export const mapTaskSubmissionRowToTaskSubmission = (
  row: TaskSubmissionRow,
): TaskSubmission => ({
  id: row.id,
  taskId: row.task_id,
  childId: row.child_id,
  status: row.status,
  submittedAt: row.submitted_at,
  proofNote: row.photo_url ?? undefined,
});

export const mapTaskSubmissionToCreatePayload = (
  submission: TaskSubmission,
): CreateTaskSubmissionPayload => ({
  task_id: submission.taskId,
  child_id: submission.childId,
});

export const mapRewardRowToReward = (row: RewardRow): Reward => ({
  id: row.id,
  childId: row.child_id ?? undefined,
  title: row.title,
  price: row.price,
  type: row.type,
  isActive: row.is_active,
  isDailyReward: row.is_daily_reward ?? false,
  availableDays: (row.available_days ?? []) as DayOfWeek[],
  requiresDailyQuestsCompleted: row.requires_daily_quests_completed ?? false,
  createdBy: row.created_by,
});

export const mapRewardToCreatePayload = (
  reward: Reward,
  familyId: string,
  createdBy: string,
): CreateRewardPayload => ({
  family_id: familyId,
  child_id: reward.childId ?? null,
  title: reward.title ?? '',
  price: reward.price,
  type: reward.type,
  is_active: true,
  created_by: createdBy,
});

export const mapWishRowToWish = (row: WishRow): Wish => ({
  id: row.id,
  title: row.title,
  price: row.price,
  childId: row.child_id,
  status: (row.status as WishStatus | undefined) ?? 'pending',
});

export const mapWishToCreatePayload = (
  wish: Wish,
  childId: string,
): CreateWishPayload => ({
  child_id: childId,
  title: wish.title ?? '',
  price: wish.price,
});

export const mapPointTransactionRowToPointTransaction = (
  row: PointTransactionRow,
): PointTransaction => ({
  id: row.id,
  childId: row.child_id,
  title: row.title,
  points: row.points,
  type: row.type,
  createdAt: row.created_at,
});

export const mapFavoriteGoalRowToFavoriteGoal = (row: FavoriteGoalRow): FavoriteGoal => ({
  childId: row.child_id,
  type: row.target_type,
  itemId: row.target_id,
});

export const mapPointTransactionToCreatePayload = (
  transaction: PointTransaction,
): CreatePointTransactionPayload => ({
  child_id: transaction.childId,
  title: transaction.title ?? '',
  points: transaction.points,
  type: transaction.type,
});
