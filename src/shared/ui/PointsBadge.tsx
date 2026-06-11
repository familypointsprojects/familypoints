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
      <View style={styles.coin}>
        <View style={styles.coinShine} />
      </View>
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
    backgroundColor: FP.white,
    borderColor: '#F1D28A',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  coin: {
    alignItems: 'center',
    backgroundColor: FP.accent,
    borderColor: '#8B5904',
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  coinShine: {
    borderColor: '#FFF1A6',
    borderLeftColor: 'transparent',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 8,
    transform: [{ rotate: '-35deg' }],
    width: 8,
  },
  text: {
    color: FP.accentText,
    fontSize: 13,
    fontWeight: '900',
  },
});
