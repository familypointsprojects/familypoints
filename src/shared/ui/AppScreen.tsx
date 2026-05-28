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
import { AppHeaderMenu } from '@/shared/ui/AppHeaderMenu';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { shouldShowBottomNavigation } from '@/shared/ui/bottomNavigationRoutes';

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
  const isDashboard = pathname === '/parent/dashboard' || pathname === '/child/dashboard';
  const isWelcome = pathname === '/';
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
          <View style={styles.topBar}>
            {shouldShowBackButton ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleBackPress}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Text style={styles.backText}>{t('common.back')}</Text>
              </Pressable>
            ) : (
              <View style={styles.topBarSpacer} />
            )}
            {isWelcome ? <LanguageToggle /> : <AppHeaderMenu />}
          </View>

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
    backgroundColor: FP.bg,
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 20,
    gap: 16,
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
    gap: 6,
    marginBottom: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarSpacer: {
    width: 42,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backText: {
    color: FP.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  title: {
    color: FP.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 15,
    lineHeight: 22,
  },
});
