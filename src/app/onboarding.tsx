import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { isSupabaseConfigured } from '@/shared/services/supabase';
import { createFamily } from '@/shared/services/supabase/onboardingService';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle, StatusBadge } from '@/shared/ui';

const OnboardingScreen = () => {
  const { t } = useLanguage();
  const { signIn, signInDemoRole } = useAuth();
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [childName, setChildName] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSupabase = async () => {
    const isValid =
      parentName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      familyName.trim().length > 0 &&
      childName.trim().length > 0;

    if (!isValid) {
      setIsSuccess(false);
      setMessage(t('onboarding.invalidSupabase'));
      return;
    }

    setMessage('');
    setIsLoading(true);

    try {
      await createFamily({
        parentEmail: email.trim(),
        parentPassword: password,
        parentName: parentName.trim(),
        familyName: familyName.trim(),
        childName: childName.trim(),
      });

      setIsSuccess(true);
      setMessage(t('onboarding.successSupabase'));

      const session = await signIn({ email: email.trim(), password });
      router.replace(session.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
    } catch (err: unknown) {
      setIsSuccess(false);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessage(t('onboarding.error', { message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemo = async () => {
    if (familyName.trim().length === 0 || childName.trim().length === 0) {
      setIsSuccess(false);
      setMessage(t('onboarding.invalid'));
      return;
    }

    await signInDemoRole({ role: 'parent' });
    setIsSuccess(true);
    setMessage(t('onboarding.success', { family: familyName.trim(), child: childName.trim() }));
    router.replace('/parent/dashboard');
  };

  return (
    <AppScreen title={t('onboarding.title')} subtitle={t('onboarding.subtitle')}>
      {isSupabaseConfigured && (
        <AppCard>
          <SectionTitle title={t('auth.parentAccount')} />
          <AppTextInput
            label={t('auth.parentName')}
            value={parentName}
            onChangeText={setParentName}
            placeholder={t('auth.parentNamePlaceholder')}
          />
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
        </AppCard>
      )}

      <AppCard>
        <SectionTitle title={t('onboarding.familySetup')} />
        <AppTextInput
          label={t('onboarding.familyName')}
          value={familyName}
          onChangeText={setFamilyName}
          placeholder={t('onboarding.familyPlaceholder')}
        />
        <AppTextInput
          label={t('onboarding.childName')}
          value={childName}
          onChangeText={setChildName}
          placeholder={t('onboarding.childPlaceholder')}
        />
        <View style={styles.actions}>
          {isSupabaseConfigured ? (
            <AppButton
              title={isLoading ? t('onboarding.registering') : t('onboarding.register')}
              onPress={handleCreateSupabase}
              disabled={isLoading}
            />
          ) : (
            <AppButton title={t('onboarding.create')} onPress={handleCreateDemo} />
          )}
          <AppButton
            title={t('parent.dashboard.title')}
            variant="secondary"
            onPress={() => router.replace('/parent/dashboard')}
          />
        </View>
      </AppCard>

      {Boolean(message) && (
        <View style={styles.message}>
          <StatusBadge
            label={isSuccess ? t('common.success') : t('common.checkForm')}
            tone={isSuccess ? 'success' : 'warning'}
          />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
    </AppScreen>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  message: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3DDD2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  messageText: {
    color: '#34444C',
    fontSize: 14,
    lineHeight: 20,
  },
});