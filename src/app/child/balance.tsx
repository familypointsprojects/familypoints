import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import { PointTransactionType } from '@/shared/types/family';
import {
  AppCard,
  AppScreen,
  EmptyState,
  PointsBadge,
  SectionTitle,
  SegmentedControl,
  SegmentedControlOption,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle, getTaskTitle, getTransactionTitle, getWishTitle } from '@/shared/utils/content';
import { getFavoriteGoalForChild } from '@/shared/utils/favoriteGoals';
import { getBalance, getPotentialPoints, getProgressPercent } from '@/shared/utils/points';
import { findTask, getAvailableTasksForChild, getDailyTasksForToday, hasSubmittedDailyTaskToday } from '@/shared/utils/tasks';
import { getVisibleWishes } from '@/shared/utils/wishes';

type ChildBalanceTab = 'balance' | 'taskHistory';

const transactionLabelKeys: Record<PointTransactionType, TranslationKey> = {
  earn: 'transactionType.earn',
  spend: 'transactionType.spend',
  penalty: 'transactionType.penalty',
  manual_adjustment: 'transactionType.manual_adjustment',
  investment_deposit: 'transactionType.investment_deposit',
  investment_payout: 'transactionType.investment_payout',
};


const formatDate = (dateValue: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(dateValue));

const ChildBalanceScreen = () => {
  const { language, t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { pointTransactions, taskSubmissions, tasks, rewards, rewardRedemptions, wishes, favoriteGoals } = useFamilyPoints();
  const { myInvestments } = useGrowthMissions();
  const [activeTab, setActiveTab] = useState<ChildBalanceTab>('balance');

  const childTransactions = pointTransactions.filter((tx) => tx.childId === activeChildId);
  const balance = getBalance(pointTransactions, activeChildId);
  const potentialPoints = getPotentialPoints(tasks, taskSubmissions, activeChildId);
  const locale = language === 'ru' ? 'ru' : 'en';

  // Stats — exclude investment flows from earned/spent
  const totalEarned = childTransactions
    .filter((tx) => tx.points > 0 && tx.type !== 'investment_payout')
    .reduce((s, tx) => s + tx.points, 0);
  const totalSpent = Math.abs(childTransactions
    .filter((tx) => tx.points < 0 && tx.type !== 'investment_deposit')
    .reduce((s, tx) => s + tx.points, 0));
  const totalInvested = Math.abs(childTransactions
    .filter((tx) => tx.type === 'investment_deposit')
    .reduce((s, tx) => s + tx.points, 0));
  const totalPayoutReceived = childTransactions
    .filter((tx) => tx.type === 'investment_payout')
    .reduce((s, tx) => s + tx.points, 0);
  const activeInv = myInvestments.filter((inv) => !inv.claimedAt);
  const expectedPayout = activeInv.reduce((s, inv) => s + inv.payoutAmount, 0);

  // Focus goal
  const visibleWishes = getVisibleWishes(wishes, rewards, rewardRedemptions);
  const favoriteGoal = getFavoriteGoalForChild(favoriteGoals, activeChildId);
  const focusReward = favoriteGoal?.type === 'reward'
    ? rewards.find((r) => r.id === favoriteGoal.itemId && r.isActive !== false)
    : undefined;
  const focusWish = favoriteGoal?.type === 'wish'
    ? visibleWishes.find((w) => w.id === favoriteGoal.itemId && (w.status ?? 'pending') === 'approved')
    : undefined;
  const focusGoal = focusReward
    ? { title: getRewardTitle(focusReward, t), price: focusReward.price }
    : focusWish
      ? { title: getWishTitle(focusWish, t), price: focusWish.price }
      : undefined;
  const goalProgress = focusGoal ? getProgressPercent(balance, focusGoal.price) : 0;
  const goalRemaining = focusGoal ? Math.max(focusGoal.price - balance, 0) : 0;
  const availableTasks = getAvailableTasksForChild(tasks, taskSubmissions, activeChildId);
  const pendingDailyTasks = getDailyTasksForToday(tasks).filter(
    (task) => !hasSubmittedDailyTaskToday(taskSubmissions, task.id, activeChildId),
  );
  const availableTasksPoints = [...availableTasks, ...pendingDailyTasks].reduce((s, task) => s + task.points, 0);
  const goalRemainingAfterAvailable = focusGoal ? Math.max(focusGoal.price - balance - availableTasksPoints, 0) : 0;

  // Submissions
  const mySubmissions = taskSubmissions
    .filter((s) => s.childId === activeChildId)
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const pendingSubmissions = mySubmissions.filter((s) => s.status === 'pending');
  const reviewedSubmissions = mySubmissions.filter((s) => s.status !== 'pending');

  const tabOptions: SegmentedControlOption<ChildBalanceTab>[] = [
    { label: t('child.balance.tabPoints'), value: 'balance' },
    { label: t('child.balance.tabQuests'), value: 'taskHistory' },
  ];

  return (
    <AppScreen title={t('child.balanceAndHistory.title')} subtitle={t('child.balanceAndHistory.subtitle')}>

      {/* ── Balance card ── */}
      <AppCard>
        <SectionTitle title={t('common.currentBalance')} />

        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>

        {/* "Ждёт тебя" block — only when there's something incoming */}
        {(potentialPoints > 0 || activeInv.length > 0) && (() => {
          const totalIncoming = potentialPoints + expectedPayout;
          return (
            <View style={styles.incomingBox}>
              <Text style={styles.incomingTitle}>{t('missions.incomingTitle')}</Text>

              {potentialPoints > 0 && (
                <View style={styles.incomingRow}>
                  <Text style={styles.incomingIcon}>⏳</Text>
                  <Text style={styles.incomingLabel}>{t('child.balance.onReview')}</Text>
                  <Text style={styles.incomingAmount}>+{potentialPoints} {t('common.pointsShort')}</Text>
                </View>
              )}

              {activeInv.map((inv) => {
                const diffMs = new Date(inv.maturesAt).getTime() - Date.now();
                const ready  = diffMs <= 0;
                const days   = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours  = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
                <Text style={styles.incomingTotalValue}>
                  {balance + totalIncoming} {t('common.pointsShort')}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Stats row 1: earned / spent / pending */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+{totalEarned}</Text>
            <Text style={styles.statLabel}>{t('child.balance.earned')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, totalSpent > 0 && styles.statSpent]}>−{totalSpent}</Text>
            <Text style={styles.statLabel}>{t('child.balance.spent')}</Text>
          </View>
          {pendingSubmissions.length > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statPending]}>+{potentialPoints}</Text>
                <Text style={styles.statLabel}>{t('child.balance.pendingTasks')}</Text>
              </View>
            </>
          )}
        </View>

        {/* Stats row 2: investment stats (only if any investment activity) */}
        {(totalInvested > 0 || totalPayoutReceived > 0) && (
          <View style={[styles.statsRow, styles.statsRowInvest]}>
            {totalInvested > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statInvested]}>🔒 {totalInvested}</Text>
                <Text style={styles.statLabel}>{t('missions.statInvested')}</Text>
              </View>
            )}
            {totalInvested > 0 && expectedPayout > 0 && <View style={styles.statDivider} />}
            {expectedPayout > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statExpected]}>{expectedPayout}</Text>
                <Text style={styles.statLabel}>{t('missions.statExpected')}</Text>
              </View>
            )}
            {totalPayoutReceived > 0 && totalInvested > 0 && <View style={styles.statDivider} />}
            {totalPayoutReceived > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statPayout]}>+{totalPayoutReceived}</Text>
                <Text style={styles.statLabel}>{t('missions.statPayout')}</Text>
              </View>
            )}
          </View>
        )}
      </AppCard>

      {/* ── Focus goal progress ── */}
      {focusGoal && (
        <AppCard>
          <SectionTitle title={t('child.balance.goalProgress')} />
          <Text style={styles.goalTitle} numberOfLines={1}>{focusGoal.title}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
          </View>
          <View style={styles.goalMeta}>
            <Text style={styles.goalPercent}>{goalProgress}%</Text>
            {goalRemaining > 0 && (
              <Text style={styles.goalRemaining}>
                {goalRemaining} {t('common.pointsShort')} {t('child.balance.remaining')}
              </Text>
            )}
          </View>

          {availableTasksPoints > 0 && (
            <View style={styles.questHint}>
              <Text style={styles.questHintText}>
                {goalRemainingAfterAvailable === 0
                  ? `⭐ ${t('child.balance.questReady', { points: availableTasksPoints })}`
                  : `🗺️ ${t('child.balance.questHint', { points: availableTasksPoints })}`}
              </Text>
            </View>
          )}
        </AppCard>
      )}

      <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} />

      {/* ── Balance tab: transaction history ── */}
      {activeTab === 'balance' && (
        <>
          {childTransactions.length === 0 && pendingSubmissions.length === 0 && (
            <EmptyState
              title={t('child.balance.emptyTitle')}
              message={t('child.balance.emptyMessage')}
            />
          )}

          {/* Pending submissions — not yet approved */}
          {pendingSubmissions.map((submission) => {
            const task = findTask(tasks, submission.taskId);
            const taskTitle = task ? getTaskTitle(task, t) : t('child.taskDetails.notFoundTitle');
            return (
              <AppCard key={`pending-${submission.id}`}>
                <View style={styles.header}>
                  <View style={styles.textGroup}>
                    <Text style={styles.title}>{taskTitle}</Text>
                    <Text style={styles.meta}>{formatDate(submission.submittedAt, locale)}</Text>
                  </View>
                  <View style={styles.txPendingCol}>
                    <Text style={styles.txPendingAmount}>
                      +{task?.points ?? '?'} {t('common.pointsShort')}
                    </Text>
                    <Text style={styles.txPendingLabel}>{t('child.balance.onReview')}</Text>
                  </View>
                </View>
              </AppCard>
            );
          })}

          {/* Confirmed transactions */}
          {childTransactions.map((transaction) => {
            const isPositive = transaction.points > 0;
            const sign = isPositive ? '+' : '';
            const isDeposit = transaction.type === 'investment_deposit';
            const isPayout  = transaction.type === 'investment_payout';
            const typeLabel = t(transactionLabelKeys[transaction.type]);

            // For deposit transactions — find linked investment for countdown
            const linkedInv = isDeposit
              ? myInvestments.find((inv) => inv.depositTxId === transaction.id)
              : null;
            const matureCountdown = linkedInv && !linkedInv.claimedAt ? (() => {
              const diffMs = new Date(linkedInv.maturesAt).getTime() - Date.now();
              if (diffMs <= 0) return { ready: true, days: 0, hours: 0 };
              return {
                ready: false,
                days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              };
            })() : null;
            return (
              <AppCard key={transaction.id} style={isDeposit ? styles.depositCard : isPayout ? styles.payoutCard : undefined}>
                <View style={styles.header}>
                  <View style={styles.textGroup}>
                    <Text style={styles.title}>{getTransactionTitle(transaction, t)}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.meta}>{formatDate(transaction.createdAt, locale)}</Text>
                      {(isDeposit || isPayout) && (
                        <View style={[styles.typeBadge, isPayout ? styles.typeBadgePayout : styles.typeBadgeDeposit]}>
                          <Text style={[styles.typeBadgeText, isPayout ? styles.typeBadgeTextPayout : styles.typeBadgeTextDeposit]}>
                            {isPayout ? '🎉 ' : '🔒 '}{typeLabel}
                          </Text>
                        </View>
                      )}
                      {matureCountdown && linkedInv && (
                        <View style={[styles.typeBadge, matureCountdown.ready ? styles.typeBadgePayout : styles.typeBadgeDeposit]}>
                          <Text style={[styles.typeBadgeText, matureCountdown.ready ? styles.typeBadgeTextPayout : styles.typeBadgeTextDeposit]}>
                            {matureCountdown.ready
                              ? `🎉 ${t('missions.payoutLabel', { payout: String(linkedInv.payoutAmount) })}`
                              : `→ ${linkedInv.payoutAmount} ${t('common.pointsShort')} ${t('missions.dashboard.matureIn', { days: String(matureCountdown.days), hours: String(matureCountdown.hours) })}`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    isPayout ? styles.txPayout :
                    isDeposit ? styles.txDeposit :
                    isPositive ? styles.txPositive : styles.txNegative,
                  ]}>
                    {sign}{transaction.points} {t('common.pointsShort')}
                  </Text>
                </View>
              </AppCard>
            );
          })}
        </>
      )}

      {/* ── Task history tab ── */}
      {activeTab === 'taskHistory' && (
        <>
          {mySubmissions.length === 0 && (
            <EmptyState
              title={t('child.history.emptyTitle')}
              message={t('child.history.emptyMessage')}
            />
          )}

          {pendingSubmissions.length > 0 && (
            <>
              <SectionTitle title={t('common.pending')} />
              {pendingSubmissions.map((submission) => {
                const task = findTask(tasks, submission.taskId);
                const taskTitle = task ? getTaskTitle(task, t) : t('child.taskDetails.notFoundTitle');

                return (
                  <AppCard key={submission.id}>
                    <View style={styles.header}>
                      <View style={styles.textGroup}>
                        <Text style={styles.title}>{taskTitle}</Text>
                        <Text style={styles.meta}>{formatDate(submission.submittedAt, locale)}</Text>
                        {Boolean(submission.proofNote) && (
                          <Text style={styles.proof}>{submission.proofNote}</Text>
                        )}
                      </View>
                      <View style={styles.rightCol}>
                        {task && <PointsBadge points={task.points} />}
                        <StatusBadge label={t('common.waitingForApproval')} tone="warning" />
                      </View>
                    </View>
                  </AppCard>
                );
              })}
            </>
          )}

          {reviewedSubmissions.length > 0 && (
            <>
              <SectionTitle title={t('common.history')} />
              {reviewedSubmissions.map((submission) => {
                const task = findTask(tasks, submission.taskId);
                const taskTitle = task ? getTaskTitle(task, t) : t('child.taskDetails.notFoundTitle');
                const isApproved = submission.status === 'approved';
                const statusLabel = isApproved ? t('common.approved') : t('common.rejected');
                const statusTone = isApproved ? 'success' : ('danger' as const);

                return (
                  <AppCard key={submission.id}>
                    <View style={styles.header}>
                      <View style={styles.textGroup}>
                        <Text style={styles.title}>{taskTitle}</Text>
                        <Text style={styles.meta}>{formatDate(submission.submittedAt, locale)}</Text>
                        {Boolean(submission.proofNote) && (
                          <Text style={styles.proof}>{submission.proofNote}</Text>
                        )}
                      </View>
                      <View style={styles.rightCol}>
                        {task && isApproved && <PointsBadge points={task.points} />}
                        <StatusBadge label={statusLabel} tone={statusTone} />
                      </View>
                    </View>
                  </AppCard>
                );
              })}
            </>
          )}
        </>
      )}
    </AppScreen>
  );
};

export default ChildBalanceScreen;

const styles = StyleSheet.create({
  // Balance card
  balanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  balance: {
    color: FP.text,
    fontSize: 42,
    fontWeight: '900',
  },
  pendingBadge: {
    backgroundColor: FP.accentLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingText: {
    color: FP.accentText,
    fontSize: 13,
    fontWeight: '700',
  },
  projectedText: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '600',
    marginTop: -4,
  },
  investHint: {
    color: FP.accentText,
    fontSize: 13,
    fontWeight: '600',
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
  statsRow: {
    borderTopColor: FP.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    gap: 0,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statDivider: {
    backgroundColor: FP.border,
    width: 1,
  },
  statValue: {
    color: FP.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: FP.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
  statSpent: {
    color: FP.red,
  },
  statPending: {
    color: FP.accentText,
  },
  statsRowInvest: {
    borderTopColor: FP.accentLight,
    backgroundColor: FP.accentLight,
    borderRadius: 10,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 0,
  },
  statInvested: {
    color: FP.accentText,
  },
  statExpected: {
    color: FP.accentDark,
  },
  statPayout: {
    color: FP.primary,
  },
  // Goal progress
  goalTitle: {
    color: FP.text,
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: FP.tan,
    borderRadius: 8,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: FP.primary,
    height: 10,
    borderRadius: 8,
  },
  progressAvailable: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: FP.primaryLight,
    borderRightWidth: 1.5,
    borderRightColor: FP.primary,
  },
  goalMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalPercent: {
    color: FP.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  goalRemaining: {
    color: FP.textSub,
    fontSize: 13,
  },
  questHint: {
    backgroundColor: FP.primaryLight,
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  questHintText: {
    color: FP.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  questHintSuccess: {
    backgroundColor: FP.primary,
  },
  questHintSuccessText: {
    color: FP.white,
  },
  // Pending transaction
  txPendingCol: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    gap: 2,
  },
  txPendingAmount: {
    color: FP.textSub,
    fontSize: 18,
    fontWeight: '900',
  },
  txPendingLabel: {
    color: FP.accentText,
    fontSize: 11,
    fontWeight: '700',
  },
  // Transaction amount
  txAmount: {
    fontSize: 18,
    fontWeight: '900',
    alignSelf: 'center',
  },
  txPositive: {
    color: FP.primary,
  },
  txNegative: {
    color: FP.red,
  },
  txDeposit: {
    color: FP.accentDark,
  },
  txPayout: {
    color: FP.primary,
  },
  // Investment transaction cards
  depositCard: {
    borderLeftWidth: 3,
    borderLeftColor: FP.accent,
  },
  payoutCard: {
    borderLeftWidth: 3,
    borderLeftColor: FP.primary,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeDeposit: {
    backgroundColor: FP.accentLight,
  },
  typeBadgePayout: {
    backgroundColor: FP.primaryLight,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeTextDeposit: {
    color: FP.accentText,
  },
  typeBadgeTextPayout: {
    color: FP.primaryDark,
  },
  // Cards
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: FP.text,
    fontSize: 17,
    fontWeight: '900',
  },
  meta: {
    color: FP.textSub,
    fontSize: 14,
  },
  proof: {
    color: FP.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
