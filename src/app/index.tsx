import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { AppButton, AppCard, AppScreen, BrandLogo, SectionTitle, StatusBadge } from '@/shared/ui';
import { QuestFlowPill } from '@/shared/ui/QuestFlowPill';
import { FP } from '@/constants/theme';

const WelcomeScreen = () => {
  const { t } = useLanguage();
  const { session } = useAuth();

  return (
    <AppScreen contentStyle={styles.content} showBackButton={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <BrandLogo height={160} style={styles.heroLogo} />
        <Text style={styles.heroTitle}>{t('welcome.heroTitle')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

        <QuestFlowPill />
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
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  heroLogo: {
    alignSelf: 'center',
  },
  heroTitle: {
    color: FP.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 33,
    textAlign: 'center',
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 340,
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
