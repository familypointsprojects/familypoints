import type { AuthSession } from '@/shared/auth/types';
import type {
  ChildProfile,
  ChildAchievementProgress,
  ChildProgress,
  ChildSkillId,
  ChildSkillUnlock,
  DayOfWeek,
  ParentProfile,
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
  childProgress: ChildProgress[];
  childSkillUnlocks: ChildSkillUnlock[];
  childAchievements: ChildAchievementProgress[];
  redeemedRewardIds: string[];
  children: ChildProfile[];
  parents: ParentProfile[];
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
  childId?: string;
  isDaily?: boolean;
  availableDays?: DayOfWeek[];
};

export type UpdateTaskInput = {
  taskId: string;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
  childId?: string;
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
  childId?: string;
  isDailyReward?: boolean;
  availableDays?: DayOfWeek[];
  requiresDailyQuestsCompleted?: boolean;
};

export type UpdateRewardInput = CreateRewardInput & {
  rewardId: string;
  isActive?: boolean;
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

export type CreateParentInput = {
  name: string;
  hasFullPermissions: boolean;
  familyName?: string;
};

export type DeleteParentInput = {
  parentId: string;
};

export type UpdateParentInput = {
  parentId: string;
  name: string;
  hasFullPermissions: boolean;
};

export type UpdateFamilyNameInput = {
  familyName: string;
};

export type UnlockSkillInput = {
  childId: string;
  skillId: ChildSkillId;
};

export type FamilyPointsServiceContext = {
  state: FamilyPointsState;
  familyId: string;
  parentId: string;
  childId: string;
  session: AuthSession | null;
};
