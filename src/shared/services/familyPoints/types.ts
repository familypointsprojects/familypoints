import type {
  AddWishInput,
  ApproveWishInput,
  ClearFavoriteGoalInput,
  CreateChildInput,
  CreateParentInput,
  DeleteParentInput,
  UpdateParentInput,
  CreateRewardInput,
  CreateTaskInput,
  DeleteChildInput,
  DeleteTaskInput,
  FamilyPointsServiceContext,
  FamilyPointsState,
  RedeemRewardInput,
  RejectWishInput,
  ReviewRewardRedemptionInput,
  ReviewSubmissionInput,
  SetFavoriteGoalInput,
  SetRewardActiveInput,
  SetTaskStatusInput,
  SubmitTaskInput,
  UnlockSkillInput,
  UpdateFamilyNameInput,
  UpdateTaskInput,
  UpdateRewardInput,
} from '@/shared/state/types';
import type { AuthSession } from '@/shared/auth/types';

export type FamilyPointsService = {
  loadState: (session?: AuthSession | null) => Promise<FamilyPointsState | null>;
  saveState: (state: FamilyPointsState) => Promise<void>;
  resetState: () => Promise<void>;
  createTask: (input: CreateTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  updateTask: (input: UpdateTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  setTaskStatus: (input: SetTaskStatusInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  deleteTask: (input: DeleteTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  createReward: (input: CreateRewardInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  updateReward: (input: UpdateRewardInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  setRewardActive: (input: SetRewardActiveInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  submitTask: (input: SubmitTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  approveSubmission: (input: ReviewSubmissionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  rejectSubmission: (input: ReviewSubmissionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  addWish: (input: AddWishInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  approveWish: (input: ApproveWishInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  rejectWish: (input: RejectWishInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  redeemReward: (input: RedeemRewardInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  setFavoriteGoal: (input: SetFavoriteGoalInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  clearFavoriteGoal: (input: ClearFavoriteGoalInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  unlockSkill: (input: UnlockSkillInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  approveRewardRedemption: (input: ReviewRewardRedemptionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  rejectRewardRedemption: (input: ReviewRewardRedemptionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  fulfillRewardRedemption: (input: ReviewRewardRedemptionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  deleteChild: (input: DeleteChildInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  createChild: (input: CreateChildInput, context: FamilyPointsServiceContext) => Promise<{ state: FamilyPointsState; childId: string }>;
  createParent: (input: CreateParentInput, context: FamilyPointsServiceContext) => Promise<{ state: FamilyPointsState; parentId: string }>;
  deleteParent: (input: DeleteParentInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  updateParent: (input: UpdateParentInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  updateFamilyName: (input: UpdateFamilyNameInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
};
