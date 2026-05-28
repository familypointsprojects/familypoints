import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { RewardType, WishStatus } from '@/shared/types/family';
import {
  AppButton,
  AppScreen,
  AppTextInput,
  EmptyState,
  FocusLiftCard,
  PointsBadge,
  SectionTitle,
  SegmentedControl,
  SegmentedControlOption,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle, getWishTitle } from '@/shared/utils/content';
import { isFavoriteGoal, moveFavoriteGoalsToFront } from '@/shared/utils/favoriteGoals';
import { getVisibleWishes } from '@/shared/utils/wishes';

type ParentRewardsTab = 'rewards' | 'wishes';

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
  wish: 'rewardType.wish',
};

const wishStatusTone: Record<WishStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const wishStatusLabelKeys: Record<WishStatus, TranslationKey> = {
  pending: 'wishStatus.pending',
  approved: 'wishStatus.approved',
  rejected: 'wishStatus.rejected',
};

const parsePointsPrice = (value: string): number => {
  const parsed = Number(value.replace(/[^\d]/g, ''));

  return Number.isFinite(parsed) ? parsed : 0;
};

const ParentRewardsScreen = () => {
  const { t } = useLanguage();
  const { getChildName } = useActiveChild();
  const {
    approveWish,
    favoriteGoals,
    rejectWish,
    rewardRedemptions,
    rewards,
    setRewardActive,
    wishes,
  } = useFamilyPoints();
  const [activeTab, setActiveTab] = useState<ParentRewardsTab>('rewards');
  const [updatingRewardId, setUpdatingRewardId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loadingWishId, setLoadingWishId] = useState<string | null>(null);
  const rewardVisibleOrder = useRef<string[]>([]);
  const wishVisibleOrder = useRef<string[]>([]);
  const visibleWishes = getVisibleWishes(wishes, rewards, rewardRedemptions);
  const sortedRewards = moveFavoriteGoalsToFront(
    rewards,
    favoriteGoals,
    'reward',
    (reward) => reward.id,
    rewardVisibleOrder.current,
  );
  const sortedVisibleWishes = moveFavoriteGoalsToFront(
    visibleWishes,
    favoriteGoals,
    'wish',
    (wish) => wish.id,
    wishVisibleOrder.current,
  );
  const tabOptions: SegmentedControlOption<ParentRewardsTab>[] = [
    { label: t('common.rewards'), value: 'rewards' },
    { label: t('common.wishes'), value: 'wishes' },
  ];

  const handleSetRewardActive = async (rewardId: string, isActive: boolean) => {
    setUpdatingRewardId(rewardId);

    try {
      await setRewardActive({ rewardId, isActive });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setUpdatingRewardId(null);
    }
  };

  const rewardOrderKey = sortedRewards.map((reward) => reward.id).join('|');
  const wishOrderKey = sortedVisibleWishes.map((wish) => wish.id).join('|');

  useEffect(() => {
    rewardVisibleOrder.current = rewardOrderKey ? rewardOrderKey.split('|') : [];
  }, [rewardOrderKey]);

  useEffect(() => {
    wishVisibleOrder.current = wishOrderKey ? wishOrderKey.split('|') : [];
  }, [wishOrderKey]);

  const handleApproveWish = async (wishId: string, price: number) => {
    if (price <= 0) {
      Alert.alert(t('common.error'), t('parent.wishes.invalidPrice'));
      return;
    }

    setLoadingWishId(wishId);
    try {
      await approveWish({ wishId, price });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingWishId(null);
    }
  };

  const handleRejectWish = async (wishId: string) => {
    setLoadingWishId(wishId);
    try {
      await rejectWish({ wishId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingWishId(null);
    }
  };

  return (
    <AppScreen title={t('parent.rewardsAndWishes.title')} subtitle={t('parent.rewardsAndWishes.subtitle')}>
      <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'rewards' && (
        <>
          <View style={styles.topActions}>
            <AppButton title={t('parent.rewards.create')} onPress={() => router.push('/parent/create-reward')} />
            <AppButton
              title={t('parent.redemptions.title')}
              variant="secondary"
              onPress={() => router.push('/parent/redemptions')}
            />
          </View>

          <SectionTitle title={t('common.availableRewards')} />
          {sortedRewards.map((reward) => {
            const isFavorite = favoriteGoals.some((goal) =>
              isFavoriteGoal(goal, 'reward', reward.id),
            );

            return (
              <FocusLiftCard
                key={reward.id}
                cardStyle={isFavorite ? styles.favoriteCard : undefined}
                isFocused={isFavorite}>
                <View style={styles.header}>
                  <Text style={styles.title}>{getRewardTitle(reward, t)}</Text>
                  <View style={styles.badges}>
                    {isFavorite && <StatusBadge label={t('common.favorite')} tone="warning" />}
                    <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} tone="muted" />
                    <StatusBadge
                      label={reward.isActive === false ? t('common.inactive') : t('common.active')}
                      tone={reward.isActive === false ? 'warning' : 'success'}
                    />
                  </View>
                </View>
                <PointsBadge points={reward.price} prefix={t('common.price')} />
                <AppButton
                  title={
                    updatingRewardId === reward.id
                      ? t('common.saving')
                      : reward.isActive === false
                        ? t('common.activate')
                        : t('common.deactivate')
                  }
                  variant="ghost"
                  onPress={() => handleSetRewardActive(reward.id, reward.isActive === false)}
                  disabled={updatingRewardId === reward.id}
                />
              </FocusLiftCard>
            );
          })}
        </>
      )}

      {activeTab === 'wishes' && (
        <>
          {sortedVisibleWishes.length === 0 && (
            <EmptyState title={t('common.allCaughtUp')} message={t('parent.wishes.empty')} />
          )}

          {sortedVisibleWishes.map((wish) => {
            const priceStr = prices[wish.id] ?? String(wish.price > 0 ? wish.price : '');
            const priceNum = parsePointsPrice(priceStr);
            const canApprove = priceNum > 0;
            const wishStatus = wish.status ?? 'pending';
            const isPending = wishStatus === 'pending';
            const isFavorite = favoriteGoals.some((goal) =>
              isFavoriteGoal(goal, 'wish', wish.id),
            );

            return (
              <FocusLiftCard
                key={wish.id}
                cardStyle={isFavorite ? styles.favoriteCard : undefined}
                isFocused={isFavorite}>
                <View style={styles.header}>
                  <View style={styles.info}>
                    <Text style={styles.title}>{getWishTitle(wish, t)}</Text>
                    {wish.childId && <Text style={styles.meta}>{getChildName(wish.childId)}</Text>}
                    {wish.price > 0 && <PointsBadge points={wish.price} prefix={t('common.price')} />}
                  </View>
                  <View style={styles.badges}>
                    {isFavorite && <StatusBadge label={t('common.favorite')} tone="warning" />}
                    {!isPending && (
                      <StatusBadge
                        label={t(wishStatusLabelKeys[wishStatus])}
                        tone={wishStatusTone[wishStatus]}
                      />
                    )}
                  </View>
                </View>
                {isPending && (
                  <>
                    <AppTextInput
                      label={t('parent.wishes.priceLabel')}
                      value={priceStr}
                      onChangeText={(value) =>
                        setPrices((prev) => ({ ...prev, [wish.id]: value.replace(/[^\d]/g, '') }))
                      }
                      placeholder={t('parent.wishes.pricePlaceholder')}
                      keyboardType="number-pad"
                    />
                    <View style={styles.actions}>
                      <AppButton
                        title={loadingWishId === wish.id ? '...' : t('parent.wishes.approve')}
                        onPress={() => handleApproveWish(wish.id, priceNum)}
                        disabled={!canApprove || loadingWishId === wish.id}
                        style={styles.actionButton}
                      />
                      <AppButton
                        title={loadingWishId === wish.id ? '...' : t('common.reject')}
                        variant="danger"
                        onPress={() => handleRejectWish(wish.id)}
                        disabled={loadingWishId === wish.id}
                        style={styles.actionButton}
                      />
                    </View>
                  </>
                )}
              </FocusLiftCard>
            );
          })}
        </>
      )}
    </AppScreen>
  );
};

export default ParentRewardsScreen;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  favoriteCard: {
    backgroundColor: '#FFFBF0',
    borderColor: '#F5B225',
    borderWidth: 2,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
  },
  title: {
    color: '#12314A',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  topActions: {
    gap: 10,
  },
});
