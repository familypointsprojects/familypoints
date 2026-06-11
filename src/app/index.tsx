import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { AppButton, AppCard, AppScreen, BrandLogo, SectionTitle, StatusBadge } from '@/shared/ui';
import { QuestFlowPill } from '@/shared/ui/QuestFlowPill';
import { FP } from '@/constants/theme';

const mascotSource = require('../../design/assets/mascot/easyquest-rocket-clean.png');

const WelcomeScreen = () => {
  const { t } = useLanguage();
  const { session } = useAuth();

  return (
    <AppScreen contentStyle={styles.content} showBackButton={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroLogoPlate}>
            <BrandLogo height={58} style={styles.heroLogo} />
          </View>
          <Image
            source={mascotSource}
            style={styles.heroMascot}
            contentFit="contain"
            accessibilityLabel="easyQuest rocket"
          />
        </View>
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
    backgroundColor: FP.primaryDark,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 30,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 14,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  heroLogoPlate: {
    alignItems: 'center',
    backgroundColor: FP.white,
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroLogo: {
    alignSelf: 'center',
  },
  heroMascot: {
    height: 116,
    width: 116,
  },
  heroTitle: {
    color: FP.white,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 33,
    textAlign: 'center',
  },
  subtitle: {
    color: '#DDEBFF',
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
