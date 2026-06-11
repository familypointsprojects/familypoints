import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { FP } from '@/constants/theme';

type AppButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';

type AppButtonProps = {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
};

const containerStyles: Record<AppButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: FP.primaryDark,
  },
  secondary: {
    backgroundColor: FP.white,
    borderColor: FP.primary,
    borderWidth: 1.5,
  },
  accent: {
    backgroundColor: FP.accent,
    borderColor: '#FCE28B',
    borderWidth: 1,
  },
  danger: {
    backgroundColor: FP.red,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const textStyles: Record<AppButtonVariant, TextStyle> = {
  primary:   { color: FP.white },
  secondary: { color: FP.primary },
  accent:    { color: FP.ink2 },
  danger:    { color: FP.white },
  ghost:     { color: FP.primary },
};

export const AppButton = ({
  title,
  subtitle,
  leftIcon,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: AppButtonProps) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      containerStyles[variant],
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
      style,
    ]}>
    <View style={styles.contentRow}>
      {leftIcon}
      <Text style={[styles.text, textStyles[variant], disabled && styles.disabledText]}>
        {title}
      </Text>
    </View>
    {Boolean(subtitle) && (
      <Text style={[styles.subtitle, textStyles[variant], disabled && styles.disabledText]}>
        {subtitle}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.72,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.42,
  },
  disabledText: {
    color: FP.textSub,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
