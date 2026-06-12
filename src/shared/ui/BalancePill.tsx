import { Platform, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { IconCoin } from '@/shared/ui/QuestIcons';

type BalancePillProps = {
  compact?: boolean;
  points: number;
};

export const BalancePill = ({ compact = false, points }: BalancePillProps) => (
  <View style={[styles.pill, compact && styles.pillCompact]}>
    <IconCoin size={compact ? 20 : 24} />
    <Text style={[styles.value, compact && styles.valueCompact]}>{points}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: FP.white,
    borderColor: '#F1D28A',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: FP.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 10px 24px rgba(247,183,33,0.22)' },
    }),
  },
  pillCompact: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  value: {
    color: FP.accentText,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  valueCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
});
