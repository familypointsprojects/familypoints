import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Animated, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FP, gameText } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import {
  AppButton,
  AppBottomSheet,
  AppCard,
  AppScreen,
  AvatarPickerModal,
  BalancePill,
  QuestLevelCard,
  RocketProgressBar,
  SectionTitle,
} from '@/shared/ui';
import { IconOpenToyChest } from '@/shared/ui/QuestIcons';
import { StreakBurstBackground } from '@/shared/ui/StreakBurstBackground';
import { OutlineText } from '@/shared/ui/OutlineText';
import { getRewardTitle, getTaskTitle, getWishTitle } from '@/shared/utils/content';
import { getFavoriteGoalForChild } from '@/shared/utils/favoriteGoals';
import { getMissionCountdown } from '@/shared/utils/growthMissions';
import {
  getChildLevelProgressFromXp,
  getChildProgress,
  getSkillRank,
  getTaskStreakDays,
  STREAK_REWARD_BONUS_MIN_DAYS,
  STREAK_REWARD_BONUS_POINTS,
} from '@/shared/utils/leveling';
import { getBalance, getNearestWish, getPotentialPoints, getProgressPercent } from '@/shared/utils/points';
import { getDailyRewardLockReason, isDailyRewardAvailableToday, isRewardAvailableForChild } from '@/shared/utils/rewards';
import {
  getAvailableTasksForChild,
  getDailyTasksForToday,
  getTotalAvailableTasksCount,
  hasSubmittedDailyTaskToday,
} from '@/shared/utils/tasks';
import { getVisibleWishes } from '@/shared/utils/wishes';

// ─── Mini task icon palettes ──────────────────────────────────────────────────
const MINI_PALETTES = [
  { bg: '#E5EFFF', fg: FP.primary },
  { bg: '#FFE9DC', fg: FP.orange },
  { bg: FP.mintLight, fg: '#15786A' },
  { bg: '#EDE9FF', fg: '#5040C4' },
  { bg: FP.cyanLight, fg: '#0B6F8A' },
] as const;

const MiniIconStar = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 32 32">
    <Path d="M16 4l3 9 9 3-9 3-3 11-3-11-9-3 9-3z" fill={color} />
  </Svg>
);
const MiniIconBolt = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 32 32">
    <Path d="M18 4L10 18h8l-4 10 12-14h-8z" fill={color} />
  </Svg>
);
const MiniIconBook = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 32 32">
    <Path d="M9 6h12a4 4 0 014 4v16H11a4 4 0 01-4-4V8a2 2 0 012-2z" fill={color} />
  </Svg>
);
const MiniIconLeaf = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 32 32">
    <Path d="M16 16c-6-1-9-5-8-10 6 0 9 4 8 10z" fill={color} />
    <Path d="M17 18c6-2 9-6 7-11-6 1-8 5-7 11z" fill={color} opacity={0.6} />
  </Svg>
);
const MINI_ICONS = [MiniIconStar, MiniIconBolt, MiniIconBook, MiniIconLeaf, MiniIconStar] as const;

const FIRE_OUTLINE_COLOR = '#07151A';

const AnimatedStreakFire = () => {
  const flicker = useRef(new Animated.Value(0)).current;
  const core = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 560, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
    );
    const coreLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(core, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(core, { toValue: 0, duration: 540, useNativeDriver: true }),
      ]),
    );

    flickerLoop.start();
    coreLoop.start();
    return () => {
      flickerLoop.stop();
      coreLoop.stop();
    };
  }, [core, flicker]);

  const flameScaleX = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });
  const flameScaleY = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const flameRotate = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '3deg'],
  });
  const yellowTranslateY = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });
  const yellowRotate = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: ['1deg', '-3deg'],
  });
  const coreScaleX = core.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });
  const coreScaleY = core.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const coreRotate = core.interpolate({
    inputRange: [0, 1],
    outputRange: ['1deg', '-3deg'],
  });
  return (
    <View style={styles.balanceFireBox}>
      <Animated.View
        style={[
          styles.balanceFireLayer,
          {
            transform: [{ rotate: flameRotate }, { scaleX: flameScaleX }, { scaleY: flameScaleY }],
          },
        ]}>
        <Svg width="100%" height="100%" viewBox="0 0 160 160">
          <Path
            d="M79 151C47 151 23 131 23 105C23 82 38 69 58 54C74 42 81 26 89 9C109 34 116 54 112 72C119 62 124 51 127 39C142 64 149 84 149 107C149 134 127 151 95 151Z"
            fill="#FF9F38"
            stroke={FIRE_OUTLINE_COLOR}
            strokeLinejoin="round"
            strokeWidth={7}
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.balanceFireLayer,
          {
            transform: [{ translateY: yellowTranslateY }, { rotate: yellowRotate }],
          },
        ]}>
        <Svg width="100%" height="100%" viewBox="0 0 160 160">
          <Path
            d="M80 146C58 146 45 133 45 115C45 101 53 91 65 80C74 71 79 59 81 47C95 63 101 79 98 94C105 86 109 78 111 70C122 85 127 99 127 115C127 134 112 146 80 146Z"
            fill="#FFD35A"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.balanceFireLayer,
          {
            transform: [{ rotate: coreRotate }, { scaleX: coreScaleX }, { scaleY: coreScaleY }],
          },
        ]}>
        <Svg width="100%" height="100%" viewBox="0 0 160 160">
          <Path
            d="M91 147C73 147 61 136 61 121C61 107 69 96 81 82C91 96 103 108 107 122C112 136 103 147 91 147Z"
            fill="#A83AFF"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const ChildDashboardScreen = () => {
  const { t } = useLanguage();
  const { activeChild, activeChildId, activeChildName } = useActiveChild();
  const { myInvestments, reload } = useGrowthMissions();
  const [isStreakInfoVisible, setIsStreakInfoVisible] = useState(false);
  const [isAvatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const {
    hasHydrated,
    updateChildAvatar,
    childProgress: storedChildProgress,
    childSkillUnlocks,
    favoriteGoals,
    pointTransactions,
    redeemReward,
    rewardRedemptions,
    rewards,
    taskSubmissions,
    tasks,
    wishes,
  } = useFamilyPoints();

  const avatarId = activeChild?.avatarId;
  const mustChooseAvatar = hasHydrated && !!activeChildId && !avatarId;

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Heavy derived state — memoized so the additional re-renders triggered by
  // Growth Missions hydration / realtime updates don't recompute every
  // aggregate on each render. Recomputes only when underlying data changes.
  const derived = useMemo(() => {
    const balance = getBalance(pointTransactions, activeChildId);
    const potentialPoints = getPotentialPoints(tasks, taskSubmissions, activeChildId);
    const activeChildProgress = getChildProgress(
      { childProgress: storedChildProgress, childSkillUnlocks, tasks, taskSubmissions },
      activeChildId,
    );
    const levelProgress = getChildLevelProgressFromXp(activeChildProgress.xp);
    const streakDays = getTaskStreakDays(taskSubmissions, activeChildId);
    const streakBonusUnlocked = streakDays >= STREAK_REWARD_BONUS_MIN_DAYS;
    const streakBonusDaysLeft = Math.max(STREAK_REWARD_BONUS_MIN_DAYS - streakDays, 0);
    const streakBonusText = streakBonusUnlocked
      ? `Бонус активен: +${STREAK_REWARD_BONUS_POINTS} бал. за каждый квест`
      : `Еще ${streakBonusDaysLeft} ${streakBonusDaysLeft === 1 ? 'день' : streakBonusDaysLeft > 1 && streakBonusDaysLeft < 5 ? 'дня' : 'дней'} до бонуса +${STREAK_REWARD_BONUS_POINTS}`;
    const hasLegendBadge = getSkillRank(childSkillUnlocks, activeChildId, 'legend_badge') > 0;
    const visibleWishes = getVisibleWishes(wishes, rewards, rewardRedemptions);
    const nearestWish = getNearestWish(visibleWishes, balance);
    const favoriteGoal = getFavoriteGoalForChild(favoriteGoals, activeChildId);
    const favoriteReward =
      favoriteGoal?.type === 'reward'
        ? rewards.find((reward) =>
            reward.id === favoriteGoal.itemId &&
            reward.isActive !== false &&
            isRewardAvailableForChild(reward, activeChildId),
          )
        : undefined;
    const favoriteWish =
      favoriteGoal?.type === 'wish'
        ? visibleWishes.find(
            (wish) => wish.id === favoriteGoal.itemId && (wish.status ?? 'pending') === 'approved',
          )
        : undefined;
    const openRewardRequestIds = new Set(
      rewardRedemptions
        .filter(
          (r) =>
            r.childId === activeChildId &&
            (r.status === 'requested' || r.status === 'approved'),
        )
        .map((r) => r.rewardId),
    );
    const dashboardGoal =
      favoriteReward
        ? {
            title: getRewardTitle(favoriteReward, t),
            price: favoriteReward.price,
            sectionTitle: t('child.dashboard.favoriteGoal'),
            typeLabel: t('common.rewards'),
            rewardId: favoriteReward.id,
            hasOpenRequest: openRewardRequestIds.has(favoriteReward.id),
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
    const totalTasksWord =
      totalTasksCount % 10 === 1 && totalTasksCount % 100 !== 11
        ? 'квест'
        : [2, 3, 4].includes(totalTasksCount % 10) && ![12, 13, 14].includes(totalTasksCount % 100)
          ? 'квеста'
          : 'квестов';
    const pendingDailyTasks = getDailyTasksForToday(tasks, activeChildId).filter(
      (task) => !hasSubmittedDailyTaskToday(taskSubmissions, task.id, activeChildId),
    );
    const dashboardTasks = (pendingDailyTasks.length > 0 ? pendingDailyTasks : activeTasks).slice(0, 3);
    const progress = dashboardGoal ? getProgressPercent(balance, dashboardGoal.price) : 0;
    const isDashboardGoalReady = Boolean(dashboardGoal && progress >= 100);
    const activeInvestments = myInvestments.filter((inv) => !inv.claimedAt);
    const expectedPayout = activeInvestments.reduce((s, inv) => s + inv.payoutAmount, 0);
    const totalIncoming = potentialPoints + expectedPayout;

    const unlockedDailyRewards = rewards.filter(
      (reward) =>
        isDailyRewardAvailableToday(reward, activeChildId) &&
        !openRewardRequestIds.has(reward.id) &&
        getDailyRewardLockReason(reward, balance, tasks, taskSubmissions, activeChildId) === null,
    );

    return {
      balance, potentialPoints, activeChildProgress, levelProgress, streakDays,
      streakBonusUnlocked, streakBonusDaysLeft, streakBonusText, hasLegendBadge,
      visibleWishes, nearestWish, favoriteGoal, favoriteReward, favoriteWish,
      openRewardRequestIds, dashboardGoal, activeTasks, totalTasksCount,
      totalTasksWord, pendingDailyTasks, dashboardTasks, progress,
      isDashboardGoalReady, activeInvestments, expectedPayout, totalIncoming,
      unlockedDailyRewards,
    };
  }, [
    pointTransactions, activeChildId, tasks, taskSubmissions, storedChildProgress,
    childSkillUnlocks, wishes, rewards, rewardRedemptions, favoriteGoals,
    myInvestments, t,
  ]);

  if (!hasHydrated) {
    return (
      <AppScreen
        title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}>
        <AppCard>
          <Text style={styles.meta}>{t('common.loading')}</Text>
        </AppCard>
      </AppScreen>
    );
  }

  const {
    balance, potentialPoints, activeChildProgress, levelProgress, streakDays,
    streakBonusUnlocked, streakBonusDaysLeft, streakBonusText, hasLegendBadge,
    dashboardGoal, totalTasksCount, totalTasksWord, pendingDailyTasks,
    dashboardTasks, progress, isDashboardGoalReady, unlockedDailyRewards,
  } = derived;

  return (
    <AppScreen
      headerRight={
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/child/balance')}
          style={({ pressed }) => [styles.headerBalanceAction, pressed && { opacity: 0.88 }]}>
          <BalancePill points={balance} />
        </Pressable>
      }
      title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}>

      {/* ── Daily reward unlock banner ── */}
      {unlockedDailyRewards.length > 0 && (
        <Pressable
          onPress={() => router.push('/child/rewards')}
          style={({ pressed }) => [styles.dailyBanner, pressed && { opacity: 0.88 }]}>
          <View style={styles.dailyBannerIcon}>
            <IconOpenToyChest size={52} />
          </View>
          <View style={styles.dailyBannerText}>
            <Text style={styles.dailyBannerTitle}>{t('child.dashboard.dailyRewardReady')}</Text>
            <Text style={styles.dailyBannerSub}>
              {unlockedDailyRewards.length === 1
                ? unlockedDailyRewards[0].title || t('child.rewards.dailyTitle')
                : t('child.dashboard.dailyRewardCount', { count: String(unlockedDailyRewards.length) })}
            </Text>
          </View>
          <View style={styles.dailyBannerChevron}>
            <Text style={styles.dailyBannerChevronText}>›</Text>
          </View>
        </Pressable>
      )}

      {/* ── Balance card ── */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsStreakInfoVisible(true)}
        style={({ pressed }) => [styles.balanceCard, pressed && { opacity: 0.88 }]}>
        <View pointerEvents="none" style={styles.balanceBurst}>
          <StreakBurstBackground radius={1} />
        </View>
        <View pointerEvents="none" style={styles.balanceHighlight} />
        <View pointerEvents="none" style={styles.balanceBottomBevel} />

        <View style={styles.balanceContent}>
          <View style={styles.balanceLeft}>
            <View style={styles.balanceStreak}>
              <AnimatedStreakFire />
              <View style={styles.balanceStreakCopy}>
                <OutlineText style={styles.balanceStreakKicker}>Серия дней</OutlineText>
                <OutlineText style={styles.balanceStreakText}>
                  {streakDays} {streakDays === 1 ? 'день' : streakDays > 1 && streakDays < 5 ? 'дня' : 'дней'} подряд
                </OutlineText>
                <Text style={styles.balanceStreakSub}>{streakBonusText}</Text>
              </View>
            </View>
            {potentialPoints > 0 && (
              <View style={styles.balancePending}>
                <Text style={styles.balancePendingText}>+{potentialPoints} на проверке ⏳</Text>
              </View>
            )}
          </View>

          <Image
            source={require('@/assets/images/pirate-variants/flat-pirate-17-coin-rain.png')}
            style={styles.balanceMascot}
            contentFit="contain"
            pointerEvents="none"
          />
        </View>
      </Pressable>

      <QuestLevelCard
        avatarId={avatarId}
        rankLabel={hasLegendBadge ? t('child.level.legendStatus') : levelProgress.rank}
        levelValue={levelProgress.level}
        progress={levelProgress.progressPercent}
        detailLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxed')
            : `${t('child.level.toLevel', { level: levelProgress.level + 1 })} · ${t('child.level.skillPoints', {
                count: activeChildProgress.unspentSkillPoints,
              })}`
        }
        onPress={() => router.push('/child/achievements' as never)}
        xpLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxXpSummary', { total: levelProgress.totalXp })
            : `${levelProgress.currentLevelXp} / ${levelProgress.nextLevelXp} XP`
        }
      />

      <AvatarPickerModal
        visible={mustChooseAvatar || isAvatarPickerVisible}
        mandatory={mustChooseAvatar}
        currentId={avatarId}
        title={mustChooseAvatar ? 'Выбери свой аватар' : 'Сменить аватар'}
        subtitle={mustChooseAvatar ? 'Он появится на твоей карточке уровня' : undefined}
        onConfirm={(id) => {
          if (activeChildId) {
            updateChildAvatar({ childId: activeChildId, avatarId: id });
          }
        }}
        onClose={() => setAvatarPickerVisible(false)}
      />

      {dashboardGoal && (
        <Pressable
          accessibilityRole={dashboardGoal.rewardId ? 'button' : undefined}
          disabled={!dashboardGoal.rewardId}
          onPress={() => {
            if (!dashboardGoal.rewardId) {
              return;
            }

            router.push({
              pathname: '/child/rewards',
              params: {
                rewardId: dashboardGoal.rewardId,
                scrollToReward: String(Date.now()),
              },
            });
          }}
          style={({ pressed }) => [dashboardGoal.rewardId && pressed && styles.goalCardPressed]}>
          <AppCard style={styles.goalCard}>
            <View pointerEvents="none" style={styles.goalHighlight} />
            <View pointerEvents="none" style={styles.goalBottomBevel} />
            <View style={styles.goalHeader}>
              <Text style={styles.goalKicker}>{dashboardGoal.sectionTitle}</Text>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>{dashboardGoal.typeLabel}</Text>
              </View>
            </View>
            <Text style={styles.goalTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {dashboardGoal.title}
            </Text>
            <Text style={styles.goalMeta}>
              {t('child.dashboard.progressSummary', { balance, price: dashboardGoal.price })}
            </Text>
            <RocketProgressBar
              compact
              progress={progress}
              showGlow={!isDashboardGoalReady}
              showRunner={!isDashboardGoalReady}
            />
            {isDashboardGoalReady && dashboardGoal.rewardId && (
              <AppButton
                title={
                  dashboardGoal.hasOpenRequest
                    ? t('common.waitingForApproval')
                    : t('common.redeem')
                }
                onPress={() => redeemReward(dashboardGoal.rewardId)}
                disabled={dashboardGoal.hasOpenRequest}
                style={styles.goalActionButton}
                variant={dashboardGoal.hasOpenRequest ? 'secondary' : 'primary'}
              />
            )}
          </AppCard>
        </Pressable>
      )}

      <AppCard style={styles.dashboardTaskPanel}>
        <View pointerEvents="none" style={styles.dashboardPanelHighlight} />
        <View pointerEvents="none" style={styles.dashboardPanelBottom} />
        <SectionTitle
          title={pendingDailyTasks.length > 0 ? t('child.tasks.todayTitle') : t('common.availableTasks')}
          action={
            totalTasksCount > 0 ? (
              <View style={styles.questCountBadge}>
                <View pointerEvents="none" style={styles.questCountHighlight} />
                <View style={styles.questCountInner}>
                  <OutlineText style={styles.questCountText} outlineWidth={1.5} bottomDepth={2}>
                    {`${totalTasksCount} ${totalTasksWord}`}
                  </OutlineText>
                </View>
              </View>
            ) : undefined
          }
        />
        {dashboardTasks.map((task, i) => {
          const palette = MINI_PALETTES[i % MINI_PALETTES.length];
          const Icon = MINI_ICONS[i % MINI_ICONS.length];
          return (
            <Pressable
              key={task.id}
              onPress={() => router.push('/child/tasks')}
              style={({ pressed }) => [
                styles.taskRow,
                i > 0 && styles.taskRowBorder,
                pressed && styles.taskRowPressed,
              ]}>
              <View style={[styles.taskIconBox, { backgroundColor: palette.bg }]}>
                <Icon color={palette.fg} />
              </View>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {getTaskTitle(task, t)}
              </Text>
              <BalancePill compact points={task.points} />
            </Pressable>
          );
        })}
      </AppCard>

      <Pressable
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.settingsLink, pressed && styles.settingsLinkPressed]}>
        <Text style={styles.settingsLinkText}>⚙ {t('common.settings')}</Text>
      </Pressable>

      <AppBottomSheet
        contentStyle={styles.modalCard}
        onClose={() => setIsStreakInfoVisible(false)}
        visible={isStreakInfoVisible}>
        <View style={styles.modalHero}>
          <AnimatedStreakFire />
          <View style={styles.modalHeroCopy}>
            <Text style={styles.modalKicker}>Серия дней</Text>
            <Text style={styles.modalTitle}>
              {streakDays} {streakDays === 1 ? 'день' : streakDays > 1 && streakDays < 5 ? 'дня' : 'дней'} подряд
            </Text>
          </View>
        </View>
        <Text style={styles.modalText}>
          Серия растёт, когда за день есть хотя бы один одобренный квест.
        </Text>
        <View style={styles.modalRules}>
          <Text style={styles.modalRule}>• Одобрили квест сегодня — серия продолжается.</Text>
          <Text style={styles.modalRule}>• Если сегодня ещё нет квеста, вчерашняя серия пока сохраняется.</Text>
          <Text style={styles.modalRule}>• Пропустил день без одобренных квестов — серия начнётся заново.</Text>
          <Text style={styles.modalRule}>
            • С {STREAK_REWARD_BONUS_MIN_DAYS} дней включается бонус: +{STREAK_REWARD_BONUS_POINTS} бал. за каждый квест.
          </Text>
        </View>
        <View style={styles.modalBonusBox}>
          <Text style={styles.modalBonusTitle}>
            {streakBonusUnlocked ? 'Бонус уже активен' : `До бонуса: ${streakBonusDaysLeft}`}
          </Text>
          <Text style={styles.modalBonusText}>{streakBonusText}</Text>
        </View>
        <AppButton
          title="Понятно"
          onPress={() => setIsStreakInfoVisible(false)}
          style={styles.modalButton}
        />
      </AppBottomSheet>

    </AppScreen>
  );
};

export default ChildDashboardScreen;

const styles = StyleSheet.create({
  balance: {
    ...gameText,
    color: FP.white,
    fontSize: 46,
    lineHeight: 52,
  },
  headerBalanceAction: {
    borderRadius: 999,
  },
  // ── Balance card ──
  balanceCard: {
    backgroundColor: '#13B7EF',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    overflow: 'visible',
    position: 'relative',
    transform: [{ skewX: '-3deg' }],
    ...Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.32, shadowRadius: 0 },
      android: { elevation: 7 },
      web: { boxShadow: '4px 4px 0 #061426' },
    }) as ViewStyle,
  },
  balanceBurst: {
    borderRadius: 1,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  balanceHighlight: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    height: 3,
    left: 14,
    position: 'absolute',
    right: 96,
    top: 8,
    zIndex: 0,
  },
  balanceBottomBevel: {
    backgroundColor: 'rgba(58,18,6,0.5)',
    bottom: 0,
    height: 7,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 0,
  },
  // ── Balance content (text + mascot) ──
  balanceContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    position: 'relative',
    transform: [{ skewX: '3deg' }],
    zIndex: 1,
  },
  balanceLeft: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  balanceLabel: {
    ...gameText,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
  },
  balancePending: {
    alignSelf: 'flex-start',
    backgroundColor: '#29334F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  balancePendingText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 11,
  },
  balanceStreak: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    maxWidth: 260,
  },
  balanceStreakCopy: {
    flex: 1,
    minWidth: 0,
  },
  balanceFireBox: {
    height: 42,
    marginRight: 1,
    position: 'relative',
    width: 42,
  },
  balanceFireLayer: {
    bottom: -2,
    height: 44,
    left: -2,
    position: 'absolute',
    width: 44,
  },
  balanceStreakKicker: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 11,
  },
  balanceStreakText: {
    ...gameText,
    color: FP.white,
    fontSize: 20,
    lineHeight: 23,
  },
  balanceStreakSub: {
    color: '#EAF7FF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 2,
  },
  balanceMascot: {
    height: 162,
    marginBottom: -16,
    marginRight: -14,
    marginTop: -54,
    width: 162,
  },
  title: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 20,
  },
  goalActionButton: {
    marginTop: 4,
  },
  goalBadge: {
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  goalBadgeText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 11,
  },
  goalCard: {
    backgroundColor: '#30364F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    gap: 3,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 8,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.30, shadowRadius: 0 },
      android: { elevation: 6 },
      web: { boxShadow: '4px 4px 0 #061426' },
    }) as ViewStyle,
  },
  goalCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  goalHighlight: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    height: 3,
    left: 12,
    position: 'absolute',
    right: 74,
    top: 7,
    zIndex: 0,
  },
  goalBottomBevel: {
    backgroundColor: '#0A2854',
    bottom: 0,
    height: 8,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 0,
  },
  goalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  goalKicker: {
    ...gameText,
    color: FP.white,
    flex: 1,
    fontSize: 14,
  },
  goalMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    position: 'relative',
    zIndex: 1,
  },
  goalTitle: {
    ...gameText,
    color: FP.white,
    fontSize: 21,
    lineHeight: 24,
    position: 'relative',
    zIndex: 1,
  },
  modalBonusBox: {
    backgroundColor: '#F6F9FF',
    borderColor: '#DFE9FA',
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
    padding: 12,
  },
  modalBonusText: {
    color: '#5E7182',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  modalBonusTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 15,
  },
  modalButton: {
    marginTop: 2,
  },
  modalCard: {
    gap: 13,
  },
  modalHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  modalHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  modalKicker: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
  },
  modalRule: {
    color: '#4B6072',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  modalRules: {
    gap: 7,
  },
  modalText: {
    color: '#5E7182',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  modalTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 27,
  },
  // ── Daily reward banner ──────────────────────────────────────────────────────
  dailyBanner: {
    alignItems: 'center',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    padding: 14,
    ...(Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.30, shadowRadius: 0 },
      android: { elevation: 3 },
      web: { boxShadow: '4px 4px 0 #061426, inset 0 3px 0 #FFC928' },
    }) as ViewStyle),
  },
  dailyBannerIcon: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 48,
  },
  dailyBannerText: {
    flex: 1,
    gap: 2,
  },
  dailyBannerTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 15,
  },
  dailyBannerSub: {
    color: '#5B3300',
    fontSize: 13,
    fontWeight: '600',
  },
  dailyBannerChevron: {
    alignItems: 'center',
    backgroundColor: '#F36B1D',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dailyBannerChevronText: {
    ...gameText,
    color: '#fff',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  // ─────────────────────────────────────────────────────────────────────────────
  meta: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 20,
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    position: 'relative',
    paddingVertical: 8,
    zIndex: 1,
  },
  taskRowBorder: {
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderTopWidth: 2,
  },
  taskRowPressed: {
    opacity: 0.55,
  },
  taskIconBox: {
    alignItems: 'center',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  taskTitle: {
    ...gameText,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
  },
  questCountBadge: {
    backgroundColor: '#17222F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 5,
    transform: [{ skewX: '-8deg' }],
  },
  questCountHighlight: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    height: 2,
    left: 7,
    position: 'absolute',
    right: 7,
    top: 3,
  },
  questCountInner: {
    transform: [{ skewX: '8deg' }],
  },
  questCountText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  dashboardTaskPanel: {
    backgroundColor: '#29334F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.30, shadowRadius: 0 },
      android: { elevation: 4 },
      web: { boxShadow: '4px 4px 0 #061426' },
    }) as ViewStyle,
  },
  dashboardPanelHighlight: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    height: 3,
    left: 14,
    position: 'absolute',
    right: 80,
    top: 7,
    zIndex: 0,
  },
  dashboardPanelBottom: {
    backgroundColor: '#061426',
    bottom: 0,
    height: 7,
    left: 0,
    opacity: 0.45,
    position: 'absolute',
    right: 0,
    zIndex: 0,
  },
  settingsLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingsLinkPressed: {
    opacity: 0.5,
  },
  settingsLinkText: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '700',
  },
  incomingBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  incomingTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
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
    color: FP.white,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  incomingMeta: {
    color: '#DDEBFF',
    fontSize: 12,
  },
  incomingAmount: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 15,
  },
  incomingAmountReady: {
    color: FP.mint,
  },
  incomingTotal: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 2,
  },
  incomingTotalLabel: {
    color: '#DDEBFF',
    fontSize: 13,
    fontWeight: '700',
  },
  incomingTotalValue: {
    ...gameText,
    color: FP.white,
    fontSize: 18,
  },
});
