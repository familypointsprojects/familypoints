import type { FamilyPointsState } from '@/shared/state/types';
import { getSupabaseClient, loadChildFamilyState } from '@/shared/services/supabase';
import type { AuthSession } from '@/shared/auth/types';
import { getBalance } from '@/shared/utils/points';

import {
  mapChildRowToChildProfile,
  mapFavoriteGoalRowToFavoriteGoal,
  mapPointTransactionRowToPointTransaction,
  mapRewardRowToReward,
  mapTaskRowToTask,
  mapTaskSubmissionRowToTaskSubmission,
  mapWishRowToWish,
} from './mappers';
import type {
  ChildRow,
  FavoriteGoalRow,
  FamilyMemberRow,
  FamilyRow,
  PointTransactionRow,
  RewardRedemptionRow,
  RewardRow,
  TaskRow,
  TaskSubmissionRow,
  WishRow,
} from './supabaseDtos';
import type { FamilyPointsService } from './types';

const createSupabaseServiceError = (operation: string): Error =>
  new Error(
    `Supabase easyQuest ${operation} is not implemented yet. The client is configured, but the app still uses localFamilyPointsService.`,
  );

const throwSupabaseError = (operation: string, message: string): never => {
  throw new Error(`Failed to ${operation}: ${message}`);
};

const isMissingAuthSessionError = (message?: string): boolean =>
  message?.toLowerCase().includes('auth session missing') ?? false;

const isMissingRelationError = (message?: string): boolean => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  return normalizedMessage.includes('does not exist') || normalizedMessage.includes('schema cache');
};

const getRequiredCurrentUserId = async (): Promise<string> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throwSupabaseError('load current user', error.message);
  }

  const user = data.user;

  if (!user) {
    throw new Error('Failed to load current user: User is not authenticated');
  }

  return user.id;
};

const getFirstFamilyMembership = async (
  profileId: string,
): Promise<FamilyMemberRow | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('profile_id', profileId)
    .limit(1);

  if (error) {
    throwSupabaseError('load family membership', error.message);
  }

  const memberships = (data ?? []) as FamilyMemberRow[];

  return memberships[0] ?? null;
};

const getFamilyChildren = async (familyId: string): Promise<ChildRow[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });

  if (error) {
    throwSupabaseError('load children', error.message);
  }

  return (data ?? []) as ChildRow[];
};

const getFamilyTasks = async (familyId: string): Promise<TaskRow[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) {
    throwSupabaseError('load tasks', error.message);
  }

  return (data ?? []) as TaskRow[];
};

const getFamilyRewards = async (familyId: string): Promise<RewardRow[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) {
    throwSupabaseError('load rewards', error.message);
  }

  return (data ?? []) as RewardRow[];
};

const getChildSubmissions = async (childIds: string[]): Promise<TaskSubmissionRow[]> => {
  if (childIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*')
    .in('child_id', childIds)
    .order('submitted_at', { ascending: false });

  if (error) {
    throwSupabaseError('load task submissions', error.message);
  }

  return (data ?? []) as TaskSubmissionRow[];
};

const getChildWishes = async (childIds: string[]): Promise<WishRow[]> => {
  if (childIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .in('child_id', childIds)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    throwSupabaseError('load wishes', error.message);
  }

  return (data ?? []) as WishRow[];
};

const getChildPointTransactions = async (
  childIds: string[],
): Promise<PointTransactionRow[]> => {
  if (childIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .in('child_id', childIds)
    .order('created_at', { ascending: false });

  if (error) {
    throwSupabaseError('load point transactions', error.message);
  }

  return (data ?? []) as PointTransactionRow[];
};

const getChildRewardRedemptions = async (
  childIds: string[],
): Promise<RewardRedemptionRow[]> => {
  if (childIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*')
    .in('child_id', childIds)
    .order('requested_at', { ascending: false });

  if (error) {
    throwSupabaseError('load reward redemptions', error.message);
  }

  return (data ?? []) as RewardRedemptionRow[];
};

const getChildFavoriteGoals = async (childIds: string[]): Promise<FavoriteGoalRow[]> => {
  if (childIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('favorite_goals')
    .select('*')
    .in('child_id', childIds);

  if (error) {
    if (isMissingRelationError(error.message)) {
      return [];
    }

    throwSupabaseError('load favorite goals', error.message);
  }

  return (data ?? []) as FavoriteGoalRow[];
};

const getRequiredFamilyMembership = async (): Promise<FamilyMemberRow> => {
  const userId = await getRequiredCurrentUserId();
  const membership = await getFirstFamilyMembership(userId);

  if (membership) {
    return membership;
  }

  throw new Error('Failed to load family membership: Current user has no family');
};

const reloadState = async (session?: AuthSession | null): Promise<FamilyPointsState> => {
  const state = await supabaseFamilyPointsService.loadState(session);

  if (state) {
    return state;
  }

  throw new Error('Failed to reload family points state: No family state is available');
};

const hasRewardSpendTransaction = async (redemptionId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('point_transactions')
    .select('id')
    .eq('source_reward_redemption_id', redemptionId)
    .eq('type', 'spend')
    .limit(1);

  if (error) {
    throwSupabaseError('load reward spend transaction', error.message);
  }

  return (data ?? []).length > 0;
};

const hasRewardRefundTransaction = async (redemptionId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('point_transactions')
    .select('id')
    .eq('source_reward_redemption_id', redemptionId)
    .eq('type', 'manual_adjustment')
    .gt('points', 0)
    .limit(1);

  if (error) {
    throwSupabaseError('load reward refund transaction', error.message);
  }

  return (data ?? []).length > 0;
};

const createRewardSpendTransactionIfNeeded = async (
  redemption: RewardRedemptionRow,
  reward: RewardRow,
  createdBy: string | null,
): Promise<void> => {
  const hasSpend = await hasRewardSpendTransaction(redemption.id);

  if (hasSpend) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('point_transactions').insert({
    child_id: redemption.child_id,
    title: reward.title,
    points: -redemption.points_spent,
    type: 'spend',
    source_task_submission_id: null,
    source_reward_redemption_id: redemption.id,
    created_by: createdBy,
  });

  if (error) {
    throwSupabaseError('create reward spend transaction', error.message);
  }
};

const createRewardRefundTransactionIfNeeded = async (
  redemption: RewardRedemptionRow,
  reward: RewardRow,
  createdBy: string | null,
): Promise<void> => {
  const hasSpend = await hasRewardSpendTransaction(redemption.id);
  const hasRefund = await hasRewardRefundTransaction(redemption.id);

  if (!hasSpend || hasRefund) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('point_transactions').insert({
    child_id: redemption.child_id,
    title: `Refund: ${reward.title}`,
    points: redemption.points_spent,
    type: 'manual_adjustment',
    source_task_submission_id: null,
    source_reward_redemption_id: redemption.id,
    created_by: createdBy,
  });

  if (error) {
    throwSupabaseError('create reward refund transaction', error.message);
  }
};

export const supabaseFamilyPointsService: FamilyPointsService = {
  loadState: async (session) => {
    if (session?.role === 'child') {
      return loadChildFamilyState(session);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (isMissingAuthSessionError(error.message)) {
        return null;
      }

      throwSupabaseError('load current user', error.message);
    }

    if (!data.user) {
      return null;
    }

    const membership = await getFirstFamilyMembership(data.user.id);

    if (!membership) {
      return null;
    }

    const children = await getFamilyChildren(membership.family_id);
    const childIds = children.map((child) => child.id);

    const [
      taskRows,
      submissionRows,
      rewardRows,
      wishRows,
      transactionRows,
      redemptionRows,
      favoriteGoalRows,
      familyResult,
    ] = await Promise.all([
      getFamilyTasks(membership.family_id),
      getChildSubmissions(childIds),
      getFamilyRewards(membership.family_id),
      getChildWishes(childIds),
      getChildPointTransactions(childIds),
      getChildRewardRedemptions(childIds),
      getChildFavoriteGoals(childIds),
      supabase.from('families').select('name').eq('id', membership.family_id).single(),
    ]);

    const familyName = (familyResult.data as FamilyRow | null)?.name;

    return {
      tasks: taskRows.map(mapTaskRowToTask),
      taskSubmissions: submissionRows.map(mapTaskSubmissionRowToTaskSubmission),
      rewards: rewardRows.map(mapRewardRowToReward),
      rewardRedemptions: redemptionRows.map((redemption) => ({
        id: redemption.id,
        rewardId: redemption.reward_id,
        childId: redemption.child_id,
        pointsSpent: redemption.points_spent,
        status: redemption.status,
        requestedAt: redemption.requested_at,
      })),
      wishes: wishRows.map(mapWishRowToWish),
      favoriteGoals: favoriteGoalRows.map(mapFavoriteGoalRowToFavoriteGoal),
      pointTransactions: transactionRows.map(mapPointTransactionRowToPointTransaction),
      redeemedRewardIds: redemptionRows
        .filter((redemption) => redemption.status === 'requested' || redemption.status === 'approved')
        .map((redemption) => redemption.reward_id),
      children: children.map(mapChildRowToChildProfile),
      activeFamilyId: membership.family_id,
      activeParentId: data.user.id,
      activeChildId: childIds[0],
      familyName,
    };
  },
  createTask: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const membership = await getRequiredFamilyMembership();
    const { error } = await supabase.from('tasks').insert({
      family_id: membership.family_id,
      child_id: null,
      title: input.title.trim(),
      description: input.description.trim(),
      points: input.points,
      status: 'active',
      is_daily: input.isDaily ?? false,
      available_days: input.availableDays ?? [],
      created_by: userId,
    });

    if (error) {
      throwSupabaseError('create task', error.message);
    }

    return reloadState();
  },
  updateTask: async (input) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tasks')
      .update({
        title: input.title.trim(),
        description: input.description.trim(),
        points: input.points,
        status: input.status,
        is_daily: input.isDaily ?? false,
        available_days: input.availableDays ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.taskId);

    if (error) {
      throwSupabaseError('update task', error.message);
    }

    return reloadState();
  },
  setTaskStatus: async (input) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tasks')
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq('id', input.taskId);

    if (error) {
      throwSupabaseError('update task status', error.message);
    }

    return reloadState();
  },
  deleteTask: async (input) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', input.taskId);

    if (error) {
      throwSupabaseError('delete task', error.message);
    }

    return reloadState();
  },
  createReward: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const membership = await getRequiredFamilyMembership();
    const { error } = await supabase
      .from('rewards')
      .insert({
        family_id: membership.family_id,
        title: input.title.trim(),
        price: input.price,
        type: input.type,
        is_active: true,
        is_daily_reward: input.isDailyReward ?? false,
        available_days: input.availableDays ?? [],
        requires_daily_quests_completed: input.requiresDailyQuestsCompleted ?? false,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      throwSupabaseError('create reward', error.message);
    }

    return reloadState();
  },
  setRewardActive: async (input) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('rewards')
      .update({ is_active: input.isActive, updated_at: new Date().toISOString() })
      .eq('id', input.rewardId)
      .select('id')
      .single();

    if (error) {
      throwSupabaseError('update reward status', error.message);
    }

    return reloadState();
  },
  submitTask: async (input, context) => {
    const supabase = getSupabaseClient();

    if (context.session?.role === 'child') {
      const { data, error } = await supabase.rpc('submit_child_task', {
        child_id_input: input.childId,
        profile_id_input: context.session.profileId,
        proof_note_input: input.proofNote?.trim() || null,
        task_id_input: input.taskId,
      });

      if (error) {
        throwSupabaseError('submit task', error.message);
      }

      const result = data as { error?: string } | null;

      if (result?.error) {
        throwSupabaseError('submit task', result.error);
      }

      return reloadState(context.session);
    }

    const { error } = await supabase.from('task_submissions').insert({
      task_id: input.taskId,
      child_id: input.childId,
      status: 'pending',
      photo_url: input.proofNote?.trim() || null,
    });

    if (error) {
      throwSupabaseError('submit task', error.message);
    }

    return reloadState();
  },
  approveSubmission: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const reviewedAt = new Date().toISOString();
    const { data: submissionData, error: submissionError } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('id', input.submissionId)
      .single();

    if (submissionError) {
      throwSupabaseError('load task submission', submissionError.message);
    }

    const submission = submissionData as TaskSubmissionRow;

    if (submission.status === 'approved') {
      return reloadState();
    }

    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', submission.task_id)
      .single();

    if (taskError) {
      throwSupabaseError('load submitted task', taskError.message);
    }

    const task = taskData as TaskRow;
    const { error: updateError } = await supabase
      .from('task_submissions')
      .update({
        status: 'approved',
        reviewed_by: userId,
        reviewed_at: reviewedAt,
      })
      .eq('id', input.submissionId);

    if (updateError) {
      throwSupabaseError('approve task submission', updateError.message);
    }

    const { error: transactionError } = await supabase.from('point_transactions').insert({
      child_id: submission.child_id,
      title: task.title,
      points: task.points,
      type: 'earn',
      source_task_submission_id: submission.id,
      source_reward_redemption_id: null,
      created_by: userId,
    });

    if (transactionError) {
      throwSupabaseError('create earn transaction', transactionError.message);
    }

    // Daily quests stay active so they can be submitted again tomorrow.
    // Only one-time tasks are deactivated after approval.
    if (!task.is_daily) {
      const { error: taskStatusError } = await supabase
        .from('tasks')
        .update({ status: 'inactive', updated_at: reviewedAt })
        .eq('id', task.id);

      if (taskStatusError) {
        throwSupabaseError('deactivate approved task', taskStatusError.message);
      }
    }

    return reloadState();
  },
  rejectSubmission: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const { error } = await supabase
      .from('task_submissions')
      .update({
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.submissionId);

    if (error) {
      throwSupabaseError('reject task submission', error.message);
    }

    return reloadState();
  },
  addWish: async (input, context) => {
    const supabase = getSupabaseClient();

    if (context.session?.role === 'child') {
      const { data, error } = await supabase.rpc('add_child_wish', {
        child_id_input: context.childId,
        price_input: input.price,
        profile_id_input: context.session.profileId,
        title_input: input.title.trim(),
      });

      if (error) {
        throwSupabaseError('add wish', error.message);
      }

      const result = data as { error?: string } | null;

      if (result?.error) {
        throwSupabaseError('add wish', result.error);
      }

      return reloadState(context.session);
    }

    const { error } = await supabase.from('wishes').insert({
      child_id: context.childId,
      title: input.title.trim(),
      price: input.price,
      is_archived: false,
    });

    if (error) {
      throwSupabaseError('add wish', error.message);
    }

    return reloadState();
  },
  redeemReward: async (input, context) => {
    const supabase = getSupabaseClient();

    if (context.session?.role === 'child') {
      const { data, error } = await supabase.rpc('create_child_reward_redemption', {
        child_id_input: input.childId,
        profile_id_input: context.session.profileId,
        reward_id_input: input.rewardId,
      });

      if (error) {
        throwSupabaseError('redeem reward', error.message);
      }

      const result = data as { error?: string } | null;

      if (result?.error) {
        throwSupabaseError('redeem reward', result.error);
      }

      return reloadState(context.session);
    }

    const reward = context.state.rewards.find((item) => item.id === input.rewardId);
    const balance = getBalance(context.state.pointTransactions, input.childId);
    const hasOpenRequest = context.state.rewardRedemptions.some(
      (redemption) =>
        redemption.childId === input.childId &&
        redemption.rewardId === input.rewardId &&
        (redemption.status === 'requested' || redemption.status === 'approved'),
    );

    if (!reward || reward.isActive === false || balance < reward.price || hasOpenRequest) {
      return reloadState();
    }

    const { data: redemptionData, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        reward_id: reward.id,
        child_id: input.childId,
        points_spent: reward.price,
        status: 'requested',
      })
      .select('*')
      .single();

    if (redemptionError) {
      throwSupabaseError('redeem reward', redemptionError.message);
    }

    await createRewardSpendTransactionIfNeeded(
      redemptionData as RewardRedemptionRow,
      {
        id: reward.id,
        family_id: context.familyId,
        title: reward.title ?? '',
        price: reward.price,
        type: reward.type,
        is_active: true,
        is_daily_reward: reward.isDailyReward ?? false,
        available_days: reward.availableDays ?? [],
        requires_daily_quests_completed: reward.requiresDailyQuestsCompleted ?? false,
        created_by: context.parentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      context.parentId || null,
    );

    return reloadState();
  },
  setFavoriteGoal: async (input, context) => {
    const supabase = getSupabaseClient();

    if (context.session?.role === 'child') {
      const { data, error } = await supabase.rpc('set_child_favorite_goal', {
        child_id_input: input.childId,
        profile_id_input: context.session.profileId,
        target_id_input: input.itemId,
        target_type_input: input.type,
      });

      if (error) {
        throwSupabaseError('set favorite goal', error.message);
      }

      const result = data as { error?: string } | null;

      if (result?.error) {
        throwSupabaseError('set favorite goal', result.error);
      }

      const nextState = await reloadState(context.session);

      return {
        ...nextState,
        favoriteGoals: [
          ...nextState.favoriteGoals.filter((goal) => goal.childId !== input.childId),
          {
            childId: input.childId,
            type: input.type,
            itemId: input.itemId,
          },
        ],
      };
    }

    const { error } = await supabase.from('favorite_goals').upsert(
      {
        child_id: input.childId,
        target_type: input.type,
        target_id: input.itemId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id' },
    );

    if (error) {
      throwSupabaseError('set favorite goal', error.message);
    }

    return reloadState(context.session);
  },
  clearFavoriteGoal: async (input, context) => {
    const supabase = getSupabaseClient();

    if (context.session?.role === 'child') {
      const { data, error } = await supabase.rpc('clear_child_favorite_goal', {
        child_id_input: input.childId,
        profile_id_input: context.session.profileId,
      });

      if (error) {
        throwSupabaseError('clear favorite goal', error.message);
      }

      const result = data as { error?: string } | null;

      if (result?.error) {
        throwSupabaseError('clear favorite goal', result.error);
      }

      const nextState = await reloadState(context.session);

      return {
        ...nextState,
        favoriteGoals: nextState.favoriteGoals.filter((goal) => goal.childId !== input.childId),
      };
    }

    const { error } = await supabase
      .from('favorite_goals')
      .delete()
      .eq('child_id', input.childId);

    if (error) {
      throwSupabaseError('clear favorite goal', error.message);
    }

    return reloadState(context.session);
  },
  approveRewardRedemption: async (input, context) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const reviewedAt = new Date().toISOString();
    const { data: redemptionData, error: redemptionLoadError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', input.redemptionId)
      .single();

    if (redemptionLoadError) {
      throwSupabaseError('load reward redemption', redemptionLoadError.message);
    }

    const redemption = redemptionData as RewardRedemptionRow;

    if (redemption.status !== 'requested') {
      return reloadState();
    }

    const hasSpend = await hasRewardSpendTransaction(redemption.id);
    const balance = getBalance(context.state.pointTransactions, redemption.child_id);

    if (!hasSpend && balance < redemption.points_spent) {
      return reloadState();
    }

    const { data: rewardData, error: rewardLoadError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', redemption.reward_id)
      .single();

    if (rewardLoadError) {
      throwSupabaseError('load redeemed reward', rewardLoadError.message);
    }

    const reward = rewardData as RewardRow;
    const { error: updateError } = await supabase
      .from('reward_redemptions')
      .update({ status: 'approved', reviewed_by: userId, reviewed_at: reviewedAt })
      .eq('id', input.redemptionId);

    if (updateError) {
      throwSupabaseError('approve reward redemption', updateError.message);
    }

    await createRewardSpendTransactionIfNeeded(redemption, reward, userId);

    return reloadState();
  },
  rejectRewardRedemption: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', input.redemptionId)
      .single();

    if (redemptionError) {
      throwSupabaseError('load reward redemption', redemptionError.message);
    }

    const redemption = redemptionData as RewardRedemptionRow;
    const { data: rewardData, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', redemption.reward_id)
      .single();

    if (rewardError) {
      throwSupabaseError('load rejected reward', rewardError.message);
    }

    const reward = rewardData as RewardRow;
    const { error } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.redemptionId);

    if (error) {
      throwSupabaseError('reject reward redemption', error.message);
    }

    await createRewardRefundTransactionIfNeeded(redemption, reward, userId);

    return reloadState();
  },
  fulfillRewardRedemption: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const reviewedAt = new Date().toISOString();
    const { data: redemptionData, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', input.redemptionId)
      .single();

    if (redemptionError) {
      throwSupabaseError('load reward redemption', redemptionError.message);
    }

    const redemption = redemptionData as RewardRedemptionRow;
    const { error } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'fulfilled',
        reviewed_by: userId,
        reviewed_at: reviewedAt,
      })
      .eq('id', input.redemptionId);

    if (error) {
      throwSupabaseError('fulfill reward redemption', error.message);
    }

    const { error: rewardError } = await supabase
      .from('rewards')
      .update({ is_active: false, updated_at: reviewedAt })
      .eq('id', redemption.reward_id);

    if (rewardError) {
      throwSupabaseError('deactivate fulfilled reward', rewardError.message);
    }

    const { data: rewardData, error: rewardLoadError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', redemption.reward_id)
      .single();

    if (rewardLoadError) {
      throwSupabaseError('load fulfilled reward', rewardLoadError.message);
    }

    const reward = rewardData as RewardRow;

    if (reward.type === 'wish') {
      const { error: wishArchiveError } = await supabase
        .from('wishes')
        .update({ is_archived: true, updated_at: reviewedAt })
        .eq('child_id', redemption.child_id)
        .eq('status', 'approved')
        .eq('title', reward.title)
        .eq('price', reward.price);

      if (wishArchiveError) {
        throwSupabaseError('archive fulfilled wish', wishArchiveError.message);
      }
    }

    await createRewardSpendTransactionIfNeeded(redemption, reward, userId);

    return reloadState();
  },
  createChild: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();

    // Ищем существующую семью или создаём новую
    let familyId: string;
    const existingMembership = await getFirstFamilyMembership(userId);

    if (existingMembership) {
      familyId = existingMembership.family_id;
    } else {
      // Создаём семью (первый ребёнок)
      const name = (input.familyName ?? 'Моя семья').trim();
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({ name, created_by: userId })
        .select('id')
        .single();

      if (familyError || !familyData) {
        throwSupabaseError('create family', familyError?.message ?? 'unknown');
      }

      familyId = (familyData as { id: string }).id;

      // Добавляем родителя в family_members
      const { error: parentMemberError } = await supabase
        .from('family_members')
        .insert({ family_id: familyId, profile_id: userId, role: 'parent' });

      if (parentMemberError) {
        throwSupabaseError('add parent to family', parentMemberError.message);
      }
    }

    // Создаём профиль ребёнка
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({ name: input.name.trim(), role: 'child' })
      .select('id')
      .single();

    if (profileError || !profileData) {
      throwSupabaseError('create child profile', profileError?.message ?? 'unknown');
    }

    const profileId = (profileData as { id: string }).id;

    // Создаём запись в children
    const { data: childData, error: childError } = await supabase
      .from('children')
      .insert({
        family_id: familyId,
        profile_id: profileId,
        display_name: input.name.trim(),
        avatar_color: input.avatarColor,
      })
      .select('id')
      .single();

    if (childError || !childData) {
      throwSupabaseError('create child', childError?.message ?? 'unknown');
    }

    const childId = (childData as { id: string }).id;

    // Добавляем ребёнка в family_members
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({ family_id: familyId, profile_id: profileId, role: 'child' });

    if (memberError) {
      throwSupabaseError('add child to family', memberError.message);
    }

    const state = await reloadState();
    return { state, childId };
  },
  deleteChild: async (input) => {
    const supabase = getSupabaseClient();

    // Удаляем профиль — это каскадно удалит children, family_members, tasks и т.д.
    const { data: childRow, error: fetchError } = await supabase
      .from('children')
      .select('profile_id')
      .eq('id', input.childId)
      .single();

    if (fetchError || !childRow) {
      throwSupabaseError('fetch child profile', fetchError?.message ?? 'not found');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', (childRow as { profile_id: string }).profile_id);

    if (error) {
      throwSupabaseError('delete child', error.message);
    }

    return reloadState();
  },
  updateFamilyName: async (input) => {
    const supabase = getSupabaseClient();
    const membership = await getRequiredFamilyMembership();
    const { error } = await supabase
      .from('families')
      .update({ name: input.familyName.trim(), updated_at: new Date().toISOString() })
      .eq('id', membership.family_id);

    if (error) {
      throwSupabaseError('update family name', error.message);
    }

    return reloadState();
  },
  approveWish: async (input, context) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();

    const { data, error } = await supabase.rpc('approve_wish', {
      wish_id_input: input.wishId,
      price_input: input.price,
      profile_id_input: userId,
    });

    if (error) {
      throwSupabaseError('approve wish', error.message);
    }

    const result = data as { error?: string } | null;

    if (result?.error) {
      throwSupabaseError('approve wish', result.error);
    }

    const nextState = await reloadState(context.session);

    return {
      ...nextState,
      wishes: nextState.wishes.map((wish) =>
        wish.id === input.wishId ? { ...wish, price: input.price, status: 'approved' } : wish,
      ),
    };
  },
  rejectWish: async (input, context) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('reject_wish', {
      wish_id_input: input.wishId,
    });

    if (error) {
      throwSupabaseError('reject wish', error.message);
    }

    const result = data as { error?: string } | null;

    if (result?.error) {
      throwSupabaseError('reject wish', result.error);
    }

    const nextState = await reloadState(context.session);

    return {
      ...nextState,
      wishes: nextState.wishes.map((wish) =>
        wish.id === input.wishId ? { ...wish, status: 'rejected' } : wish,
      ),
    };
  },
  saveState: async (state: FamilyPointsState) => {
    getSupabaseClient();
    void state;

    throw createSupabaseServiceError('saveState');
  },
  resetState: async () => {
    getSupabaseClient();

    throw createSupabaseServiceError('resetState');
  },
};
