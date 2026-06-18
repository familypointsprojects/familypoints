/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#10233F',
    background: '#F6F2E8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDF5EF',
    textSecondary: '#63758A',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0E2536',
    backgroundElement: '#163A4C',
    backgroundSelected: '#1E4A5E',
    textSecondary: '#9DB4C4',
  },
} as const;

/** easyQuest design tokens (arcade quest theme) */
export const FP = {
  // Brand — quest blue
  primary:      '#1647B7',
  primaryDark:  '#0B2B70',
  primaryLight: '#E8F2FF',
  primaryBorder:'#BFD7F5',

  // Accent (points / coins / stars) — gold
  accent:       '#F7B721',
  accentDark:   '#D88B08',
  accentLight:  '#FFF2BE',
  accentText:   '#835100',

  // Energy (flags / alerts / progress peaks) — orange
  orange:       '#FF642D',
  orangeDark:   '#C8431A',
  orangeLight:  '#FFE4D6',
  cyan:         '#10C7E8',
  cyanLight:    '#DDF8FF',
  mint:         '#25D989',
  mintLight:    '#DBFBEF',
  lime:         '#D8FF3E',
  pink:         '#FF4F91',
  purple:       '#7557FF',

  // Semantic
  green:        '#21B86F',
  greenLight:   '#DBFBEF',
  red:          '#EF463D',
  redLight:     '#FFE3E0',

  // Neutrals — ice / navy
  bg:           '#F6F2E8',
  card:         '#FFFFFF',
  paper:        '#FBF8F0',
  tan:          '#E6DDCB',
  ink:          '#10233F',
  ink2:         '#071827',
  text:         '#10233F',
  textSub:      '#63758A',
  border:       '#E6DDCB',
  muted:        '#F8F4EC',
  white:        '#FFFFFF',
  graphite:     '#16283A',

  // Gradient stops — blue / cyan
  gradStart:    '#1647B7',
  gradEnd:      '#0B2B70',
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
