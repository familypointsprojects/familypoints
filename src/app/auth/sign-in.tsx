import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { isSupabaseConfigured } from '@/shared/services/supabase';
import {
  clearPendingParentInvite,
  getPendingParentInvite,
  validateParentInvite,
} from '@/shared/services/supabase/parentInviteService';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, BrandLogo, StatusBadge } from '@/shared/ui';
import { FP } from '@/constants/theme';

type TabType = 'signin' | 'signup';

const SignInScreen = () => {
  const { t } = useLanguage();
  const { parentInvite } = useLocalSearchParams<{ parentInvite?: string }>();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { reloadState } = useFamilyPoints();
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

  const applyPendingParentInvite = async (): Promise<boolean> => {
    const inviteToken = await getPendingParentInvite();

    if (!inviteToken) {
      return false;
    }

    await validateParentInvite(inviteToken);
    await clearPendingParentInvite();
    await reloadState();
    router.replace('/parent/dashboard');

    return true;
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const session = await signInWithGoogle();
      if (await applyPendingParentInvite()) {
        return;
      }
      router.replace(session.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Google sign-in was cancelled') {
        return;
      }

      setError(err instanceof Error ? err.message : 'Ошибка входа через Google');
    } finally {
      setIsLoading(false);
    }
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
        if (await applyPendingParentInvite()) {
          return;
        }
        router.replace('/onboarding');
        return;
      }

      const session = await signIn({ email: email.trim(), password });
      if (await applyPendingParentInvite()) {
        return;
      }
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
        {parentInvite === '1' && (
          <View style={styles.inviteNotice}>
            <StatusBadge label="Приглашение родителя" tone="success" />
            <Text style={styles.inviteNoticeText}>
              Войдите или зарегистрируйтесь, и мы подключим вас к семье.
            </Text>
          </View>
        )}
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

          {isSupabaseConfigured && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>или</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}>
                <Svg width={20} height={20} viewBox="0 0 48 48">
                  <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </Svg>
                <Text style={styles.googleText}>Войти через Google</Text>
              </Pressable>
            </>
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
  inviteNotice: {
    backgroundColor: FP.primaryLight,
    borderColor: FP.primary,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  inviteNoticeText: {
    color: FP.text,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: FP.muted,
  },
  dividerText: {
    color: FP.textSub,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: FP.muted,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: FP.white,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '700',
    color: FP.text,
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
