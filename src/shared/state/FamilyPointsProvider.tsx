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
  ChildSkillUnlock,
  Reward,
  Task,
  TaskSubmission,
} from '@/shared/types/family';
import {
  approveSubmissionInState,
  rejectSubmissionInState,
  submitTaskInState,
  unlockSkillInState,
  updateRewardInState,
} from '@/shared/state/domainActions';
import type {
  AddWishInput,
  ApproveWishInput,
  ClearFavoriteGoalInput,
  CreateChildInput,
  CreateParentInput,
  CreateRewardInput,
  CreateTaskInput,
  DeleteChildInput,
  DeleteParentInput,
  DeleteTaskInput,
  FamilyPointsState,
  RejectWishInput,
  SetFavoriteGoalInput,
  SetRewardActiveInput,
  SetTaskStatusInput,
  UnlockSkillInput,
  UpdateFamilyNameInput,
  UpdateParentInput,
  UpdateRewardInput,
  UpdateTaskInput,
} from '@/shared/state/types';
import { normalizeLevelingState } from '@/shared/utils/leveling';

type FamilyPointsAction =
  | { type: 'hydrate'; payload: FamilyPointsState }
  | { type: 'resetDemoData' };

type FamilyPointsContextValue = FamilyPointsState & {
  hasHydrated: boolean;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (input: UpdateTaskInput) => Promise<void>;
  setTaskStatus: (input: SetTaskStatusInput) => Promise<void>;
  deleteTask: (input: DeleteTaskInput) => void;
  createReward: (input: CreateRewardInput) => Promise<void>;
  updateReward: (input: UpdateRewardInput) => Promise<void>;
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
  unlockSkill: (input: UnlockSkillInput) => Promise<void>;
  approveRewardRedemption: (redemptionId: string) => void;
  rejectRewardRedemption: (redemptionId: string) => void;
  fulfillRewardRedemption: (redemptionId: string) => void;
  deleteChild: (input: DeleteChildInput) => void;
  createChild: (input: CreateChildInput) => Promise<string>;
  createParent: (input: CreateParentInput) => Promise<string>;
  deleteParent: (input: DeleteParentInput) => void;
  updateParent: (input: UpdateParentInput) => void;
  updateFamilyName: (input: UpdateFamilyNameInput) => void;
  reloadState: () => Promise<void>;
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
  childProgress: [],
  childSkillUnlocks: [],
  childAchievements: [],
  redeemedRewardIds: [],
  children: [],
  parents: [],
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

  return normalizeLevelingState({
    ...nextState,
    children: nextState.children ?? [],
    parents: nextState.parents ?? [],
    favoriteGoals: nextState.favoriteGoals ?? [],
    childProgress: nextState.childProgress ?? [],
    childSkillUnlocks: nextState.childSkillUnlocks ?? [],
    childAchievements: nextState.childAchievements ?? [],
    activeChildId: nextActiveChildId,
    activeParentId: nextActiveParentId,
  });
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

const upsertById = <T extends { id: string }>(items: T[], item: T): T[] => {
  const existingIndex = items.findIndex((existingItem) => existingItem.id === item.id);

  if (existingIndex === -1) {
    return [item, ...items];
  }

  return items.map((existingItem) => (existingItem.id === item.id ? item : existingItem));
};

const toDateKey = (value: string): string => value.slice(0, 10);

const submissionsMatchSameAttempt = (
  submission: TaskSubmission,
  optimisticSubmission: TaskSubmission,
): boolean =>
  submission.taskId === optimisticSubmission.taskId &&
  submission.childId === optimisticSubmission.childId &&
  toDateKey(submission.submittedAt) === toDateKey(optimisticSubmission.submittedAt);

const skillUnlocksMatch = (
  unlock: ChildSkillUnlock,
  optimisticUnlock: ChildSkillUnlock,
): boolean =>
  unlock.childId === optimisticUnlock.childId &&
  unlock.skillId === optimisticUnlock.skillId;

const FamilyPointsContext = createContext<FamilyPointsContextValue | undefined>(undefined);

export const FamilyPointsProvider = ({ children }: PropsWithChildren) => {
  const { hasHydrated: hasAuthHydrated, session } = useAuth();
  const [state, dispatch] = useReducer(familyPointsReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const optimisticTasksRef = useRef<Task[]>([]);
  const optimisticRewardsRef = useRef<Reward[]>([]);
  const optimisticSubmissionsRef = useRef<TaskSubmission[]>([]);
  const optimisticSkillUnlocksRef = useRef<ChildSkillUnlock[]>([]);

  const mergeOptimisticState = useCallback(
    (nextState: FamilyPointsState, nextSession: AuthSession | null = session) => {
      const optimisticTasks = optimisticTasksRef.current;
      const optimisticRewards = optimisticRewardsRef.current;
      const optimisticSubmissions = optimisticSubmissionsRef.current;
      const optimisticSkillUnlocks = optimisticSkillUnlocksRef.current;

      const taskOverrides = new Map(optimisticTasks.map((task) => [task.id, task]));
      const rewardOverrides = new Map(optimisticRewards.map((reward) => [reward.id, reward]));
      const mergedTasks = [
        ...optimisticTasks.filter((task) => !nextState.tasks.some((item) => item.id === task.id)),
        ...nextState.tasks.map((task) => taskOverrides.get(task.id) ?? task),
      ];
      const mergedRewards = [
        ...optimisticRewards.filter((reward) => !nextState.rewards.some((item) => item.id === reward.id)),
        ...nextState.rewards.map((reward) => rewardOverrides.get(reward.id) ?? reward),
      ];

      const mergedSubmissions = [...nextState.taskSubmissions];

      optimisticSubmissions.forEach((optimisticSubmission) => {
        const sameIdIndex = mergedSubmissions.findIndex(
          (submission) => submission.id === optimisticSubmission.id,
        );

        if (sameIdIndex >= 0) {
          mergedSubmissions[sameIdIndex] = optimisticSubmission;
          return;
        }

        const sameAttemptIndex = mergedSubmissions.findIndex((submission) =>
          submissionsMatchSameAttempt(submission, optimisticSubmission),
        );

        if (sameAttemptIndex >= 0) {
          if (mergedSubmissions[sameAttemptIndex].status !== optimisticSubmission.status) {
            mergedSubmissions[sameAttemptIndex] = optimisticSubmission;
          }
          return;
        }

        mergedSubmissions.unshift(optimisticSubmission);
      });
      const mergedSkillUnlocks = [
        ...optimisticSkillUnlocks,
        ...nextState.childSkillUnlocks.filter(
          (unlock) =>
            !optimisticSkillUnlocks.some((optimisticUnlock) =>
              skillUnlocksMatch(unlock, optimisticUnlock),
            ),
        ),
      ];

      return applySessionToState(
        {
          ...nextState,
          tasks: mergedTasks,
          rewards: mergedRewards,
          taskSubmissions: mergedSubmissions,
          childSkillUnlocks: mergedSkillUnlocks,
        },
        nextSession,
      );
    },
    [session],
  );

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
            payload: mergeOptimisticState(storedState, session),
          });
        }

        if (isMounted && !storedState) {
          dispatch({ type: 'hydrate', payload: mergeOptimisticState(initialState, session) });
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
  }, [hasAuthHydrated, mergeOptimisticState, session]);

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
              dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) });
            }
          })
          .catch((error: unknown) => console.warn('Re-hydrate failed', error));
      }, delay);
    },
    [mergeOptimisticState, session],
  );

  // Re-hydrate when app returns to foreground
  useEffect(() => {
    if (!session) return;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') scheduleReload(0);
    });
    return () => subscription.remove();
  }, [session, scheduleReload]);

  // Polling — reliable fallback while app is active
  useEffect(() => {
    if (!session || familyPointsDataSource !== 'supabase') return;
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') scheduleReload(0);
    }, 3_000);
    return () => clearInterval(interval);
  }, [session, scheduleReload]);

  // Supabase Realtime — instant push when available
  useEffect(() => {
    if (!session || !supabaseClient || familyPointsDataSource !== 'supabase') return;
    const client = supabaseClient;

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
      client.channel(channelName),
    ).subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime channel error — polling will cover updates');
      }
    });

    return () => {
      client.removeChannel(channel);
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
        }),
    [],
  );

  const reloadFamilyPointsState = useCallback(async () => {
    if (!session) {
      dispatch({ type: 'hydrate', payload: initialState });
      return;
    }

    const nextState = await familyPointsService.loadState(session);

    if (nextState) {
      dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) });
    }
  }, [mergeOptimisticState, session]);

  const value = useMemo<FamilyPointsContextValue>(
    () => ({
      ...state,
      hasHydrated,
      createTask: async (input) => {
        const nextState = await familyPointsService.createTask(input, serviceContext);
        const createdTasks = nextState.tasks.filter(
          (task) => !serviceContext.state.tasks.some((existingTask) => existingTask.id === task.id),
        );
        optimisticTasksRef.current = createdTasks.reduce(
          (tasks, task) => upsertById(tasks, task),
          optimisticTasksRef.current,
        );
        dispatch({ type: 'hydrate', payload: nextState });
        familyPointsService
          .loadState(session)
          .then((freshState) => {
            if (freshState) {
              const freshTaskIds = new Set(freshState.tasks.map((task) => task.id));
              const mergedState = {
                ...freshState,
                tasks: [
                  ...createdTasks.filter((task) => !freshTaskIds.has(task.id)),
                  ...freshState.tasks,
                ],
              };
              dispatch({ type: 'hydrate', payload: mergeOptimisticState(mergedState, session) });
            }
          })
          .catch((error: unknown) => {
            console.warn('Failed to refresh easyQuest state after task creation', error);
          });
      },
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
      updateReward: async (input) => {
        const optimisticState = updateRewardInState(serviceContext.state, input);
        const optimisticReward = optimisticState.rewards.find((reward) => reward.id === input.rewardId);

        if (optimisticReward) {
          optimisticRewardsRef.current = upsertById(optimisticRewardsRef.current, optimisticReward);
        }
        dispatch({ type: 'hydrate', payload: optimisticState });

        try {
          const nextState = await familyPointsService.updateReward(input, serviceContext);
          optimisticRewardsRef.current = optimisticRewardsRef.current.filter(
            (reward) => reward.id !== input.rewardId,
          );
          dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) });
        } catch (error: unknown) {
          optimisticRewardsRef.current = optimisticRewardsRef.current.filter(
            (reward) => reward.id !== input.rewardId,
          );

          const freshState = await familyPointsService.loadState(session).catch(() => null);
          if (freshState) {
            dispatch({ type: 'hydrate', payload: mergeOptimisticState(freshState, session) });
          }

          console.warn('Failed to sync easyQuest reward update', error);
          throw error;
        }
      },
      setRewardActive: async (input) => {
        const nextState = await familyPointsService.setRewardActive(input, serviceContext);
        dispatch({ type: 'hydrate', payload: nextState });
      },
      submitTask: (taskId) => {
        const submitInput = { taskId, childId: serviceContext.childId };
        const optimisticState = submitTaskInState(serviceContext.state, submitInput);
        const optimisticSubmissions = optimisticState.taskSubmissions.filter(
          (submission) =>
            !serviceContext.state.taskSubmissions.some((existingSubmission) => existingSubmission.id === submission.id),
        );

        optimisticSubmissionsRef.current = optimisticSubmissions.reduce(
          (submissions, submission) => upsertById(submissions, submission),
          optimisticSubmissionsRef.current,
        );
        dispatch({ type: 'hydrate', payload: optimisticState });
        familyPointsService
          .submitTask(submitInput, serviceContext)
          .then((nextState) => {
            // Remove optimistic submission — server now owns the real record.
            // Without this, mergeOptimisticState would keep overriding the
            // server's 'approved'/'rejected' status with the stale 'pending'.
            optimisticSubmissionsRef.current = optimisticSubmissionsRef.current.filter(
              (s) => s.taskId !== submitInput.taskId || s.childId !== submitInput.childId,
            );
            dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) });
          })
          .catch((error: unknown) => {
            console.warn('Failed to sync easyQuest task submission', error);
          });
      },
      submitTaskWithProof: async (taskId, proofNote) => {
        const submitInput = { taskId, childId: serviceContext.childId, proofNote };
        const optimisticState = submitTaskInState(serviceContext.state, submitInput);
        const optimisticSubmissions = optimisticState.taskSubmissions.filter(
          (submission) =>
            !serviceContext.state.taskSubmissions.some((existingSubmission) => existingSubmission.id === submission.id),
        );

        optimisticSubmissionsRef.current = optimisticSubmissions.reduce(
          (submissions, submission) => upsertById(submissions, submission),
          optimisticSubmissionsRef.current,
        );
        dispatch({ type: 'hydrate', payload: optimisticState });
        familyPointsService
          .submitTask(submitInput, serviceContext)
          .then((nextState) => {
            // Same fix: clear optimistic submission once server confirms.
            optimisticSubmissionsRef.current = optimisticSubmissionsRef.current.filter(
              (s) => s.taskId !== submitInput.taskId || s.childId !== submitInput.childId,
            );
            dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) });
          })
          .catch((error: unknown) => {
            console.warn('Failed to sync easyQuest task submission', error);
          });
      },
      approveSubmission: (submissionId) => {
        const reviewInput = { submissionId };
        const optimisticState = approveSubmissionInState(serviceContext.state, reviewInput);
        const optimisticSubmission = optimisticState.taskSubmissions.find(
          (submission) => submission.id === submissionId,
        );
        const optimisticTask = optimisticState.tasks.find((task) => {
          const previousTask = serviceContext.state.tasks.find((item) => item.id === task.id);
          return previousTask && previousTask.status !== task.status;
        });

        if (optimisticSubmission) {
          optimisticSubmissionsRef.current = upsertById(optimisticSubmissionsRef.current, optimisticSubmission);
        }
        if (optimisticTask) {
          optimisticTasksRef.current = upsertById(optimisticTasksRef.current, optimisticTask);
        }
        dispatch({ type: 'hydrate', payload: optimisticState });
        familyPointsService
          .approveSubmission(reviewInput, serviceContext)
          .then((nextState) => dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) }))
          .catch((error: unknown) => {
            console.warn('Failed to sync easyQuest submission approval', error);
          });
      },
      rejectSubmission: (submissionId) => {
        const reviewInput = { submissionId };
        const optimisticState = rejectSubmissionInState(serviceContext.state, reviewInput);
        const optimisticSubmission = optimisticState.taskSubmissions.find(
          (submission) => submission.id === submissionId,
        );

        if (optimisticSubmission) {
          optimisticSubmissionsRef.current = upsertById(optimisticSubmissionsRef.current, optimisticSubmission);
        }
        dispatch({ type: 'hydrate', payload: optimisticState });
        familyPointsService
          .rejectSubmission(reviewInput, serviceContext)
          .then((nextState) => dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) }))
          .catch((error: unknown) => {
            console.warn('Failed to sync easyQuest submission rejection', error);
          });
      },
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
      unlockSkill: async (input) => {
        const nextState = unlockSkillInState(serviceContext.state, input);
        const nextUnlock = nextState.childSkillUnlocks.find(
          (unlock) => unlock.childId === input.childId && unlock.skillId === input.skillId,
        );

        if (nextUnlock) {
          optimisticSkillUnlocksRef.current = [
            nextUnlock,
            ...optimisticSkillUnlocksRef.current.filter(
              (unlock) => !skillUnlocksMatch(unlock, nextUnlock),
            ),
          ];
        }
        dispatch({ type: 'hydrate', payload: nextState });
      },
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
        familyPointsService
          .loadState(session)
          .then((nextState) => {
            if (nextState) {
              dispatch({ type: 'hydrate', payload: mergeOptimisticState(nextState, session) });
            }
          })
          .catch((error: unknown) => {
            console.warn('Failed to refresh easyQuest state after child creation', error);
          });
        return childId;
      },
      createParent: async (input) => {
        const { state, parentId } = await familyPointsService.createParent(input, serviceContext);
        dispatch({ type: 'hydrate', payload: state });
        return parentId;
      },
      deleteChild: (input) =>
        runServiceAction(() => familyPointsService.deleteChild(input, serviceContext)),
      deleteParent: (input) =>
        runServiceAction(() => familyPointsService.deleteParent(input, serviceContext)),
      updateParent: (input) =>
        runServiceAction(() => familyPointsService.updateParent(input, serviceContext)),
      updateFamilyName: (input) =>
        runServiceAction(() => familyPointsService.updateFamilyName(input, serviceContext)),
      reloadState: reloadFamilyPointsState,
      resetDemoData: () => {
        familyPointsService.resetState().catch((error: unknown) => {
          console.warn('Failed to reset easyQuest storage', error);
        });
        dispatch({ type: 'resetDemoData' });
      },
    }),
    [
      hasHydrated,
      mergeOptimisticState,
      reloadFamilyPointsState,
      runAnimatedServiceAction,
      runServiceAction,
      session,
      serviceContext,
      state,
    ],
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
