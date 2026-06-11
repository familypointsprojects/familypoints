import type { FamilyPointsState } from '@/shared/state/types';
import type {
  ChildAchievementId,
  ChildAchievementProgress,
  ChildProgress,
  ChildSkillId,
  ChildSkillUnlock,
  PointTransaction,
  RewardRedemption,
  Task,
  TaskSubmission,
} from '@/shared/types/family';

export type ChildLevelProgress = {
  level: number;
  rank: string;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  isMaxLevel: boolean;
};

export type ChildLevelSkills = {
  coinBonusPercent: number;
  savingsSpeedPercent: number;
};

export type AchievementTone = 'bronze' | 'silver' | 'gold' | 'blue';

export type ChildAchievement = {
  id: ChildAchievementId;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  tone: AchievementTone;
  xpReward: number;
};

export type ChildSkillDefinition = {
  id: ChildSkillId;
  title: string;
  description: string;
  maxRank: number;
  minLevel?: number;
};

export type TaskSkillBonusResult = {
  points: number;
  dailyCap: number;
  usedToday: number;
};

export type SavingsSkillResult = {
  speedPercent: number;
  yieldBonusPercent: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TASK_BONUS_TRANSACTION_PREFIX = 'Skill bonus: task_bonus';
const COMBO_BONUS_TRANSACTION_PREFIX = 'Skill bonus: combo_bonus';

export const LEVEL_XP_THRESHOLDS = [
  0,
  75,
  180,
  340,
  560,
  850,
  1220,
  1680,
  2240,
  3000,
] as const;
export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

export const SKILL_DEFINITIONS: ChildSkillDefinition[] = [
  {
    id: 'task_bonus',
    title: 'Бонус к квестам',
    description: '+1/+2/+3 балла к одобренным заданиям от 10 баллов, с дневным лимитом.',
    maxRank: 3,
  },
  {
    id: 'savings_speed',
    title: 'Бонус копилки',
    description: '+1/+2/+3 процентных пункта к бонусу копилки.',
    maxRank: 3,
  },
  {
    id: 'savings_yield',
    title: 'Доход копилки',
    description: '+1/+2/+3 процентных пункта к бонусу копилки.',
    maxRank: 3,
  },
  {
    id: 'combo_bonus',
    title: 'Комбо дня',
    description: '+5 баллов один раз в день после 3 одобренных заданий.',
    maxRank: 1,
  },
  {
    id: 'quest_chain',
    title: 'Цепочка квестов',
    description: 'Комбо дня дает +1/+2 балла сверху.',
    maxRank: 2,
    minLevel: 6,
  },
  {
    id: 'savings_master',
    title: 'Мастер копилки',
    description: '+1/+2 процентных пункта к бонусу копилки.',
    maxRank: 2,
    minLevel: 8,
  },
  {
    id: 'legend_badge',
    title: 'Легендарный знак',
    description: 'Финальный статусный скилл для максимального уровня.',
    maxRank: 1,
    minLevel: 10,
  },
];

export const ACHIEVEMENT_DEFINITIONS: ChildAchievement[] = [
  {
    id: 'first_task',
    title: 'Первый квест',
    description: 'Выполни первое подтвержденное задание.',
    progress: 0,
    target: 1,
    unlocked: false,
    tone: 'bronze',
    xpReward: 5,
  },
  {
    id: 'tasks_10',
    title: '10 квестов',
    description: 'Закрой 10 подтвержденных заданий.',
    progress: 0,
    target: 10,
    unlocked: false,
    tone: 'silver',
    xpReward: 15,
  },
  {
    id: 'tasks_25',
    title: '25 квестов',
    description: 'Закрой 25 подтвержденных заданий.',
    progress: 0,
    target: 25,
    unlocked: false,
    tone: 'gold',
    xpReward: 35,
  },
  {
    id: 'tasks_50',
    title: '50 квестов',
    description: 'Закрой 50 подтвержденных заданий.',
    progress: 0,
    target: 50,
    unlocked: false,
    tone: 'gold',
    xpReward: 60,
  },
  {
    id: 'first_investment',
    title: 'Первая копилка',
    description: 'Сделай первый вклад в копилку.',
    progress: 0,
    target: 1,
    unlocked: false,
    tone: 'blue',
    xpReward: 10,
  },
  {
    id: 'first_investment_payout',
    title: 'Первая выплата',
    description: 'Получить первую выплату из копилки.',
    progress: 0,
    target: 1,
    unlocked: false,
    tone: 'silver',
    xpReward: 15,
  },
  {
    id: 'streak_3',
    title: 'Серия 3 дня',
    description: 'Делай задания 3 дня подряд.',
    progress: 0,
    target: 3,
    unlocked: false,
    tone: 'blue',
    xpReward: 15,
  },
  {
    id: 'first_reward',
    title: 'Первая награда',
    description: 'Получи первую одобренную награду.',
    progress: 0,
    target: 1,
    unlocked: false,
    tone: 'bronze',
    xpReward: 10,
  },
  {
    id: 'savings_profit_100',
    title: '100 баллов из копилки',
    description: 'Накопи 100 баллов выплатами из копилки.',
    progress: 0,
    target: 100,
    unlocked: false,
    tone: 'gold',
    xpReward: 35,
  },
];

const toDateKey = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const capProgress = (progress: number, target: number): number =>
  Math.min(progress, target);

const getThresholdForLevel = (level: number): number => {
  const safeLevel = clamp(level, 1, MAX_LEVEL);

  return LEVEL_XP_THRESHOLDS[safeLevel - 1] ?? 0;
};

export const getTaskXp = (task: Task): number =>
  clamp(Math.round(task.points * 0.4), 3, 15);

export const getLevelForXp = (xp: number): number => {
  let level = 1;

  while (level < MAX_LEVEL && xp >= getThresholdForLevel(level + 1)) {
    level += 1;
  }

  return level;
};

export const getSkillPointsForLevel = (level: number): number =>
  Math.max(0, level - 1);

export const getXpForNextLevel = (level: number): number =>
  getThresholdForLevel(level + 1) - getThresholdForLevel(level);

export const getChildTotalXp = (
  tasks: Task[],
  submissions: TaskSubmission[],
  childId: string,
): number => {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  return submissions
    .filter((submission) => submission.childId === childId && submission.status === 'approved')
    .reduce((sum, submission) => {
      const task = tasksById.get(submission.taskId);
      return task ? sum + getTaskXp(task) : sum;
    }, 0);
};

export const getLevelRank = (level: number): string => {
  if (level >= 10) return 'Легенда квестов';
  if (level >= 8) return 'Исследователь';
  if (level >= 6) return 'Навигатор';
  if (level >= 3) return 'Следопыт';
  return 'Новичок';
};

export const getChildLevelProgressFromXp = (xp: number): ChildLevelProgress => {
  const level = getLevelForXp(xp);
  const isMaxLevel = level >= MAX_LEVEL;
  const currentThreshold = getThresholdForLevel(level);
  const nextThreshold = isMaxLevel ? currentThreshold : getThresholdForLevel(level + 1);
  const currentLevelXp = Math.max(0, xp - currentThreshold);
  const nextLevelXp = isMaxLevel ? 0 : Math.max(1, nextThreshold - currentThreshold);

  return {
    level,
    rank: getLevelRank(level),
    totalXp: xp,
    currentLevelXp,
    nextLevelXp,
    progressPercent: isMaxLevel ? 100 : Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100)),
    isMaxLevel,
  };
};

export const getChildLevelProgress = (
  tasks: Task[],
  submissions: TaskSubmission[],
  childId: string,
): ChildLevelProgress => getChildLevelProgressFromXp(getChildTotalXp(tasks, submissions, childId));

export const getApprovedTaskCount = (
  submissions: TaskSubmission[],
  childId: string,
): number =>
  submissions.filter(
    (submission) => submission.childId === childId && submission.status === 'approved',
  ).length;

export const getEarnedPointsTotal = (
  transactions: PointTransaction[],
  childId: string,
): number =>
  transactions
    .filter((transaction) => transaction.childId === childId && transaction.type === 'earn')
    .reduce((sum, transaction) => sum + Math.max(transaction.points, 0), 0);

export const getRewardRedemptionCount = (
  redemptions: RewardRedemption[],
  childId: string,
): number =>
  redemptions.filter(
    (redemption) =>
      redemption.childId === childId &&
      (redemption.status === 'approved' || redemption.status === 'fulfilled'),
  ).length;

export const getApprovedDailyTaskCount = (
  tasks: Task[],
  submissions: TaskSubmission[],
  childId: string,
): number => {
  const dailyTaskIds = new Set(
    tasks.filter((task) => task.isDaily).map((task) => task.id),
  );

  return submissions.filter(
    (submission) =>
      submission.childId === childId &&
      submission.status === 'approved' &&
      dailyTaskIds.has(submission.taskId),
  ).length;
};

export const getTaskStreakDays = (
  submissions: TaskSubmission[],
  childId: string,
  now = new Date(),
): number => {
  const approvedDateKeys = new Set(
    submissions
      .filter((submission) => submission.childId === childId && submission.status === 'approved')
      .map((submission) => toDateKey(submission.submittedAt)),
  );

  let cursor = new Date(now);
  let streak = 0;

  if (!approvedDateKeys.has(toDateKey(cursor.toISOString()))) {
    cursor = addDays(cursor, -1);
  }

  while (approvedDateKeys.has(toDateKey(cursor.toISOString()))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const getSkillRank = (
  unlocks: ChildSkillUnlock[],
  childId: string,
  skillId: ChildSkillId,
): number =>
  unlocks.find((unlock) => unlock.childId === childId && unlock.skillId === skillId)?.rank ?? 0;

export const getChildSkillRanks = (
  unlocks: ChildSkillUnlock[],
  childId: string,
): Record<ChildSkillId, number> => ({
  task_bonus: getSkillRank(unlocks, childId, 'task_bonus'),
  savings_speed: getSkillRank(unlocks, childId, 'savings_speed'),
  savings_yield: getSkillRank(unlocks, childId, 'savings_yield'),
  combo_bonus: getSkillRank(unlocks, childId, 'combo_bonus'),
  quest_chain: getSkillRank(unlocks, childId, 'quest_chain'),
  savings_master: getSkillRank(unlocks, childId, 'savings_master'),
  legend_badge: getSkillRank(unlocks, childId, 'legend_badge'),
});

export const getChildLevelSkills = (level: number): ChildLevelSkills => ({
  coinBonusPercent: Math.min(10, Math.floor(level / 4)),
  savingsSpeedPercent: Math.min(10, Math.floor(level / 6)),
});

export const applyCoinBonus = (points: number, bonusPercent: number): number => {
  if (bonusPercent <= 0) return points;

  return Math.max(points, Math.round(points * (1 + bonusPercent / 100)));
};

export const getChildProgress = (
  state: Pick<FamilyPointsState, 'childProgress' | 'childSkillUnlocks' | 'taskSubmissions' | 'tasks'>,
  childId: string,
): ChildProgress => {
  const storedProgress = state.childProgress.find((progress) => progress.childId === childId);

  if (storedProgress) {
    const level = getLevelForXp(storedProgress.xp);
    const spentSkillPoints = state.childSkillUnlocks
      .filter((unlock) => unlock.childId === childId)
      .reduce((sum, unlock) => sum + unlock.rank, 0);
    const earnedSkillPoints = getSkillPointsForLevel(level);

    return {
      ...storedProgress,
      level,
      unspentSkillPoints: Math.max(storedProgress.unspentSkillPoints, earnedSkillPoints - spentSkillPoints),
    };
  }

  const xp = getChildTotalXp(state.tasks, state.taskSubmissions, childId);
  const level = getLevelForXp(xp);

  return {
    childId,
    xp,
    level,
    unspentSkillPoints: getSkillPointsForLevel(level),
  };
};

export const addXpToProgress = (
  progress: ChildProgress,
  xpToAdd: number,
): ChildProgress => {
  const nextXp = progress.xp + Math.max(0, xpToAdd);
  const nextLevel = getLevelForXp(nextXp);
  const earnedSkillPoints = Math.max(0, nextLevel - progress.level);

  return {
    ...progress,
    xp: nextXp,
    level: nextLevel,
    unspentSkillPoints: progress.unspentSkillPoints + earnedSkillPoints,
  };
};

export const upsertChildProgress = (
  progressList: ChildProgress[],
  nextProgress: ChildProgress,
): ChildProgress[] => [
  nextProgress,
  ...progressList.filter((progress) => progress.childId !== nextProgress.childId),
];

export const calculateTaskSkillBonus = ({
  pointTransactions,
  task,
  unlocks,
  childId,
  now = new Date(),
}: {
  pointTransactions: PointTransaction[];
  task: Task;
  unlocks: ChildSkillUnlock[];
  childId: string;
  now?: Date;
}): TaskSkillBonusResult => {
  const rank = getSkillRank(unlocks, childId, 'task_bonus');

  if (rank <= 0 || task.points < 10) {
    return { points: 0, dailyCap: 0, usedToday: 0 };
  }

  const dailyCap = rank * 3;
  const today = toDateKey(now.toISOString());
  const usedToday = pointTransactions
    .filter(
      (transaction) =>
        transaction.childId === childId &&
        transaction.type === 'skill_bonus' &&
        transaction.title?.startsWith(TASK_BONUS_TRANSACTION_PREFIX) &&
        toDateKey(transaction.createdAt) === today,
    )
    .reduce((sum, transaction) => sum + Math.max(transaction.points, 0), 0);

  return {
    points: Math.max(0, Math.min(rank, dailyCap - usedToday)),
    dailyCap,
    usedToday,
  };
};

export const shouldAwardComboBonus = ({
  submissions,
  pointTransactions,
  unlocks,
  childId,
  now = new Date(),
}: {
  submissions: TaskSubmission[];
  pointTransactions: PointTransaction[];
  unlocks: ChildSkillUnlock[];
  childId: string;
  now?: Date;
}): boolean => {
  if (getSkillRank(unlocks, childId, 'combo_bonus') <= 0) {
    return false;
  }

  const today = toDateKey(now.toISOString());
  const approvedTodayCount = submissions.filter(
    (submission) =>
      submission.childId === childId &&
      submission.status === 'approved' &&
      toDateKey(submission.submittedAt) === today,
  ).length;
  const hasComboToday = pointTransactions.some(
    (transaction) =>
      transaction.childId === childId &&
      transaction.type === 'skill_bonus' &&
      transaction.title?.startsWith(COMBO_BONUS_TRANSACTION_PREFIX) &&
      toDateKey(transaction.createdAt) === today,
  );

  return approvedTodayCount >= 3 && !hasComboToday;
};

export const getComboBonusPoints = (
  unlocks: ChildSkillUnlock[],
  childId: string,
): number => {
  if (getSkillRank(unlocks, childId, 'combo_bonus') <= 0) {
    return 0;
  }

  return 5 + getSkillRank(unlocks, childId, 'quest_chain');
};

export const getSavingsSkillResult = (
  unlocks: ChildSkillUnlock[],
  childId: string,
): SavingsSkillResult => ({
  speedPercent: 0,
  yieldBonusPercent:
    getSkillRank(unlocks, childId, 'savings_yield') +
    getSkillRank(unlocks, childId, 'savings_speed') +
    getSkillRank(unlocks, childId, 'savings_master'),
});

export const applySavingsSkills = ({
  bonusPercent,
  durationDays,
  unlocks,
  childId,
}: {
  bonusPercent: number;
  durationDays: number;
  unlocks: ChildSkillUnlock[];
  childId: string;
}): { bonusPercent: number; durationMs: number; speedPercent: number; yieldBonusPercent: number } => {
  const { speedPercent, yieldBonusPercent } = getSavingsSkillResult(unlocks, childId);
  const effectiveBonusPercent = Math.min(25, bonusPercent + yieldBonusPercent);
  const durationMs = durationDays * DAY_IN_MS;

  return {
    bonusPercent: effectiveBonusPercent,
    durationMs,
    speedPercent,
    yieldBonusPercent,
  };
};

const getAchievementProgress = (
  state: Pick<
    FamilyPointsState,
    'pointTransactions' | 'rewardRedemptions' | 'taskSubmissions'
  >,
  childId: string,
  achievementId: ChildAchievementId,
): number => {
  const approvedTaskCount = getApprovedTaskCount(state.taskSubmissions, childId);

  switch (achievementId) {
    case 'first_task':
      return capProgress(approvedTaskCount, 1);
    case 'tasks_10':
      return capProgress(approvedTaskCount, 10);
    case 'tasks_25':
      return capProgress(approvedTaskCount, 25);
    case 'tasks_50':
      return capProgress(approvedTaskCount, 50);
    case 'first_investment':
      return capProgress(
        state.pointTransactions.filter(
          (transaction) =>
            transaction.childId === childId && transaction.type === 'investment_deposit',
        ).length,
        1,
      );
    case 'first_investment_payout':
      return capProgress(
        state.pointTransactions.filter(
          (transaction) =>
            transaction.childId === childId && transaction.type === 'investment_payout',
        ).length,
        1,
      );
    case 'streak_3':
      return capProgress(getTaskStreakDays(state.taskSubmissions, childId), 3);
    case 'first_reward':
      return capProgress(getRewardRedemptionCount(state.rewardRedemptions, childId), 1);
    case 'savings_profit_100':
      return capProgress(
        state.pointTransactions
          .filter(
            (transaction) =>
              transaction.childId === childId && transaction.type === 'investment_payout',
          )
          .reduce((sum, transaction) => sum + Math.max(transaction.points, 0), 0),
        100,
      );
  }
};

const getUnlockedAchievementXpTotal = (
  state: Pick<
    FamilyPointsState,
    'pointTransactions' | 'rewardRedemptions' | 'taskSubmissions'
  >,
  childId: string,
): number =>
  ACHIEVEMENT_DEFINITIONS.reduce((sum, achievement) => {
    const progress = getAchievementProgress(state, childId, achievement.id);

    return progress >= achievement.target ? sum + achievement.xpReward : sum;
  }, 0);

export const getChildAchievements = ({
  tasks,
  submissions,
  pointTransactions,
  rewardRedemptions,
  childId,
}: {
  tasks: Task[];
  submissions: TaskSubmission[];
  pointTransactions: PointTransaction[];
  rewardRedemptions: RewardRedemption[];
  childId: string;
}): ChildAchievement[] => {
  const state = {
    tasks,
    taskSubmissions: submissions,
    pointTransactions,
    rewardRedemptions,
  };

  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const progress = getAchievementProgress(state, childId, achievement.id);

    return {
      ...achievement,
      progress,
      unlocked: progress >= achievement.target,
    };
  });
};

export const syncChildAchievements = ({
  state,
  childId,
  awardNewXp,
}: {
  state: FamilyPointsState;
  childId: string;
  awardNewXp: boolean;
}): FamilyPointsState => {
  let nextProgress = getChildProgress(state, childId);
  const now = new Date().toISOString();
  const currentAchievements = state.childAchievements.filter(
    (achievement) => achievement.childId === childId,
  );
  const otherAchievements = state.childAchievements.filter(
    (achievement) => achievement.childId !== childId,
  );

  const syncedAchievements = ACHIEVEMENT_DEFINITIONS.map<ChildAchievementProgress>((definition) => {
    const existing = currentAchievements.find(
      (achievement) => achievement.achievementId === definition.id,
    );
    const progress = getAchievementProgress(state, childId, definition.id);
    const unlocked = progress >= definition.target;
    const shouldAwardXp = awardNewXp && unlocked && !existing?.xpAwarded;

    if (shouldAwardXp) {
      nextProgress = addXpToProgress(nextProgress, definition.xpReward);
    }

    return {
      childId,
      achievementId: definition.id,
      progress,
      target: definition.target,
      unlocked,
      xpAwarded: existing?.xpAwarded || shouldAwardXp || (!awardNewXp && unlocked),
      unlockedAt: existing?.unlockedAt ?? (unlocked ? now : undefined),
    };
  });

  return {
    ...state,
    childAchievements: [...syncedAchievements, ...otherAchievements],
    childProgress: upsertChildProgress(state.childProgress, nextProgress),
  };
};

export const normalizeLevelingState = (state: FamilyPointsState): FamilyPointsState => {
  const stateWithArrays = {
    ...state,
    childProgress: state.childProgress ?? [],
    childSkillUnlocks: state.childSkillUnlocks ?? [],
    childAchievements: state.childAchievements ?? [],
  };

  return stateWithArrays.children.reduce<FamilyPointsState>(
    (nextState, child) => {
      const taskXp = getChildTotalXp(nextState.tasks, nextState.taskSubmissions, child.id);
      const achievementXp = getUnlockedAchievementXpTotal(nextState, child.id);
      const xp = taskXp + achievementXp;
      const level = getLevelForXp(xp);
      const spentSkillPoints = nextState.childSkillUnlocks
        .filter((unlock) => unlock.childId === child.id)
        .reduce((sum, unlock) => sum + unlock.rank, 0);
      const progress = {
        childId: child.id,
        xp,
        level,
        unspentSkillPoints: Math.max(0, getSkillPointsForLevel(level) - spentSkillPoints),
      };
      const withProgress = {
        ...nextState,
        childProgress: upsertChildProgress(nextState.childProgress, progress),
      };

      return syncChildAchievements({ state: withProgress, childId: child.id, awardNewXp: false });
    },
    stateWithArrays,
  );
};

export const unlockSkill = (
  state: FamilyPointsState,
  childId: string,
  skillId: ChildSkillId,
): FamilyPointsState => {
  const definition = SKILL_DEFINITIONS.find((skill) => skill.id === skillId);
  const currentRank = getSkillRank(state.childSkillUnlocks, childId, skillId);
  const progress = getChildProgress(state, childId);
  const minLevel = definition?.minLevel ?? 1;

  if (
    !definition ||
    progress.level < minLevel ||
    currentRank >= definition.maxRank ||
    progress.unspentSkillPoints <= 0
  ) {
    return state;
  }

  const nextUnlock: ChildSkillUnlock = {
    childId,
    skillId,
    rank: currentRank + 1,
    unlockedAt: new Date().toISOString(),
  };

  return {
    ...state,
    childSkillUnlocks: [
      nextUnlock,
      ...state.childSkillUnlocks.filter(
        (unlock) => !(unlock.childId === childId && unlock.skillId === skillId),
      ),
    ],
    childProgress: upsertChildProgress(state.childProgress, {
      ...progress,
      unspentSkillPoints: clamp(progress.unspentSkillPoints - 1, 0, progress.unspentSkillPoints),
    }),
  };
};

export const createTaskBonusTransactionTitle = (): string =>
  `${TASK_BONUS_TRANSACTION_PREFIX}`;

export const createComboBonusTransactionTitle = (): string =>
  `${COMBO_BONUS_TRANSACTION_PREFIX}`;
