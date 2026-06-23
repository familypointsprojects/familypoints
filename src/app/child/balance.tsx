import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Polygon, Polyline, Rect } from 'react-native-svg';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { gameText } from '@/constants/theme';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { Reward } from '@/shared/types/family';
import { AppScreen } from '@/shared/ui';
import { IconChest, IconCoin } from '@/shared/ui/QuestIcons';
import { getRewardTitle, getTransactionTitle } from '@/shared/utils/content';
import { getBalance } from '@/shared/utils/points';
import { isRewardAvailableForChild } from '@/shared/utils/rewards';

const NEXT_REWARD_TARGET = 200;
const IMG_PIGGY_MASCOT = require('@/assets/images/piggy-bank-mascot.png');

const HISTORY_ACCENTS = [
  { body: '#29334F', tab: '#35D638', icon: '#35D638', fg: '#063522' },
  { body: '#30364F', tab: '#FFC400', icon: '#FFC400', fg: '#5B3300' },
  { body: '#29334F', tab: '#C229E8', icon: '#C229E8', fg: '#FFFFFF' },
  { body: '#30364F', tab: '#19B8F2', icon: '#19B8F2', fg: '#061426' },
] as const;

const SHOP_ACCENTS = [
  { header: '#F36B1D', body: '#13B7EF', icon: '#FFC400', fg: '#041426', bottom: '#0D79B6' },
  { header: '#C229E8', body: '#30364F', icon: '#19B8F2', fg: '#FFFFFF', bottom: '#24293F' },
] as const;

const PlateShape = ({
  fill,
  points,
  stroke = '#061426',
  topLine,
}: {
  fill: string;
  points: string;
  stroke?: string;
  topLine?: string;
}) => (
  <Svg pointerEvents="none" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 100 100">
    <Polygon fill={fill} points={points} stroke={stroke} strokeLinejoin="round" strokeWidth={5} />
    {topLine && <Polyline fill="none" points={topLine} stroke="rgba(255,255,255,0.32)" strokeLinecap="round" strokeWidth={3} />}
  </Svg>
);

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatRelativeDate = (
  dateValue: string,
  locale: string,
  t: (key: TranslationKey) => string,
): string => {
  const date = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (formatDateKey(date) === formatDateKey(today)) {
    return t('child.balance.today');
  }

  if (formatDateKey(date) === formatDateKey(yesterday)) {
    return t('child.balance.yesterday');
  }

  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
};

const MedalIcon = () => (
  <View style={styles.medalOuter}>
    <View style={styles.medalInner}>
      <IconCoin size={54} />
    </View>
  </View>
);

const SectionHeader = ({ icon, title }: { icon: 'history' | 'shop'; title: string }) => (
  <View style={styles.sectionRow}>
    <View style={[styles.sectionIcon, icon === 'shop' && styles.sectionIconShop]}>
      {icon === 'history' ? (
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path
            d="M7 6h10M7 12h10M7 18h6"
            fill="none"
            stroke="#041426"
            strokeLinecap="round"
            strokeWidth={3}
          />
        </Svg>
      ) : (
        <IconChest size={19} />
      )}
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressTrack}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
    <View pointerEvents="none" style={styles.progressShine} />
  </View>
);

const HistoryIcon = ({ index }: { index: number }) => {
  const accent = HISTORY_ACCENTS[index % HISTORY_ACCENTS.length];

  return (
    <View style={[styles.historyIcon, { backgroundColor: accent.icon, borderColor: '#061426' }]}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M12 3l2.4 5.2 5.6.7-4.1 3.8 1.1 5.5L12 15.5 7 18.2l1.1-5.5L4 8.9l5.6-.7z"
          fill="#061426"
          stroke={accent.fg}
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
};

const ShopIcon = ({ reward, index }: { index: number; reward: Reward }) => {
  const accent = SHOP_ACCENTS[index % SHOP_ACCENTS.length];
  const isScreenTime = reward.type === 'screen_time';

  return (
    <View style={[styles.shopIconBox, { backgroundColor: accent.icon, borderColor: '#061426' }]}>
      {isScreenTime ? (
        <Svg width={34} height={34} viewBox="0 0 48 48">
          <Rect x={8} y={12} width={32} height={21} rx={5} fill="#FFFFFF" stroke={accent.fg} strokeWidth={3} />
          <Path d="M19 39h10M24 33v6" stroke={accent.fg} strokeLinecap="round" strokeWidth={3} />
          <Circle cx={18} cy={22} r={2.5} fill="#061426" />
          <Circle cx={26} cy={22} r={2.5} fill="#061426" />
          <Path d="M18 27c3 3 9 3 12 0" fill="none" stroke={accent.fg} strokeLinecap="round" strokeWidth={2.5} />
        </Svg>
      ) : (
        <Svg width={34} height={34} viewBox="0 0 48 48">
          <Path
            d="M13 20h22l-3 19H16z"
            fill="#FFFFFF"
            stroke={accent.fg}
            strokeLinejoin="round"
            strokeWidth={3}
          />
          <Path d="M16 20c1-7 15-7 16 0" fill="none" stroke={accent.fg} strokeLinecap="round" strokeWidth={3} />
          <Path d="M18 27h12" stroke="#061426" strokeLinecap="round" strokeWidth={3} />
        </Svg>
      )}
    </View>
  );
};

const ChildBalanceScreen = () => {
  const { language, t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { pointTransactions, rewards, rewardRedemptions } = useFamilyPoints();
  const locale = language === 'ru' ? 'ru' : 'en';
  const balance = getBalance(pointTransactions, activeChildId);
  const progress = Math.min(Math.round((balance / NEXT_REWARD_TARGET) * 100), 100);
  const nextRewardRemaining = Math.max(NEXT_REWARD_TARGET - balance, 0);
  const childTransactions = pointTransactions
    .filter((transaction) => transaction.childId === activeChildId && transaction.points > 0)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const openRequestIds = new Set(
    rewardRedemptions
      .filter((redemption) =>
        redemption.childId === activeChildId &&
        (redemption.status === 'requested' || redemption.status === 'approved'))
      .map((redemption) => redemption.rewardId),
  );
  const spendSuggestions = rewards
    .filter((reward) =>
      reward.isActive !== false &&
      isRewardAvailableForChild(reward, activeChildId) &&
      !openRequestIds.has(reward.id))
    .slice(0, 2);

  return (
    <AppScreen
      title={t('child.balanceAndHistory.title')}
      subtitle={t('child.balanceAndHistory.subtitle')}>
      <View style={styles.balancePanelShell}>
        <View pointerEvents="none" style={styles.balancePanelBacking} />
        <View style={styles.balancePanel}>
          <PlateShape
            fill="#13B7EF"
            points="0,0 96,0 100,100 0,100"
            topLine="12,8 66,8"
          />
          <View pointerEvents="none" style={styles.balanceBottomBevel} />
          <View style={styles.balanceHead}>
            <MedalIcon />
            <View style={styles.balanceCopy}>
              <Text style={styles.balanceNumber}>{balance}</Text>
              <Text style={styles.balanceLabel}>{t('child.balance.yourPoints')}</Text>
            </View>
            <View style={styles.piggyStage}>
              <View style={styles.piggyShadow} />
              <Image
                contentFit="contain"
                source={IMG_PIGGY_MASCOT}
                style={styles.piggyMascot}
              />
            </View>
          </View>

          <View style={styles.nextRewardRow}>
            <Text style={styles.nextRewardText}>
              {t('child.balance.nextReward', { points: String(nextRewardRemaining) })}
            </Text>
            <View style={styles.percentPill}>
              <Text style={styles.percentText}>{progress}%</Text>
            </View>
          </View>
          <ProgressBar progress={progress} />
        </View>
      </View>

      <SectionHeader icon="history" title={t('child.balance.pointsHistory')} />
      <View style={styles.historyList}>
        {childTransactions.map((transaction, index) => {
          const accent = HISTORY_ACCENTS[index % HISTORY_ACCENTS.length];

          return (
            <View key={transaction.id} style={[styles.historyRow, { backgroundColor: accent.body }]}>
              <View pointerEvents="none" style={styles.historyTopHighlight} />
              <View pointerEvents="none" style={styles.historyBottomBevel} />
              <View pointerEvents="none" style={[styles.historyLeftTab, { backgroundColor: accent.tab }]} />
              <HistoryIcon index={index} />
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle} numberOfLines={1}>
                  {getTransactionTitle(transaction, t)}
                </Text>
                <Text style={styles.historyMeta}>
                  {formatRelativeDate(transaction.createdAt, locale, t)}
                </Text>
              </View>
              <View style={styles.historyAmountPill}>
                <View pointerEvents="none" style={styles.priceTopHighlight} />
                <View pointerEvents="none" style={styles.priceBottomBevel} />
                <IconCoin size={17} />
                <Text style={styles.historyAmountText}>
                  +{transaction.points} {t('common.pointsShort')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <SectionHeader icon="shop" title={t('child.balance.spendTitle')} />
      <View style={styles.shopGrid}>
        {spendSuggestions.map((reward, index) => (
          <Pressable
            accessibilityRole="button"
            key={reward.id}
            onPress={() => router.replace('/child/rewards')}
            style={({ pressed }) => [
              styles.shopCard,
              pressed && styles.pressedCard,
            ]}>
            <PlateShape
              fill={SHOP_ACCENTS[index % SHOP_ACCENTS.length].body}
              points="0,0 96,0 100,100 0,100"
              topLine="12,8 76,8"
            />
            <View
              pointerEvents="none"
              style={[styles.shopBottomBevel, { backgroundColor: SHOP_ACCENTS[index % SHOP_ACCENTS.length].bottom }]}
            />
            <View style={[styles.shopHeaderStrip, { backgroundColor: SHOP_ACCENTS[index % SHOP_ACCENTS.length].header }]}>
              <Text style={styles.shopHeaderText}>{index === 0 ? 'ХИТ' : 'ПРИЗ'}</Text>
            </View>
            <ShopIcon reward={reward} index={index} />
            <Text style={styles.shopTitle} numberOfLines={2}>
              {getRewardTitle(reward, t)}
            </Text>
            <View style={styles.shopFooter}>
              <View style={styles.priceBadge}>
                <View pointerEvents="none" style={styles.priceTopHighlight} />
                <View pointerEvents="none" style={styles.priceBottomBevel} />
                <IconCoin size={17} />
                <Text style={styles.priceText}>{reward.price} {t('common.pointsShort')}</Text>
              </View>
              <View style={styles.shopButton}>
                <Text style={styles.shopButtonText}>{t('child.balance.shopButton')}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
};

export default ChildBalanceScreen;

const raisedShadow = Platform.select({
  ios: {
    shadowColor: '#061426',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 0,
  },
  android: { elevation: 4 },
  web: { boxShadow: '4px 4px 0 #061426' },
}) as ViewStyle;

const styles = StyleSheet.create({
  balancePanelShell: {
    paddingBottom: 5,
    paddingRight: 4,
    position: 'relative',
  },
  balancePanelBacking: {
    backgroundColor: '#061426',
    bottom: 1,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 5,
    transform: [{ skewX: '-2deg' }],
  },
  balancePanel: {
    gap: 13,
    overflow: 'visible',
    padding: 17,
    position: 'relative',
  },
  balanceBottomBevel: {
    backgroundColor: '#0D79B6',
    bottom: 0,
    height: 7,
    left: 0,
    position: 'absolute',
    right: 3,
    transform: [{ skewX: '-1deg' }],
    zIndex: 2,
  },
  balanceHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    zIndex: 3,
  },
  medalOuter: {
    alignItems: 'center',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 29,
    borderWidth: 4,
    height: 78,
    justifyContent: 'center',
    position: 'relative',
    width: 78,
    ...Platform.select({
      ios: {
        shadowColor: '#061426',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.34,
        shadowRadius: 0,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 3px 0 #C98A00' },
    }) as ViewStyle,
  },
  medalInner: {
    alignItems: 'center',
    backgroundColor: '#FFF2BE',
    borderColor: '#061426',
    borderRadius: 24,
    borderWidth: 2,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  balanceCopy: {
    flex: 1,
    minWidth: 0,
  },
  piggyStage: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    marginRight: -8,
    marginTop: -10,
    position: 'relative',
    width: 76,
  },
  piggyMascot: {
    height: 90,
    width: 82,
    zIndex: 2,
  },
  piggyShadow: {
    backgroundColor: 'rgba(4,20,38,0.26)',
    borderRadius: 999,
    bottom: 0,
    height: 16,
    position: 'absolute',
    width: 58,
    zIndex: 1,
  },
  balanceNumber: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 50,
    lineHeight: 54,
  },
  balanceLabel: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 2,
  },
  nextRewardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    zIndex: 3,
  },
  nextRewardText: {
    color: '#EAF7FF',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  percentPill: {
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  percentText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
  },
  progressTrack: {
    backgroundColor: '#0D2D5F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 2,
    height: 18,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 3,
  },
  progressFill: {
    backgroundColor: '#C229E8',
    borderRadius: 1,
    bottom: 2,
    left: 2,
    position: 'absolute',
    top: 2,
  },
  progressShine: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    height: 4,
    left: 12,
    position: 'absolute',
    right: 12,
    top: 3,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: '#19B8F2',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sectionIconShop: {
    backgroundColor: '#FFC400',
    borderColor: '#061426',
  },
  sectionTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 18,
  },
  historyList: {
    gap: 9,
  },
  historyRow: {
    alignItems: 'center',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    flexDirection: 'row',
    gap: 10,
    minHeight: 68,
    overflow: 'hidden',
    padding: 10,
    paddingLeft: 18,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#061426',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 0,
      },
      android: { elevation: 2 },
      web: { boxShadow: '4px 4px 0 #061426' },
    }) as ViewStyle,
  },
  historyTopHighlight: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    height: 3,
    left: 18,
    position: 'absolute',
    right: 96,
    top: 6,
    zIndex: 2,
  },
  historyBottomBevel: {
    backgroundColor: '#061426',
    bottom: 0,
    height: 6,
    left: 0,
    opacity: 0.36,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  historyLeftTab: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 11,
    zIndex: 2,
  },
  historyIcon: {
    alignItems: 'center',
    borderRadius: 3,
    borderWidth: 3,
    height: 42,
    justifyContent: 'center',
    width: 42,
    zIndex: 4,
  },
  historyCopy: {
    flex: 1,
    minWidth: 0,
    zIndex: 4,
  },
  historyTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  historyMeta: {
    color: '#BDE4FF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  historyAmountPill: {
    alignItems: 'center',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 4,
    minHeight: 34,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 6,
    transform: [{ skewX: '-3deg' }],
    zIndex: 4,
    ...Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.26, shadowRadius: 0 },
      android: { elevation: 2 },
      web: { boxShadow: '0 3px 0 #C98A00' },
    }) as ViewStyle,
  },
  historyAmountText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 13,
    transform: [{ skewX: '3deg' }],
  },
  priceTopHighlight: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    height: 3,
    left: 7,
    position: 'absolute',
    right: 9,
    top: 4,
    zIndex: 0,
  },
  priceBottomBevel: {
    backgroundColor: '#C98A00',
    bottom: 0,
    height: 5,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 0,
  },
  shopGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  shopCard: {
    flex: 1,
    gap: 9,
    minHeight: 190,
    overflow: 'visible',
    padding: 11,
    paddingTop: 42,
    position: 'relative',
    ...raisedShadow,
  },
  shopBottomBevel: {
    bottom: 0,
    height: 8,
    left: 0,
    position: 'absolute',
    right: 5,
    transform: [{ skewX: '-2deg' }],
    zIndex: 2,
  },
  shopHeaderStrip: {
    alignItems: 'center',
    borderBottomColor: '#061426',
    borderBottomWidth: 4,
    height: 32,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    transform: [{ skewX: '-2deg' }],
    zIndex: 2,
  },
  shopHeaderText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
  },
  pressedCard: {
    opacity: 0.82,
    transform: [{ translateY: 2 }, { scale: 0.992 }],
  },
  shopIconBox: {
    alignItems: 'center',
    borderRadius: 3,
    borderWidth: 3,
    height: 56,
    justifyContent: 'center',
    width: '100%',
    zIndex: 3,
  },
  shopTitle: {
    ...gameText,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
    zIndex: 3,
  },
  shopFooter: {
    gap: 8,
    zIndex: 3,
  },
  priceBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 4,
    minHeight: 32,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    transform: [{ skewX: '-3deg' }],
  },
  priceText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
    transform: [{ skewX: '3deg' }],
  },
  shopButton: {
    alignItems: 'center',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    minHeight: 34,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#061426',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.36,
        shadowRadius: 0,
      },
      android: { elevation: 3 },
      web: { boxShadow: 'inset 0 2px 0 #FFC928, 0 3px 0 #C98A00' },
    }) as ViewStyle,
  },
  shopButtonText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
