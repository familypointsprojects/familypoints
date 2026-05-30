import { TranslationKey } from '@/shared/i18n';
import type { DayOfWeek, Task, TaskSubmission } from '@/shared/types/family';

// ─── Weekday helpers ─────────────────────────────────────────────────────────

const JS_DAY_TO_KEY: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/** Returns today's day-of-week key, e.g. 'monday' */
export const getTodayDayKey = (): DayOfWeek => JS_DAY_TO_KEY[new Date().getDay()];

/** Returns today's date string in 'YYYY-MM-DD' (UTC) */
const getTodayDateString = (): string => new Date().toISOString().slice(0, 10);

// ─── Daily quest availability ─────────────────────────────────────────────────

/**
 * True if the task is a daily quest available today.
 * If available_days is empty, the quest is available every day.
 */
export const isDailyTaskAvailableToday = (task: Task): boolean => {
  if (!task.isDaily) return false;
  if (task.status !== 'active') return false;
  const days = task.availableDays ?? [];
  if (days.length === 0) return true;
  return days.includes(getTodayDayKey());
};

/**
 * True if the child already has a non-rejected submission for this task today.
 * (pending or approved — i.e. can't submit again today)
 */
export const hasSubmittedDailyTaskToday = (
  submissions: TaskSubmission[],
  taskId: string,
  childId: string,
): boolean => {
  const today = getTodayDateString();
  return submissions.some(
    (s) =>
      s.taskId === taskId &&
      s.childId === childId &&
      s.status !== 'rejected' &&
      s.submittedAt.slice(0, 10) === today,
  );
};

/**
 * Returns today's submission for a daily task if it exists.
 */
export const getTodaySubmission = (
  submissions: TaskSubmission[],
  taskId: string,
  childId: string,
): TaskSubmission | undefined => {
  const today = getTodayDateString();
  return submissions.find(
    (s) =>
      s.taskId === taskId &&
      s.childId === childId &&
      s.submittedAt.slice(0, 10) === today,
  );
};

/**
 * Returns all daily tasks that should be shown for this child today,
 * regardless of submission status (for the "Today's Quests" section).
 */
export const getDailyTasksForToday = (taskList: Task[]): Task[] =>
  taskList.filter(isDailyTaskAvailableToday);

/**
 * True when every daily quest due today has an approved submission today.
 */
export const areDailyQuestsApprovedToday = (
  taskList: Task[],
  submissions: TaskSubmission[],
  childId: string,
): boolean => {
  const todayDailyTasks = getDailyTasksForToday(taskList);
  if (todayDailyTasks.length === 0) return true;
  const today = getTodayDateString();
  return todayDailyTasks.every((task) =>
    submissions.some(
      (s) =>
        s.taskId === task.id &&
        s.childId === childId &&
        s.status === 'approved' &&
        s.submittedAt.slice(0, 10) === today,
    ),
  );
};

/**
 * Total count of tasks the child can act on right now:
 * - one-time active tasks not yet submitted
 * - daily quests available today that haven't been submitted (or were rejected)
 *
 * Use this for badges / dashboard counters instead of getAvailableTasksForChild.
 */
export const getTotalAvailableTasksCount = (
  taskList: Task[],
  submissions: TaskSubmission[],
  childId: string,
): number => {
  const today = getTodayDateString();

  // One-time tasks available (no pending submission)
  const oneTimeCount = getAvailableTasksForChild(taskList, submissions, childId).length;

  // Daily tasks available today that can still be submitted
  const dailyCount = getDailyTasksForToday(taskList).filter((task) => {
    const todaySubmission = submissions.find(
      (s) =>
        s.taskId === task.id &&
        s.childId === childId &&
        s.submittedAt.slice(0, 10) === today,
    );
    // Available if no submission today, or if today's submission was rejected
    return !todaySubmission || todaySubmission.status === 'rejected';
  }).length;

  return oneTimeCount + dailyCount;
};

// ─── Existing helpers (unchanged) ────────────────────────────────────────────

export const getPendingTasksForChild = (
  taskList: Task[],
  submissions: TaskSubmission[],
  childId: string,
): Task[] => {
  const pendingTaskIds = new Set(
    submissions
      .filter((s) => s.childId === childId && s.status === 'pending')
      .map((s) => s.taskId),
  );
  return taskList.filter((task) => pendingTaskIds.has(task.id));
};

export const getActiveTasks = (taskList: Task[]): Task[] =>
  taskList.filter((task) => task.status === 'active');

export const getAvailableTasksForChild = (
  taskList: Task[],
  submissions: TaskSubmission[],
  childId: string,
): Task[] => {
  const pendingTaskIds = new Set(
    submissions
      .filter((submission) => submission.childId === childId && submission.status === 'pending')
      .map((submission) => submission.taskId),
  );

  // Exclude daily quests from one-time task list; they appear in their own section
  return getActiveTasks(taskList).filter(
    (task) => !task.isDaily && !pendingTaskIds.has(task.id),
  );
};

export const findTaskTitleKey = (taskList: Task[], taskId: string): TranslationKey | undefined =>
  taskList.find((task) => task.id === taskId)?.titleKey;

export const findTask = (taskList: Task[], taskId: string): Task | undefined =>
  taskList.find((task) => task.id === taskId);
