import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { family } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';
import { FP } from '@/constants/theme';
import type { UserRole } from '@/shared/types/family';

const WelcomeScreen = () => {
  const { t } = useLanguage();
  const { session, signInDemoRole } = useAuth();
  const { resetDemoData } = useFamilyPoints();

  const handleContinue = async (role: UserRole) => {
    try {
      await signInDemoRole({ role });
      router.replace(role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
    } catch (error) {
      Alert.alert(t('common.checkForm'), String(error));
    }
  };

  const handleResetDemoData = () => {
    Alert.alert(t('demo.resetTitle'), t('demo.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('demo.resetConfirm'),
        style: 'destructive',
        onPress: resetDemoData,
      },
    ]);
  };

  return (
    <AppScreen contentStyle={styles.content} showBackButton={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>⭐</Text>
        </View>
        <Text style={styles.appName}>{t('common.appName')}</Text>
        <Text style={styles.heroTitle}>{t('welcome.heroTitle')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

        {/* Emoji strip */}
        <View style={styles.emojiRow}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.emoji}>⭐</Text>
          <Text style={styles.emoji}>🏆</Text>
        </View>
      </View>

      <AppCard>
        <SectionTitle title={t(family.nameKey)} />
        {session && (
          <View style={styles.sessionRow}>
            <StatusBadge label={t('auth.signedInAs', { name: session.name })} tone="success" />
            <Text style={styles.sessionText}>
              {session.role === 'parent' ? t('auth.roleParent') : t('auth.roleChild')}
            </Text>
          </View>
        )}
        <View style={styles.actions}>
          <AppButton
            title={t('welcome.continueParent')}
            onPress={() => handleContinue('parent')}
          />
          <AppButton
            title={t('welcome.continueChild')}
            variant="secondary"
            onPress={() => handleContinue('child')}
          />
          <AppButton
            title={t('common.settings')}
            variant="secondary"
            onPress={() => router.push('/settings')}
          />
          <AppButton
            title={t('auth.signInTitle')}
            variant="ghost"
            onPress={() => router.push('/auth/sign-in')}
          />
          <AppButton
            title={t('onboarding.title')}
            variant="ghost"
            onPress={() => router.push('/onboarding')}
          />
          <AppButton title={t('demo.reset')} variant="ghost" onPress={handleResetDemoData} />
        </View>
      </AppCard>
    </AppScreen>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: FP.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    color: FP.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: FP.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 37,
    textAlign: 'center',
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: FP.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 4,
  },
  emoji: {
    fontSize: 30,
  },
  sessionRow: {
    gap: 8,
  },
  sessionText: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
});
