import 'react-native-url-polyfill/auto';

import { router, Stack, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { AuthProvider } from '@/shared/auth';
import { LanguageProvider } from '@/shared/i18n';
import { FamilyPointsProvider } from '@/shared/state';

const DeepLinkHandler = () => {
  const pathname = usePathname();

  useEffect(() => {
    const handleUrl = (url: string) => {
      // familypoints://invite/<token>
      const match = url.match(/invite\/([a-f0-9-]{36})/);
      if (match) {
        router.push({ pathname: '/auth/scan-invite', params: { token: match[1] } });
      }
    };

    // Ссылка при холодном старте
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Ссылка когда приложение уже открыто
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => subscription.remove();
  }, []);

  return null;
};

const RootLayout = () => (
  <LanguageProvider>
    <AuthProvider>
      <FamilyPointsProvider>
        <DeepLinkHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: '#F8F7FF' },
            headerTintColor: '#111827',
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#F8F7FF' },
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
          <Stack.Screen name="parent/create-child" />
          <Stack.Screen name="child/dashboard" />
          <Stack.Screen name="child/tasks" />
          <Stack.Screen name="child/task-details" />
          <Stack.Screen name="child/balance" />
          <Stack.Screen name="child/wishes" />
          <Stack.Screen name="child/rewards" />
        </Stack>
      </FamilyPointsProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default RootLayout;
