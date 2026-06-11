import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';

type SectionTitleProps = {
  title: string;
  action?: ReactNode;
};

export const SectionTitle = ({ title, action }: SectionTitleProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {action}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: FP.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
