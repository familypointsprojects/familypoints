import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle } from '@/shared/ui';
import { getTaskTitle, getWishTitle } from '@/shared/utils/content';
import { getBalance, getNearestWish, getProgressPercent } from '@/shared/utils/points';
import { getActiveTasks } from '@/shared/utils/tasks';

const ChildDashboardScreen = () => {
  const { t } = useLanguage();
  const { pointTransactions, tasks, wishes } = useFamilyPoints();
  const balance = getBalance(pointTransactions, childProfile.id);
  const nearestWish = getNearestWish(wishes, balance);
  const activeTasks = getActiveTasks(tasks);
  const progress = nearestWish ? getProgressPercent(balance, nearestWish.price) : 0;

  return (
    <AppScreen
      title={t('child.dashboard.title', { name: childProfile.name })}
      subtitle={t('child.dashboard.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.balance')} />
        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>
      </AppCard>

      {nearestWish && (
        <AppCard>
          <SectionTitle title={t('common.nearestWish')} />
          <Text style={styles.title}>{getWishTitle(nearestWish, t)}</Text>
          <Text style={styles.meta}>
            {t('child.dashboard.progressSummary', { balance, price: nearestWish.price })}
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

      <AppCard>
        <SectionTitle title={t('common.quickActions')} />
        <View style={styles.actions}>
          <AppButton title={t('common.tasks')} onPress={() => router.push('/child/tasks')} />
          <AppButton
            title={t('common.rewards')}
            variant="secondary"
            onPress={() => router.push('/child/rewards')}
          />
          <AppButton
            title={t('common.wishes')}
            variant="secondary"
            onPress={() => router.push('/child/wishes')}
          />
          <AppButton
            title={t('common.balance')}
            variant="ghost"
            onPress={() => router.push('/child/balance')}
          />
          <AppButton
            title={t('common.settings')}
            variant="ghost"
            onPress={() => router.push('/settings')}
          />
        </View>
      </AppCard>
    </AppScreen>
  );
};

export default ChildDashboardScreen;

const styles = StyleSheet.create({
  balance: {
    color: '#1F2933',
    fontSize: 42,
    fontWeight: '900',
  },
  title: {
    color: '#1F2933',
    fontSize: 20,
    fontWeight: '900',
  },
  meta: {
    color: '#5F6C72',
    fontSize: 14,
    lineHeight: 20,
  },
  progressTrack: {
    backgroundColor: '#E8ECEE',
    borderRadius: 8,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#58A4B0',
    height: 12,
  },
  taskRow: {
    alignItems: 'center',
    borderTopColor: '#ECE7DF',
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
    color: '#1F2933',
    fontSize: 16,
    fontWeight: '800',
  },
  smallButton: {
    minWidth: 96,
  },
  actions: {
    gap: 10,
  },
});
