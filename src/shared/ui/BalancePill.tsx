import { StyleSheet, View } from 'react-native';

import { gameText } from '@/constants/theme';
import { IconCoin } from '@/shared/ui/QuestIcons';
import { OutlineText } from '@/shared/ui/OutlineText';

type BalancePillProps = {
  compact?: boolean;
  points: number;
};

export const BalancePill = ({ compact = false, points }: BalancePillProps) => {
  const coinSize = compact ? 32 : 40;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* slanted dark bar (parallelogram) with a thin blue sole underneath */}
      <View style={styles.barWrap}>
        <View style={[styles.barDark, compact && styles.barDarkCompact]}>
          {/* inner shadow around the whole perimeter (stacked translucent frames) */}
          <View pointerEvents="none" style={styles.inset1} />
          <View pointerEvents="none" style={styles.inset2} />
          <View pointerEvents="none" style={styles.inset3} />
          {/* counter-skew so the number stays upright */}
          <View style={styles.content}>
            <OutlineText
              style={[styles.value, gameText, compact && styles.valueCompact]}
              outlineWidth={1.5}
              bottomDepth={2}>
              {points}
            </OutlineText>
          </View>
        </View>
      </View>

      {/* coin sits on the left, taller than the bar so it overhangs top & bottom */}
      <View pointerEvents="none" style={styles.coinWrap}>
        <IconCoin size={coinSize} />
      </View>
    </View>
  );
};

const SKEW = '-8deg';
const COUNTER_SKEW = '8deg';

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingLeft: 18,
    position: 'relative',
  },
  containerCompact: {
    paddingLeft: 14,
  },
  barWrap: {
    position: 'relative',
    transform: [{ skewX: SKEW }],
  },
  barDark: {
    alignItems: 'flex-end',
    backgroundColor: '#1B2A3D',
    borderColor: '#0A1626',
    borderRadius: 0,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 28,
    overflow: 'hidden',
    paddingLeft: 30,
    paddingRight: 16,
    paddingVertical: 2,
  },
  barDarkCompact: {
    minHeight: 24,
    paddingLeft: 24,
    paddingRight: 12,
  },
  inset1: {
    borderColor: 'rgba(0,0,0,0.14)',
    borderWidth: 6,
    borderLeftWidth: 0,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  inset2: {
    borderColor: 'rgba(0,0,0,0.22)',
    borderWidth: 3,
    borderLeftWidth: 0,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  inset3: {
    borderColor: 'rgba(0,0,0,0.32)',
    borderWidth: 1.5,
    borderLeftWidth: 0,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    transform: [{ skewX: COUNTER_SKEW }],
  },
  coinWrap: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 1,
    position: 'absolute',
    top: 0,
    zIndex: 5,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 22,
  },
  valueCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
});
