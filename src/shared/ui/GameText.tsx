import { StyleSheet, TextProps } from 'react-native';

import { FP, gameText } from '@/constants/theme';
import { OutlineText } from '@/shared/ui/OutlineText';

type GameTextProps = TextProps & {
  children: TextProps['children'];
};

export const GameTitle = ({ children, style, ...props }: GameTextProps) => (
  <OutlineText {...props} style={[styles.title, style]}>
    {children}
  </OutlineText>
);

export const GameButtonText = ({ children, style, ...props }: GameTextProps) => (
  <OutlineText {...props} style={[styles.button, style]}>
    {children}
  </OutlineText>
);

const styles = StyleSheet.create({
  button: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
  title: {
    ...gameText,
    color: FP.white,
    fontSize: 24,
  },
});
