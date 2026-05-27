import type { FamilyPointsState } from '@/shared/state/types';
import { getSupabaseClient } from '@/shared/services/supabase';
import { getBalance } from '@/shared/utils/points';

import {
  mapChildRowToChildProfile,
  mapPointTransactionRowToPointTransaction,
  mapRewardRowToReward,
  mapTaskRowToTask,
  mapTaskSubmissionRowToTaskSubmission,
  mapWishRowToWish,
} from './mappers';
import type {
  ChildRow,
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
    `Supabase Family Points ${operation} is not implemented yet. The client is configured, but the app still uses localFamilyPointsService.`,
  );

const throwSupabaseError = (operation: string, message: string): never => {
  throw new Error(`Failed to ${operation}: ${message}`);
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
    .eq('is_active', true)
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
    .in('status', ['requested', 'approved', 'fulfilled'])
    .order('requested_at', { ascending: false });

  if (error) {
    throwSupabaseError('load reward redemptions', error.message);
  }

  return (data ?? []) as RewardRedemptionRow[];
};

const getRequiredFamilyMembership = async (): Promise<FamilyMemberRow> => {
  const userId = await getRequiredCurrentUserId();
  const membership = await getFirstFamilyMembership(userId);

  if (membership) {
    return membership;
  }

  throw new Error('Failed to load family membership: Current user has no family');
};

const reloadState = async (): Promise<FamilyPointsState> => {
  const state = await supabaseFamilyPointsService.loadState();

  if (state) {
    return state;
  }

  throw new Error('Failed to reload family points state: No family state is available');
};

export const supabaseFamilyPointsService: FamilyPointsService = {
  loadState: async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
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
      familyResult,
    ] = await Promise.all([
      getFamilyTasks(membership.family_id),
      getChildSubmissions(childIds),
      getFamilyRewards(membership.family_id),
      getChildWishes(childIds),
      getChildPointTransactions(childIds),
      getChildRewardRedemptions(childIds),
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
      pointTransactions: transactionRows.map(mapPointTransactionRowToPointTransaction),
      redeemedRewardIds: redemptionRows.map((redemption) => redemption.reward_id),
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
  createReward: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const membership = await getRequiredFamilyMembership();
    const { error } = await supabase.from('rewards').insert({
      family_id: membership.family_id,
      title: input.title.trim(),
      price: input.price,
      type: input.type,
      is_active: true,
      created_by: userId,
    });

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
      .eq('id', input.rewardId);

    if (error) {
      throwSupabaseError('update reward status', error.message);
    }

    return reloadState();
  },
  submitTask: async (input) => {
    const supabase = getSupabaseClient();
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
    const userId = await getRequiredCurrentUserId();
    const reward = context.state.rewards.find((item) => item.id === input.rewardId);
    const balance = getBalance(context.state.pointTransactions, input.childId);
    const wasRedeemed = context.state.redeemedRewardIds.includes(input.rewardId);

    if (!reward || balance < reward.price || wasRedeemed) {
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

    const redemption = redemptionData as RewardRedemptionRow;
    const { error: transactionError } = await supabase.from('point_transactions').insert({
      child_id: input.childId,
      title: reward.title ?? '',
      points: -reward.price,
      type: 'spend',
      source_task_submission_id: null,
      source_reward_redemption_id: redemption.id,
      created_by: userId,
    });

    if (transactionError) {
      throwSupabaseError('create spend transaction', transactionError.message);
    }

    return reloadState();
  },
  approveRewardRedemption: async (input) => {
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

    const { error: transactionError } = await supabase.from('point_transactions').insert({
      child_id: redemption.child_id,
      title: reward.title,
      points: -redemption.points_spent,
      type: 'spend',
      source_task_submission_id: null,
      source_reward_redemption_id: redemption.id,
      created_by: userId,
    });

    if (transactionError) {
      throwSupabaseError('create reward spend transaction', transactionError.message);
    }

    return reloadState();
  },
  rejectRewardRedemption: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
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

    return reloadState();
  },
  fulfillRewardRedemption: async (input) => {
    const supabase = getSupabaseClient();
    const userId = await getRequiredCurrentUserId();
    const { error } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'fulfilled',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', input.redemptionId);

    if (error) {
      throwSupabaseError('fulfill reward redemption', error.message);
    }

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
