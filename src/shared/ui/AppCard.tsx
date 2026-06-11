import { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { FP } from '@/constants/theme';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export const AppCard = ({ children, style }: AppCardProps) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: FP.card,
    borderColor: 'rgba(191, 215, 245, 0.82)',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: FP.primaryDark,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.11,
        shadowRadius: 26,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 18px 38px rgba(16,35,63,0.10)',
      },
    }),
  },
});
