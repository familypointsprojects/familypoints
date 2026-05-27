import { TranslationKey } from '@/shared/i18n';
import { Task } from '@/shared/types/family';

export const getActiveTasks = (taskList: Task[]): Task[] =>
  taskList.filter((task) => task.status === 'active');

export const findTaskTitleKey = (taskList: Task[], taskId: string): TranslationKey | undefined =>
  taskList.find((task) => task.id === taskId)?.titleKey;

export const findTask = (taskList: Task[], taskId: string): Task | undefined =>
  taskList.find((task) => task.id === taskId);
