import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { AppButton, AppCard, AppScreen, BrandLogo, SectionTitle, StatusBadge } from '@/shared/ui';
import { FP } from '@/constants/theme';

const WelcomeScreen = () => {
  const { t } = useLanguage();
  const { session } = useAuth();

  return (
    <AppScreen contentStyle={styles.content} showBackButton={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <BrandLogo size={82} />
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
        <SectionTitle title={t('welcome.startTitle')} />
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
            title={t('welcome.parentAccount')}
            onPress={() => router.push('/auth/sign-in')}
          />
          <AppButton
            title={t('welcome.childInvite')}
            variant="secondary"
            onPress={() => router.push('/auth/scan-invite')}
          />
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
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: FP.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
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
