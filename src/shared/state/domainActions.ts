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
  UnlockSkillInput,
  UpdateRewardInput,
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
import {
  addXpToProgress,
  calculateTaskSkillBonus,
  createComboBonusTransactionTitle,
  createTaskBonusTransactionTitle,
  getComboBonusPoints,
  getChildProgress,
  getStreakRewardBonusPoints,
  getTaskXp,
  shouldAwardComboBonus,
  syncChildAchievements,
  unlockSkill,
  upsertChildProgress,
} from '@/shared/utils/leveling';
import { getDailyRewardLockReason } from '@/shared/utils/rewards';
import { hasSubmittedDailyTaskToday, isDailyTaskAvailableToday } from '@/shared/utils/tasks';
import { rewardMatchesWish } from '@/shared/utils/wishes';

const createLocalId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  createdAt = new Date().toISOString(),
  bonusPoints = 0,
): PointTransaction => ({
  id: createLocalId('transaction'),
  childId: submission.childId,
  titleKey: task.titleKey,
  title: task.title,
  points: task.points + bonusPoints,
  type: 'earn',
  createdAt,
});

const createSkillBonusTransaction = (
  childId: string,
  title: string,
  points: number,
  createdAt = new Date().toISOString(),
): PointTransaction => ({
  id: createLocalId('transaction'),
  childId,
  title,
  points,
  type: 'skill_bonus',
  createdAt,
});

export const createTaskInState = (
  state: FamilyPointsState,
  input: CreateTaskInput,
): FamilyPointsState => {
  const newTask: Task = {
    id: createLocalId('task'),
    childId: input.childId,
    title: input.title.trim(),
    description: input.description.trim(),
    points: input.points,
    status: 'active',
    isDaily: input.isDaily,
    availableDays: input.availableDays,
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
          childId: input.childId,
          isDaily: input.isDaily,
          availableDays: input.availableDays,
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
    childId: input.childId,
    title: input.title.trim(),
    price: input.price,
    type: input.type,
    isActive: true,
    isDailyReward: input.isDailyReward,
    availableDays: input.availableDays,
    requiresDailyQuestsCompleted: input.requiresDailyQuestsCompleted,
  };

  return {
    ...state,
    rewards: [newReward, ...state.rewards],
  };
};

export const updateRewardInState = (
  state: FamilyPointsState,
  input: UpdateRewardInput,
): FamilyPointsState => ({
  ...state,
  rewards: state.rewards.map((reward) =>
    reward.id === input.rewardId
      ? {
          ...reward,
          childId: input.childId,
          title: input.title.trim(),
          price: input.price,
          type: input.type,
          isActive: input.isActive ?? reward.isActive,
          isDailyReward: input.isDailyReward,
          availableDays: input.availableDays,
          requiresDailyQuestsCompleted: input.requiresDailyQuestsCompleted,
        }
      : reward,
  ),
});

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

export const unlockSkillInState = (
  state: FamilyPointsState,
  input: UnlockSkillInput,
): FamilyPointsState => unlockSkill(state, input.childId, input.skillId);

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
  const task = state.tasks.find((item) => item.id === input.taskId);
  const taskIsAvailableForChild = !task?.childId || task.childId === input.childId;

  if (!task || !taskIsAvailableForChild || task.status !== 'active') {
    return state;
  }

  if (task.isDaily) {
    if (
      !isDailyTaskAvailableToday(task, input.childId) ||
      hasSubmittedDailyTaskToday(state.taskSubmissions, input.taskId, input.childId)
    ) {
      return state;
    }
  } else if (hasPendingSubmission) {
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

  const reviewedAt = new Date().toISOString();
  const approvedSubmissions = state.taskSubmissions.map((item) =>
    item.id === input.submissionId ? { ...item, status: 'approved' as const } : item,
  );
  const progressAfterTaskXp = addXpToProgress(
    getChildProgress(state, submission.childId),
    getTaskXp(task),
  );
  const streakBonusPoints = getStreakRewardBonusPoints(
    approvedSubmissions,
    submission.childId,
    new Date(reviewedAt),
  );
  const earnTransaction = createEarnTransaction(submission, task, reviewedAt, streakBonusPoints);
  const taskBonus = calculateTaskSkillBonus({
    pointTransactions: state.pointTransactions,
    task,
    unlocks: state.childSkillUnlocks,
    childId: submission.childId,
    now: new Date(reviewedAt),
  });
  const taskBonusTransaction = taskBonus.points > 0
    ? createSkillBonusTransaction(
        submission.childId,
        createTaskBonusTransactionTitle(),
        taskBonus.points,
        reviewedAt,
      )
    : undefined;
  const pointTransactionsBeforeCombo = [
    ...(taskBonusTransaction ? [taskBonusTransaction] : []),
    earnTransaction,
    ...state.pointTransactions,
  ];
  const comboTransaction = shouldAwardComboBonus({
    submissions: approvedSubmissions,
    pointTransactions: pointTransactionsBeforeCombo,
    unlocks: state.childSkillUnlocks,
    childId: submission.childId,
    now: new Date(reviewedAt),
  })
    ? createSkillBonusTransaction(
        submission.childId,
        createComboBonusTransactionTitle(),
        getComboBonusPoints(state.childSkillUnlocks, submission.childId),
        reviewedAt,
      )
    : undefined;

  const nextState = {
    ...state,
    taskSubmissions: approvedSubmissions,
    tasks: state.tasks.map((taskItem) =>
      taskItem.id === task.id && !task.isDaily
        ? { ...taskItem, status: 'inactive' as const }
        : taskItem,
    ),
    pointTransactions: [
      ...(comboTransaction ? [comboTransaction] : []),
      ...pointTransactionsBeforeCombo,
    ],
    childProgress: upsertChildProgress(state.childProgress, progressAfterTaskXp),
  };

  return syncChildAchievements({
    state: nextState,
    childId: submission.childId,
    awardNewXp: true,
  });
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

  if (!wish) {
    return state;
  }

  const approvedWish: Wish = { ...wish, status: 'approved', price: input.price };
  const existingReward = state.rewards.find((reward) => rewardMatchesWish(reward, approvedWish));
  const nextReward: Reward = {
    id: existingReward?.id ?? createLocalId('reward'),
    childId: approvedWish.childId,
    title: approvedWish.title,
    titleKey: approvedWish.titleKey,
    price: input.price,
    type: 'wish',
    isActive: true,
  };
  const nextRewards = existingReward
    ? state.rewards.map((reward) =>
        reward.id === existingReward.id ? { ...reward, ...nextReward } : reward,
      )
    : [nextReward, ...state.rewards];

  return {
    ...state,
    wishes: state.wishes.map((w) =>
      w.id === input.wishId ? approvedWish : w,
    ),
    rewards: nextRewards,
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

  const rewardIsAvailableForChild = !reward?.childId || reward.childId === input.childId;

  const dailyLockReason = reward?.isDailyReward
    ? getDailyRewardLockReason(
        reward,
        balance,
        state.tasks,
        state.taskSubmissions,
        input.childId,
      )
    : null;

  if (
    !reward ||
    !rewardIsAvailableForChild ||
    reward.isActive === false ||
    balance < reward.price ||
    hasOpenRequest ||
    dailyLockReason
  ) {
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
