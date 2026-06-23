import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import { router, Stack, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/shared/auth';
import { fonts, FP } from '@/constants/theme';
import { LanguageProvider } from '@/shared/i18n';
import { FamilyPointsProvider } from '@/shared/state';
import { GrowthMissionsProvider } from '@/shared/state/GrowthMissionsProvider';
import { AppBottomNavigation } from '@/shared/ui/AppBottomNavigation';
import { shouldShowBottomNavigation } from '@/shared/ui/bottomNavigationRoutes';

const getDashboardRoute = (role: 'parent' | 'child') =>
  role === 'parent' ? '/parent/dashboard' : '/child/dashboard';

const isGuestOnlyRoute = (pathname: string): boolean =>
  pathname === '/' || (pathname.startsWith('/auth') && pathname !== '/auth/scan-invite');

const isRoleMismatchRoute = (pathname: string, role: 'parent' | 'child'): boolean =>
  (role === 'parent' && pathname.startsWith('/child')) ||
  (role === 'child' && (pathname.startsWith('/parent') || pathname === '/onboarding'));

const AuthRouteGuard = () => {
  const pathname = usePathname();
  const { hasHydrated, session } = useAuth();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (session) {
      const dashboardRoute = getDashboardRoute(session.role);

      if (isGuestOnlyRoute(pathname) || isRoleMismatchRoute(pathname, session.role)) {
        router.replace(dashboardRoute);
      }

      return;
    }

    if (pathname.startsWith('/parent') || pathname.startsWith('/child') || pathname === '/onboarding') {
      router.replace('/');
    }
  }, [hasHydrated, pathname, session]);

  return null;
};

const DeepLinkHandler = () => {
  const { session } = useAuth();

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parentMatch = url.match(/invite\/parent\/([a-f0-9-]{36})/);
      const childMatch = parentMatch ? null : url.match(/invite\/([a-f0-9-]{36})/);

      if (!parentMatch && !childMatch) return;

      const match = parentMatch || childMatch;
      const token = match?.[1];

      if (!token) return;

      const inviteType = parentMatch ? 'parent' : 'child';

      // familypoints://invite/parent/<token> или familypoints://invite/<token>
      router.push({ pathname: '/auth/scan-invite', params: { token, inviteType } });
    };

    // Ссылка при холодном старте
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Ссылка когда приложение уже открыто
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => subscription.remove();
  }, [session]);

  return null;
};

const RootNavigation = () => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const showBottomNavigation = shouldShowBottomNavigation(pathname);
  const isChildArcade = pathname.startsWith('/child');

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: FP.bg },
          headerTintColor: FP.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: FP.bg },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/scan-invite" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="parent/dashboard" />
        <Stack.Screen name="parent/tasks" />
        <Stack.Screen name="parent/create-task" />
        <Stack.Screen name="parent/edit-task" />
        <Stack.Screen name="parent/submissions" />
        <Stack.Screen name="parent/rewards" />
        <Stack.Screen name="parent/create-reward" />
        <Stack.Screen name="parent/redemptions" />
        <Stack.Screen name="parent/invite-child" />
        <Stack.Screen name="parent/wish-requests" />
        <Stack.Screen name="parent/create-child" />
        <Stack.Screen name="parent/add-member" />
        <Stack.Screen name="parent/create-parent" />
        <Stack.Screen name="parent/invite-parent" />
        <Stack.Screen name="parent/edit-parent" />
        <Stack.Screen name="child/dashboard" />
        <Stack.Screen name="child/tasks" />
        <Stack.Screen name="child/task-details" />
        <Stack.Screen name="child/balance" />
        <Stack.Screen name="child/wishes" />
        <Stack.Screen name="child/rewards" />
        <Stack.Screen name="child/history" />
        <Stack.Screen name="child/achievements" />
        <Stack.Screen name="parent/growth-missions" />
        <Stack.Screen name="parent/create-growth-mission" />
        <Stack.Screen name="child/growth-missions" />
      </Stack>
      {showBottomNavigation && (
        <View
          pointerEvents="box-none"
          style={[styles.bottomNavigation, { bottom: isChildArcade ? 0 : Math.max(insets.bottom, 14) }]}>
          <AppBottomNavigation />
        </View>
      )}
    </View>
  );
};

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    [fonts.game]: require('@/assets/fonts/FranxurterTotallyFat.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <BottomSheetModalProvider>
        <LanguageProvider>
          <AuthProvider>
            <FamilyPointsProvider>
              <GrowthMissionsProvider>
                <AuthRouteGuard />
                <DeepLinkHandler />
                <RootNavigation />
              </GrowthMissionsProvider>
            </FamilyPointsProvider>
          </AuthProvider>
        </LanguageProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  bottomNavigation: {
    backgroundColor: 'transparent',
    bottom: 0,
    elevation: 30,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 30,
  },
  gestureRoot: {
    backgroundColor: FP.bg,
    flex: 1,
  },
  root: {
    backgroundColor: FP.bg,
    flex: 1,
    position: 'relative',
  },
});
