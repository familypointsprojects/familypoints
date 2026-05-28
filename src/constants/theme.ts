/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#12314A',
    background: '#F6EEDD',
    backgroundElement: '#FBF6EA',
    backgroundSelected: '#EAF1EF',
    textSecondary: '#6B7B86',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0E2536',
    backgroundElement: '#163A4C',
    backgroundSelected: '#1E4A5E',
    textSecondary: '#9DB4C4',
  },
} as const;

/** easyQuest design tokens (treasure-map / quest theme) */
export const FP = {
  // Brand — teal
  primary:      '#1E9E86',
  primaryDark:  '#15786A',
  primaryLight: '#E3F3EE',
  primaryBorder:'#BFE3D8',

  // Accent (points / coins / stars) — gold
  accent:       '#F5B225',
  accentDark:   '#DE940F',
  accentLight:  '#FBEBC4',
  accentText:   '#8A5A06',

  // Energy (flags / alerts / progress peaks) — orange
  orange:       '#EF5A24',
  orangeDark:   '#C8431A',
  orangeLight:  '#FBE0D4',

  // Semantic
  green:        '#2BA84A',
  greenLight:   '#DEF3E2',
  red:          '#E2483B',
  redLight:     '#FBE3E0',

  // Neutrals — parchment / navy
  bg:           '#F6EEDD',
  card:         '#FFFFFF',
  paper:        '#FBF6EA',
  tan:          '#E7D5AC',
  ink:          '#12314A',
  ink2:         '#0E2536',
  text:         '#12314A',
  textSub:      '#6B7B86',
  border:       '#ECE3CF',
  muted:        '#FBF6EA',
  white:        '#FFFFFF',

  // Gradient stops — teal
  gradStart:    '#2BB89B',
  gradEnd:      '#15786A',
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
