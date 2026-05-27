import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getBalance } from '@/shared/utils/points';

const ParentDashboardScreen = () => {
  const { t } = useLanguage();
  const { children = [], pointTransactions, rewardRedemptions, taskSubmissions, deleteChild } = useFamilyPoints();

  const pendingCount = taskSubmissions.filter((s) => s.status === 'pending').length;
  const rewardRequestCount = rewardRedemptions.filter((r) => r.status === 'requested').length;

  const handleDeleteChild = (childId: string, childName: string) => {
    Alert.alert(
      `Удалить ${childName}?`,
      'Все данные ребёнка (задачи, баланс, желания) будут удалены. Это необратимо.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: () => deleteChild({ childId }) },
      ],
    );
  };

  return (
    <AppScreen title={t('parent.dashboard.title')} subtitle={t('parent.dashboard.subtitle')}>

      <AppCard>
        <SectionTitle title="Дети" />
        {children.length === 0 ? (
          <Text style={styles.empty}>Нет детей. Добавьте первого ребёнка.</Text>
        ) : (
          children.map((child) => {
            const balance = getBalance(pointTransactions, child.id);
            return (
              <View key={child.id} style={styles.childRow}>
                <View style={[styles.avatar, { backgroundColor: child.avatarColor }]}>
                  <Text style={styles.avatarText}>{child.name.slice(0, 1)}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <PointsBadge points={balance} prefix={t('common.balance')} />
                </View>
                <View style={styles.childActions}>
                  <AppButton
                    title="Пригласить"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/parent/invite-child',
                        params: { childId: child.id, childName: child.name },
                      })
                    }
                    style={styles.actionButton}
                  />
                  <AppButton
                    title="Удалить"
                    variant="danger"
                    onPress={() => handleDeleteChild(child.id, child.name)}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            );
          })
        )}
        <AppButton
          title="+ Добавить ребёнка"
          variant="secondary"
          onPress={() => router.push('/parent/create-child')}
          style={styles.addButton}
        />
      </AppCard>

      <AppCard>
        <SectionTitle title={t('common.needsReview')} />
        <View style={styles.metricRow}>
          <Text style={styles.metric}>{pendingCount}</Text>
          <StatusBadge
            label={t('common.pendingSubmissions')}
            tone={pendingCount > 0 ? 'warning' : 'success'}
          />
        </View>
        <Text style={styles.meta}>
          {t('parent.dashboard.rewardRequests', { count: rewardRequestCount })}
        </Text>
      </AppCard>

      <AppCard>
        <SectionTitle title={t('common.quickActions')} />
        <View style={styles.actions}>
          <AppButton
            title={t('parent.dashboard.createTask')}
            onPress={() => router.push('/parent/create-task')}
          />
          <AppButton
            title={t('parent.dashboard.reviewSubmissions')}
            variant="secondary"
            onPress={() => router.push('/parent/submissions')}
          />
          <AppButton
            title={t('common.rewards')}
            variant="secondary"
            onPress={() => router.push('/parent/rewards')}
          />
          <AppButton
            title={t('parent.redemptions.title')}
            variant="secondary"
            onPress={() => router.push('/parent/redemptions')}
          />
          <AppButton
            title={t('common.tasks')}
            variant="ghost"
            onPress={() => router.push('/parent/tasks')}
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

export default ParentDashboardScreen;

const styles = StyleSheet.create({
  empty: {
    color: '#5F6C72',
    fontSize: 14,
    marginBottom: 12,
  },
  childRow: {
    borderTopColor: '#ECE7DF',
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12,
    marginTop: 4,
  },
  childInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  childName: {
    color: '#1F2933',
    fontSize: 18,
    fontWeight: '900',
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  addButton: {
    marginTop: 12,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    color: '#1F2933',
    fontSize: 40,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
  },
  meta: {
    color: '#5F6C72',
    fontSize: 14,
    lineHeight: 20,
  },
});
