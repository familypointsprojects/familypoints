import { PropsWithChildren, ReactNode } from 'react';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export const AppScreen = ({
  title,
  subtitle,
  showBackButton,
  bottomBar,
  children,
  contentStyle,
}: AppScreenProps) => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { pointTransactions } = useFamilyPoints();
  const isDashboard = pathname === '/parent/dashboard' || pathname === '/child/dashboard';
  const isWelcome = pathname === '/';
  const shouldShowBalancePill = pathname.startsWith('/child') && pathname !== '/child/balance';
  const childBalance = shouldShowBalancePill ? getBalance(pointTransactions, activeChildId) : 0;
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
    <View style={styles.screenRoot}>
      {/* Subtle dot grid overlay at the top */}
      <View style={styles.gridLayer} pointerEvents="none" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
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

          {Boolean(title || subtitle) && (
            <View style={styles.header}>
              {Boolean(title) && <Text style={styles.title}>{title}</Text>}
              {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
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
  safeArea: {
    backgroundColor: 'transparent',
    flex: 1,
    minHeight: 0,
  },
  gridLayer: {
    bottom: 0,
    left: 0,
    opacity: 0.55,
    position: 'absolute',
    right: 0,
    top: 0,
    borderColor: 'rgba(22, 71, 183, 0.055)',
    borderWidth: 0,
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
    paddingBottom: 148,
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
    bottom: 148,
  },
  header: {
    gap: 5,
    marginBottom: 2,
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
