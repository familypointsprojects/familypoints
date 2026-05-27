import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  message?: string;
};

export const EmptyState = ({ title, message }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {Boolean(message) && <Text style={styles.message}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: FP.primaryLight,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    alignItems: 'center',
  },
  title: {
    color: FP.primary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
