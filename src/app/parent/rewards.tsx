import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { RewardRedemption, RewardRedemptionStatus, RewardType, WishStatus } from '@/shared/types/family';
import {
  AppButton,
  AppCard,
  AppScreen,
  AppTextInput,
  EmptyState,
  FocusLiftCard,
  ParentChildFilter,
  PointsBadge,
  SectionTitle,
  SegmentedControl,
  SegmentedControlOption,
  StatusBadge,
} from '@/shared/ui';
import { IconAlert } from '@/shared/ui/QuestIcons';
import { getRewardTitle, getWishTitle } from '@/shared/utils/content';
import { canManage } from '@/shared/utils/permissions';
import { isFavoriteGoal, moveFavoriteGoalsToFront } from '@/shared/utils/favoriteGoals';
import { getDailyRewardBalance, getRewardPriceSuggestions } from '@/shared/utils/pricingGuidance';
import { getVisibleWishes } from '@/shared/utils/wishes';

type ParentRewardsMode = 'work' | 'history';
type ParentRewardsWorkFilter = 'rewards' | 'wishes' | 'requests';
type ParentRewardsHistoryFilter = 'received' | 'rejected';
type ParentRewardsTab = ParentRewardsWorkFilter | ParentRewardsHistoryFilter;

const parentRewardsTabs: ParentRewardsTab[] = [
  'rewards',
  'wishes',
  'requests',
  'received',
  'rejected',
];

const isParentRewardsTab = (value: string | undefined): value is ParentRewardsTab =>
  parentRewardsTabs.includes(value as ParentRewardsTab);

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
  wish: 'rewardType.wish',
};

const redemptionStatusLabelKeys: Record<RewardRedemptionStatus, TranslationKey> = {
  requested: 'redemptionStatus.requested',
  approved: 'redemptionStatus.approved',
  rejected: 'redemptionStatus.rejected',
  fulfilled: 'redemptionStatus.fulfilled',
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
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { getChildName } = useActiveChild();
  const {
    activeParentId,
    approveWish,
    children,
    favoriteGoals,
    fulfillRewardRedemption,
    parents,
    rejectWish,
    rejectRewardRedemption,
    rewardRedemptions,
    rewards,
    setRewardActive,
    tasks,
    updateReward,
    wishes,
  } = useFamilyPoints();
  const currentParent = parents?.find((p) => p.id === activeParentId);
  const [activeMode, setActiveMode] = useState<ParentRewardsMode>('work');
  const [workFilter, setWorkFilter] = useState<ParentRewardsWorkFilter>('rewards');
  const [historyFilter, setHistoryFilter] = useState<ParentRewardsHistoryFilter>('received');
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [updatingRewardId, setUpdatingRewardId] = useState<string | null>(null);
  const [pendingBalanceRewardId, setPendingBalanceRewardId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loadingWishId, setLoadingWishId] = useState<string | null>(null);
  const rewardVisibleOrder = useRef<string[]>([]);
  const wishVisibleOrder = useRef<string[]>([]);
  const filteredFavoriteGoals = selectedChildId
    ? favoriteGoals.filter((goal) => goal.childId === selectedChildId)
    : favoriteGoals;
  const visibleWishes = getVisibleWishes(wishes, rewards, rewardRedemptions).filter(
    (wish) => !selectedChildId || wish.childId === selectedChildId,
  );
  const childFilteredRedemptions = selectedChildId
    ? rewardRedemptions.filter((redemption) => redemption.childId === selectedChildId)
    : rewardRedemptions;
  const visibleRewards = selectedChildId
    ? rewards.filter((reward) => !reward.childId || reward.childId === selectedChildId)
    : rewards;
  const redemptionRequests = childFilteredRedemptions.filter(
    (item) => item.status === 'requested' || item.status === 'approved',
  );
  const receivedRedemptions = childFilteredRedemptions.filter((item) => item.status === 'fulfilled');
  const rejectedRedemptions = childFilteredRedemptions.filter((item) => item.status === 'rejected');
  const sortedRewards = moveFavoriteGoalsToFront(
    visibleRewards,
    filteredFavoriteGoals,
    'reward',
    (reward) => reward.id,
    rewardVisibleOrder.current,
  );
  const sortedVisibleWishes = moveFavoriteGoalsToFront(
    visibleWishes,
    filteredFavoriteGoals,
    'wish',
    (wish) => wish.id,
    wishVisibleOrder.current,
  );
  const pendingBalanceReward = rewards.find((reward) => reward.id === pendingBalanceRewardId);
  const pendingRewardBalance = pendingBalanceReward
    ? getDailyRewardBalance({ reward: pendingBalanceReward, rewards, tasks })
    : undefined;
  const modeOptions: SegmentedControlOption<ParentRewardsMode>[] = [
    { label: t('parent.rewardsAndWishes.workTab'), value: 'work' },
    { label: t('common.history'), value: 'history' },
  ];
  const workFilterOptions: SegmentedControlOption<ParentRewardsWorkFilter>[] = [
    { label: t('common.rewards'), value: 'rewards' },
    { label: t('common.wishes'), value: 'wishes' },
    { label: t('parent.redemptions.requests'), value: 'requests' },
  ];
  const historyFilterOptions: SegmentedControlOption<ParentRewardsHistoryFilter>[] = [
    { label: t('common.received'), value: 'received' },
    { label: t('parent.redemptions.rejected'), value: 'rejected' },
  ];

  useEffect(() => {
    if (isParentRewardsTab(tab)) {
      if (tab === 'received' || tab === 'rejected') {
        setActiveMode('history');
        setHistoryFilter(tab);
        return;
      }

      setActiveMode('work');
      setWorkFilter(tab);
    }
  }, [tab]);

  const handleSetRewardActive = async (rewardId: string, isActive: boolean) => {
    const reward = rewards.find((item) => item.id === rewardId);

    setUpdatingRewardId(rewardId);

    try {
      await setRewardActive({ rewardId, isActive });

      if (!reward || !isActive || !reward.isDailyReward) {
        return;
      }

      const activatedReward = { ...reward, isActive: true };
      const rewardsAfterActivation = rewards.map((item) =>
        item.id === rewardId ? activatedReward : item,
      );
      const dailyBalance = getDailyRewardBalance({
        reward: activatedReward,
        rewards: rewardsAfterActivation,
        tasks,
      });

      if (dailyBalance.status !== 'ok' && dailyBalance.suggestedPrice !== reward.price) {
        setPendingBalanceRewardId(reward.id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setUpdatingRewardId(null);
    }
  };

  const handleBalanceReward = async (rewardId: string, price: number) => {
    const reward = rewards.find((item) => item.id === rewardId);

    if (!reward) {
      return;
    }

    setUpdatingRewardId(rewardId);

    try {
      await updateReward({
        rewardId,
        title: reward.title ?? getRewardTitle(reward, t),
        price,
        type: reward.type,
        childId: reward.childId,
        isActive: reward.isActive,
        isDailyReward: reward.isDailyReward,
        availableDays: reward.availableDays,
        requiresDailyQuestsCompleted: reward.requiresDailyQuestsCompleted,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setUpdatingRewardId(null);
    }
  };

  const getRewardBalanceReason = () => {
    if (!pendingRewardBalance) {
      return '';
    }

    if (pendingRewardBalance.status === 'expensive') {
      return 'Цена выше дневного баланса. Ребенок может сделать дела, но не получить награду.';
    }

    if (pendingRewardBalance.status === 'cheap') {
      return 'Цена ниже дневного баланса. Награда может покупаться слишком легко.';
    }

    if (pendingRewardBalance.status === 'no_daily_quests') {
      return 'Нет ежедневных квестов. Цена пока считается как мягкий старт.';
    }

    return 'Цена выглядит нормально.';
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

  const renderRedemptionHistoryCard = (redemption: RewardRedemption, showRepeat: boolean) => {
    const reward = rewards.find((item) => item.id === redemption.rewardId);
    const rewardTitle = reward ? getRewardTitle(reward, t) : t('common.rewards');

    return (
      <AppCard key={redemption.id}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.title}>{rewardTitle}</Text>
            <Text style={styles.meta}>{getChildName(redemption.childId)}</Text>
            <View style={styles.badgesRow}>
              {reward && <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />}
              <StatusBadge
                label={t(redemptionStatusLabelKeys[redemption.status])}
                tone={redemption.status === 'fulfilled' ? 'success' : 'danger'}
              />
            </View>
          </View>
          <PointsBadge points={redemption.pointsSpent} />
        </View>
        {showRepeat && reward?.isActive === false && (
          <AppButton
            title={t('parent.redemptions.repeatReward')}
            variant="secondary"
            onPress={() => handleSetRewardActive(reward.id, true)}
          />
        )}
      </AppCard>
    );
  };

  return (
    <AppScreen title={t('parent.rewardsAndWishes.title')} subtitle={t('parent.rewardsAndWishes.subtitle')}>
      <ParentChildFilter
        childrenList={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <SegmentedControl options={modeOptions} value={activeMode} onChange={setActiveMode} />
      {activeMode === 'work' ? (
        <SegmentedControl options={workFilterOptions} value={workFilter} onChange={setWorkFilter} />
      ) : (
        <SegmentedControl
          options={historyFilterOptions}
          value={historyFilter}
          onChange={setHistoryFilter}
        />
      )}

      {activeMode === 'work' && workFilter === 'rewards' && (
        <>
          <View style={styles.topActions}>
            <AppButton title={t('parent.rewards.create')} onPress={() => router.push('/parent/create-reward')} />
          </View>

          <SectionTitle title={t('common.availableRewards')} />
          {sortedRewards.map((reward) => {
            const isFavorite = filteredFavoriteGoals.some((goal) =>
              isFavoriteGoal(goal, 'reward', reward.id),
            );
            const dailyBalance = reward.isDailyReward && reward.isActive !== false
              ? getDailyRewardBalance({ reward, rewards, tasks })
              : undefined;
            const shouldShowBalanceAction = dailyBalance && dailyBalance.status !== 'ok';
            const dailyBalanceTone = dailyBalance?.status === 'ok' ? 'success' : 'warning';
            const canBalanceReward = !reward.createdBy || canManage(currentParent, reward.createdBy);

            return (
              <FocusLiftCard
                key={reward.id}
                cardStyle={isFavorite ? styles.favoriteCard : undefined}
                isFocused={isFavorite}>
                <View style={styles.header}>
                  <Text style={styles.title}>{getRewardTitle(reward, t)}</Text>
                  <View style={styles.badges}>
                    {isFavorite && <StatusBadge label={t('common.favorite')} tone="warning" />}
                    <StatusBadge
                      label={reward.childId ? getChildName(reward.childId) : t('common.allChildren')}
                      tone="muted"
                    />
                    <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} tone="muted" />
                    {dailyBalance && (
                      <StatusBadge label={dailyBalance.note} tone={dailyBalanceTone} />
                    )}
                    <StatusBadge
                      label={reward.isActive === false ? t('common.inactive') : t('common.active')}
                      tone={reward.isActive === false ? 'warning' : 'success'}
                    />
                  </View>
                </View>
                <PointsBadge points={reward.price} prefix={t('common.price')} />
                {dailyBalance && dailyBalance.status !== 'ok' && (
                  <Text style={styles.balanceHint}>
                    Рекомендовано: {dailyBalance.suggestedPrice}
                  </Text>
                )}
                {canBalanceReward && (
                  <View style={styles.rewardActions}>
                    {shouldShowBalanceAction && dailyBalance.suggestedPrice !== reward.price && (
                      <AppButton
                        title={updatingRewardId === reward.id ? t('common.saving') : 'Рекомендация!'}
                        leftIcon={updatingRewardId === reward.id ? undefined : <IconAlert />}
                        variant="secondary"
                        onPress={() => setPendingBalanceRewardId(reward.id)}
                        disabled={updatingRewardId === reward.id}
                        style={styles.actionButton}
                      />
                    )}
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
                      style={styles.actionButton}
                    />
                  </View>
                )}
              </FocusLiftCard>
            );
          })}
        </>
      )}

      {activeMode === 'work' && workFilter === 'wishes' && (
        <>
          {sortedVisibleWishes.length === 0 && (
            <EmptyState title={t('common.allCaughtUp')} message={t('parent.wishes.empty')} />
          )}

          {sortedVisibleWishes.map((wish) => {
            const priceStr = prices[wish.id] ?? String(wish.price > 0 ? wish.price : '');
            const priceNum = parsePointsPrice(priceStr);
            const priceSuggestions = getRewardPriceSuggestions({
              rewardType: 'wish',
              isDailyReward: false,
              rewards,
              tasks,
            });
            const canApprove = priceNum > 0;
            const wishStatus = wish.status ?? 'pending';
            const isPending = wishStatus === 'pending';
            const isFavorite = filteredFavoriteGoals.some((goal) =>
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
                    <View style={styles.suggestionRow}>
                      {priceSuggestions.map((suggestion) => (
                        <Pressable
                          accessibilityRole="button"
                          key={suggestion.label}
                          onPress={() =>
                            setPrices((prev) => ({ ...prev, [wish.id]: String(suggestion.value) }))
                          }
                          style={({ pressed }) => [
                            styles.suggestionChip,
                            priceNum === suggestion.value && styles.suggestionChipSelected,
                            pressed && styles.suggestionChipPressed,
                          ]}>
                          <Text
                            style={[
                              styles.suggestionValue,
                              priceNum === suggestion.value && styles.suggestionValueSelected,
                            ]}>
                            {suggestion.label}: {suggestion.value}
                          </Text>
                          <Text
                            style={[
                              styles.suggestionNote,
                              priceNum === suggestion.value && styles.suggestionNoteSelected,
                            ]}>
                            {suggestion.note}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
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

      {activeMode === 'work' && workFilter === 'requests' && (
        <>
          <SectionTitle title={t('parent.redemptions.requests')} />
          {redemptionRequests.length === 0 && (
            <EmptyState title={t('common.allCaughtUp')} message={t('parent.redemptions.empty')} />
          )}

          {redemptionRequests.map((redemption) => {
            const reward = rewards.find((item) => item.id === redemption.rewardId);
            const rewardTitle = reward ? getRewardTitle(reward, t) : t('common.rewards');

            return (
              <AppCard key={redemption.id}>
                <View style={styles.header}>
                  <View style={styles.info}>
                    <Text style={styles.title}>{rewardTitle}</Text>
                    <Text style={styles.meta}>{getChildName(redemption.childId)}</Text>
                    <View style={styles.badgesRow}>
                      {reward && <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />}
                      <StatusBadge
                        label={t(redemptionStatusLabelKeys[redemption.status])}
                        tone="warning"
                      />
                    </View>
                  </View>
                  <PointsBadge points={redemption.pointsSpent} />
                </View>
                <View style={styles.actions}>
                  <AppButton
                    title={t('common.fulfill')}
                    onPress={() => fulfillRewardRedemption(redemption.id)}
                    style={styles.actionButton}
                  />
                  <AppButton
                    title={t('common.reject')}
                    variant="danger"
                    onPress={() => rejectRewardRedemption(redemption.id)}
                    style={styles.actionButton}
                  />
                </View>
              </AppCard>
            );
          })}
        </>
      )}

      {activeMode === 'history' && historyFilter === 'received' && (
        <>
          <SectionTitle title={t('common.receivedRewardsAndWishes')} />
          {receivedRedemptions.length === 0 && (
            <EmptyState
              title={t('common.received')}
              message={t('parent.redemptions.receivedEmpty')}
            />
          )}
          {receivedRedemptions.map((redemption) => renderRedemptionHistoryCard(redemption, true))}
        </>
      )}

      {activeMode === 'history' && historyFilter === 'rejected' && (
        <>
          <SectionTitle title={t('parent.redemptions.rejected')} />
          {rejectedRedemptions.length === 0 && (
            <EmptyState
              title={t('parent.redemptions.rejected')}
              message={t('parent.redemptions.rejectedEmpty')}
            />
          )}
          {rejectedRedemptions.map((redemption) => renderRedemptionHistoryCard(redemption, false))}
        </>
      )}
      <Modal
        animationType="fade"
        onRequestClose={() => setPendingBalanceRewardId(null)}
        transparent
        visible={Boolean(pendingBalanceRewardId)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPendingBalanceRewardId(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Рекомендация по цене</Text>
            {pendingBalanceReward && (
              <Text style={styles.modalItemTitle}>{getRewardTitle(pendingBalanceReward, t)}</Text>
            )}
            <Text style={styles.modalText}>{getRewardBalanceReason()}</Text>
            {pendingRewardBalance && (
              <Text style={styles.modalRecommendation}>
                Рекомендую: {pendingRewardBalance.suggestedPrice} баллов
              </Text>
            )}
            <View style={styles.modalActions}>
              <AppButton
                title={t('common.cancel')}
                variant="secondary"
                onPress={() => setPendingBalanceRewardId(null)}
                style={styles.actionButton}
              />
              {pendingBalanceReward && pendingRewardBalance && (
                <AppButton
                  title="Сбалансировать"
                  onPress={() => {
                    void handleBalanceReward(
                      pendingBalanceReward.id,
                      pendingRewardBalance.suggestedPrice,
                    );
                    setPendingBalanceRewardId(null);
                  }}
                  style={styles.actionButton}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  badgesRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  balanceHint: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '700',
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
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE3CF',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    width: '88%',
  },
  modalItemTitle: {
    color: '#12314A',
    fontSize: 17,
    fontWeight: '900',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 49, 74, 0.26)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalRecommendation: {
    color: FP.primaryDark,
    fontSize: 15,
    fontWeight: '900',
  },
  modalText: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
  modalTitle: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '900',
  },
  rewardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: FP.primaryLight,
    borderColor: FP.primaryBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  suggestionChipPressed: {
    opacity: 0.78,
  },
  suggestionChipSelected: {
    backgroundColor: FP.primary,
    borderColor: FP.primary,
  },
  suggestionValue: {
    color: FP.primaryDark,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  suggestionValueSelected: {
    color: '#FFFFFF',
  },
  suggestionNote: {
    color: FP.textSub,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  suggestionNoteSelected: {
    color: '#EAF8F4',
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
