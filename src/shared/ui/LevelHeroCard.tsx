import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { FP } from '@/constants/theme';

type LevelHeroCardProps = {
  avatarColor?: string;
  avatarLabel: string;
  detailLabel?: string;
  levelLabel: string;
  onLevelPress?: () => void;
  progress: number;
  rankLabel: string;
  showGlow?: boolean;
  skillLabel: string;
  xpLabel: string;
};

const clampProgress = (progress: number) => Math.max(0, Math.min(progress, 100));

export const LevelHeroCard = ({
  avatarColor = FP.primary,
  avatarLabel,
  detailLabel,
  levelLabel,
  onLevelPress,
  progress,
  rankLabel,
  showGlow = false,
  skillLabel,
  xpLabel,
}: LevelHeroCardProps) => {
  const progressWidth = `${clampProgress(progress)}%` as `${number}%`;

  return (
    <View style={styles.wrap}>
      {showGlow && <View pointerEvents="none" style={styles.glowCyan} />}
      {showGlow && <View pointerEvents="none" style={styles.glowLime} />}
      <Pressable
        accessibilityRole={onLevelPress ? 'button' : undefined}
        disabled={!onLevelPress}
        onPress={onLevelPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.contentRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{avatarLabel.slice(0, 1).toUpperCase()}</Text>
          </View>

          <View style={styles.mainCopy}>
            <Text style={styles.rank} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {rankLabel}
            </Text>
            <Text style={styles.xpText}>{xpLabel}</Text>
          </View>

          <View style={styles.sideCopy}>
            <Text style={styles.skillText}>{skillLabel}</Text>
            <Text style={styles.detailText}>{detailLabel ?? levelLabel}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
    position: 'relative',
  },
  card: {
    backgroundColor: FP.graphite,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
    zIndex: 1,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 14px 32px rgba(0,0,0,0.18)' },
    }) as ViewStyle),
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  glowCyan: {
    backgroundColor: 'rgba(16,199,232,0.10)',
    borderRadius: 200,
    height: 320,
    position: 'absolute',
    right: -140,
    top: -100,
    width: 320,
    zIndex: 0,
  },
  glowLime: {
    backgroundColor: 'rgba(216,255,62,0.13)',
    borderRadius: 100,
    height: 130,
    position: 'absolute',
    right: -20,
    top: -50,
    width: 130,
    zIndex: 0,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
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
  mainCopy: {
    flex: 1,
    minWidth: 0,
  },
  rank: {
    color: FP.white,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },
  sideCopy: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 5,
  },
  skillText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  detailText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  progressTrack: {
    backgroundColor: 'rgba(13,31,72,0.44)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    marginLeft: 54,
    marginTop: 8,
    overflow: 'hidden',
    padding: 1,
    position: 'relative',
    zIndex: 1,
  },
  progressFill: {
    backgroundColor: FP.accent,
    borderRadius: 999,
    height: '100%',
  },
});
