import { TranslationKey } from '@/shared/i18n';
import { Task, TaskSubmission } from '@/shared/types/family';

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

  return getActiveTasks(taskList).filter((task) => !pendingTaskIds.has(task.id));
};

export const findTaskTitleKey = (taskList: Task[], taskId: string): TranslationKey | undefined =>
  taskList.find((task) => task.id === taskId)?.titleKey;

export const findTask = (taskList: Task[], taskId: string): Task | undefined =>
  taskList.find((task) => task.id === taskId);
