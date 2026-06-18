import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Animated, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import {
  AppButton,
  AppBottomSheet,
  AppCard,
  AppScreen,
  BalancePill,
  LevelHeroCard,
  RocketProgressBar,
  SectionTitle,
  StatusBadge,
} from '@/shared/ui';
import { IconCoin, IconOpenToyChest } from '@/shared/ui/QuestIcons';
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
  const {
    hasHydrated,
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

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

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
        {/* Layer 1 — glows, clipped inside card, zIndex 0 */}
        <View style={[StyleSheet.absoluteFill, styles.balanceGlowLayer]} pointerEvents="none">
          <View style={styles.balanceGlow1} />
          <View style={styles.balanceGlow2} />
        </View>

        {/* Layer 2 — all content + mascot in ONE wrapper with zIndex 1
        Wrapping together forces them above the absolute glow layer on iOS */}
        <View style={styles.balanceContent}>
          <View style={styles.balanceLeft}>
            <View style={styles.balanceStreak}>
              <AnimatedStreakFire />
              <View style={styles.balanceStreakCopy}>
                <Text style={styles.balanceStreakKicker}>Серия дней</Text>
                <Text style={styles.balanceStreakText}>
                  {streakDays} {streakDays === 1 ? 'день' : streakDays > 1 && streakDays < 5 ? 'дня' : 'дней'} подряд
                </Text>
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

      <LevelHeroCard
        avatarColor={activeChild?.avatarColor}
        avatarLabel={activeChildName || t('common.child')}
        detailLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxed')
            : t('child.level.toLevel', { level: levelProgress.level + 1 })
        }
        levelLabel={t('child.level.levelShort', { level: levelProgress.level })}
        onLevelPress={() => router.push('/child/achievements' as never)}
        progress={levelProgress.progressPercent}
        showGlow
        rankLabel={hasLegendBadge ? t('child.level.legendStatus') : levelProgress.rank}
        skillLabel={t('child.level.skillPoints', { count: activeChildProgress.unspentSkillPoints })}
        xpLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxXpSummary', { total: levelProgress.totalXp })
            : `${levelProgress.currentLevelXp} / ${levelProgress.nextLevelXp} XP`
        }
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
            <View pointerEvents="none" style={styles.goalGlowCyan} />
            <View pointerEvents="none" style={styles.goalGlowLime} />
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

      <AppCard>
        <SectionTitle
          title={pendingDailyTasks.length > 0 ? t('child.tasks.todayTitle') : t('common.availableTasks')}
          action={
            totalTasksCount > 0
              ? <StatusBadge label={`${totalTasksCount} ${t('child.dashboard.openTasks')}`} tone="muted" />
              : undefined
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
              <View style={styles.taskPointsPill}>
                <IconCoin size={18} />
                <Text style={styles.taskPointsText}>+{task.points}</Text>
              </View>
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
    color: FP.white,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
  },
  headerBalanceAction: {
    borderRadius: 999,
  },
  // ── Balance card ──
  balanceCard: {
    backgroundColor: '#2A1068',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'visible',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#1A0840', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.30, shadowRadius: 22 },
      android: { elevation: 7 },
      web: { boxShadow: '0 10px 28px rgba(26,8,64,0.30)' },
    }) as ViewStyle,
  },
  // ── Balance glow ──
  balanceGlowLayer: {
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 0,
  },
  balanceGlow1: {
    backgroundColor: 'rgba(140, 60, 255, 0.55)',
    borderRadius: 999,
    height: 180,
    position: 'absolute',
    right: 10,
    top: -60,
    width: 180,
    ...Platform.select({
      web: { filter: 'blur(40px)' },
    }) as ViewStyle,
  },
  balanceGlow2: {
    backgroundColor: 'rgba(60, 120, 255, 0.35)',
    borderRadius: 999,
    bottom: -50,
    height: 130,
    left: 40,
    position: 'absolute',
    width: 130,
    ...Platform.select({
      web: { filter: 'blur(32px)' },
    }) as ViewStyle,
  },
  // ── Balance content (text + mascot) above glow layer ──
  balanceContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    position: 'relative',
    zIndex: 1,
  },
  balanceLeft: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  balancePending: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 99,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  balancePendingText: {
    color: FP.lime,
    fontSize: 11,
    fontWeight: '800',
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
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  balanceStreakText: {
    color: FP.white,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 23,
  },
  balanceStreakSub: {
    color: 'rgba(255,255,255,0.70)',
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
    color: FP.text,
    fontSize: 20,
    fontWeight: '900',
  },
  goalActionButton: {
    marginTop: 4,
  },
  goalBadge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  goalBadgeText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 11,
    fontWeight: '900',
  },
  goalCard: {
    backgroundColor: FP.primary,
    borderColor: 'rgba(191,215,245,0.26)',
    borderRadius: 22,
    gap: 3,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 8,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: FP.primary, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.20, shadowRadius: 28 },
      android: { elevation: 6 },
      web: { boxShadow: '0 14px 32px rgba(22,71,183,0.22)' },
    }) as ViewStyle,
  },
  goalCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  goalGlowCyan: {
    backgroundColor: 'rgba(16,199,232,0.18)',
    borderRadius: 180,
    height: 260,
    position: 'absolute',
    right: -122,
    top: -102,
    width: 260,
  },
  goalGlowLime: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 92,
    height: 112,
    position: 'absolute',
    right: -12,
    top: -52,
    width: 112,
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
    color: FP.white,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
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
    color: FP.white,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
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
    color: FP.primaryDark,
    fontSize: 15,
    fontWeight: '900',
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
    color: '#7A8CA0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    color: '#10233F',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 27,
  },
  // ── Daily reward banner ──────────────────────────────────────────────────────
  dailyBanner: {
    alignItems: 'center',
    backgroundColor: '#FFF7E0',
    borderColor: FP.accent,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    ...(Platform.select({
      ios: { shadowColor: FP.accentDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14 },
      android: { elevation: 3 },
      web: { boxShadow: '0 6px 16px rgba(200,140,0,0.18)' },
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
    color: FP.accentDark,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  dailyBannerSub: {
    color: '#8B6200',
    fontSize: 13,
    fontWeight: '600',
  },
  dailyBannerChevron: {
    alignItems: 'center',
    backgroundColor: FP.accent,
    borderRadius: 99,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dailyBannerChevronText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
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
    paddingVertical: 8,
  },
  taskRowBorder: {
    borderTopColor: FP.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  taskRowPressed: {
    opacity: 0.55,
  },
  taskIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  taskTitle: {
    color: FP.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  taskPointsPill: {
    alignItems: 'center',
    backgroundColor: '#FFF7D7',
    borderColor: '#F4D06F',
    borderWidth: 1,
    borderRadius: 99,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 5,
    minWidth: 58,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  taskPointsText: {
    color: FP.accentText,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
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
    color: FP.lime,
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
    color: FP.lime,
    fontSize: 15,
    fontWeight: '800',
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
    color: FP.white,
    fontSize: 18,
    fontWeight: '900',
  },
});
