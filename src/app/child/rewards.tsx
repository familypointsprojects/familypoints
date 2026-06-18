import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Animated,
  InteractionManager,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import type { FavoriteGoalType } from '@/shared/state/types';
import { RewardRedemptionStatus, RewardType, WishStatus } from '@/shared/types/family';
import {
  AppButton,
  AppCard,
  AppScreen,
  AppTextInput,
  EmptyState,
  FocusLiftCard,
  PointsBadge,
  RocketProgressBar,
  SectionTitle,
  SegmentedControl,
  SegmentedControlOption,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle, getWishTitle } from '@/shared/utils/content';
import {
  getFavoriteGoalForChild,
  isFavoriteGoal,
  moveFavoriteGoalsToFront,
} from '@/shared/utils/favoriteGoals';
import { getBalance, getProgressPercent } from '@/shared/utils/points';
import {
  getDailyRewardLockReason,
  isDailyRewardAvailableToday,
  isRewardAvailableForChild,
} from '@/shared/utils/rewards';
import { getVisibleWishes } from '@/shared/utils/wishes';

type ChildRewardsTab = 'rewards' | 'wishes' | 'received';
type PendingFavoriteGoal = {
  type: FavoriteGoalType;
  itemId: string;
};

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

const redemptionStatusTones: Record<RewardRedemptionStatus, 'warning' | 'success' | 'danger'> = {
  requested: 'warning',
  approved: 'warning',
  rejected: 'danger',
  fulfilled: 'success',
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

const ChildRewardsScreen = () => {
  const { t } = useLanguage();
  const {
    rewardId: rewardIdParam,
    scrollToReward: scrollToRewardParam,
  } = useLocalSearchParams<{ rewardId?: string | string[]; scrollToReward?: string | string[] }>();
  const { activeChildId } = useActiveChild();
  const {
    addWish,
    clearFavoriteGoal,
    favoriteGoals,
    pointTransactions,
    redeemReward,
    rewardRedemptions,
    rewards,
    setFavoriteGoal,
    taskSubmissions,
    tasks,
    wishes,
  } = useFamilyPoints();
  const [activeTab, setActiveTab] = useState<ChildRewardsTab>('rewards');
  const [celebrationTitle, setCelebrationTitle] = useState('');
  const [isFocusModalVisible, setIsFocusModalVisible] = useState(false);
  const [isWishModalVisible, setIsWishModalVisible] = useState(false);
  const [pendingFavoriteGoal, setPendingFavoriteGoal] = useState<PendingFavoriteGoal | null>(null);
  const [wishTitle, setWishTitle] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const rewardAnchorY = useRef<Record<string, number>>({});
  const rewardVisibleOrder = useRef<string[]>([]);
  const wishVisibleOrder = useRef<string[]>([]);
  const lastHandledScrollRequest = useRef<string | null>(null);
  const celebrationProgress = useRef(new Animated.Value(0)).current;
  const [anchorVersion, setAnchorVersion] = useState(0);
  const [contentSizeVersion, setContentSizeVersion] = useState(0);
  const [scrollRequestVersion, setScrollRequestVersion] = useState(0);
  const targetRewardId = Array.isArray(rewardIdParam) ? rewardIdParam[0] : rewardIdParam;
  const scrollToRewardKey = Array.isArray(scrollToRewardParam)
    ? scrollToRewardParam[0]
    : scrollToRewardParam;
  const scrollRequestKey = targetRewardId
    ? `${targetRewardId}:${scrollToRewardKey ?? 'focus'}:${scrollRequestVersion}`
    : null;
  const balance = getBalance(pointTransactions, activeChildId);
  const childRedemptions = rewardRedemptions.filter(
    (redemption) => redemption.childId === activeChildId,
  );
  const openRewardRequests = childRedemptions.filter(
    (redemption) => redemption.status === 'requested' || redemption.status === 'approved',
  );
  const receivedRedemptions = childRedemptions.filter(
    (redemption) => redemption.status === 'fulfilled',
  );
  const availableRewards = rewards.filter(
    (reward) =>
      reward.isActive !== false &&
      isRewardAvailableForChild(reward, activeChildId) &&
      !reward.isDailyReward &&
      !openRewardRequests.some((redemption) => redemption.rewardId === reward.id),
  );
  // Daily rewards: active + available today (regardless of lock state — shown with lock indicator)
  const dailyRewards = rewards.filter(
    (reward) => reward.isDailyReward && isDailyRewardAvailableToday(reward, activeChildId),
  );
  const visibleWishes = getVisibleWishes(wishes, rewards, rewardRedemptions);
  const childWishes = visibleWishes.filter(
    (wish) => !wish.childId || wish.childId === activeChildId,
  );
  const tabOptions: SegmentedControlOption<ChildRewardsTab>[] = [
    { label: t('common.rewards'), value: 'rewards' },
    { label: t('common.wishes'), value: 'wishes' },
    { label: t('common.received'), value: 'received' },
  ];
  const celebrationScale = celebrationProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.85, 1.08, 1],
  });
  const celebrationOpacity = celebrationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const canAddWish = wishTitle.trim().length > 0;
  const favoriteGoal = getFavoriteGoalForChild(favoriteGoals, activeChildId);
  const activeFavoriteGoals = favoriteGoal ? [favoriteGoal] : [];
  const sortedAvailableRewards = moveFavoriteGoalsToFront(
    availableRewards,
    activeFavoriteGoals,
    'reward',
    (reward) => reward.id,
    rewardVisibleOrder.current,
  );
  const sortedChildWishes = moveFavoriteGoalsToFront(
    childWishes,
    activeFavoriteGoals,
    'wish',
    (wish) => wish.id,
    wishVisibleOrder.current,
  );

  const rewardOrderKey = sortedAvailableRewards.map((reward) => reward.id).join('|');
  const wishOrderKey = sortedChildWishes.map((wish) => wish.id).join('|');

  useEffect(() => {
    if (!celebrationTitle) {
      return undefined;
    }

    celebrationProgress.setValue(0);
    Animated.timing(celebrationProgress, {
      duration: 320,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => setCelebrationTitle(''), 20000);

    return () => clearTimeout(timeout);
  }, [celebrationProgress, celebrationTitle]);

  useFocusEffect(useCallback(() => {
    if (targetRewardId) {
      setActiveTab('rewards');
      setScrollRequestVersion((version) => version + 1);
    }
  }, [targetRewardId]));

  useEffect(() => {
    if (!targetRewardId || !scrollRequestKey || activeTab !== 'rewards') {
      return undefined;
    }

    if (lastHandledScrollRequest.current === scrollRequestKey) {
      return undefined;
    }

    const anchorY = rewardAnchorY.current[targetRewardId];

    if (typeof anchorY !== 'number') {
      return undefined;
    }

    const scrollY = Math.max(anchorY - 18, 0);
    lastHandledScrollRequest.current = scrollRequestKey;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const interaction = InteractionManager.runAfterInteractions(() => {
      [0, 80, 180, 360, 640].forEach((delay, index) => {
        const timeout = setTimeout(() => {
          scrollRef.current?.scrollTo({ y: scrollY, animated: index > 0 });
        }, delay);
        timeouts.push(timeout);
      });
    });

    return () => {
      interaction.cancel();
      timeouts.forEach(clearTimeout);
    };
  }, [activeTab, anchorVersion, contentSizeVersion, scrollRequestKey, targetRewardId]);

  useEffect(() => {
    rewardVisibleOrder.current = rewardOrderKey ? rewardOrderKey.split('|') : [];
  }, [rewardOrderKey]);

  useEffect(() => {
    wishVisibleOrder.current = wishOrderKey ? wishOrderKey.split('|') : [];
  }, [wishOrderKey]);

  const closeCelebration = () => {
    setCelebrationTitle('');
  };

  const handleRedeem = (rewardId: string, title: string) => {
    setCelebrationTitle(title);
    redeemReward(rewardId);
  };

  const handleChooseFavorite = async (type: FavoriteGoalType, itemId: string) => {
    try {
      if (isFavoriteGoal(favoriteGoal, type, itemId)) {
        await clearFavoriteGoal({ childId: activeChildId });
        return;
      }

      if (favoriteGoal) {
        setPendingFavoriteGoal({ type, itemId });
        setIsFocusModalVisible(true);
        return;
      }

      await setFavoriteGoal({ childId: activeChildId, type, itemId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Ошибка', message);
    }
  };

  const handleCloseFocusModal = () => {
    setPendingFavoriteGoal(null);
    setIsFocusModalVisible(false);
  };

  const handleReplaceFavorite = async () => {
    if (!pendingFavoriteGoal) {
      return;
    }

    try {
      await setFavoriteGoal({
        childId: activeChildId,
        type: pendingFavoriteGoal.type,
        itemId: pendingFavoriteGoal.itemId,
      });
      handleCloseFocusModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Ошибка', message);
      handleCloseFocusModal();
    }
  };

  const handleAddWish = () => {
    if (!canAddWish) {
      return;
    }

    addWish({
      title: wishTitle.trim(),
      price: 0,
    });
    setWishTitle('');
    setIsWishModalVisible(false);
  };

  const handleCloseWishModal = () => {
    setWishTitle('');
    setIsWishModalVisible(false);
  };

  const handleRewardAnchorLayout = useCallback(
    (rewardId: string) => (event: LayoutChangeEvent) => {
      rewardAnchorY.current[rewardId] = event.nativeEvent.layout.y;
      setAnchorVersion((version) => version + 1);
    },
    [],
  );

  return (
    <AppScreen
      onContentSizeChange={() => setContentSizeVersion((version) => version + 1)}
      scrollRef={scrollRef}
      title={t('child.rewardsAndWishes.title')}
      subtitle={t('child.rewardsAndWishes.subtitle')}>
      {Boolean(celebrationTitle) && (
        <Animated.View
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            },
          ]}>
          <View style={styles.sparkleRow}>
            <Text style={styles.sparkle}>+</Text>
            <Text style={styles.star}>★</Text>
            <Text style={styles.sparkle}>+</Text>
          </View>
          <Text style={styles.celebrationTitle}>{t('child.rewards.celebrationTitle')}</Text>
          <Text style={styles.celebrationReward}>{celebrationTitle}</Text>
          <Text style={styles.celebrationSubtitle}>
            {t('child.rewards.celebrationSubtitle')}
          </Text>
          <AppButton
            title={t('common.close')}
            variant="secondary"
            onPress={closeCelebration}
            style={styles.celebrationButton}
          />
        </Animated.View>
      )}

      <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} />

      <Modal
        animationType="fade"
        onRequestClose={handleCloseFocusModal}
        transparent
        visible={isFocusModalVisible}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseFocusModal} />
          <View style={styles.modalCard}>
            <SectionTitle title={t('child.favorite.modalTitle')} />
            <Text style={styles.modalText}>{t('child.favorite.modalMessage')}</Text>
            <View style={styles.modalActions}>
              <AppButton
                title={t('child.favorite.keepCurrent')}
                variant="secondary"
                onPress={handleCloseFocusModal}
                style={styles.modalButton}
              />
              <AppButton
                title={t('child.favorite.replace')}
                onPress={handleReplaceFavorite}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {activeTab === 'rewards' && (
        <>
          {/* ── Daily Rewards ── */}
          {dailyRewards.length > 0 && (
            <>
              <SectionTitle title={t('child.rewards.dailyTitle')} />
              {dailyRewards.map((reward) => {
                const lockReason = getDailyRewardLockReason(
                  reward,
                  balance,
                  tasks,
                  taskSubmissions,
                  activeChildId,
                );
                const rewardTitle = getRewardTitle(reward, t);
                const isLocked = lockReason !== null;
                const pendingRedemption = openRewardRequests.find((r) => r.rewardId === reward.id);

                return (
                  <View key={reward.id} onLayout={handleRewardAnchorLayout(reward.id)}>
                    <AppCard style={styles.dailyRewardCard}>
                      <View style={styles.header}>
                        <View style={styles.titleGroup}>
                          <View style={styles.dailyRewardTitleRow}>
                            <Text style={styles.dailyRewardEmoji}>🌅</Text>
                            <Text style={styles.title}>{rewardTitle}</Text>
                          </View>
                          <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />
                        </View>
                        <PointsBadge points={reward.price} />
                      </View>

                      {pendingRedemption ? (
                        <StatusBadge
                          label={t(redemptionStatusLabelKeys[pendingRedemption.status])}
                          tone={redemptionStatusTones[pendingRedemption.status]}
                        />
                      ) : (
                        <>
                          {lockReason === 'daily_quests_incomplete' && (
                            <Text style={styles.lockNote}>
                              {t('child.rewards.lockDailyQuests')}
                            </Text>
                          )}
                          {lockReason === 'not_enough_points' && (
                            <Text style={styles.lockNote}>
                              {t('child.rewards.lockNotEnoughPoints')}
                            </Text>
                          )}
                          <AppButton
                            title={
                              lockReason === 'daily_quests_incomplete'
                                ? t('child.rewards.lockDailyQuestsButton')
                                : lockReason === 'not_enough_points'
                                  ? t('common.notEnoughPoints')
                                  : t('common.redeem')
                            }
                            onPress={() => !isLocked && handleRedeem(reward.id, rewardTitle)}
                            disabled={isLocked}
                            variant={isLocked ? 'secondary' : 'primary'}
                          />
                        </>
                      )}
                    </AppCard>
                  </View>
                );
              })}
            </>
          )}

          <SectionTitle title={t('common.availableRewards')} />
          {sortedAvailableRewards.map((reward) => {
            const canRedeem = balance >= reward.price;
            const progress = getProgressPercent(balance, reward.price);
            const rewardTitle = getRewardTitle(reward, t);
            const isFavorite = isFavoriteGoal(favoriteGoal, 'reward', reward.id);

            return (
              <View key={reward.id} onLayout={handleRewardAnchorLayout(reward.id)}>
                <FocusLiftCard
                  cardStyle={isFavorite ? styles.favoriteCard : undefined}
                  isFocused={isFavorite}>
                  <View style={styles.header}>
                    <View style={styles.titleGroup}>
                      <Text style={styles.title}>{rewardTitle}</Text>
                      <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />
                    </View>
                    <PointsBadge points={reward.price} />
                  </View>
                  <RocketProgressBar progress={progress} showRunner={false} showGlow={false} />
                  <Text style={styles.meta}>
                    {t('child.rewards.progress', { balance, price: reward.price, progress })}
                  </Text>
                  <AppButton
                    title={isFavorite ? t('child.favorite.clear') : t('child.favorite.choose')}
                    onPress={() => handleChooseFavorite('reward', reward.id)}
                    variant={isFavorite ? 'primary' : 'secondary'}
                  />
                  <AppButton
                    title={canRedeem ? t('common.redeem') : t('common.notEnoughPoints')}
                    onPress={() => handleRedeem(reward.id, rewardTitle)}
                    disabled={!canRedeem}
                    variant={canRedeem ? 'primary' : 'secondary'}
                  />
                </FocusLiftCard>
              </View>
            );
          })}

          {openRewardRequests.length > 0 && (
            <>
              <SectionTitle title={t('child.rewards.pendingTitle')} />
              {openRewardRequests.map((redemption) => {
                const reward = rewards.find((item) => item.id === redemption.rewardId);
                const rewardTitle = reward ? getRewardTitle(reward, t) : t('common.rewards');

                return (
                  <View key={redemption.id} onLayout={handleRewardAnchorLayout(redemption.rewardId)}>
                    <AppCard>
                      <View style={styles.header}>
                        <View style={styles.titleGroup}>
                          <Text style={styles.title}>{rewardTitle}</Text>
                          {reward && <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />}
                        </View>
                        <PointsBadge points={redemption.pointsSpent} />
                      </View>
                      <StatusBadge
                        label={t(redemptionStatusLabelKeys[redemption.status])}
                        tone={redemptionStatusTones[redemption.status]}
                      />
                    </AppCard>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}

      {activeTab === 'wishes' && (
        <>
          <SectionTitle
            title={t('common.wishlist')}
            action={
              <AppButton
                title={t('common.addWish')}
                onPress={() => setIsWishModalVisible(true)}
                style={styles.addWishButton}
              />
            }
          />
          {childWishes.length === 0 && (
            <EmptyState
              title={t('common.wishlist')}
              message={t('child.wishes.empty')}
            />
          )}
          {sortedChildWishes.map((wish) => {
            const wishStatus = wish.status ?? 'pending';
            const isApproved = wishStatus === 'approved';
            const progress = isApproved && wish.price > 0 ? getProgressPercent(balance, wish.price) : 0;
            const title = getWishTitle(wish, t);
            const isFavorite = isFavoriteGoal(favoriteGoal, 'wish', wish.id);

            return (
              <FocusLiftCard
                key={wish.id}
                cardStyle={isFavorite ? styles.favoriteCard : undefined}
                isFocused={isFavorite}>
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <StatusBadge
                    label={t(wishStatusLabelKeys[wishStatus])}
                    tone={wishStatusTone[wishStatus]}
                  />
                </View>
                {isApproved && wish.price > 0 && (
                  <>
                    <PointsBadge points={wish.price} prefix={t('common.goal')} />
                    <RocketProgressBar progress={progress} showRunner={false} showGlow={false} />
                    <Text style={styles.meta}>
                      {t('child.wishes.progress', { progress, balance, price: wish.price })}
                    </Text>
                    <AppButton
                      title={isFavorite ? t('child.favorite.clear') : t('child.favorite.choose')}
                      onPress={() => handleChooseFavorite('wish', wish.id)}
                      variant={isFavorite ? 'primary' : 'secondary'}
                    />
                  </>
                )}
                {!isApproved && wish.price > 0 && (
                  <Text style={styles.meta}>
                    {t('common.price')}: {wish.price} {t('common.pointsShort')}
                  </Text>
                )}
              </FocusLiftCard>
            );
          })}

          <Modal
            animationType="fade"
            onRequestClose={handleCloseWishModal}
            transparent
            visible={isWishModalVisible}>
            <View style={styles.modalOverlay}>
              <Pressable style={styles.modalBackdrop} onPress={handleCloseWishModal} />
              <View style={styles.modalCard}>
                <SectionTitle title={t('common.addWish')} />
                <AppTextInput
                  label={t('common.title')}
                  value={wishTitle}
                  onChangeText={setWishTitle}
                  placeholder={t('child.wishes.titlePlaceholder')}
                />
                <View style={styles.modalActions}>
                  <AppButton
                    title={t('common.cancel')}
                    variant="secondary"
                    onPress={handleCloseWishModal}
                    style={styles.modalButton}
                  />
                  <AppButton
                    title={t('common.addWish')}
                    onPress={handleAddWish}
                    disabled={!canAddWish}
                    style={styles.modalButton}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      {activeTab === 'received' && (
        <>
          <SectionTitle title={t('common.receivedRewardsAndWishes')} />
          {receivedRedemptions.length === 0 && (
            <EmptyState
              title={t('common.received')}
              message={t('child.rewards.receivedEmpty')}
            />
          )}
          {receivedRedemptions.map((redemption) => {
            const reward = rewards.find((item) => item.id === redemption.rewardId);
            const rewardTitle = reward ? getRewardTitle(reward, t) : t('common.rewards');

            return (
              <AppCard key={redemption.id}>
                <View style={styles.header}>
                  <View style={styles.titleGroup}>
                    <Text style={styles.title}>{rewardTitle}</Text>
                    {reward && <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />}
                  </View>
                  <PointsBadge points={redemption.pointsSpent} />
                </View>
                <StatusBadge label={t(redemptionStatusLabelKeys.fulfilled)} tone="success" />
              </AppCard>
            );
          })}
        </>
      )}
    </AppScreen>
  );
};

export default ChildRewardsScreen;

const styles = StyleSheet.create({
  addWishButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  balance: {
    color: '#12314A',
    fontSize: 42,
    fontWeight: '900',
  },
  dailyRewardCard: {
    borderColor: '#F5B225',
    borderWidth: 1.5,
  },
  dailyRewardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dailyRewardEmoji: {
    fontSize: 16,
  },
  lockNote: {
    color: '#6B7B86',
    fontSize: 13,
    lineHeight: 19,
  },
  celebrationOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#12314A',
    borderColor: '#F5B225',
    borderRadius: 28,
    borderWidth: 2,
    elevation: 12,
    gap: 6,
    maxWidth: 320,
    paddingHorizontal: 24,
    paddingVertical: 22,
    position: 'absolute',
    top: 112,
    width: '88%',
    zIndex: 20,
  },
  celebrationButton: {
    marginTop: 8,
    minHeight: 44,
    width: '100%',
  },
  celebrationReward: {
    color: '#FBEBC4',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  celebrationSubtitle: {
    color: '#ECE3CF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  celebrationTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
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
  modalButton: {
    flex: 1,
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
  modalText: {
    color: '#6B7B86',
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 49, 74, 0.26)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  progressFill: {
    backgroundColor: '#1E9E86',
    height: 12,
  },
  progressTrack: {
    backgroundColor: '#E7D5AC',
    borderRadius: 8,
    height: 12,
    overflow: 'hidden',
  },
  sparkle: {
    color: '#FBEBC4',
    fontSize: 24,
    fontWeight: '900',
  },
  sparkleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  star: {
    color: '#F5B225',
    fontSize: 40,
    fontWeight: '900',
  },
  title: {
    color: '#12314A',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  titleGroup: {
    flex: 1,
    gap: 8,
  },
});
