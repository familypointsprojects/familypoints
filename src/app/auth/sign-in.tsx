import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { isSupabaseConfigured } from '@/shared/services/supabase';
import { AppButton, AppCard, AppScreen, AppTextInput, BrandLogo, StatusBadge } from '@/shared/ui';
import { FP } from '@/constants/theme';

type TabType = 'signin' | 'signup';

const SignInScreen = () => {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<TabType>('signin');
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (tab === 'signup' && !parentName.trim()) {
      return false;
    }

    return Boolean(email.trim() && password.length >= (tab === 'signup' ? 6 : 1));
  };

  const handleAuthSubmit = async () => {
    if (!validateForm()) {
      setError(t('common.checkForm'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (tab === 'signup') {
        await signUp({ email: email.trim(), password, parentName: parentName.trim() });
        router.replace('/onboarding');
        return;
      }

      const session = await signIn({ email: email.trim(), password });
      router.replace(session.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen>
      {/* Logo */}
      <View style={styles.logoBlock}>
        <BrandLogo height={224} width={520} />
        <Text style={styles.logoTitle}>{t('common.appName')}</Text>
        <Text style={styles.logoSub}>Войдите или создайте аккаунт</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['signin', 'signup'] as TabType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'signin' ? 'Войти' : 'Регистрация'}
            </Text>
          </Pressable>
        ))}
      </View>

      <AppCard>
        {tab === 'signup' && (
          <AppTextInput
            label={t('auth.parentName')}
            value={parentName}
            onChangeText={setParentName}
            placeholder={t('auth.parentNamePlaceholder')}
          />
        )}
        <AppTextInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppTextInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          secureTextEntry
        />

        <View style={styles.actions}>
          {isSupabaseConfigured ? (
            <AppButton
              title={
                isLoading
                  ? (tab === 'signin' ? t('auth.signingIn') : t('auth.signingUp'))
                  : (tab === 'signin' ? t('auth.signIn') : t('auth.signUp'))
              }
              onPress={handleAuthSubmit}
              disabled={isLoading}
            />
          ) : (
            <AppButton title={t('auth.realAuthLater')} onPress={() => {}} disabled variant="secondary" />
          )}
        </View>

        {Boolean(error) && (
          <View style={styles.errorRow}>
            <StatusBadge label={t('auth.signInError')} tone="warning" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </AppCard>

      {/* Child entry */}
      <AppCard style={styles.childCard}>
        <View style={styles.childRow}>
          <Text style={styles.childEmoji}>👋</Text>
          <View style={styles.childText}>
            <Text style={styles.childTitle}>Я ребёнок</Text>
            <Text style={styles.childHint}>
              Попроси родителя показать QR-код или отправить ссылку-приглашение
            </Text>
          </View>
        </View>
        <AppButton
          title="Войти по QR / ссылке"
          variant="secondary"
          onPress={() => router.push('/auth/scan-invite')}
        />
      </AppCard>
    </AppScreen>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  logoBlock: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  logoTitle: {
    color: FP.text,
    fontSize: 22,
    fontWeight: '900',
  },
  logoSub: {
    color: FP.textSub,
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: FP.muted,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: FP.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: FP.textSub,
  },
  tabTextActive: {
    color: FP.text,
    fontWeight: '800',
  },
  actions: {
    gap: 10,
  },
  errorRow: {
    gap: 6,
  },
  errorText: {
    color: FP.red,
    fontSize: 14,
    lineHeight: 20,
  },
  childCard: {
    gap: 12,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  childEmoji: {
    fontSize: 28,
  },
  childText: {
    flex: 1,
    gap: 3,
  },
  childTitle: {
    color: FP.text,
    fontSize: 16,
    fontWeight: '800',
  },
  childHint: {
    color: FP.textSub,
    fontSize: 13,
    lineHeight: 19,
  },
});
