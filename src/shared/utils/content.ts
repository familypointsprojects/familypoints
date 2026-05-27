import { TranslationKey, TranslationParams } from '@/shared/i18n';
import { PointTransaction, Reward, Task, Wish } from '@/shared/types/family';

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

export const getTaskTitle = (task: Task, t: Translate): string =>
  task.titleKey ? t(task.titleKey) : task.title ?? '';

export const getTaskDescription = (task: Task, t: Translate): string =>
  task.descriptionKey ? t(task.descriptionKey) : task.description ?? '';

export const getWishTitle = (wish: Wish, t: Translate): string =>
  wish.titleKey ? t(wish.titleKey) : wish.title ?? '';

export const getRewardTitle = (reward: Reward, t: Translate): string =>
  reward.titleKey ? t(reward.titleKey) : reward.title ?? '';

export const getTransactionTitle = (transaction: PointTransaction, t: Translate): string =>
  transaction.titleKey ? t(transaction.titleKey) : transaction.title ?? '';
