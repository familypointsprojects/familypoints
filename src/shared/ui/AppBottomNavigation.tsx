import { router, usePathname } from 'expo-router';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { BottomActionBar, BottomActionItem } from '@/shared/ui/BottomActionBar';
import { getBalance } from '@/shared/utils/points';
import { getDailyRewardBalance, getDailyTaskBalance } from '@/shared/utils/pricingGuidance';
import {
  getDailyRewardLockReason,
  isDailyRewardAvailableToday,
  isRewardAvailableForChild,
} from '@/shared/utils/rewards';
import { getTotalAvailableTasksCount } from '@/shared/utils/tasks';

const isActiveRoute = (pathname: string, route: string): boolean => pathname === route;

type BottomNavigationRoute =
  | '/parent/dashboard'
  | '/parent/tasks'
  | '/parent/submissions'
  | '/parent/rewards'
  | '/parent/growth-missions'
  | '/child/dashboard'
  | '/child/tasks'
  | '/child/balance'
  | '/child/rewards'
  | '/child/growth-missions'
  | '/settings';

const pushIfInactive = (pathname: string, route: BottomNavigationRoute) => {
  if (isActiveRoute(pathname, route)) {
    return;
  }

  router.replace(route);
};

export const AppBottomNavigation = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { session } = useAuth();
  const { activeChildId } = useActiveChild();
  const { pointTransactions, rewardRedemptions, rewards, taskSubmissions, tasks, wishes = [] } = useFamilyPoints();

  const isSettings = pathname === '/settings';
  const effectivePath = isSettings
    ? session?.role === 'parent' ? '/parent' : '/child'
    : pathname;

  if (effectivePath.startsWith('/parent')) {
    const pendingSubmissionCount = taskSubmissions.filter((item) => item.status === 'pending').length;
    const pendingRewardCount = rewardRedemptions.filter(
      (item) => item.status === 'requested' || item.status === 'approved',
    ).length;
    const pendingWishCount = wishes.filter((item) => !item.status || item.status === 'pending').length;
    const pendingRewardAreaCount = pendingRewardCount + pendingWishCount;
    const hasTaskRecommendations = tasks.some(
      (task) => task.isDaily && getDailyTaskBalance(task).status !== 'ok',
    );
    const hasRewardRecommendations = rewards.some(
      (reward) =>
        reward.isActive !== false &&
        reward.isDailyReward &&
        getDailyRewardBalance({ reward, rewards, tasks }).status !== 'ok',
    );
    const parentItems: BottomActionItem[] = [
      {
        icon: 'children',
        isActive: isActiveRoute(pathname, '/parent/dashboard'),
        key: 'children',
        label: t('parent.children.title'),
        onPress: () => pushIfInactive(pathname, '/parent/dashboard'),
      },
      {
        attention: hasTaskRecommendations,
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
        attention: hasRewardRecommendations,
        badgeCount: pendingRewardAreaCount,
        icon: 'rewards',
        isActive: isActiveRoute(pathname, '/parent/rewards'),
        key: 'rewards',
        label: t('parent.quick.rewards'),
        onPress: () => pushIfInactive(pathname, '/parent/rewards'),
      },
      {
        icon: 'missions',
        isActive: isActiveRoute(pathname, '/parent/growth-missions'),
        key: 'missions',
        label: t('missions.navLabel'),
        onPress: () => pushIfInactive(pathname, '/parent/growth-missions'),
      },
    ];

    return <BottomActionBar items={parentItems} />;
  }

  if (effectivePath.startsWith('/child')) {
    const balance = getBalance(pointTransactions, activeChildId);
    const availableTasksCount = getTotalAvailableTasksCount(tasks, taskSubmissions, activeChildId);
    const openRequestIds = new Set(
      rewardRedemptions
        .filter((r) => r.childId === activeChildId && (r.status === 'requested' || r.status === 'approved'))
        .map((r) => r.rewardId),
    );
    const affordableRewardsCount = rewards.filter(
      (r) =>
        r.isActive !== false &&
        isRewardAvailableForChild(r, activeChildId) &&
        !openRequestIds.has(r.id) &&
        balance >= r.price &&
        (
          !r.isDailyReward ||
          (
            isDailyRewardAvailableToday(r, activeChildId) &&
            !getDailyRewardLockReason(r, balance, tasks, taskSubmissions, activeChildId)
          )
        ),
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
      {
        icon: 'missions',
        isActive: isActiveRoute(pathname, '/child/growth-missions'),
        key: 'missions',
        label: t('missions.navLabel'),
        onPress: () => pushIfInactive(pathname, '/child/growth-missions'),
      },
    ];

    return <BottomActionBar items={childItems} />;
  }

  return null;
};
