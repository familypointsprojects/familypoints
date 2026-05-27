import type {
  ChildProfile,
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
  pointTransactions: PointTransaction[];
  redeemedRewardIds: string[];
  children: ChildProfile[];
  activeFamilyId?: string;
  activeParentId?: string;
  activeChildId?: string;
  familyName?: string;
};

export type CreateTaskInput = {
  title: string;
  description: string;
  points: number;
};

export type UpdateTaskInput = {
  taskId: string;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
};

export type SetTaskStatusInput = {
  taskId: string;
  status: TaskStatus;
};

export type CreateRewardInput = {
  title: string;
  price: number;
  type: RewardType;
};

export type SetRewardActiveInput = {
  rewardId: string;
  isActive: boolean;
};

export type AddWishInput = {
  title: string;
  price: number;
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
};
