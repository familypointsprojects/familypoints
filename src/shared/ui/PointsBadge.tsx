import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { IconCoin } from '@/shared/ui/QuestIcons';

type PointsBadgeProps = {
  points: number;
  prefix?: string;
};

export const PointsBadge = ({ points, prefix }: PointsBadgeProps) => {
  const { t } = useLanguage();

  return (
    <View style={styles.badge}>
      <IconCoin size={20} />
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
  text: {
    color: FP.accentText,
    fontSize: 13,
    fontWeight: '900',
  },
});
