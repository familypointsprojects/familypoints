import {
  ChildProfile,
  Family,
  ParentProfile,
  PointTransaction,
  Reward,
  Task,
  TaskSubmission,
  Wish,
} from '@/shared/types/family';

export const parentProfile: ParentProfile = {
  id: 'parent-1',
  name: 'Alex',
  role: 'parent',
};

export const childProfile: ChildProfile = {
  id: 'child-1',
  name: 'Mia',
  role: 'child',
  avatarColor: '#1E9E86',
};

export const family: Family = {
  id: 'family-1',
  nameKey: 'family.parkers',
  parentIds: [parentProfile.id],
  childIds: [childProfile.id],
};

export const tasks: Task[] = [
  {
    id: 'task-1',
    titleKey: 'task.makeBed.title',
    descriptionKey: 'task.makeBed.description',
    points: 6,
    status: 'active',
    isDaily: true,
  },
  {
    id: 'task-2',
    titleKey: 'task.exercise.title',
    descriptionKey: 'task.exercise.description',
    points: 4,
    status: 'active',
    isDaily: true,
  },
  {
    id: 'task-3',
    titleKey: 'task.cleanRoom.title',
    descriptionKey: 'task.cleanRoom.description',
    points: 10,
    status: 'active',
    isDaily: true,
  },
  {
    id: 'task-4',
    titleKey: 'task.plants.title',
    descriptionKey: 'task.plants.description',
    points: 12,
    status: 'inactive',
  },
];

export const taskSubmissions: TaskSubmission[] = [
  {
    id: 'submission-1',
    taskId: 'task-2',
    childId: childProfile.id,
    status: 'pending',
    submittedAt: '2026-05-24T17:20:00.000Z',
  },
  {
    id: 'submission-2',
    taskId: 'task-1',
    childId: childProfile.id,
    status: 'pending',
    submittedAt: '2026-05-25T07:45:00.000Z',
  },
  {
    id: 'submission-3',
    taskId: 'task-3',
    childId: childProfile.id,
    status: 'approved',
    submittedAt: '2026-05-23T18:00:00.000Z',
  },
];

export const rewards: Reward[] = [
  {
    id: 'reward-1',
    titleKey: 'reward.screenTime',
    price: 80,
    type: 'screen_time',
  },
  {
    id: 'reward-2',
    titleKey: 'reward.fridayMovie',
    price: 120,
    type: 'treat',
  },
  {
    id: 'reward-3',
    titleKey: 'reward.lego',
    price: 220,
    type: 'toy',
  },
  {
    id: 'reward-4',
    titleKey: 'reward.iceCream',
    price: 45,
    type: 'treat',
  },
];

export const wishes: Wish[] = [
  {
    id: 'wish-1',
    titleKey: 'wish.skates',
    price: 180,
  },
  {
    id: 'wish-2',
    titleKey: 'wish.markers',
    price: 120,
  },
];

export const pointTransactions: PointTransaction[] = [
  {
    id: 'transaction-1',
    childId: childProfile.id,
    titleKey: 'transaction.makeBed',
    points: 6,
    type: 'earn',
    createdAt: '2026-06-20T08:10:00.000Z',
  },
  {
    id: 'transaction-2',
    childId: childProfile.id,
    titleKey: 'transaction.exercise',
    points: 4,
    type: 'earn',
    createdAt: '2026-06-20T07:40:00.000Z',
  },
  {
    id: 'transaction-3',
    childId: childProfile.id,
    titleKey: 'transaction.bilge',
    points: 21,
    type: 'earn',
    createdAt: '2026-06-19T17:40:00.000Z',
  },
  {
    id: 'transaction-4',
    childId: childProfile.id,
    titleKey: 'transaction.homework',
    points: 12,
    type: 'earn',
    createdAt: '2026-06-19T16:25:00.000Z',
  },
  {
    id: 'transaction-5',
    childId: childProfile.id,
    titleKey: 'transaction.walletBonus',
    points: 132,
    type: 'manual_adjustment',
    createdAt: '2026-06-18T16:45:00.000Z',
  },
];
