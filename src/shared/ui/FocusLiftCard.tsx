import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { AppCard } from '@/shared/ui/AppCard';

type FocusLiftCardProps = PropsWithChildren<{
  cardStyle?: StyleProp<ViewStyle>;
  isFocused: boolean;
}>;

export const FocusLiftCard = ({ cardStyle, children, isFocused }: FocusLiftCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const previousIsFocused = useRef(isFocused);

  useEffect(() => {
    if (!isFocused || previousIsFocused.current) {
      previousIsFocused.current = isFocused;
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          duration: 900,
          toValue: 1.1,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 900,
          toValue: -22,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scale, {
          duration: 1100,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 1100,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    previousIsFocused.current = isFocused;
  }, [isFocused, scale, translateY]);

  return (
    <Animated.View
      style={[
        styles.shell,
        isFocused && styles.focusedShell,
        {
          transform: [{ translateY }, { scale }],
        },
      ]}>
      <AppCard style={cardStyle}>{children}</AppCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  focusedShell: {
    elevation: 18,
    zIndex: 50,
  },
  shell: {
    position: 'relative',
  },
});
