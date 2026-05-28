import { router, usePathname } from 'expo-router';

import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { BottomActionBar, BottomActionItem } from '@/shared/ui/BottomActionBar';
import { getBalance } from '@/shared/utils/points';
import { getAvailableTasksForChild } from '@/shared/utils/tasks';

const isActiveRoute = (pathname: string, route: string): boolean => pathname === route;

type BottomNavigationRoute =
  | '/parent/dashboard'
  | '/parent/tasks'
  | '/parent/submissions'
  | '/parent/rewards'
  | '/parent/redemptions'
  | '/child/dashboard'
  | '/child/tasks'
  | '/child/balance'
  | '/child/rewards';

const pushIfInactive = (pathname: string, route: BottomNavigationRoute) => {
  if (isActiveRoute(pathname, route)) {
    return;
  }

  router.replace(route);
};

export const AppBottomNavigation = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { pointTransactions, rewardRedemptions, rewards, taskSubmissions, tasks, wishes = [] } = useFamilyPoints();

  if (pathname.startsWith('/parent')) {
    const pendingSubmissionCount = taskSubmissions.filter((item) => item.status === 'pending').length;
    const pendingRewardCount = rewardRedemptions.filter(
      (item) => item.status === 'requested' || item.status === 'approved',
    ).length;
    const pendingWishCount = wishes.filter((item) => !item.status || item.status === 'pending').length;
    const parentItems: BottomActionItem[] = [
      {
        icon: 'children',
        isActive: isActiveRoute(pathname, '/parent/dashboard'),
        key: 'children',
        label: t('parent.children.title'),
        onPress: () => pushIfInactive(pathname, '/parent/dashboard'),
      },
      {
        icon: 'tasks',
        isActive: isActiveRoute(pathname, '/parent/tasks'),
        key: 'tasks',
        label: t('parent.quick.tasks'),
        onPress: () => pushIfInactive(pathname, '/parent/tasks'),
      },
      {
        badgeCount: pendingSubmissionCount,
        icon: 'review',
        isActive: isActiveRoute(pathname, '/parent/submissions'),
        key: 'review',
        label: t('parent.quick.review'),
        onPress: () => pushIfInactive(pathname, '/parent/submissions'),
      },
      {
        badgeCount: pendingWishCount,
        icon: 'rewards',
        isActive: isActiveRoute(pathname, '/parent/rewards'),
        key: 'rewards',
        label: t('parent.quick.rewards'),
        onPress: () => pushIfInactive(pathname, '/parent/rewards'),
      },
      {
        badgeCount: pendingRewardCount,
        icon: 'requests',
        isActive: isActiveRoute(pathname, '/parent/redemptions'),
        key: 'requests',
        label: t('parent.quick.requests'),
        onPress: () => pushIfInactive(pathname, '/parent/redemptions'),
      },
    ];

    return <BottomActionBar items={parentItems} />;
  }

  if (pathname.startsWith('/child')) {
    const balance = getBalance(pointTransactions, activeChildId);
    const availableTasksCount = getAvailableTasksForChild(tasks, taskSubmissions, activeChildId).length;
    const openRequestIds = new Set(
      rewardRedemptions
        .filter((r) => r.childId === activeChildId && (r.status === 'requested' || r.status === 'approved'))
        .map((r) => r.rewardId),
    );
    const affordableRewardsCount = rewards.filter(
      (r) => r.isActive !== false && !openRequestIds.has(r.id) && balance >= r.price,
    ).length;

    const childItems: BottomActionItem[] = [
      {
        icon: 'home',
        isActive: isActiveRoute(pathname, '/child/dashboard'),
        key: 'home',
        label: t('common.home'),
        onPress: () => pushIfInactive(pathname, '/child/dashboard'),
      },
      {
        badgeCount: availableTasksCount,
        icon: 'tasks',
        isActive: isActiveRoute(pathname, '/child/tasks'),
        key: 'tasks',
        label: t('common.tasks'),
        onPress: () => pushIfInactive(pathname, '/child/tasks'),
      },
      {
        icon: 'points',
        isActive: isActiveRoute(pathname, '/child/balance'),
        key: 'points',
        label: t('child.quick.points'),
        onPress: () => pushIfInactive(pathname, '/child/balance'),
      },
      {
        badgeCount: affordableRewardsCount,
        icon: 'rewards',
        isActive: isActiveRoute(pathname, '/child/rewards'),
        key: 'rewards',
        label: t('common.rewards'),
        onPress: () => pushIfInactive(pathname, '/child/rewards'),
      },
    ];

    return <BottomActionBar items={childItems} />;
  }

  return null;
};
