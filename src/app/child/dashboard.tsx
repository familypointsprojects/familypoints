import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import {
  AppButton,
  AppCard,
  AppScreen,
  SectionTitle,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle, getTaskTitle, getWishTitle } from '@/shared/utils/content';
import { getFavoriteGoalForChild } from '@/shared/utils/favoriteGoals';
import { getBalance, getNearestWish, getPotentialPoints, getProgressPercent } from '@/shared/utils/points';
import {
  getAvailableTasksForChild,
  getDailyTasksForToday,
  getTotalAvailableTasksCount,
  hasSubmittedDailyTaskToday,
} from '@/shared/utils/tasks';
import { getVisibleWishes } from '@/shared/utils/wishes';

const pluralQuest = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} квестов`;
  if (mod10 === 1) return `${n} квест`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} квеста`;
  return `${n} квестов`;
};

const getCountdown = (maturesAt: string) => {
  const diffMs = new Date(maturesAt).getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, ready: true };
  const days  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, ready: false };
};

const ChildDashboardScreen = () => {
  const { t } = useLanguage();
  const { activeChildId, activeChildName } = useActiveChild();
  const { myInvestments } = useGrowthMissions();
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
  const totalTasksCount = getTotalAvailableTasksCount(tasks, taskSubmissions, activeChildId);
  const pendingDailyTasks = getDailyTasksForToday(tasks).filter(
    (task) => !hasSubmittedDailyTaskToday(taskSubmissions, task.id, activeChildId),
  );
  // Show daily quests until all done, then regular tasks
  const dashboardTasks = (pendingDailyTasks.length > 0 ? pendingDailyTasks : activeTasks).slice(0, 3);
  const progress = dashboardGoal ? getProgressPercent(balance, dashboardGoal.price) : 0;
  const activeInvestments = myInvestments.filter((inv) => !inv.claimedAt);
  const expectedPayout = activeInvestments.reduce((s, inv) => s + inv.payoutAmount, 0);
  const totalIncoming = potentialPoints + expectedPayout;

  return (
    <AppScreen
      title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}
      subtitle={t('child.dashboard.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.balance')} />
        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>

        {totalIncoming > 0 && (
          <View style={styles.incomingBox}>
            <Text style={styles.incomingTitle}>{t('missions.incomingTitle')}</Text>

            {potentialPoints > 0 && (
              <View style={styles.incomingRow}>
                <Text style={styles.incomingIcon}>⏳</Text>
                <Text style={styles.incomingLabel}>{t('child.balance.onReview')}</Text>
                <Text style={styles.incomingAmount}>+{potentialPoints} {t('common.pointsShort')}</Text>
              </View>
            )}

            {activeInvestments.map((inv) => {
              const { ready, days, hours } = getCountdown(inv.maturesAt);
              return (
                <View key={inv.id} style={styles.incomingRow}>
                  <Text style={styles.incomingIcon}>{ready ? '🎉' : '🔒'}</Text>
                  <View style={styles.incomingLabelCol}>
                    <Text style={styles.incomingLabel}>{inv.projectTitle}</Text>
                    <Text style={styles.incomingMeta}>
                      {ready
                        ? t('missions.dashboard.ready')
                        : t('missions.dashboard.matureIn', { days: String(days), hours: String(hours) })}
                    </Text>
                  </View>
                  <Text style={[styles.incomingAmount, ready && styles.incomingAmountReady]}>
                    +{inv.payoutAmount} {t('common.pointsShort')}
                  </Text>
                </View>
              );
            })}

            <View style={styles.incomingTotal}>
              <Text style={styles.incomingTotalLabel}>{t('missions.incomingTotal')}</Text>
              <Text style={styles.incomingTotalValue}>{balance + totalIncoming} {t('common.pointsShort')}</Text>
            </View>
          </View>
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
          title={pendingDailyTasks.length > 0 ? '⚡ Квесты на сегодня' : t('common.availableTasks')}
          action={totalTasksCount > 0 ? <StatusBadge label={pluralQuest(totalTasksCount)} tone="muted" /> : undefined}
        />
        {dashboardTasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <View style={styles.taskText}>
              <Text style={styles.taskTitle}>
                {task.isDaily ? '⚡ ' : ''}{getTaskTitle(task, t)}
              </Text>
              <Text style={styles.meta}>
                {task.points} {t('common.pointsShort')}
              </Text>
            </View>
            <AppButton
              title={t('common.open')}
              variant="secondary"
              onPress={() => router.push('/child/tasks')}
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
  // Incoming block
  incomingBox: {
    backgroundColor: FP.primaryLight,
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  incomingTitle: {
    color: FP.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  incomingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  incomingIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  incomingLabelCol: {
    flex: 1,
    gap: 1,
  },
  incomingLabel: {
    color: FP.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  incomingMeta: {
    color: FP.textSub,
    fontSize: 12,
  },
  incomingAmount: {
    color: FP.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  incomingAmountReady: {
    color: FP.primary,
  },
  incomingTotal: {
    alignItems: 'center',
    borderTopColor: FP.primaryBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 2,
  },
  incomingTotalLabel: {
    color: FP.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  incomingTotalValue: {
    color: FP.primaryDark,
    fontSize: 18,
    fontWeight: '900',
  },
  // Investment rows (legacy, kept for ref)
  investRow: {
    alignItems: 'center',
    borderTopColor: FP.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  investInfo: {
    flex: 1,
    gap: 2,
  },
  investTitle: {
    color: FP.text,
    fontSize: 15,
    fontWeight: '800',
  },
  investMeta: {
    color: FP.textSub,
    fontSize: 13,
  },
  countdownBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countdownWaiting: {
    backgroundColor: FP.accentLight,
  },
  countdownReady: {
    backgroundColor: FP.primaryLight,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  countdownTextWaiting: {
    color: FP.accentText,
  },
  countdownTextReady: {
    color: FP.primaryDark,
  },
});
