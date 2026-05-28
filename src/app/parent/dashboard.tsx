import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppCard,
  AppScreen,
  PointsBadge,
  SectionTitle,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle, getWishTitle } from '@/shared/utils/content';
import { getFavoriteGoalForChild } from '@/shared/utils/favoriteGoals';
import { getBalance, getPotentialPoints } from '@/shared/utils/points';

const ParentDashboardScreen = () => {
  const { t } = useLanguage();
  const {
    children = [],
    favoriteGoals,
    hasHydrated,
    pointTransactions,
    rewardRedemptions,
    rewards,
    taskSubmissions,
    tasks,
    wishes = [],
    deleteChild,
  } = useFamilyPoints();

  if (!hasHydrated) {
    return (
      <AppScreen title={t('parent.dashboard.title')} subtitle={t('parent.dashboard.subtitle')}>
        <AppCard>
          <Text style={styles.empty}>{t('common.loading')}</Text>
        </AppCard>
      </AppScreen>
    );
  }

  const pendingCount = taskSubmissions.filter((s) => s.status === 'pending').length;
  const rewardRequestCount = rewardRedemptions.filter((r) => r.status === 'requested').length;
  const wishRequestCount = wishes.filter((w) => !w.status || w.status === 'pending').length;

  const handleDeleteChild = (childId: string, childName: string) => {
    Alert.alert(
      t('parent.children.deleteTitle', { name: childName }),
      t('parent.children.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('parent.children.deleteConfirm'), style: 'destructive', onPress: () => deleteChild({ childId }) },
      ],
    );
  };

  return (
    <AppScreen
      title={t('parent.dashboard.title')}
      subtitle={t('parent.dashboard.subtitle')}>

      <AppCard>
        <SectionTitle title={t('parent.children.title')} />
        {children.length === 0 ? (
          <Text style={styles.empty}>{t('parent.children.empty')}</Text>
        ) : (
          children.map((child) => {
            const balance = getBalance(pointTransactions, child.id);
            const potentialPoints = getPotentialPoints(tasks, taskSubmissions, child.id);
            const favoriteGoal = getFavoriteGoalForChild(favoriteGoals, child.id);
            const favoriteWish =
              favoriteGoal?.type === 'wish'
                ? wishes.find((wish) => wish.id === favoriteGoal.itemId)
                : undefined;
            const favoriteReward =
              favoriteGoal?.type === 'reward'
                ? rewards.find((reward) => reward.id === favoriteGoal.itemId)
                : undefined;
            const favoriteFocus = favoriteWish
              ? {
                  label: t('parent.dashboard.favoriteWish'),
                  title: getWishTitle(favoriteWish, t),
                  price: favoriteWish.price,
                }
              : favoriteReward
                ? {
                    label:
                      favoriteReward.type === 'wish'
                        ? t('parent.dashboard.favoriteWish')
                        : t('parent.dashboard.favoriteReward'),
                    title: getRewardTitle(favoriteReward, t),
                    price: favoriteReward.price,
                  }
                : undefined;

            return (
              <View key={child.id} style={styles.childRow}>
                <View style={[styles.avatar, { backgroundColor: child.avatarColor }]}>
                  <Text style={styles.avatarText}>{child.name.slice(0, 1)}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <View style={styles.balanceGroup}>
                    <PointsBadge points={balance} prefix={t('common.balance')} />
                    {potentialPoints > 0 && (
                      <Text style={styles.potential}>
                        {t('parent.dashboard.potentialPoints', { points: potentialPoints })}
                      </Text>
                    )}
                  </View>
                </View>
                {favoriteFocus && (
                  <View style={styles.favoriteWish}>
                    <View style={styles.favoriteWishHeader}>
                      <Text style={styles.favoriteWishLabel}>{favoriteFocus.label}</Text>
                      <StatusBadge label={t('common.favorite')} tone="warning" />
                    </View>
                    <Text style={styles.favoriteWishTitle}>{favoriteFocus.title}</Text>
                    {favoriteFocus.price > 0 && (
                      <PointsBadge points={favoriteFocus.price} prefix={t('common.goal')} />
                    )}
                  </View>
                )}
                <View style={styles.childActions}>
                  <AppButton
                    title={t('parent.children.invite')}
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
                    title={t('parent.children.delete')}
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
          title={t('parent.children.add')}
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
        {wishRequestCount > 0 && (
          <Text style={styles.meta}>
            {t('parent.wishes.title')}: {wishRequestCount}
          </Text>
        )}
      </AppCard>

    </AppScreen>
  );
};

export default ParentDashboardScreen;

const styles = StyleSheet.create({
  empty: {
    color: '#6B7B86',
    fontSize: 14,
    marginBottom: 12,
  },
  childRow: {
    borderTopColor: '#ECE3CF',
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
  balanceGroup: {
    alignItems: 'flex-start',
    gap: 2,
  },
  potential: {
    color: '#1E9E86',
    fontSize: 13,
    fontWeight: '700',
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
    color: '#12314A',
    fontSize: 18,
    fontWeight: '900',
  },
  favoriteWish: {
    backgroundColor: '#FFFBF0',
    borderColor: '#F5B225',
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
    padding: 12,
  },
  favoriteWishHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  favoriteWishLabel: {
    color: '#8A5A06',
    fontSize: 13,
    fontWeight: '900',
  },
  favoriteWishTitle: {
    color: '#12314A',
    fontSize: 16,
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
    color: '#12314A',
    fontSize: 40,
    fontWeight: '900',
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
});
