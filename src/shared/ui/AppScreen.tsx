import { PropsWithChildren, ReactNode, RefObject } from 'react';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { AppHeaderMenu } from '@/shared/ui/AppHeaderMenu';
import { BalancePill } from '@/shared/ui/BalancePill';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
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

type MapBackdropProps = {
  emphasis?: boolean;
};

const AbstractTreasureMapBackdrop = ({ emphasis = false }: MapBackdropProps) => {
  const orbitOpacity = emphasis ? 0.18 : 0.12;
  const routeOpacity = emphasis ? 0.34 : 0.24;
  const nodeOpacity = emphasis ? 0.24 : 0.17;

  return (
    <View style={styles.mapBackdrop} pointerEvents="none">
      <Svg
        height="100%"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        viewBox="0 0 390 844"
        width="100%">
        <Defs>
          <LinearGradient id="constellation-field" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#F8FAF4" />
            <Stop offset="0.45" stopColor="#EEF4EE" />
            <Stop offset="1" stopColor="#F8EFEA" />
          </LinearGradient>
          <LinearGradient id="constellation-cool-wash" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="#E5EEF4" stopOpacity="0.48" />
            <Stop offset="0.48" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="1" stopColor="#F3DCD5" stopOpacity="0.34" />
          </LinearGradient>
        </Defs>

        <Rect fill="url(#constellation-field)" height="844" width="390" />
        <Rect fill="url(#constellation-cool-wash)" height="844" width="390" />

        <Path
          d="M-58 70C36 14 142 20 216 82C284 139 356 146 448 108V-26H-58Z"
          fill="#E1EBE1"
          opacity={0.5}
        />
        <Path
          d="M246 246C311 210 378 223 438 286V526C368 486 300 491 244 540C178 598 96 588 28 512C-16 463-36 406-30 340C61 374 145 363 246 246Z"
          fill="#E8ECEF"
          opacity={0.45}
        />
        <Path
          d="M-52 651C8 600 86 599 142 652C192 699 246 709 312 675C353 654 389 657 424 686V870H-52Z"
          fill="#F2DDD7"
          opacity={0.44}
        />

        <Path
          d="M-52 194C46 146 151 152 238 209C309 256 370 261 444 226"
          fill="none"
          opacity={orbitOpacity}
          stroke="#4F6D68"
          strokeLinecap="round"
          strokeWidth={1}
        />
        <Path
          d="M-44 291C52 246 148 253 224 304C298 354 365 360 442 320"
          fill="none"
          opacity={orbitOpacity * 0.86}
          stroke="#4F6D68"
          strokeLinecap="round"
          strokeWidth={1}
        />
        <Path
          d="M-38 430C46 383 143 387 218 438C292 489 362 496 440 458"
          fill="none"
          opacity={orbitOpacity * 0.8}
          stroke="#526078"
          strokeLinecap="round"
          strokeWidth={1}
        />
        <Path
          d="M-42 760C47 709 152 714 232 766C302 812 368 814 442 772"
          fill="none"
          opacity={orbitOpacity * 0.76}
          stroke="#9B6E62"
          strokeLinecap="round"
          strokeWidth={1}
        />

        <Path
          d="M286 74C256 130 258 194 292 247C322 293 324 348 296 396C268 443 270 501 306 553"
          fill="none"
          opacity={orbitOpacity}
          stroke="#526078"
          strokeLinecap="round"
          strokeWidth={1}
        />
        <Path
          d="M316 72C285 136 290 198 326 250C358 296 362 351 332 404C303 454 308 505 346 554"
          fill="none"
          opacity={orbitOpacity * 0.72}
          stroke="#526078"
          strokeLinecap="round"
          strokeWidth={1}
        />

        <Path
          d="M58 184C94 250 145 281 210 276C264 272 292 330 340 354"
          fill="none"
          opacity={routeOpacity}
          stroke="#5E7E75"
          strokeLinecap="round"
          strokeDasharray="2 10"
          strokeWidth={1.9}
        />
        <Path
          d="M54 646C104 607 154 604 204 636C250 666 300 661 348 620"
          fill="none"
          opacity={routeOpacity * 0.9}
          stroke="#B56F5E"
          strokeLinecap="round"
          strokeDasharray="2 10"
          strokeWidth={1.9}
        />

        <Path d="M82 121h34M99 104v34" opacity={0.08} stroke="#526078" strokeLinecap="round" strokeWidth={1.2} />
        <Path d="M314 164h26M327 151v26" opacity={0.1} stroke="#5E7E75" strokeLinecap="round" strokeWidth={1.2} />
        <Path d="M112 506h24M124 494v24" opacity={0.08} stroke="#B56F5E" strokeLinecap="round" strokeWidth={1.2} />
        <Path d="M285 721h28M299 707v28" opacity={0.08} stroke="#526078" strokeLinecap="round" strokeWidth={1.2} />

        <Circle cx={58} cy={184} fill="#5E7E75" opacity={nodeOpacity} r={6} />
        <Circle cx={145} cy={281} fill="#526078" opacity={nodeOpacity * 0.86} r={5} />
        <Circle cx={210} cy={276} fill="#B99B59" opacity={nodeOpacity * 0.9} r={5.5} />
        <Circle cx={340} cy={354} fill="#B56F5E" opacity={nodeOpacity} r={6} />
        <Circle cx={54} cy={646} fill="#526078" opacity={nodeOpacity * 0.86} r={5.5} />
        <Circle cx={204} cy={636} fill="#5E7E75" opacity={nodeOpacity} r={5.5} />
        <Circle cx={348} cy={620} fill="#B56F5E" opacity={nodeOpacity} r={6} />

        <Circle cx={34} cy={44} fill="#2F3C45" opacity={0.026} r={1.2} />
        <Circle cx={168} cy={54} fill="#2F3C45" opacity={0.024} r={1.1} />
        <Circle cx={246} cy={156} fill="#2F3C45" opacity={0.024} r={1.1} />
        <Circle cx={74} cy={354} fill="#2F3C45" opacity={0.022} r={1} />
        <Circle cx={330} cy={482} fill="#2F3C45" opacity={0.026} r={1.2} />
        <Circle cx={142} cy={738} fill="#2F3C45" opacity={0.024} r={1.1} />
      </Svg>
    </View>
  );
};

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
  const isWelcome = pathname === '/';
  const isChildPage = pathname.startsWith('/child') && pathname !== '/child/balance';
  const shouldShowBalancePill = isChildPage;
  const childBalance = isChildPage ? getBalance(pointTransactions, activeChildId) : 0;
  const effectiveHeaderRight = headerRight ?? (isChildPage ? <BalancePill points={childBalance} /> : undefined);
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
    <View style={[styles.screenRoot, isChildDashboard && styles.childDashboardRoot]}>
      <AbstractTreasureMapBackdrop emphasis={isChildDashboard} />
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
                  {Boolean(title) && <Text style={styles.title}>{title}</Text>}
                  {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {effectiveHeaderRight && <View style={styles.headerRight}>{effectiveHeaderRight}</View>}
              </View>
            </View>
          )}
          {children}
        </ScrollView>
      </SafeAreaView>
      {bottomBar && <View style={styles.bottomBar}>{bottomBar}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    backgroundColor: FP.bg,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  childDashboardRoot: {
    backgroundColor: FP.bg,
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
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 15,
    lineHeight: 22,
  },
});
