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
  avatarColor: '#58A4B0',
};

export const family: Family = {
  id: 'family-1',
  nameKey: 'family.parkers',
  parentId: parentProfile.id,
  childIds: [childProfile.id],
};

export const tasks: Task[] = [
  {
    id: 'task-1',
    titleKey: 'task.makeBed.title',
    descriptionKey: 'task.makeBed.description',
    points: 10,
    status: 'active',
  },
  {
    id: 'task-2',
    titleKey: 'task.read.title',
    descriptionKey: 'task.read.description',
    points: 25,
    status: 'active',
  },
  {
    id: 'task-3',
    titleKey: 'task.toys.title',
    descriptionKey: 'task.toys.description',
    points: 15,
    status: 'active',
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
    price: 60,
    type: 'screen_time',
  },
  {
    id: 'reward-2',
    titleKey: 'reward.fridayMovie',
    price: 90,
    type: 'experience',
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
    titleKey: 'transaction.toys',
    points: 15,
    type: 'earn',
    createdAt: '2026-05-23T18:10:00.000Z',
  },
  {
    id: 'transaction-2',
    childId: childProfile.id,
    titleKey: 'transaction.iceCream',
    points: -45,
    type: 'spend',
    createdAt: '2026-05-22T15:30:00.000Z',
  },
  {
    id: 'transaction-3',
    childId: childProfile.id,
    titleKey: 'transaction.table',
    points: 80,
    type: 'manual_adjustment',
    createdAt: '2026-05-21T17:40:00.000Z',
  },
  {
    id: 'transaction-4',
    childId: childProfile.id,
    titleKey: 'transaction.cleanup',
    points: -10,
    type: 'penalty',
    createdAt: '2026-05-20T19:05:00.000Z',
  },
  {
    id: 'transaction-5',
    childId: childProfile.id,
    titleKey: 'transaction.read',
    points: 25,
    type: 'earn',
    createdAt: '2026-05-19T16:45:00.000Z',
  },
];
