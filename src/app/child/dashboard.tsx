import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppCard,
  AppScreen,
  PointsBadge,
  SectionTitle,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle, getTaskTitle, getWishTitle } from '@/shared/utils/content';
import { getFavoriteGoalForChild } from '@/shared/utils/favoriteGoals';
import { getBalance, getNearestWish, getPotentialPoints, getProgressPercent } from '@/shared/utils/points';
import { getAvailableTasksForChild } from '@/shared/utils/tasks';
import { getVisibleWishes } from '@/shared/utils/wishes';

const ChildDashboardScreen = () => {
  const { t } = useLanguage();
  const { activeChildId, activeChildName } = useActiveChild();
  const {
    hasHydrated,
    favoriteGoals,
    pointTransactions,
    rewardRedemptions,
    rewards,
    taskSubmissions,
    tasks,
    wishes,
  } = useFamilyPoints();

  if (!hasHydrated) {
    return (
      <AppScreen
        title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}
        subtitle={t('child.dashboard.subtitle')}>
        <AppCard>
          <Text style={styles.meta}>{t('common.loading')}</Text>
        </AppCard>
      </AppScreen>
    );
  }

  const balance = getBalance(pointTransactions, activeChildId);
  const potentialPoints = getPotentialPoints(tasks, taskSubmissions, activeChildId);
  const visibleWishes = getVisibleWishes(wishes, rewards, rewardRedemptions);
  const nearestWish = getNearestWish(visibleWishes, balance);
  const favoriteGoal = getFavoriteGoalForChild(favoriteGoals, activeChildId);
  const favoriteReward =
    favoriteGoal?.type === 'reward'
      ? rewards.find((reward) => reward.id === favoriteGoal.itemId && reward.isActive !== false)
      : undefined;
  const favoriteWish =
    favoriteGoal?.type === 'wish'
      ? visibleWishes.find(
          (wish) => wish.id === favoriteGoal.itemId && (wish.status ?? 'pending') === 'approved',
        )
      : undefined;
  const dashboardGoal =
    favoriteReward
      ? {
          title: getRewardTitle(favoriteReward, t),
          price: favoriteReward.price,
          sectionTitle: t('child.dashboard.favoriteGoal'),
          typeLabel: t('common.rewards'),
        }
      : favoriteWish
        ? {
            title: getWishTitle(favoriteWish, t),
            price: favoriteWish.price,
            sectionTitle: t('child.dashboard.favoriteGoal'),
            typeLabel: t('common.wishes'),
          }
        : nearestWish
          ? {
              title: getWishTitle(nearestWish, t),
              price: nearestWish.price,
              sectionTitle: t('common.nearestWish'),
              typeLabel: t('common.wishlist'),
            }
          : undefined;
  const activeTasks = getAvailableTasksForChild(tasks, taskSubmissions, activeChildId);
  const progress = dashboardGoal ? getProgressPercent(balance, dashboardGoal.price) : 0;

  return (
    <AppScreen
      title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}
      subtitle={t('child.dashboard.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.balance')} />
        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>
        {potentialPoints > 0 && (
          <Text style={styles.potential}>
            {t('child.dashboard.potentialPoints', { points: potentialPoints })}
          </Text>
        )}
      </AppCard>

      {dashboardGoal && (
        <AppCard>
          <SectionTitle
            title={dashboardGoal.sectionTitle}
            action={<StatusBadge label={dashboardGoal.typeLabel} />}
          />
          <Text style={styles.title}>{dashboardGoal.title}</Text>
          <Text style={styles.meta}>
            {t('child.dashboard.progressSummary', { balance, price: dashboardGoal.price })}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.meta}>{t('child.dashboard.progressPercent', { progress })}</Text>
        </AppCard>
      )}

      <AppCard>
        <SectionTitle
          title={t('common.availableTasks')}
          action={<PointsBadge points={activeTasks.length} prefix={t('child.dashboard.openTasks')} />}
        />
        {activeTasks.slice(0, 3).map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <View style={styles.taskText}>
              <Text style={styles.taskTitle}>{getTaskTitle(task, t)}</Text>
              <Text style={styles.meta}>
                {task.points} {t('common.pointsShort')}
              </Text>
            </View>
            <AppButton
              title={t('common.open')}
              variant="secondary"
              onPress={() => router.push(`/child/task-details?taskId=${task.id}`)}
              style={styles.smallButton}
            />
          </View>
        ))}
      </AppCard>

    </AppScreen>
  );
};

export default ChildDashboardScreen;

const styles = StyleSheet.create({
  balance: {
    color: '#12314A',
    fontSize: 42,
    fontWeight: '900',
  },
  title: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '900',
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
  potential: {
    color: '#1E9E86',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    backgroundColor: '#E7D5AC',
    borderRadius: 8,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#1E9E86',
    height: 12,
  },
  taskRow: {
    alignItems: 'center',
    borderTopColor: '#ECE3CF',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  taskText: {
    flex: 1,
    gap: 3,
  },
  taskTitle: {
    color: '#12314A',
    fontSize: 16,
    fontWeight: '800',
  },
  smallButton: {
    minWidth: 96,
  },
});
