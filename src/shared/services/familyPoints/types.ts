import type {
  AddWishInput,
  CreateChildInput,
  CreateRewardInput,
  CreateTaskInput,
  DeleteChildInput,
  FamilyPointsServiceContext,
  FamilyPointsState,
  RedeemRewardInput,
  ReviewRewardRedemptionInput,
  ReviewSubmissionInput,
  SetRewardActiveInput,
  SetTaskStatusInput,
  SubmitTaskInput,
  UpdateFamilyNameInput,
  UpdateTaskInput,
} from '@/shared/state/types';

export type FamilyPointsService = {
  loadState: () => Promise<FamilyPointsState | null>;
  saveState: (state: FamilyPointsState) => Promise<void>;
  resetState: () => Promise<void>;
  createTask: (input: CreateTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  updateTask: (input: UpdateTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  setTaskStatus: (input: SetTaskStatusInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  createReward: (input: CreateRewardInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  setRewardActive: (input: SetRewardActiveInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  submitTask: (input: SubmitTaskInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  approveSubmission: (input: ReviewSubmissionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  rejectSubmission: (input: ReviewSubmissionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  addWish: (input: AddWishInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  redeemReward: (input: RedeemRewardInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  approveRewardRedemption: (input: ReviewRewardRedemptionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  rejectRewardRedemption: (input: ReviewRewardRedemptionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  fulfillRewardRedemption: (input: ReviewRewardRedemptionInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  deleteChild: (input: DeleteChildInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
  createChild: (input: CreateChildInput, context: FamilyPointsServiceContext) => Promise<{ state: FamilyPointsState; childId: string }>;
  updateFamilyName: (input: UpdateFamilyNameInput, context: FamilyPointsServiceContext) => Promise<FamilyPointsState>;
};
