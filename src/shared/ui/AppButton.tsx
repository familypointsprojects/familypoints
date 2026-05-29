import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

import { FP } from '@/constants/theme';

type AppButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';

type AppButtonProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
};

const containerStyles: Record<AppButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: FP.primary,
  },
  secondary: {
    backgroundColor: FP.primaryLight,
    borderColor: FP.primary,
    borderWidth: 1.5,
  },
  accent: {
    backgroundColor: FP.accent,
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
    <Text style={[styles.text, textStyles[variant], disabled && styles.disabledText]}>
      {title}
    </Text>
    {Boolean(subtitle) && (
      <Text style={[styles.subtitle, textStyles[variant], disabled && styles.disabledText]}>
        {subtitle}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
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
