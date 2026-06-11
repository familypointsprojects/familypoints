import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { RocketProgressBar } from '@/shared/ui/RocketProgressBar';

type LevelHeroCardProps = {
  avatarColor?: string;
  avatarLabel: string;
  levelLabel: string;
  onLevelPress?: () => void;
  progress: number;
  rankLabel: string;
  skillLabel: string;
  xpLabel: string;
};

const PulsingLevelPill = ({
  levelLabel,
  onPress,
}: {
  levelLabel: string;
  onPress?: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    ).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.levelPill, pressed && styles.levelPillPressed]}>
        <Text style={styles.levelText}>{levelLabel}</Text>
        {onPress && (
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Circle cx={11} cy={11} r={10}  fill={FP.orange} opacity={0.3} />
            <Circle cx={11} cy={11} r={8.5} fill={FP.orange} stroke={FP.orangeDark} strokeWidth={1.5} />
            <Circle cx={8}  cy={7.5} r={2.5} fill="rgba(255,255,255,0.35)" />
            <Line x1={11} y1={6.5}  x2={11} y2={15.5} stroke="#fff" strokeWidth={2.8} strokeLinecap="round" />
            <Line x1={6.5} y1={11}  x2={15.5} y2={11} stroke="#fff" strokeWidth={2.8} strokeLinecap="round" />
          </Svg>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const LevelHeroCard = ({
  avatarColor = FP.primary,
  avatarLabel,
  levelLabel,
  onLevelPress,
  progress,
  rankLabel,
  skillLabel,
  xpLabel,
}: LevelHeroCardProps) => (
  <View style={styles.card}>
    <View pointerEvents="none" style={styles.glowCyan} />
    <View pointerEvents="none" style={styles.glowLime} />

    {/* Top row: avatar + rank + pressable level badge */}
    <View style={styles.topRow}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{avatarLabel.slice(0, 1).toUpperCase()}</Text>
      </View>
      <Text style={styles.rank} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {rankLabel}
      </Text>
      <PulsingLevelPill levelLabel={levelLabel} onPress={onLevelPress} />
    </View>

    {/* Progress bar */}
    <View style={styles.progressWrap}>
      <RocketProgressBar progress={progress} />
    </View>

    {/* XP primary + skills secondary */}
    <View style={styles.metaRow}>
      <Text style={styles.xpText}>{xpLabel}</Text>
      <Text style={styles.skillText}>{skillLabel}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1647B7',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'visible',
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: 'relative',
    ...(Platform.select({
      ios: {
        shadowColor: FP.primaryDark,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.24,
        shadowRadius: 30,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 16px 40px rgba(22,71,183,0.24)' },
    }) as ViewStyle),
  },
  glowCyan: {
    backgroundColor: 'rgba(16,199,232,0.10)',
    borderRadius: 200,
    height: 320,
    position: 'absolute',
    right: -140,
    top: -100,
    width: 320,
  },
  glowLime: {
    backgroundColor: 'rgba(216,255,62,0.13)',
    borderRadius: 100,
    height: 130,
    position: 'absolute',
    right: -20,
    top: -50,
    width: 130,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    position: 'relative',
    zIndex: 1,
  },
  avatar: {
    alignItems: 'center',
    borderColor: 'rgba(0,0,0,0.28)',
    borderRadius: 13,
    borderWidth: 2,
    flexShrink: 0,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: FP.white,
    fontSize: 20,
    fontWeight: '900',
  },
  rank: {
    color: FP.white,
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  levelPill: {
    alignItems: 'center',
    backgroundColor: FP.lime,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  levelPillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  levelText: {
    color: '#264000',
    fontSize: 13,
    fontWeight: '900',
  },
  progressWrap: {
    marginBottom: 8,
    position: 'relative',
    zIndex: 1,
  },
  metaRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  skillText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    fontWeight: '700',
  },
});
