import { StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
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
import { getTaskTitle, getTransactionTitle } from '@/shared/utils/content';
import { getBalance } from '@/shared/utils/points';
import { findTask } from '@/shared/utils/tasks';
import { useState } from 'react';

type ChildBalanceTab = 'balance' | 'taskHistory';

const transactionLabelKeys: Record<PointTransactionType, TranslationKey> = {
  earn: 'transactionType.earn',
  spend: 'transactionType.spend',
  penalty: 'transactionType.penalty',
  manual_adjustment: 'transactionType.manual_adjustment',
};

const getTransactionTone = (type: PointTransactionType) => {
  if (type === 'earn' || type === 'manual_adjustment') {
    return 'success';
  }

  return type === 'penalty' ? 'danger' : 'muted';
};

const formatDate = (dateValue: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(dateValue));

const ChildBalanceScreen = () => {
  const { language, t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { pointTransactions, taskSubmissions, tasks } = useFamilyPoints();
  const [activeTab, setActiveTab] = useState<ChildBalanceTab>('balance');
  const childTransactions = pointTransactions.filter(
    (transaction) => transaction.childId === activeChildId,
  );
  const balance = getBalance(pointTransactions, activeChildId);
  const locale = language === 'ru' ? 'ru' : 'en';
  const mySubmissions = taskSubmissions
    .filter((submission) => submission.childId === activeChildId)
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const pendingSubmissions = mySubmissions.filter((submission) => submission.status === 'pending');
  const reviewedSubmissions = mySubmissions.filter((submission) => submission.status !== 'pending');
  const tabOptions: SegmentedControlOption<ChildBalanceTab>[] = [
    { label: t('common.balance'), value: 'balance' },
    { label: t('common.history'), value: 'taskHistory' },
  ];

  return (
    <AppScreen title={t('child.balanceAndHistory.title')} subtitle={t('child.balanceAndHistory.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.currentBalance')} />
        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>
      </AppCard>

      <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'balance' && (
        <>
          <SectionTitle title={t('child.balance.pointsHistory')} />
          {childTransactions.map((transaction) => (
            <AppCard key={transaction.id}>
              <View style={styles.header}>
                <View style={styles.textGroup}>
                  <Text style={styles.title}>{getTransactionTitle(transaction, t)}</Text>
                  <Text style={styles.meta}>{formatDate(transaction.createdAt, locale)}</Text>
                </View>
                <PointsBadge points={transaction.points} />
              </View>
              <StatusBadge
                label={t(transactionLabelKeys[transaction.type])}
                tone={getTransactionTone(transaction.type)}
              />
            </AppCard>
          ))}
        </>
      )}

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
                      <StatusBadge label={t('common.waitingForApproval')} tone="warning" />
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
                      <StatusBadge label={statusLabel} tone={statusTone} />
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
  balance: {
    color: '#12314A',
    fontSize: 42,
    fontWeight: '900',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
  },
  proof: {
    color: '#12314A',
    fontSize: 14,
    lineHeight: 20,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#12314A',
    fontSize: 17,
    fontWeight: '900',
  },
});
