import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';

type PointsBadgeProps = {
  points: number;
  prefix?: string;
};

export const PointsBadge = ({ points, prefix }: PointsBadgeProps) => {
  const { t } = useLanguage();

  return (
    <View style={styles.badge}>
      <Text style={styles.star}>⭐</Text>
      <Text style={styles.text}>
        {prefix ? `${prefix} ` : ''}
        {points} {t('common.pointsShort')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: FP.accentLight,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 13,
  },
  text: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
});
