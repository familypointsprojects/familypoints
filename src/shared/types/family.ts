import type { TranslationKey } from '@/shared/i18n';

export type UserRole = 'parent' | 'child';

export type ParentProfile = {
  id: string;
  name: string;
  role: 'parent';
};

export type ChildProfile = {
  id: string;
  name: string;
  role: 'child';
  avatarColor: string;
};

export type Family = {
  id: string;
  nameKey: TranslationKey;
  parentId: string;
  childIds: string[];
};

export type TaskStatus = 'active' | 'inactive';

export type Task = {
  id: string;
  titleKey?: TranslationKey;
  title?: string;
  descriptionKey?: TranslationKey;
  description?: string;
  points: number;
  status: TaskStatus;
};

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type TaskSubmission = {
  id: string;
  taskId: string;
  childId: string;
  status: SubmissionStatus;
  submittedAt: string;
  proofNote?: string;
};

export type RewardType = 'screen_time' | 'experience' | 'toy' | 'treat';

export type Reward = {
  id: string;
  titleKey?: TranslationKey;
  title?: string;
  price: number;
  type: RewardType;
  isActive?: boolean;
};

export type RewardRedemptionStatus = 'requested' | 'approved' | 'rejected' | 'fulfilled';

export type RewardRedemption = {
  id: string;
  rewardId: string;
  childId: string;
  pointsSpent: number;
  status: RewardRedemptionStatus;
  requestedAt: string;
};

export type Wish = {
  id: string;
  titleKey?: TranslationKey;
  title?: string;
  price: number;
};

export type PointTransactionType = 'earn' | 'spend' | 'penalty' | 'manual_adjustment';

export type PointTransaction = {
  id: string;
  childId: string;
  titleKey?: TranslationKey;
  title?: string;
  points: number;
  type: PointTransactionType;
  createdAt: string;
};
