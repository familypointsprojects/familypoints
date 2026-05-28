import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AppState, LayoutAnimation, Platform, UIManager, type LayoutAnimationConfig } from 'react-native';

import { useAuth } from '@/shared/auth';
import type { AuthSession } from '@/shared/auth/types';
import { familyPointsService, familyPointsDataSource } from '@/shared/services/familyPoints';
import { supabaseClient } from '@/shared/services/supabase';
import type {
  AddWishInput,
  ApproveWishInput,
  ClearFavoriteGoalInput,
  CreateChildInput,
  CreateRewardInput,
  CreateTaskInput,
  DeleteChildInput,
  DeleteTaskInput,
  FamilyPointsState,
  RejectWishInput,
  SetFavoriteGoalInput,
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
  deleteTask: (input: DeleteTaskInput) => void;
  createReward: (input: CreateRewardInput) => Promise<void>;
  setRewardActive: (input: SetRewardActiveInput) => Promise<void>;
  submitTask: (taskId: string) => void;
  submitTaskWithProof: (taskId: string, proofNote: string) => Promise<void>;
  approveSubmission: (submissionId: string) => void;
  rejectSubmission: (submissionId: string) => void;
  addWish: (input: AddWishInput) => void;
  approveWish: (input: ApproveWishInput) => Promise<void>;
  rejectWish: (input: RejectWishInput) => Promise<void>;
  redeemReward: (rewardId: string) => void;
  setFavoriteGoal: (input: SetFavoriteGoalInput) => Promise<void>;
  clearFavoriteGoal: (input: ClearFavoriteGoalInput) => Promise<void>;
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
  favoriteGoals: [],
  pointTransactions: [],
  redeemedRewardIds: [],
  children: [],
};

const favoriteGoalLayoutAnimation: LayoutAnimationConfig = {
  duration: 3000,
  create: {
    duration: 420,
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  update: {
    springDamping: 0.97,
    type: LayoutAnimation.Types.spring,
  },
  delete: {
    duration: 360,
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

const applySessionToState = (
  nextState: FamilyPointsState,
  session: AuthSession | null,
): FamilyPointsState => {
  const sessionChildId =
    session?.role === 'child' ? session.childId ?? session.profileId : undefined;
  const nextActiveChildId = sessionChildId ?? nextState.activeChildId ?? nextState.children[0]?.id;
  const nextActiveParentId =
    session?.role === 'parent' ? session.profileId : nextState.activeParentId;

  return {
    ...nextState,
    children: nextState.children ?? [],
    favoriteGoals: nextState.favoriteGoals ?? [],
    activeChildId: nextActiveChildId,
    activeParentId: nextActiveParentId,
  };
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
  const { hasHydrated: hasAuthHydrated, session } = useAuth();
  const [state, dispatch] = useReducer(familyPointsReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  useEffect(() => {
    if (!hasAuthHydrated) {
      return undefined;
    }

    let isMounted = true;

    const hydrateState = async () => {
      if (!session) {
        dispatch({ type: 'hydrate', payload: initialState });
        setHasHydrated(true);
        return;
      }

      try {
        const storedState = await familyPointsService.loadState(session);

        if (isMounted && storedState) {
          dispatch({
            type: 'hydrate',
            payload: applySessionToState(storedState, session),
          });
        }

        if (isMounted && !storedState) {
          dispatch({ type: 'hydrate', payload: applySessionToState(initialState, session) });
        }
      } catch (error) {
        console.warn('Failed to hydrate easyQuest state', error);
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
  }, [hasAuthHydrated, session]);

  // Central reload helper — shared by polling, realtime and foreground handlers
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReload = useCallback(
    (delay = 300) => {
      if (!session) return;
      if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = setTimeout(() => {
        familyPointsService
          .loadState(session)
          .then((nextState) => {
            if (nextState) {
              dispatch({ type: 'hydrate', payload: applySessionToState(nextState, session) });
            }
          })
          .catch((error: unknown) => console.warn('Re-hydrate failed', error));
      }, delay);
    },
    [session],
  );

  // Re-hydrate when app returns to foreground
  useEffect(() => {
    if (!session) return;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') scheduleReload(0);
    });
    return () => subscription.remove();
  }, [session, scheduleReload]);

  // Polling — reliable fallback, every 10 s while app is active
  useEffect(() => {
    if (!session || familyPointsDataSource !== 'supabase') return;
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') scheduleReload(0);
    }, 10_000);
    return () => clearInterval(interval);
  }, [session, scheduleReload]);

  // Supabase Realtime — instant push when available
  useEffect(() => {
    if (!session || !supabaseClient || familyPointsDataSource !== 'supabase') return;

    const REALTIME_TABLES = [
      'tasks',
      'task_submissions',
      'point_transactions',
      'rewards',
      'reward_redemptions',
      'wishes',
      'favorite_goals',
      'children',
    ] as const;

    const channelName = `family-realtime-${session.profileId ?? 'anon'}`;
    const channel = REALTIME_TABLES.reduce(
      (ch, table) =>
        ch.on('postgres_changes' as const, { event: '*', schema: 'public', table }, () =>
          scheduleReload(),
        ),
      supabaseClient.channel(channelName),
    ).subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime channel error — polling will cover updates');
      }
    });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [session, scheduleReload]);

  const serviceContext = useMemo(
    () => ({
      state,
      familyId: state.activeFamilyId ?? '',
      parentId: state.activeParentId ?? '',
      childId:
      (session?.role === 'child' ? (session.childId ?? session.profileId) : undefined) ??
      state.activeChildId ??
      '',
      session,
    }),
    [session, state],
  );

  const runServiceAction = useCallback(
    (action: () => Promise<FamilyPointsState>): Promise<void> =>
      action()
        .then((nextState) => dispatch({ type: 'hydrate', payload: nextState }))
        .catch((error: unknown) => {
          console.warn('Failed to update easyQuest state', error);
        }),
    [],
  );

  const runAnimatedServiceAction = useCallback(
    (action: () => Promise<FamilyPointsState>): Promise<void> =>
      action()
        .then((nextState) => {
          LayoutAnimation.configureNext(favoriteGoalLayoutAnimation);
          dispatch({ type: 'hydrate', payload: nextState });
        })
        .catch((error: unknown) => {
          console.warn('Failed to update easyQuest state', error);
        }),
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
      deleteTask: (input) =>
        runServiceAction(() => familyPointsService.deleteTask(input, serviceContext)),
      createReward: async (input) => {
        const nextState = await familyPointsService.createReward(input, serviceContext);
        dispatch({ type: 'hydrate', payload: nextState });
      },
      setRewardActive: async (input) => {
        const nextState = await familyPointsService.setRewardActive(input, serviceContext);
        dispatch({ type: 'hydrate', payload: nextState });
      },
      submitTask: (taskId) =>
        runServiceAction(() =>
          familyPointsService.submitTask(
            { taskId, childId: serviceContext.childId },
            serviceContext,
          ),
        ),
      submitTaskWithProof: async (taskId, proofNote) => {
        const nextState = await familyPointsService.submitTask(
          { taskId, childId: serviceContext.childId, proofNote },
          serviceContext,
        );
        dispatch({ type: 'hydrate', payload: nextState });
      },
      approveSubmission: (submissionId) =>
        runServiceAction(() =>
          familyPointsService.approveSubmission({ submissionId }, serviceContext),
        ),
      rejectSubmission: (submissionId) =>
        runServiceAction(() =>
          familyPointsService.rejectSubmission({ submissionId }, serviceContext),
        ),
      addWish: (input) =>
        runServiceAction(() =>
          familyPointsService.addWish(
            { ...input, childId: (input.childId ?? serviceContext.childId) || undefined },
            serviceContext,
          ),
        ),
      approveWish: async (input) => {
        const nextState = await familyPointsService.approveWish(input, serviceContext);
        dispatch({ type: 'hydrate', payload: nextState });
      },
      rejectWish: async (input) => {
        const nextState = await familyPointsService.rejectWish(input, serviceContext);
        dispatch({ type: 'hydrate', payload: nextState });
      },
      redeemReward: (rewardId) =>
        runServiceAction(() =>
          familyPointsService.redeemReward(
            { rewardId, childId: serviceContext.childId },
            serviceContext,
          ),
        ),
      setFavoriteGoal: (input) =>
        runAnimatedServiceAction(() => familyPointsService.setFavoriteGoal(input, serviceContext)),
      clearFavoriteGoal: (input) =>
        runAnimatedServiceAction(() => familyPointsService.clearFavoriteGoal(input, serviceContext)),
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
          console.warn('Failed to reset easyQuest storage', error);
        });
        dispatch({ type: 'resetDemoData' });
      },
    }),
    [hasHydrated, runAnimatedServiceAction, runServiceAction, serviceContext, state],
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
