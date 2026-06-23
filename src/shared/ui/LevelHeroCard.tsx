import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { FP, gameText } from '@/constants/theme';

type LevelHeroCardProps = {
  avatarColor?: string;
  avatarLabel: string;
  detailLabel?: string;
  levelLabel: string;
  levelValue?: number;
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
  levelValue,
  onLevelPress,
  progress,
  rankLabel,
  showGlow = false,
  skillLabel,
  xpLabel,
}: LevelHeroCardProps) => {
  const progressWidth = `${clampProgress(progress)}%` as `${number}%`;
  const levelText =
    levelValue != null ? String(levelValue) : levelLabel.replace(/\D/g, '') || levelLabel;

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
          </View>

          <View style={styles.sideCopy}>
            <Text style={styles.skillText}>{skillLabel}</Text>
            <Text style={styles.detailText}>{detailLabel ?? levelLabel}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {levelText}
            </Text>
          </View>

          <View style={styles.progressBarWrap}>
            <View style={styles.progressTrack}>
              <View style={styles.progressTrackInner} />
              <View style={[styles.progressFill, { width: progressWidth }]}>
                <View pointerEvents="none" style={styles.progressShade} />
              </View>
            </View>

            <View pointerEvents="none" style={styles.progressLabelOverlay}>
              <Text style={styles.progressLabelText} numberOfLines={1}>
                {xpLabel}
              </Text>
            </View>
          </View>
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
    ...gameText,
    color: FP.white,
    fontSize: 20,
  },
  mainCopy: {
    flex: 1,
    minWidth: 0,
  },
  rank: {
    ...gameText,
    color: FP.white,
    fontSize: 21,
  },
  sideCopy: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 5,
  },
  skillText: {
    ...gameText,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    textAlign: 'right',
  },
  detailText: {
    ...gameText,
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    textAlign: 'right',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
    position: 'relative',
    zIndex: 1,
  },
  // белый «жетон» уровня с толстой чёрной обводкой, налегает на левый край бара
  levelBadge: {
    alignItems: 'center',
    backgroundColor: FP.white,
    borderColor: '#000000',
    borderRadius: 12,
    borderWidth: 3,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    marginRight: -13,
    width: 38,
    zIndex: 3,
  },
  levelBadgeText: {
    ...gameText,
    color: FP.ink,
    fontSize: 18,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
  },
  progressBarWrap: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  progressLabelOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  progressLabelText: {
    ...gameText,
    color: FP.white,
    fontSize: 13,
    letterSpacing: 0.5,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 0,
  },
  // косой желоб (параллелограмм) с лёгким скруглением углов и чёрной обводкой
  progressTrack: {
    backgroundColor: '#0C2233',
    borderColor: '#000000',
    borderRadius: 8,
    borderWidth: 2,
    height: 30,
    overflow: 'hidden',
    position: 'relative',
    transform: [{ skewX: '-20deg' }],
  },
  progressTrackInner: {
    backgroundColor: 'rgba(13,31,72,0.35)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  // заливка жёлто-оранжевая; передняя кромка параллельна косым концам трека
  progressFill: {
    backgroundColor: FP.accent,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  // нижняя оранжевая зона для градиента золото -> оранж
  progressShade: {
    backgroundColor: FP.orange,
    bottom: 0,
    height: '48%',
    left: 0,
    opacity: 0.85,
    position: 'absolute',
    right: 0,
  },
});
