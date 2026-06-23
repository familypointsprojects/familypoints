import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { gameText } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { IconCoin } from '@/shared/ui/QuestIcons';
import { OutlineText } from '@/shared/ui/OutlineText';

type PointsBadgeProps = {
  points: number;
  prefix?: string;
};

export const PointsBadge = ({ points, prefix }: PointsBadgeProps) => {
  const { t } = useLanguage();

  return (
    <View style={styles.badge}>
      <View pointerEvents="none" style={styles.topHighlight} />
      <View pointerEvents="none" style={styles.bottomBevel} />
      <IconCoin size={32} />
      <OutlineText style={[styles.text, gameText]}>
        {prefix ? `${prefix} ` : ''}
        {points} {t('common.pointsShort')}
      </OutlineText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 4,
    borderWidth: 3,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#061426',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 0,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 0 #C98A00' },
    }) as ViewStyle,
  },
  topHighlight: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    height: 3,
    left: 8,
    position: 'absolute',
    right: 10,
    top: 4,
    zIndex: 0,
  },
  bottomBevel: {
    backgroundColor: '#C98A00',
    bottom: 0,
    height: 5,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 0,
  },
  text: {
    color: '#041426',
    fontSize: 13,
    zIndex: 5,
  },
});
