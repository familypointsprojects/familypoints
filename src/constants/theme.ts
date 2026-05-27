/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

/** Figma design tokens */
export const FP = {
  // Brand
  primary:      '#7C4FFF',
  primaryDark:  '#4E2DB8',
  primaryLight: '#EDE9FE',
  primaryBorder:'#C4B5FD',

  // Accent (points / stars)
  accent:       '#F59E0B',
  accentDark:   '#D97706',
  accentLight:  '#FEF3C7',

  // Semantic
  green:        '#10B981',
  greenLight:   '#D1FAE5',
  red:          '#EF4444',
  redLight:     '#FEE2E2',

  // Neutrals
  bg:           '#F8F7FF',
  card:         '#FFFFFF',
  text:         '#111827',
  textSub:      '#6B7280',
  border:       '#E5E7EB',
  muted:        '#F3F4F6',
  white:        '#FFFFFF',

  // Gradient stops
  gradStart:    '#9B72FF',
  gradEnd:      '#4E2DB8',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
