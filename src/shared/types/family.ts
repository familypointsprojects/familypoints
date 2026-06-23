import type { TranslationKey } from '@/shared/i18n';

export type UserRole = 'parent' | 'child';

export type ParentProfile = {
  id: string;
  name: string;
  role: 'parent';
  /** True for the family creator — always has full permissions */
  isOwner?: boolean;
  /** If true, can manage all tasks/rewards/submissions regardless of creator */
  hasFullPermissions?: boolean;
};

export type ChildProfile = {
  id: string;
  name: string;
  role: 'child';
  avatarColor: string;
  /** Id of the in-app avatar character chosen by the child (see shared/ui AvatarHeads). */
  avatarId?: string;
};

export type FamilyMemberRole = 'parent' | 'child';

export type Family = {
  id: string;
  nameKey: TranslationKey;
  /** @deprecated use parentIds instead */
  parentId?: string;
  parentIds: string[];
  childIds: string[];
};

export type TaskStatus = 'active' | 'inactive';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Task = {
  id: string;
  childId?: string;
  titleKey?: TranslationKey;
  title?: string;
  descriptionKey?: TranslationKey;
  description?: string;
  points: number;
  status: TaskStatus;
  /** true = repeatable daily quest; false/undefined = one-time task */
  isDaily?: boolean;
  /** Which days the quest is available. Empty/undefined = every day */
  availableDays?: DayOfWeek[];
  /** Parent who created this task */
  createdBy?: string;
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

export type RewardType = 'screen_time' | 'experience' | 'toy' | 'treat' | 'wish';

export type Reward = {
  id: string;
  childId?: string;
  titleKey?: TranslationKey;
  title?: string;
  price: number;
  type: RewardType;
  isActive?: boolean;
  /** true = repeatable daily reward */
  isDailyReward?: boolean;
  /** Which days the reward is available. Empty/undefined = every day */
  availableDays?: DayOfWeek[];
  /** If true, child must have all today's daily quests approved before buying */
  requiresDailyQuestsCompleted?: boolean;
  /** Parent who created this reward */
  createdBy?: string;
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

export type WishStatus = 'pending' | 'approved' | 'rejected';

export type Wish = {
  id: string;
  titleKey?: TranslationKey;
  title?: string;
  price: number;
  childId?: string;
  status?: WishStatus;
};

export type PointTransactionType =
  | 'earn'
  | 'skill_bonus'
  | 'spend'
  | 'penalty'
  | 'manual_adjustment'
  | 'investment_deposit'
  | 'investment_payout';

export type ChildSkillId =
  | 'task_bonus'
  | 'savings_speed'
  | 'savings_yield'
  | 'combo_bonus'
  | 'quest_chain'
  | 'savings_master'
  | 'legend_badge';

export type ChildProgress = {
  childId: string;
  xp: number;
  level: number;
  unspentSkillPoints: number;
};

export type ChildSkillUnlock = {
  childId: string;
  skillId: ChildSkillId;
  rank: number;
  unlockedAt: string;
};

export type ChildAchievementId =
  | 'first_task'
  | 'tasks_10'
  | 'tasks_25'
  | 'tasks_50'
  | 'first_investment'
  | 'first_investment_payout'
  | 'streak_3'
  | 'first_reward'
  | 'savings_profit_100';

export type ChildAchievementProgress = {
  childId: string;
  achievementId: ChildAchievementId;
  progress: number;
  target: number;
  unlocked: boolean;
  xpAwarded: boolean;
  unlockedAt?: string;
};

// ─── Growth Missions ─────────────────────────────────────────────────────────

export type MissionStatus = 'active' | 'archived';

export type InvestmentProject = {
  id: string;
  familyId: string;
  createdBy: string;
  title: string;
  description?: string;
  durationDays: number;
  bonusPercent: number;
  minAmount: number;
  maxAmount: number;
  status: MissionStatus;
  createdAt: string;
};

export type ChildInvestment = {
  id: string;
  projectId: string;
  projectTitle?: string;
  childId: string;
  familyId: string;
  amount: number;
  bonusPercent: number;
  payoutAmount: number;
  depositedAt: string;
  maturesAt: string;
  claimedAt?: string | null;
  depositTxId?: string | null;
};

export type PointTransaction = {
  id: string;
  childId: string;
  titleKey?: TranslationKey;
  title?: string;
  points: number;
  type: PointTransactionType;
  createdAt: string;
};
