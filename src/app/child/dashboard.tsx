import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import {
  AppButton,
  AppCard,
  AppScreen,
  LevelHeroCard,
  RocketProgressBar,
  SectionTitle,
  StatusBadge,
  StreakWidget,
} from '@/shared/ui';
import { IconCoin } from '@/shared/ui/QuestIcons';
import { getRewardTitle, getTaskTitle, getWishTitle } from '@/shared/utils/content';
import { getFavoriteGoalForChild } from '@/shared/utils/favoriteGoals';
import { getMissionCountdown } from '@/shared/utils/growthMissions';
import { getChildLevelProgressFromXp, getChildProgress, getSkillRank } from '@/shared/utils/leveling';
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

const ChildDashboardScreen = () => {
  const { t } = useLanguage();
  const { activeChild, activeChildId, activeChildName } = useActiveChild();
  const { myInvestments, reload } = useGrowthMissions();
  const {
    hasHydrated,
    childProgress: storedChildProgress,
    childSkillUnlocks,
    favoriteGoals,
    pointTransactions,
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
        title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}
        subtitle={t('child.dashboard.subtitle')}>
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
  const dashboardGoal =
    favoriteReward
      ? {
          title: getRewardTitle(favoriteReward, t),
          price: favoriteReward.price,
          sectionTitle: t('child.dashboard.favoriteGoal'),
          typeLabel: t('common.rewards'),
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
  const activeInvestments = myInvestments.filter((inv) => !inv.claimedAt);
  const expectedPayout = activeInvestments.reduce((s, inv) => s + inv.payoutAmount, 0);
  const totalIncoming = potentialPoints + expectedPayout;

  const openRewardRequestIds = new Set(
    rewardRedemptions
      .filter(
        (r) =>
          r.childId === activeChildId &&
          (r.status === 'requested' || r.status === 'approved'),
      )
      .map((r) => r.rewardId),
  );
  const unlockedDailyRewards = rewards.filter(
    (reward) =>
      isDailyRewardAvailableToday(reward, activeChildId) &&
      !openRewardRequestIds.has(reward.id) &&
      getDailyRewardLockReason(reward, balance, tasks, taskSubmissions, activeChildId) === null,
  );

  return (
    <AppScreen
      title={t('child.dashboard.title', { name: activeChildName || t('common.child') })}
      subtitle={t('child.dashboard.subtitle')}>

      {/* ── Daily reward unlock banner ── */}
      {unlockedDailyRewards.length > 0 && (
        <Pressable
          onPress={() => router.push('/child/rewards')}
          style={({ pressed }) => [styles.dailyBanner, pressed && { opacity: 0.88 }]}>
          <Text style={styles.dailyBannerEmoji}>🎁</Text>
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
        onPress={() => router.push('/child/balance')}
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
            <Text style={styles.balanceLabel}>Мои баллы</Text>
            <View style={styles.balanceRow}>
              <IconCoin size={38} />
              <Text style={styles.balanceAmount}>{balance}</Text>
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
        levelLabel={t('child.level.levelShort', { level: levelProgress.level })}
        onLevelPress={() => router.push('/child/achievements' as never)}
        progress={levelProgress.progressPercent}
        rankLabel={hasLegendBadge ? t('child.level.legendStatus') : levelProgress.rank}
        skillLabel={t('child.level.skillPoints', { count: activeChildProgress.unspentSkillPoints })}
        xpLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxXpSummary', { total: levelProgress.totalXp })
            : `${levelProgress.currentLevelXp} / ${levelProgress.nextLevelXp} XP`
        }
      />

      <StreakWidget taskSubmissions={taskSubmissions} childId={activeChildId} />

      {dashboardGoal && (
        <AppCard>
          <SectionTitle
            title={dashboardGoal.sectionTitle}
            action={<StatusBadge label={dashboardGoal.typeLabel} />}
          />
          <Text style={styles.title}>{dashboardGoal.title}</Text>
          <Text style={styles.meta}>
            {t('child.dashboard.progressSummary', { balance, price: dashboardGoal.price })}
          </Text>
          <RocketProgressBar progress={progress} />
          <Text style={styles.meta}>{t('child.dashboard.progressPercent', { progress })}</Text>
        </AppCard>
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
    paddingHorizontal: 16,
    paddingVertical: 2,
    zIndex: 1,
  },
  balanceLeft: {
    gap: 2,
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  balanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  balanceAmount: {
    color: FP.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 40,
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
  dailyBannerEmoji: {
    fontSize: 30,
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
