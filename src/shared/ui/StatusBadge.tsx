import { StyleSheet, Text, View } from 'react-native';

import { FP, gameText } from '@/constants/theme';

type StatusTone = 'success' | 'warning' | 'muted' | 'danger';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneStyles: Record<StatusTone, { bg: string; color: string }> = {
  success: { bg: FP.mintLight,   color: '#087848' },
  warning: { bg: FP.accentLight, color: FP.accentText },
  muted:   { bg: FP.muted,       color: FP.textSub },
  danger:  { bg: FP.redLight,    color: '#A3271B' },
};

export const StatusBadge = ({ label, tone = 'muted' }: StatusBadgeProps) => {
  const { bg, color } = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, gameText, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
  },
});
