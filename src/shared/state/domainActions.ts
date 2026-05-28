import type {
  AddWishInput,
  ApproveWishInput,
  ClearFavoriteGoalInput,
  CreateRewardInput,
  CreateTaskInput,
  DeleteTaskInput,
  FamilyPointsState,
  RedeemRewardInput,
  RejectWishInput,
  ReviewRewardRedemptionInput,
  ReviewSubmissionInput,
  SetFavoriteGoalInput,
  SetRewardActiveInput,
  SetTaskStatusInput,
  SubmitTaskInput,
  UpdateTaskInput,
} from '@/shared/state/types';
import type {
  PointTransaction,
  Reward,
  RewardRedemption,
  Task,
  TaskSubmission,
  Wish,
} from '@/shared/types/family';
import { getBalance } from '@/shared/utils/points';

const createLocalId = (prefix: string): string => `${prefix}-${Date.now()}`;

const createSpendTransaction = (
  reward: Reward,
  childId: string,
): PointTransaction => ({
  id: createLocalId('transaction'),
  childId,
  titleKey: reward.titleKey,
  title: reward.title,
  points: -reward.price,
  type: 'spend',
  createdAt: new Date().toISOString(),
});

const createRewardRefundTransaction = (
  reward: Reward,
  childId: string,
): PointTransaction => ({
  id: createLocalId('transaction'),
  childId,
  title: reward.title ? `Refund: ${reward.title}` : undefined,
  points: reward.price,
  type: 'manual_adjustment',
  createdAt: new Date().toISOString(),
});

const createEarnTransaction = (
  submission: TaskSubmission,
  task: Task,
): PointTransaction => ({
  id: createLocalId('transaction'),
  childId: submission.childId,
  titleKey: task.titleKey,
  title: task.title,
  points: task.points,
  type: 'earn',
  createdAt: new Date().toISOString(),
});

export const createTaskInState = (
  state: FamilyPointsState,
  input: CreateTaskInput,
): FamilyPointsState => {
  const newTask: Task = {
    id: createLocalId('task'),
    title: input.title.trim(),
    description: input.description.trim(),
    points: input.points,
    status: 'active',
  };

  return {
    ...state,
    tasks: [newTask, ...state.tasks],
  };
};

export const updateTaskInState = (
  state: FamilyPointsState,
  input: UpdateTaskInput,
): FamilyPointsState => ({
  ...state,
  tasks: state.tasks.map((task) =>
    task.id === input.taskId
      ? {
          ...task,
          title: input.title.trim(),
          description: input.description.trim(),
          points: input.points,
          status: input.status,
        }
      : task,
  ),
});

export const setTaskStatusInState = (
  state: FamilyPointsState,
  input: SetTaskStatusInput,
): FamilyPointsState => ({
  ...state,
  tasks: state.tasks.map((task) =>
    task.id === input.taskId ? { ...task, status: input.status } : task,
  ),
});

export const deleteTaskInState = (
  state: FamilyPointsState,
  input: DeleteTaskInput,
): FamilyPointsState => ({
  ...state,
  tasks: state.tasks.filter((task) => task.id !== input.taskId),
  taskSubmissions: state.taskSubmissions.filter((submission) => submission.taskId !== input.taskId),
});

export const createRewardInState = (
  state: FamilyPointsState,
  input: CreateRewardInput,
): FamilyPointsState => {
  const newReward: Reward = {
    id: createLocalId('reward'),
    title: input.title.trim(),
    price: input.price,
    type: input.type,
    isActive: true,
  };

  return {
    ...state,
    rewards: [newReward, ...state.rewards],
  };
};

export const setRewardActiveInState = (
  state: FamilyPointsState,
  input: SetRewardActiveInput,
): FamilyPointsState => ({
  ...state,
  rewards: state.rewards.map((reward) =>
    reward.id === input.rewardId ? { ...reward, isActive: input.isActive } : reward,
  ),
});

export const setFavoriteGoalInState = (
  state: FamilyPointsState,
  input: SetFavoriteGoalInput,
): FamilyPointsState => ({
  ...state,
  favoriteGoals: [
    ...state.favoriteGoals.filter((goal) => goal.childId !== input.childId),
    {
      childId: input.childId,
      type: input.type,
      itemId: input.itemId,
    },
  ],
});

export const clearFavoriteGoalInState = (
  state: FamilyPointsState,
  input: ClearFavoriteGoalInput,
): FamilyPointsState => ({
  ...state,
  favoriteGoals: state.favoriteGoals.filter((goal) => goal.childId !== input.childId),
});

export const submitTaskInState = (
  state: FamilyPointsState,
  input: SubmitTaskInput,
): FamilyPointsState => {
  const hasPendingSubmission = state.taskSubmissions.some(
    (submission) =>
      submission.taskId === input.taskId &&
      submission.childId === input.childId &&
      submission.status === 'pending',
  );

  if (hasPendingSubmission) {
    return state;
  }

  const newSubmission: TaskSubmission = {
    id: createLocalId('submission'),
    taskId: input.taskId,
    childId: input.childId,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    proofNote: input.proofNote?.trim(),
  };

  return {
    ...state,
    taskSubmissions: [newSubmission, ...state.taskSubmissions],
  };
};

export const approveSubmissionInState = (
  state: FamilyPointsState,
  input: ReviewSubmissionInput,
): FamilyPointsState => {
  const submission = state.taskSubmissions.find(
    (item) => item.id === input.submissionId,
  );
  const task = submission
    ? state.tasks.find((taskItem) => taskItem.id === submission.taskId)
    : undefined;

  if (!submission || !task || submission.status === 'approved') {
    return state;
  }

  return {
    ...state,
    taskSubmissions: state.taskSubmissions.map((item) =>
      item.id === input.submissionId ? { ...item, status: 'approved' } : item,
    ),
    tasks: state.tasks.map((taskItem) =>
      taskItem.id === task.id ? { ...taskItem, status: 'inactive' } : taskItem,
    ),
    pointTransactions: [
      createEarnTransaction(submission, task),
      ...state.pointTransactions,
    ],
  };
};

export const rejectSubmissionInState = (
  state: FamilyPointsState,
  input: ReviewSubmissionInput,
): FamilyPointsState => ({
  ...state,
  taskSubmissions: state.taskSubmissions.map((item) =>
    item.id === input.submissionId ? { ...item, status: 'rejected' } : item,
  ),
});

export const addWishInState = (
  state: FamilyPointsState,
  input: AddWishInput,
): FamilyPointsState => {
  const newWish: Wish = {
    id: createLocalId('wish'),
    title: input.title.trim(),
    price: input.price,
    childId: input.childId,
    status: 'pending',
  };

  return {
    ...state,
    wishes: [newWish, ...state.wishes],
  };
};

export const approveWishInState = (
  state: FamilyPointsState,
  input: ApproveWishInput,
): FamilyPointsState => {
  const wish = state.wishes.find((w) => w.id === input.wishId);

  if (!wish || wish.status === 'approved') {
    return state;
  }

  const newReward: Reward = {
    id: createLocalId('reward'),
    title: wish.title,
    price: input.price,
    type: 'wish',
    isActive: true,
  };

  return {
    ...state,
    wishes: state.wishes.map((w) =>
      w.id === input.wishId ? { ...w, status: 'approved', price: input.price } : w,
    ),
    rewards: [newReward, ...state.rewards],
  };
};

export const rejectWishInState = (
  state: FamilyPointsState,
  input: RejectWishInput,
): FamilyPointsState => ({
  ...state,
  wishes: state.wishes.map((w) =>
    w.id === input.wishId ? { ...w, status: 'rejected' } : w,
  ),
});

export const redeemRewardInState = (
  state: FamilyPointsState,
  input: RedeemRewardInput,
): FamilyPointsState => {
  const reward = state.rewards.find((item) => item.id === input.rewardId);
  const balance = getBalance(state.pointTransactions, input.childId);
  const hasOpenRequest = state.rewardRedemptions.some(
    (redemption) =>
      redemption.rewardId === input.rewardId &&
      redemption.childId === input.childId &&
      (redemption.status === 'requested' || redemption.status === 'approved'),
  );

  if (!reward || balance < reward.price || hasOpenRequest) {
    return state;
  }

  const newRedemption: RewardRedemption = {
    id: createLocalId('redemption'),
    rewardId: reward.id,
    childId: input.childId,
    pointsSpent: reward.price,
    status: 'requested',
    requestedAt: new Date().toISOString(),
  };

  return {
    ...state,
    rewardRedemptions: [newRedemption, ...state.rewardRedemptions],
    pointTransactions: [
      createSpendTransaction(reward, input.childId),
      ...state.pointTransactions,
    ],
  };
};

export const approveRewardRedemptionInState = (
  state: FamilyPointsState,
  input: ReviewRewardRedemptionInput,
): FamilyPointsState => {
  const redemption = state.rewardRedemptions.find((item) => item.id === input.redemptionId);
  const reward = redemption
    ? state.rewards.find((item) => item.id === redemption.rewardId)
    : undefined;

  if (!redemption || !reward || redemption.status !== 'requested') {
    return state;
  }

  return {
    ...state,
    rewardRedemptions: state.rewardRedemptions.map((item) =>
      item.id === input.redemptionId ? { ...item, status: 'approved' } : item,
    ),
    redeemedRewardIds: [reward.id, ...state.redeemedRewardIds],
  };
};

export const rejectRewardRedemptionInState = (
  state: FamilyPointsState,
  input: ReviewRewardRedemptionInput,
): FamilyPointsState => {
  const redemption = state.rewardRedemptions.find((item) => item.id === input.redemptionId);
  const reward = redemption
    ? state.rewards.find((item) => item.id === redemption.rewardId)
    : undefined;
  const shouldRefund =
    Boolean(redemption && reward) &&
    (redemption?.status === 'requested' || redemption?.status === 'approved');

  return {
    ...state,
    rewardRedemptions: state.rewardRedemptions.map((item) =>
      item.id === input.redemptionId ? { ...item, status: 'rejected' } : item,
    ),
    pointTransactions:
      shouldRefund && redemption && reward
        ? [createRewardRefundTransaction(reward, redemption.childId), ...state.pointTransactions]
        : state.pointTransactions,
  };
};

export const fulfillRewardRedemptionInState = (
  state: FamilyPointsState,
  input: ReviewRewardRedemptionInput,
): FamilyPointsState => {
  const redemption = state.rewardRedemptions.find((item) => item.id === input.redemptionId);

  return {
    ...state,
    rewardRedemptions: state.rewardRedemptions.map((item) =>
      item.id === input.redemptionId ? { ...item, status: 'fulfilled' } : item,
    ),
    rewards: state.rewards.map((reward) =>
      reward.id === redemption?.rewardId ? { ...reward, isActive: false } : reward,
    ),
  };
};
