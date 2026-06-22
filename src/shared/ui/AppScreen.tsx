import { PropsWithChildren, ReactNode, RefObject } from 'react';
import { router, usePathname } from 'expo-router';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { FP, gameText } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { AppHeaderMenu } from '@/shared/ui/AppHeaderMenu';
import { BalancePill } from '@/shared/ui/BalancePill';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { OutlineText } from '@/shared/ui/OutlineText';
import { shouldShowBottomNavigation } from '@/shared/ui/bottomNavigationRoutes';
import { getBalance } from '@/shared/utils/points';

type AppScreenProps = PropsWithChildren<{
  bottomBar?: ReactNode;
  headerRight?: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  onContentSizeChange?: (width: number, height: number) => void;
  scrollRef?: RefObject<ScrollView | null>;
}>;

// ── Icon watermarks — равномерная диагональная сетка по всему экрану ─────────
const WMARK_TINT = '#3759A0';
const OP = 0.078;

// Источники PNG-иконок (только ассеты с прозрачным фоном)
const IMG_BALLY   = require('../../../design/assets/icon-bally.png');
const IMG_COMPASS = require('../../../assets/images/tab-home-compass.png');
const IMG_PIRATE_HAT = require('../../../assets/images/watermark-pirate-hat.png');
const IMG_PIG_FACE = require('../../../assets/images/watermark-pig-face.png');
const IMG_CHEST = require('../../../assets/images/watermark-rewards-chest.png');
// open — SVG, т.к. PNG-ассеты имеют белый фон (tintColor заливает весь квадрат)

type WMIcon = 'coin' | 'bally' | 'flame' | 'compass' | 'chest' | 'open' | 'gamepad' | 'pig' | 'pirateHat';
// [cx, cy, rot, icon]
type WMark = [number, number, number, WMIcon];
type IconWatermarksProps = {
  bakedPngBoostOpacity?: number;
  forceTintPng?: boolean;
  opacity?: number;
  opacityBottom?: number;
  svgAccent?: string;
  svgAccentBottom?: string;
  tint?: string;
  tintBottom?: string;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const getHexChannels = (color: string): [number, number, number] => {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return [55, 89, 160];

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
};

const mixHex = (from: string, to: string, amount: number) => {
  const start = getHexChannels(from);
  const end = getHexChannels(to);
  const mix = clamp01(amount);
  const channels = start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * mix).toString(16).padStart(2, '0'),
  );

  return `#${channels.join('')}`;
};

const getWatermarkTone = (top: string, bottom: string | undefined, y: number) =>
  bottom ? mixHex(top, bottom, clamp01((y - 40) / 760)) : top;

const getWatermarkOpacity = (top: number, bottom: number | undefined, y: number) =>
  bottom === undefined ? top : top + (bottom - top) * clamp01((y - 40) / 760);

const PATTERN_ICON_ROWS: WMIcon[][] = [
  ['bally', 'pig',       'pirateHat', 'chest',     'open',  'flame'],
  ['gamepad', 'chest',   'bally',     'pirateHat', 'pig',   'coin'],
  ['flame', 'compass',   'pig',       'gamepad',   'chest', 'pirateHat'],
  ['open',  'pirateHat', 'coin',      'flame',     'compass', 'pig'],
];

const PATTERN_TILE_X = 104;
const PATTERN_TILE_Y = 72;
const PATTERN_ROTATION = -12;
const PATTERN_ROW_COUNT = 14;
const PATTERN_COL_COUNT = 6;
const PATTERN_ROW_A_START = -44;
const PATTERN_ROW_B_START = 8;

// Сетка как в игровом bg-паттерне: 6 колонок с запасом за краями,
// каждый следующий ряд сдвинут на полшага, поэтому появляются диагонали.
const MARKS: WMark[] = Array.from({ length: PATTERN_ROW_COUNT }).flatMap((_, row): WMark[] => {
  const rowIcons = PATTERN_ICON_ROWS[row % PATTERN_ICON_ROWS.length];
  const xOffset = row % 2 === 0 ? PATTERN_ROW_A_START : PATTERN_ROW_B_START;
  const y = -10 + row * PATTERN_TILE_Y;

  return Array.from({ length: PATTERN_COL_COUNT }).map((__, col): WMark => [
    xOffset + col * PATTERN_TILE_X,
    y,
    PATTERN_ROTATION,
    rowIcons[col % rowIcons.length],
  ]);
});

const IMG_SRC: Record<Exclude<WMIcon, 'coin' | 'flame' | 'gamepad' | 'open'>, number> = {
  bally:   IMG_BALLY,
  chest: IMG_CHEST,
  compass: IMG_COMPASS,
  pig: IMG_PIG_FACE,
  pirateHat: IMG_PIRATE_HAT,
};

const ICON_SIZE: Record<Exclude<WMIcon, 'coin' | 'flame' | 'gamepad' | 'open'>, number> = {
  bally:   66,
  chest: 61,
  compass: 62,
  pig: 56,
  pirateHat: 76,
};

const COIN_MARKS       = MARKS.filter(([,,, t]) => t === 'coin')      as [number, number, number, 'coin'][];
const FLAME_MARKS      = MARKS.filter(([,,, t]) => t === 'flame')     as [number, number, number, 'flame'][];
const GAMEPAD_MARKS    = MARKS.filter(([,,, t]) => t === 'gamepad')   as [number, number, number, 'gamepad'][];
const OPEN_MARKS       = MARKS.filter(([,,, t]) => t === 'open')      as [number, number, number, 'open'][];

const getWatermarkDebugEnabled = () =>
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('watermarkGrid') === '1';

const getMarkAt = (row: number, col: number) => MARKS[row * PATTERN_COL_COUNT + col];

const IconWatermarks = (props: IconWatermarksProps) => (
  <IconWatermarksLayer {...props} />
);

const IconWatermarksLayer = ({
  bakedPngBoostOpacity = 0,
  forceTintPng = false,
  opacity = OP,
  opacityBottom,
  svgAccent = '#ECEEF6',
  svgAccentBottom,
  tint = WMARK_TINT,
  tintBottom,
}: IconWatermarksProps) => {
  const { height, width } = useWindowDimensions();
  const scaleX = width / 390;
  const scaleY = height / 844;
  const iconScale = Math.max(scaleX, scaleY);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* PNG-иконки масштабируются из той же 390x844 сетки, что и debug SVG */}
      {MARKS.map(([cx, cy, rot, type], i) => {
        if (type === 'coin' || type === 'flame' || type === 'gamepad' || type === 'open') return null;
        const sz = ICON_SIZE[type] * iconScale;
        const half = sz / 2;
        const hasOwnWatermarkOpacity = type === 'chest' || type === 'pirateHat' || type === 'pig';
        const useTintedPng = forceTintPng || !hasOwnWatermarkOpacity;
        const markOpacity = getWatermarkOpacity(opacity, opacityBottom, cy);
        const pngOpacity = forceTintPng && hasOwnWatermarkOpacity ? 1 : markOpacity;
        const shouldBoostBakedPng = forceTintPng && hasOwnWatermarkOpacity && bakedPngBoostOpacity > 0;
        const markTint = getWatermarkTone(tint, tintBottom, cy);
        const left = cx * scaleX - half;
        const top = cy * scaleY - half;
        const imageStyle = {
          position: 'absolute' as const,
          width: sz,
          height: sz,
          left,
          top,
          opacity: useTintedPng ? pngOpacity : 1,
          transform: [{ rotate: `${rot}deg` }],
        };

        if (shouldBoostBakedPng) {
          return [
            <Image
              key={i}
              source={IMG_SRC[type]}
              tintColor={markTint}
              style={imageStyle}
              fadeDuration={0}
            />,
            <Image
              key={`${i}-boost`}
              source={IMG_SRC[type]}
              tintColor={markTint}
              style={[imageStyle, { opacity: bakedPngBoostOpacity }]}
              fadeDuration={0}
            />,
          ];
        }

        return (
          <Image
            key={i}
            source={IMG_SRC[type]}
            tintColor={useTintedPng ? markTint : undefined}
            style={imageStyle}
            fadeDuration={0}
          />
        );
      })}
      {/* Огоньки, джойстики и открытые сундуки — SVG, чтобы не плодить отдельные ассеты */}
      <Svg
        height="100%"
        pointerEvents="none"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        viewBox="0 0 390 844"
        width="100%">
        {COIN_MARKS.map(([cx, cy, rot], i) => {
          const markTint = getWatermarkTone(tint, tintBottom, cy);
          const markAccent = getWatermarkTone(svgAccent, svgAccentBottom, cy);
          const markOpacity = getWatermarkOpacity(opacity, opacityBottom, cy);

          return (
            <G
              key={`coin-${i}`}
              transform={`translate(${cx} ${cy}) rotate(${rot}) scale(0.48) translate(-60 -60)`}>
              <Circle cx={60} cy={60} fill={markTint} opacity={markOpacity} r={52} />
              <Circle
                cx={60}
                cy={60}
                fill="none"
                r={43}
                stroke={markAccent}
                strokeOpacity={0.36}
                strokeWidth={4}
              />
              <Path
                d="M60 24 L82 60 L60 96 L38 60 Z"
                fill={markAccent}
                fillOpacity={0.24}
                stroke={markAccent}
                strokeOpacity={0.42}
                strokeWidth={4}
                strokeLinejoin="round"
              />
              <Ellipse cx={60} cy={60} fill={markTint} fillOpacity={markOpacity * 0.72} rx={10} ry={7} />
            </G>
          );
        })}
        {FLAME_MARKS.map(([cx, cy, rot], i) => {
          const markTint = getWatermarkTone(tint, tintBottom, cy);
          const markAccent = getWatermarkTone(svgAccent, svgAccentBottom, cy);
          const markOpacity = getWatermarkOpacity(opacity, opacityBottom, cy);

          return (
            <G key={i}
              transform={`translate(${cx} ${cy}) rotate(${rot}) scale(0.43) translate(-86 -105)`}>
              <Path
                d="M79 151C47 151 23 131 23 105C23 82 38 69 58 54C74 42 81 26 89 9C109 34 116 54 112 72C119 62 124 51 127 39C142 64 149 84 149 107C149 134 127 151 95 151Z"
                fill={markTint}
                opacity={markOpacity}
              />
              <Path
                d="M88 145C66 145 49 132 49 110C49 93 61 82 74 70C86 59 90 44 94 30C111 51 116 70 111 86C119 78 125 68 128 56C138 75 144 93 144 111C144 133 125 145 103 145Z"
                fill={markAccent}
                fillOpacity={0.22}
              />
              <Path
                d="M80 139C65 139 54 130 54 116C54 103 64 95 72 87C80 78 83 68 84 56C98 71 105 86 103 100C108 94 111 88 113 81C120 94 123 106 123 117C123 131 110 139 93 139Z"
                fill={markTint}
                fillOpacity={markOpacity * 0.62}
              />
            </G>
          );
        })}
        {GAMEPAD_MARKS.map(([cx, cy, rot], i) => {
          const markTint = getWatermarkTone(tint, tintBottom, cy);
          const markAccent = getWatermarkTone(svgAccent, svgAccentBottom, cy);
          const markOpacity = getWatermarkOpacity(opacity, opacityBottom, cy);

          return (
            <G key={`gamepad-${i}`} opacity={markOpacity} fill={markTint}
              transform={`translate(${cx} ${cy}) rotate(${rot}) scale(0.56) translate(-60 -60)`}>
              <Path d="M23 46C18 48 15 55 14 66L12 80C11 92 18 100 28 96L43 89C47 87 51 86 56 86H64C69 86 73 87 77 89L92 96C102 100 109 92 108 80L106 66C105 55 102 48 97 46C91 43 81 44 74 48C70 50 66 51 60 51C54 51 50 50 46 48C39 44 29 43 23 46Z" />
              <Rect x={31} y={61} width={24} height={8} rx={4} fill={markAccent} fillOpacity={0.62} />
              <Rect x={39} y={53} width={8} height={24} rx={4} fill={markAccent} fillOpacity={0.62} />
              <Circle cx={78} cy={60} r={5} fill={markAccent} fillOpacity={0.62} />
              <Circle cx={90} cy={70} r={5} fill={markAccent} fillOpacity={0.62} />
            </G>
          );
        })}
        {/* ── Открытый сундук — SVG, 120×120, центр (60,60) ──────────────────── */}
        {OPEN_MARKS.map(([cx, cy, rot], i) => {
          const markTint = getWatermarkTone(tint, tintBottom, cy);
          const markAccent = getWatermarkTone(svgAccent, svgAccentBottom, cy);
          const markOpacity = getWatermarkOpacity(opacity, opacityBottom, cy);

          return (
            <G key={`open-${i}`} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(0.54) translate(-60 -60)`}>
              <Path
                d="M14 56L14 92C14 96 18 96 60 96C102 96 106 96 106 92L106 56C106 46 88 40 60 40C32 40 14 46 14 56Z"
                fill={markTint}
                opacity={markOpacity}
              />
              <Path
                d="M18 38C18 22 40 8 60 8C80 8 102 22 102 38L102 44L18 44Z"
                fill={markTint}
                opacity={markOpacity}
              />
              <Path
                d="M28 38C28 22 46 14 60 14C74 14 92 22 92 38"
                fill="none"
                stroke={markAccent}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeOpacity={0.24}
              />
              <Path
                d="M20 56C20 48 38 44 60 44C82 44 100 48 100 56L100 60C100 52 82 48 60 48C38 48 20 52 20 60Z"
                fill={markTint}
                fillOpacity={0.12}
              />
              <Path
                d="M18 44L102 44"
                fill="none"
                stroke={markAccent}
                strokeWidth={2.5}
                strokeOpacity={0.22}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

type PatternedBackdropProps = {
  gradientId: string;
  stops: Array<{ color: string; offset: string }>;
  watermarks?: IconWatermarksProps;
};

const PatternedBackdrop = ({ gradientId, stops, watermarks }: PatternedBackdropProps) => {
  const hasArcadeGlow = gradientId === 'bg-arcade-blue';

  return (
    <View style={styles.mapBackdrop} pointerEvents="none">
      <Svg height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 390 844" width="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" x2="0.25" y1="0" y2="1">
            {stops.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </LinearGradient>
          {hasArcadeGlow && (
            <>
              <RadialGradient id={`${gradientId}-glow`} cx="50%" cy="12%" r="68%">
                <Stop offset="0" stopColor="#FFE08A" stopOpacity={0.58} />
                <Stop offset="0.42" stopColor="#FFB35A" stopOpacity={0.24} />
                <Stop offset="1" stopColor="#FFB35A" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id={`${gradientId}-center`} cx="52%" cy="42%" r="72%">
                <Stop offset="0" stopColor="#FFD86A" stopOpacity={0.30} />
                <Stop offset="1" stopColor="#FFD86A" stopOpacity={0} />
              </RadialGradient>
            </>
          )}
        </Defs>
        <Rect fill={`url(#${gradientId})`} height="844" width="390" />
        {hasArcadeGlow && <Rect fill={`url(#${gradientId}-glow)`} height="844" width="390" />}
        {hasArcadeGlow && <Rect fill={`url(#${gradientId}-center)`} height="844" width="390" />}
      </Svg>
      <IconWatermarks {...watermarks} />
    </View>
  );
};

const AbstractTreasureMapBackdrop = () => (
  <PatternedBackdrop
    gradientId="bg-lavender"
    stops={[
      { offset: '0', color: '#ECEEF6' },
      { offset: '0.48', color: '#EAEBF5' },
      { offset: '0.78', color: '#EFE8F3' },
      { offset: '1', color: '#F1E5F1' },
    ]}
  />
);

const BlueArcadeBackdrop = () => (
  <PatternedBackdrop
    gradientId="bg-arcade-blue"
    stops={[
      { offset: '0', color: '#F99438' },
      { offset: '0.44', color: '#F17326' },
      { offset: '0.78', color: '#D9571E' },
      { offset: '1', color: '#B94318' },
    ]}
    watermarks={{
      bakedPngBoostOpacity: 0.38,
      forceTintPng: true,
      opacity: 0.16,
      opacityBottom: 0.2,
      svgAccent: '#FFE0A8',
      svgAccentBottom: '#FFF5D6',
      tint: '#91320F',
      tintBottom: '#FFF0C6',
    }}
  />
);

const WatermarkGridDebugOverlay = () => (
  <View pointerEvents="none" style={styles.watermarkDebugOverlay}>
    <Svg height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 390 844" width="100%">
      {Array.from({ length: PATTERN_ROW_COUNT }).map((_, row) => {
        const [, y] = getMarkAt(row, 0);
        const isShifted = row % 2 === 1;

        return (
          <Line
            key={`row-${row}`}
            opacity={0.42}
            stroke={isShifted ? '#1E9E86' : '#1647B7'}
            strokeWidth={1}
            x1={-80}
            x2={470}
            y1={y}
            y2={y}
          />
        );
      })}
      {Array.from({ length: PATTERN_ROW_COUNT - 1 }).flatMap((_, row) =>
        Array.from({ length: PATTERN_COL_COUNT }).map((__, col) => {
          const [x1, y1] = getMarkAt(row, col);
          const [x2, y2] = getMarkAt(row + 1, col);

          return (
            <Line
              key={`diag-${row}-${col}`}
              opacity={0.68}
              stroke="#EF5424"
              strokeWidth={1.5}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        }),
      )}
      {MARKS.map(([x, y], index) => {
        const row = Math.floor(index / PATTERN_COL_COUNT);
        const isShifted = row % 2 === 1;

        return (
          <G key={`point-${index}`}>
            <Circle
              cx={x}
              cy={y}
              fill="none"
              opacity={0.38}
              r={34}
              stroke={isShifted ? '#1E9E86' : '#1647B7'}
              strokeDasharray="4 5"
              strokeWidth={1}
            />
            <Circle cx={x} cy={y} fill={isShifted ? '#1E9E86' : '#1647B7'} opacity={0.92} r={5.5} />
          </G>
        );
      })}
      <Rect fill="none" height={843} opacity={0.5} stroke="#12314A" strokeWidth={1} width={389} x={0.5} y={0.5} />
    </Svg>
  </View>
);

export const AppScreen = ({
  title,
  subtitle,
  headerRight,
  showBackButton,
  bottomBar,
  children,
  contentStyle,
  onContentSizeChange,
  scrollRef,
}: AppScreenProps) => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { pointTransactions } = useFamilyPoints();
  const isDashboard = pathname === '/parent/dashboard' || pathname === '/child/dashboard';
  const isChildDashboard = pathname === '/child/dashboard';
  const isChildArcade = pathname.startsWith('/child');
  const isWelcome = pathname === '/';
  const isChildPage = pathname.startsWith('/child');
  const shouldShowBalancePill = isChildPage;
  const childBalance = isChildPage ? getBalance(pointTransactions, activeChildId) : 0;
  const effectiveHeaderRight = headerRight ?? (isChildPage ? <BalancePill points={childBalance} /> : undefined);
  const showWatermarkGridDebug = getWatermarkDebugEnabled();
  const hasBottomNavigationSpace =
    bottomBar !== undefined || shouldShowBottomNavigation(pathname);
  const shouldShowBackButton =
    showBackButton ?? (pathname !== '/' && !isDashboard && !hasBottomNavigationSpace);

  const handleBackPress = () => {
    try {
      if (router.canDismiss()) {
        router.dismiss();
        return;
      }
    } catch {
      router.replace('/');
      return;
    }

    router.replace('/');
  };

  return (
    <View style={[styles.screenRoot, isChildDashboard && styles.childDashboardRoot, isChildArcade && styles.arcadeScreenRoot]}>
      {isChildArcade ? <BlueArcadeBackdrop /> : <AbstractTreasureMapBackdrop />}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          alwaysBounceHorizontal={false}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            hasBottomNavigationSpace && styles.contentWithBottomBar,
            contentStyle,
          ]}
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={onContentSizeChange}
          scrollIndicatorInsets={hasBottomNavigationSpace ? styles.scrollIndicatorInsets : undefined}>
          {!hasBottomNavigationSpace && (
            <View style={[styles.topBar, isWelcome && styles.topBarWelcome]}>
              {shouldShowBackButton ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleBackPress}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <Text style={styles.backText}>{t('common.back')}</Text>
                </Pressable>
              ) : (
                !isWelcome && <BrandLogo height={44} style={styles.topLogo} />
              )}
              {isWelcome ? (
                <LanguageToggle />
              ) : (
                <View style={styles.topActions}>
                  {shouldShowBalancePill && <BalancePill points={childBalance} />}
                  <AppHeaderMenu />
                </View>
              )}
            </View>
          )}

          {Boolean(title || subtitle || effectiveHeaderRight) && (
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  {Boolean(title) && (
                    <OutlineText style={[styles.title, gameText, isChildArcade && styles.arcadeTitle]}>
                      {title}
                    </OutlineText>
                  )}
                  {Boolean(subtitle) && (
                    <Text style={[styles.subtitle, isChildArcade && styles.arcadeSubtitle]}>
                      {subtitle}
                    </Text>
                  )}
                </View>
                {effectiveHeaderRight && <View style={styles.headerRight}>{effectiveHeaderRight}</View>}
              </View>
            </View>
          )}
          {children}
        </ScrollView>
      </SafeAreaView>
      {showWatermarkGridDebug && <WatermarkGridDebugOverlay />}
      {bottomBar && <View style={styles.bottomBar}>{bottomBar}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    backgroundColor: '#ECEEF6',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  childDashboardRoot: {
    backgroundColor: '#ECEEF6',
  },
  arcadeScreenRoot: {
    backgroundColor: '#F17326',
  },
  safeArea: {
    backgroundColor: 'transparent',
    flex: 1,
    minHeight: 0,
  },
  mapBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  watermarkDebugOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingBottom: 22,
    paddingTop: 10,
    gap: 14,
  },
  contentWithBottomBar: {
    paddingBottom: 154,
  },
  bottomBar: {
    bottom: 0,
    elevation: 30,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 30,
  },
  scrollIndicatorInsets: {
    bottom: 154,
  },
  header: {
    gap: 5,
    marginBottom: 2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  topBarWelcome: {
    justifyContent: 'flex-end',
  },
  topLogo: {
    flexShrink: 0,
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 10,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backText: {
    color: FP.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  title: {
    color: FP.text,
    fontSize: 30,
    letterSpacing: 0,
  },
  arcadeTitle: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 15,
    lineHeight: 22,
  },
  arcadeSubtitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    transform: [{ translateY: 4 }],
  },
});
