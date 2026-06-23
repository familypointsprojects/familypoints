import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AvatarHead } from './AvatarHeads';

const INK = '#0A1F46';
const NAVY = '#07173A';

/**
 * QuestLevelCard — level card in the "Brawl-Stars quest card" style (see ref screen).
 * Two zones: top (avatar + title) and a dark footer bar (level badge + segmented
 * progress + reward). The avatar chosen in account settings fills the avatar slot.
 */
type QuestLevelCardProps = {
  /** Avatar id picked by the user in settings (any string; unknown falls back to default). */
  avatarId?: string | null;
  /** Rank name, e.g. "Новичок". */
  rankLabel: string;
  /** Current level number shown in the badge, e.g. 1. */
  levelValue: number;
  /** 0..100 progress toward the next level. */
  progress: number;
  /** XP caption inside the bar, e.g. "34 / 75 XP". */
  xpLabel: string;
  /** Secondary line under the title, e.g. "До уровня 2 · 0 очк. скиллов". */
  detailLabel?: string;
  /** Reward chip text shown next to the skull, e.g. "100". Hidden when omitted. */
  rewardLabel?: string;
  onPress?: () => void;
};

const clamp = (n: number) => Math.max(0, Math.min(n, 100));

const SkullIcon = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 3C7.6 3 4 6.3 4 10.4c0 2.2 1.1 4.2 2.9 5.5V19c0 1.1.9 2 2 2h.2v-2.2h1.5V21h2.8v-2.2h1.5V21h.2c1.1 0 2-.9 2-2v-3.1c1.8-1.3 2.9-3.3 2.9-5.5C20 6.3 16.4 3 12 3Z"
      fill="#ffffff"
      stroke={INK}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="11" r="1.9" fill={INK} />
    <Circle cx="15" cy="11" r="1.9" fill={INK} />
    <Path d="M11 14.5h2l-1 1.6z" fill={INK} />
  </Svg>
);

export const QuestLevelCard = ({
  avatarId,
  rankLabel,
  levelValue,
  progress,
  xpLabel,
  detailLabel,
  rewardLabel,
  onPress,
}: QuestLevelCardProps) => {
  const fillWidth = `${clamp(progress)}%` as `${number}%`;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View pointerEvents="none" style={styles.topSheen} />

      <View style={styles.top}>
        <View style={styles.avatar}>
          <AvatarHead id={avatarId} size={90} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
            {rankLabel}
          </Text>
          {detailLabel ? (
            <Text style={styles.sub} numberOfLines={1}>
              {detailLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.lvlBadge}>
          <Text style={styles.lvlText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
            {levelValue}
          </Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: fillWidth }]}>
            <View pointerEvents="none" style={styles.fillSheen} />
          </View>
          <View pointerEvents="none" style={styles.ticks}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.tick} />
            ))}
          </View>
          <View pointerEvents="none" style={styles.xpWrap}>
            <Text style={styles.xpText} numberOfLines={1}>
              {xpLabel}
            </Text>
          </View>
        </View>

        {rewardLabel ? (
          <View style={styles.reward}>
            <SkullIcon size={22} />
            <Text style={styles.rewardText}>{rewardLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2358C8',
    borderColor: INK,
    borderWidth: 3,
    borderRadius: 26,
    padding: 14,
    overflow: 'hidden',
    ...(Platform.select({
      ios: { shadowColor: '#071226', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 24 },
      android: { elevation: 7 },
      web: { boxShadow: '0 16px 30px rgba(7,18,38,0.45)' },
    }) as ViewStyle),
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4, paddingBottom: 14 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: INK,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: 'FranxurterTotallyFat',
    color: '#fff',
    textTransform: 'uppercase',
    fontSize: 28,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(3,12,26,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  sub: { marginTop: 6, color: '#BBD4FF', fontWeight: '600', fontSize: 13 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0A2350',
    borderColor: NAVY,
    borderWidth: 3,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  lvlBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F7B721',
    borderColor: INK,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.select({
      ios: { shadowColor: '#C8861A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 0 #C8861A' },
    }) as ViewStyle),
  },
  lvlText: { fontFamily: 'FranxurterTotallyFat', color: '#5A3800', fontSize: 20 },

  track: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#06122E',
    borderColor: NAVY,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2BC4EE',
    borderRadius: 13,
  },
  fillSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  ticks: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  tick: { width: 2, backgroundColor: 'rgba(7,18,38,0.45)' },
  xpWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpText: {
    fontFamily: 'FranxurterTotallyFat',
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(3,12,26,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },

  reward: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 2, paddingRight: 4 },
  rewardText: {
    fontFamily: 'FranxurterTotallyFat',
    color: '#fff',
    fontSize: 18,
    textShadowColor: 'rgba(3,12,26,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
