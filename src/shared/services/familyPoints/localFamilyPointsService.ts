import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addWishInState,
  approveRewardRedemptionInState,
  approveSubmissionInState,
  approveWishInState,
  clearFavoriteGoalInState,
  createRewardInState,
  createTaskInState,
  deleteTaskInState,
  fulfillRewardRedemptionInState,
  redeemRewardInState,
  rejectRewardRedemptionInState,
  rejectSubmissionInState,
  rejectWishInState,
  setFavoriteGoalInState,
  setRewardActiveInState,
  setTaskStatusInState,
  submitTaskInState,
  updateTaskInState,
} from '@/shared/state/domainActions';
import type { FamilyPointsState } from '@/shared/state/types';

import type { FamilyPointsService } from './types';

const STORAGE_KEY = 'family-points:state:v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFamilyPointsState = (value: unknown): value is FamilyPointsState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.tasks) &&
    Array.isArray(value.taskSubmissions) &&
    Array.isArray(value.rewards) &&
    (value.rewardRedemptions === undefined || Array.isArray(value.rewardRedemptions)) &&
    Array.isArray(value.wishes) &&
    (value.favoriteGoals === undefined || Array.isArray(value.favoriteGoals)) &&
    Array.isArray(value.pointTransactions) &&
    Array.isArray(value.redeemedRewardIds)
  );
};

const persistState = async (state: FamilyPointsState): Promise<FamilyPointsState> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  return state;
};

export const localFamilyPointsService: FamilyPointsService = {
  loadState: async () => {
    const storedState = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedState) {
      return null;
    }

    const parsedState: unknown = JSON.parse(storedState);

    return isFamilyPointsState(parsedState)
      ? {
          ...parsedState,
          favoriteGoals: parsedState.favoriteGoals ?? [],
          rewardRedemptions: parsedState.rewardRedemptions ?? [],
        }
      : null;
  },
  saveState: async (state) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  resetState: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
  createTask: async (input, context) =>
    persistState(createTaskInState(context.state, input)),
  updateTask: async (input, context) =>
    persistState(updateTaskInState(context.state, input)),
  setTaskStatus: async (input, context) =>
    persistState(setTaskStatusInState(context.state, input)),
  deleteTask: async (input, context) =>
    persistState(deleteTaskInState(context.state, input)),
  createReward: async (input, context) =>
    persistState(createRewardInState(context.state, input)),
  setRewardActive: async (input, context) =>
    persistState(setRewardActiveInState(context.state, input)),
  submitTask: async (input, context) =>
    persistState(submitTaskInState(context.state, input)),
  approveSubmission: async (input, context) =>
    persistState(approveSubmissionInState(context.state, input)),
  rejectSubmission: async (input, context) =>
    persistState(rejectSubmissionInState(context.state, input)),
  addWish: async (input, context) =>
    persistState(addWishInState(context.state, input)),
  approveWish: async (input, context) =>
    persistState(approveWishInState(context.state, input)),
  rejectWish: async (input, context) =>
    persistState(rejectWishInState(context.state, input)),
  redeemReward: async (input, context) =>
    persistState(redeemRewardInState(context.state, input)),
  setFavoriteGoal: async (input, context) =>
    persistState(setFavoriteGoalInState(context.state, input)),
  clearFavoriteGoal: async (input, context) =>
    persistState(clearFavoriteGoalInState(context.state, input)),
  approveRewardRedemption: async (input, context) =>
    persistState(approveRewardRedemptionInState(context.state, input)),
  rejectRewardRedemption: async (input, context) =>
    persistState(rejectRewardRedemptionInState(context.state, input)),
  fulfillRewardRedemption: async (input, context) =>
    persistState(fulfillRewardRedemptionInState(context.state, input)),
  createChild: async (input, context) => {
    const newChild = {
      id: `child-${Date.now()}`,
      name: input.name,
      role: 'child' as const,
      avatarColor: input.avatarColor,
    };
    const isFirstChild = context.state.children.length === 0;
    const nextState = {
      ...context.state,
      children: [...context.state.children, newChild],
      ...(isFirstChild && input.familyName ? { familyName: input.familyName.trim() } : {}),
    };
    await persistState(nextState);
    return { state: nextState, childId: newChild.id };
  },
  deleteChild: async (input, context) => {
    const nextState = {
      ...context.state,
      children: context.state.children.filter((c) => c.id !== input.childId),
    };
    return persistState(nextState);
  },
  updateFamilyName: async (input, context) => {
    const nextState = { ...context.state, familyName: input.familyName.trim() };
    return persistState(nextState);
  },
};
