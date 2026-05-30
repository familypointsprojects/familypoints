import type { Reward, Task, TaskSubmission } from '@/shared/types/family';
import { areDailyQuestsApprovedToday, getTodayDayKey } from './tasks';

/**
 * True if this daily reward is available today based on its available_days setting.
 */
export const isDailyRewardAvailableToday = (reward: Reward): boolean => {
  if (!reward.isDailyReward) return false;
  if (!reward.isActive) return false;
  const days = reward.availableDays ?? [];
  if (days.length === 0) return true;
  return days.includes(getTodayDayKey());
};

export type DailyRewardLockReason = 'daily_quests_incomplete' | 'not_enough_points' | null;

/**
 * Returns why a daily reward is locked for the child, or null if unlocked.
 * Priority: daily quests check > balance check.
 */
export const getDailyRewardLockReason = (
  reward: Reward,
  balance: number,
  tasks: Task[],
  submissions: TaskSubmission[],
  childId: string,
): DailyRewardLockReason => {
  if (
    reward.requiresDailyQuestsCompleted &&
    !areDailyQuestsApprovedToday(tasks, submissions, childId)
  ) {
    return 'daily_quests_incomplete';
  }

  if (balance < reward.price) {
    return 'not_enough_points';
  }

  return null;
};
