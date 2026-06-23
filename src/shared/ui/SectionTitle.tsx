import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FP, gameText } from '@/constants/theme';
import { OutlineText } from '@/shared/ui/OutlineText';

type SectionTitleProps = {
  title: string;
  action?: ReactNode;
};

export const SectionTitle = ({ title, action }: SectionTitleProps) => (
  <View style={styles.container}>
    <OutlineText style={[styles.title, gameText]}>{title}</OutlineText>
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
    letterSpacing: 0,
  },
});
