import type { AuthSession } from '@/shared/auth/types';
import type {
  ChildProfile,
  DayOfWeek,
  PointTransaction,
  Reward,
  RewardRedemption,
  RewardType,
  Task,
  TaskStatus,
  TaskSubmission,
  Wish,
} from '@/shared/types/family';

export type FamilyPointsState = {
  tasks: Task[];
  taskSubmissions: TaskSubmission[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  wishes: Wish[];
  favoriteGoals: FavoriteGoal[];
  pointTransactions: PointTransaction[];
  redeemedRewardIds: string[];
  children: ChildProfile[];
  activeFamilyId?: string;
  activeParentId?: string;
  activeChildId?: string;
  familyName?: string;
};

export type FavoriteGoalType = 'reward' | 'wish';

export type FavoriteGoal = {
  childId: string;
  type: FavoriteGoalType;
  itemId: string;
};

export type CreateTaskInput = {
  title: string;
  description: string;
  points: number;
  isDaily?: boolean;
  availableDays?: DayOfWeek[];
};

export type UpdateTaskInput = {
  taskId: string;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
  isDaily?: boolean;
  availableDays?: DayOfWeek[];
};

export type SetTaskStatusInput = {
  taskId: string;
  status: TaskStatus;
};

export type DeleteTaskInput = {
  taskId: string;
};

export type CreateRewardInput = {
  title: string;
  price: number;
  type: RewardType;
  isDailyReward?: boolean;
  availableDays?: DayOfWeek[];
  requiresDailyQuestsCompleted?: boolean;
};

export type SetRewardActiveInput = {
  rewardId: string;
  isActive: boolean;
};

export type AddWishInput = {
  title: string;
  price: number;
  childId?: string;
};

export type ApproveWishInput = {
  wishId: string;
  price: number;
};

export type RejectWishInput = {
  wishId: string;
};

export type SubmitTaskInput = {
  taskId: string;
  childId: string;
  proofNote?: string;
};

export type ReviewSubmissionInput = {
  submissionId: string;
};

export type RedeemRewardInput = {
  rewardId: string;
  childId: string;
};

export type SetFavoriteGoalInput = {
  childId: string;
  type: FavoriteGoalType;
  itemId: string;
};

export type ClearFavoriteGoalInput = {
  childId: string;
};

export type ReviewRewardRedemptionInput = {
  redemptionId: string;
};

export type DeleteChildInput = {
  childId: string;
};

export type CreateChildInput = {
  name: string;
  avatarColor: string;
  familyName?: string;
};

export type UpdateFamilyNameInput = {
  familyName: string;
};

export type FamilyPointsServiceContext = {
  state: FamilyPointsState;
  familyId: string;
  parentId: string;
  childId: string;
  session: AuthSession | null;
};
