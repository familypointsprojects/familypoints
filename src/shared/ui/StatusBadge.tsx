import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';

type StatusTone = 'success' | 'warning' | 'muted' | 'danger';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneStyles: Record<StatusTone, { bg: string; color: string }> = {
  success: { bg: FP.greenLight,  color: '#1C7A33' },
  warning: { bg: FP.accentLight, color: '#8A5A06' },
  muted:   { bg: FP.muted,       color: FP.textSub },
  danger:  { bg: FP.redLight,    color: '#A3271B' },
};

export const StatusBadge = ({ label, tone = 'muted' }: StatusBadgeProps) => {
  const { bg, color } = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
