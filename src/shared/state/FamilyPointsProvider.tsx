import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { familyPointsService } from '@/shared/services/familyPoints';
import type {
  AddWishInput,
  CreateChildInput,
  CreateRewardInput,
  CreateTaskInput,
  DeleteChildInput,
  FamilyPointsState,
  ReviewRewardRedemptionInput,
  SetRewardActiveInput,
  SetTaskStatusInput,
  UpdateFamilyNameInput,
  UpdateTaskInput,
} from '@/shared/state/types';

type FamilyPointsAction =
  | { type: 'hydrate'; payload: FamilyPointsState }
  | { type: 'resetDemoData' };

type FamilyPointsContextValue = FamilyPointsState & {
  hasHydrated: boolean;
  createTask: (input: CreateTaskInput) => void;
  updateTask: (input: UpdateTaskInput) => void;
  setTaskStatus: (input: SetTaskStatusInput) => void;
  createReward: (input: CreateRewardInput) => void;
  setRewardActive: (input: SetRewardActiveInput) => void;
  submitTask: (taskId: string) => void;
  submitTaskWithProof: (taskId: string, proofNote: string) => void;
  approveSubmission: (submissionId: string) => void;
  rejectSubmission: (submissionId: string) => void;
  addWish: (input: AddWishInput) => void;
  redeemReward: (rewardId: string) => void;
  approveRewardRedemption: (redemptionId: string) => void;
  rejectRewardRedemption: (redemptionId: string) => void;
  fulfillRewardRedemption: (redemptionId: string) => void;
  deleteChild: (input: DeleteChildInput) => void;
  createChild: (input: CreateChildInput) => Promise<string>;
  updateFamilyName: (input: UpdateFamilyNameInput) => void;
  resetDemoData: () => void;
};

const initialState: FamilyPointsState = {
  tasks: [],
  taskSubmissions: [],
  rewards: [],
  rewardRedemptions: [],
  wishes: [],
  pointTransactions: [],
  redeemedRewardIds: [],
  children: [],
};

const familyPointsReducer = (
  state: FamilyPointsState,
  action: FamilyPointsAction,
): FamilyPointsState => {
  switch (action.type) {
    case 'hydrate':
      return action.payload;

    case 'resetDemoData':
      return initialState;

    default:
      return state;
  }
};

const FamilyPointsContext = createContext<FamilyPointsContextValue | undefined>(undefined);

export const FamilyPointsProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(familyPointsReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateState = async () => {
      try {
        const storedState = await familyPointsService.loadState();

        if (storedState) {
          dispatch({
            type: 'hydrate',
            payload: { ...storedState, children: storedState.children ?? [] },
          });
        }
      } catch (error) {
        console.warn('Failed to hydrate Family Points state', error);
      } finally {
        if (isMounted) {
          setHasHydrated(true);
        }
      }
    };

    hydrateState();

    return () => {
      isMounted = false;
    };
  }, []);

  const serviceContext = useMemo(
    () => ({
      state,
      familyId: state.activeFamilyId ?? '',
      parentId: state.activeParentId ?? '',
      childId: state.activeChildId ?? '',
    }),
    [state],
  );

  const runServiceAction = useCallback(
    (action: () => Promise<FamilyPointsState>) => {
      action()
        .then((nextState) => dispatch({ type: 'hydrate', payload: nextState }))
        .catch((error: unknown) => {
          console.warn('Failed to update Family Points state', error);
        });
    },
    [],
  );

  const value = useMemo<FamilyPointsContextValue>(
    () => ({
      ...state,
      hasHydrated,
      createTask: (input) =>
        runServiceAction(() => familyPointsService.createTask(input, serviceContext)),
      updateTask: (input) =>
        runServiceAction(() => familyPointsService.updateTask(input, serviceContext)),
      setTaskStatus: (input) =>
        runServiceAction(() => familyPointsService.setTaskStatus(input, serviceContext)),
      createReward: (input) =>
        runServiceAction(() => familyPointsService.createReward(input, serviceContext)),
      setRewardActive: (input) =>
        runServiceAction(() => familyPointsService.setRewardActive(input, serviceContext)),
      submitTask: (taskId) =>
        runServiceAction(() =>
          familyPointsService.submitTask(
            { taskId, childId: serviceContext.childId },
            serviceContext,
          ),
        ),
      submitTaskWithProof: (taskId, proofNote) =>
        runServiceAction(() =>
          familyPointsService.submitTask(
            { taskId, childId: serviceContext.childId, proofNote },
            serviceContext,
          ),
        ),
      approveSubmission: (submissionId) =>
        runServiceAction(() =>
          familyPointsService.approveSubmission({ submissionId }, serviceContext),
        ),
      rejectSubmission: (submissionId) =>
        runServiceAction(() =>
          familyPointsService.rejectSubmission({ submissionId }, serviceContext),
        ),
      addWish: (input) =>
        runServiceAction(() => familyPointsService.addWish(input, serviceContext)),
      redeemReward: (rewardId) =>
        runServiceAction(() =>
          familyPointsService.redeemReward(
            { rewardId, childId: serviceContext.childId },
            serviceContext,
          ),
        ),
      approveRewardRedemption: (redemptionId) =>
        runServiceAction(() =>
          familyPointsService.approveRewardRedemption({ redemptionId }, serviceContext),
        ),
      rejectRewardRedemption: (redemptionId) =>
        runServiceAction(() =>
          familyPointsService.rejectRewardRedemption({ redemptionId }, serviceContext),
        ),
      fulfillRewardRedemption: (redemptionId) =>
        runServiceAction(() =>
          familyPointsService.fulfillRewardRedemption({ redemptionId }, serviceContext),
        ),
      createChild: async (input) => {
        const { state, childId } = await familyPointsService.createChild(input, serviceContext);
        dispatch({ type: 'hydrate', payload: state });
        return childId;
      },
      deleteChild: (input) =>
        runServiceAction(() => familyPointsService.deleteChild(input, serviceContext)),
      updateFamilyName: (input) =>
        runServiceAction(() => familyPointsService.updateFamilyName(input, serviceContext)),
      resetDemoData: () => {
        familyPointsService.resetState().catch((error: unknown) => {
          console.warn('Failed to reset Family Points storage', error);
        });
        dispatch({ type: 'resetDemoData' });
      },
    }),
    [hasHydrated, runServiceAction, serviceContext, state],
  );

  return <FamilyPointsContext.Provider value={value}>{children}</FamilyPointsContext.Provider>;
};

export const useFamilyPoints = (): FamilyPointsContextValue => {
  const context = useContext(FamilyPointsContext);

  if (!context) {
    throw new Error('useFamilyPoints must be used within FamilyPointsProvider');
  }

  return context;
};
