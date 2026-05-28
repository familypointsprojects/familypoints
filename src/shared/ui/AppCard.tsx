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
    borderRadius: 20,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#12314A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(18,49,74,0.08)',
      },
    }),
  },
});
