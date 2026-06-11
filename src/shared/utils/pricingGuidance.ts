import type { DayOfWeek, Reward, RewardType, Task } from '@/shared/types/family';

export type PricingSuggestion = {
  label: string;
  value: number;
  note: string;
};

export type BalanceStatus = 'ok' | 'cheap' | 'expensive' | 'no_daily_quests';

export type DailyBalanceSuggestion = {
  status: BalanceStatus;
  suggestedPrice: number;
  note: string;
};

const DEFAULT_DAILY_EARN = 20;
const WEEK_DAYS_COUNT = 7;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const roundToStep = (value: number, step: number): number =>
  Math.max(step, Math.round(value / step) * step);

const getDailyTaskDays = (availableDays?: DayOfWeek[]): number =>
  availableDays && availableDays.length > 0 ? availableDays.length : WEEK_DAYS_COUNT;

const getAvailabilityWeight = (availableDays?: DayOfWeek[]): number =>
  getDailyTaskDays(availableDays) / WEEK_DAYS_COUNT;

const taskAppliesToChild = (task: Task, childId?: string): boolean =>
  !childId || !task.childId || task.childId === childId;

const rewardAppliesToChild = (reward: Reward, childId?: string): boolean =>
  !childId || !reward.childId || reward.childId === childId;

export const estimateFamilyDailyEarn = (tasks: Task[]): number => {
  const weeklyEarn = tasks
    .filter((task) => task.status === 'active')
    .reduce((sum, task) => {
      if (task.isDaily) {
        return sum + task.points * getDailyTaskDays(task.availableDays);
      }

      return sum + task.points / 2;
    }, 0);

  if (weeklyEarn <= 0) {
    return DEFAULT_DAILY_EARN;
  }

  return clamp(Math.round(weeklyEarn / WEEK_DAYS_COUNT), 8, 60);
};

export const estimateDailyQuestBudget = (tasks: Task[], childId?: string): number => {
  const dailyBudget = tasks
    .filter((task) => task.status === 'active' && task.isDaily && taskAppliesToChild(task, childId))
    .reduce((sum, task) => sum + task.points * getAvailabilityWeight(task.availableDays), 0);

  return Math.round(dailyBudget);
};

export const estimateDailyRewardSlots = ({
  rewards,
  childId,
  excludeRewardId,
}: {
  rewards: Reward[];
  childId?: string;
  excludeRewardId?: string;
}): number =>
  rewards
    .filter(
      (reward) =>
        reward.id !== excludeRewardId &&
        reward.isActive !== false &&
        reward.isDailyReward &&
        rewardAppliesToChild(reward, childId),
    )
    .reduce((sum, reward) => sum + getAvailabilityWeight(reward.availableDays), 0);

const getTaskBasePoints = ({
  title,
  description,
  isDaily,
}: {
  title: string;
  description: string;
  isDaily: boolean;
}): number => {
  const text = `${title} ${description}`.toLowerCase();

  if (text.match(/домаш|урок|комнат|посуд|мусор|покуп|стир/)) {
    return isDaily ? 10 : 15;
  }

  if (text.match(/зуб|кровать|портф|заряд|вода|питом|стол/)) {
    return isDaily ? 6 : 8;
  }

  if (text.match(/проект|контроль|слож|генерал|уборк/)) {
    return isDaily ? 14 : 22;
  }

  return isDaily ? 8 : 12;
};

export const getTaskPointSuggestions = ({
  title,
  description,
  isDaily,
}: {
  title: string;
  description: string;
  isDaily: boolean;
}): PricingSuggestion[] => {
  const base = getTaskBasePoints({ title, description, isDaily });

  return [
    {
      label: 'Легко',
      value: clamp(Math.round(base * 0.7), 3, 25),
      note: 'быстро',
    },
    {
      label: 'Норм',
      value: clamp(base, 3, 25),
      note: 'обычно',
    },
    {
      label: 'Сложно',
      value: clamp(Math.round(base * 1.4), 3, 30),
      note: 'больше усилий',
    },
  ];
};

const rewardTargetDays: Record<RewardType, [number, number, number]> = {
  screen_time: [1, 2, 4],
  treat: [1, 3, 5],
  experience: [5, 10, 14],
  toy: [10, 21, 35],
  wish: [14, 30, 60],
};

const rewardDailyTargetDays: Record<RewardType, [number, number, number]> = {
  screen_time: [0.5, 1, 2],
  treat: [0.5, 1, 2],
  experience: [2, 4, 7],
  toy: [3, 7, 14],
  wish: [5, 10, 21],
};

const rewardNotes: Record<RewardType, [string, string, string]> = {
  screen_time: ['часто', 'после усилия', 'редко'],
  treat: ['маленькая радость', 'пару дней', 'особый случай'],
  experience: ['мини-цель', 'неделя', 'большая цель'],
  toy: ['копить', 'заметная цель', 'долго копить'],
  wish: ['цель', 'большая цель', 'мечта'],
};

export const getRewardPriceSuggestions = ({
  rewardType,
  isDailyReward,
  rewards = [],
  childId,
  tasks,
}: {
  rewardType: RewardType;
  isDailyReward: boolean;
  rewards?: Reward[];
  childId?: string;
  tasks: Task[];
}): PricingSuggestion[] => {
  const dailyEarn = estimateFamilyDailyEarn(tasks);
  const dailyQuestBudget = estimateDailyQuestBudget(tasks, childId);
  const dailyRewardSlots = estimateDailyRewardSlots({ rewards, childId });
  const targetDays = isDailyReward ? rewardDailyTargetDays[rewardType] : rewardTargetDays[rewardType];
  const notes = rewardNotes[rewardType];
  const labels = ['Быстро', 'Баланс', 'Цель'];

  if (isDailyReward && dailyQuestBudget > 0) {
    const balancedPrice = roundToStep(
      clamp((dailyQuestBudget * 0.9) / Math.max(1, dailyRewardSlots + 1), 5, 150),
      5,
    );
    const dailySuggestions: [string, number, string][] = [
      ['Легко', balancedPrice * 0.75, 'чуть проще'],
      ['Баланс', balancedPrice, 'день в ноль'],
      ['Строже', balancedPrice * 1.2, 'надо запас'],
    ];

    return dailySuggestions.map(([label, value, note]) => ({
      label,
      value: roundToStep(clamp(value, 5, 150), 5),
      note,
    }));
  }

  return targetDays.map((days, index) => ({
    label: labels[index],
    value: roundToStep(clamp(dailyEarn * days, 5, 1500), 5),
    note: notes[index],
  }));
};

export const getBalancedDailyRewardPrice = ({
  reward,
  rewards,
  tasks,
}: {
  reward: Reward;
  rewards: Reward[];
  tasks: Task[];
}): number => {
  const childId = reward.childId;
  const dailyQuestBudget = estimateDailyQuestBudget(tasks, childId);

  if (dailyQuestBudget <= 0) {
    return 10;
  }

  const slots = estimateDailyRewardSlots({ rewards, childId, excludeRewardId: reward.id }) +
    getAvailabilityWeight(reward.availableDays);
  const suggested = (dailyQuestBudget * 0.9) / Math.max(1, slots);

  return roundToStep(clamp(suggested, 5, 150), 5);
};

export const getDailyRewardBalance = ({
  reward,
  rewards,
  tasks,
}: {
  reward: Reward;
  rewards: Reward[];
  tasks: Task[];
}): DailyBalanceSuggestion => {
  const suggestedPrice = getBalancedDailyRewardPrice({ reward, rewards, tasks });
  const dailyQuestBudget = estimateDailyQuestBudget(tasks, reward.childId);

  if (dailyQuestBudget <= 0) {
    return {
      status: 'no_daily_quests',
      suggestedPrice,
      note: 'нет daily-квестов',
    };
  }

  if (reward.price > dailyQuestBudget || reward.price > suggestedPrice * 1.25) {
    return {
      status: 'expensive',
      suggestedPrice,
      note: 'дорого для дня',
    };
  }

  if (reward.price < suggestedPrice * 0.65) {
    return {
      status: 'cheap',
      suggestedPrice,
      note: 'слишком легко',
    };
  }

  return {
    status: 'ok',
    suggestedPrice,
    note: 'баланс',
  };
};

export const getDailyTaskBalance = (task: Task): DailyBalanceSuggestion => {
  const suggestedPrice = getTaskPointSuggestions({
    title: task.title ?? '',
    description: task.description ?? '',
    isDaily: true,
  })[1].value;

  if (task.points > suggestedPrice * 1.6) {
    return {
      status: 'expensive',
      suggestedPrice,
      note: 'слишком жирно',
    };
  }

  if (task.points < suggestedPrice * 0.6) {
    return {
      status: 'cheap',
      suggestedPrice,
      note: 'мало мотивации',
    };
  }

  return {
    status: 'ok',
    suggestedPrice,
    note: 'баланс',
  };
};
