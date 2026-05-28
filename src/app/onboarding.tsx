import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle, StatusBadge } from '@/shared/ui';

const AVATAR_COLORS = [
  '#1E9E86',
  '#EF5A24',
  '#F5B225',
  '#2BA84A',
  '#3E8ED0',
  '#7C6BD6',
  '#E86A9C',
  '#12314A',
];

const OnboardingScreen = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { activeFamilyId, createChild, hasHydrated } = useFamilyPoints();

  const [familyName, setFamilyName] = useState('');
  const [childName, setChildName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFirstFamilySetup = !activeFamilyId;
  const canSubmit =
    hasHydrated &&
    session?.role === 'parent' &&
    childName.trim().length > 0 &&
    (!isFirstFamilySetup || familyName.trim().length > 0);

  const handleCreateFamily = async () => {
    if (!canSubmit) {
      setIsSuccess(false);
      setMessage(t('onboarding.invalid'));
      return;
    }

    setMessage('');
    setIsLoading(true);

    try {
      await createChild({
        avatarColor,
        name: childName.trim(),
        ...(isFirstFamilySetup ? { familyName: familyName.trim() } : {}),
      });

      setIsSuccess(true);
      setMessage(t('onboarding.success', {
        family: familyName.trim() || t('onboarding.existingFamily'),
        child: childName.trim(),
      }));
      router.replace('/parent/dashboard');
    } catch (err: unknown) {
      setIsSuccess(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setMessage(t('onboarding.error', { message: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title={t('onboarding.title')} subtitle={t('onboarding.subtitle')}>
      {isFirstFamilySetup && (
        <AppCard>
          <SectionTitle title={t('onboarding.familySetup')} />
          <AppTextInput
            label={t('onboarding.familyName')}
            value={familyName}
            onChangeText={setFamilyName}
            placeholder={t('onboarding.familyPlaceholder')}
          />
        </AppCard>
      )}

      <AppCard>
        <SectionTitle title={t('onboarding.firstChild')} />
        <AppTextInput
          label={t('onboarding.childName')}
          value={childName}
          onChangeText={setChildName}
          placeholder={t('onboarding.childPlaceholder')}
        />

        <Text style={styles.label}>{t('onboarding.avatarColor')}</Text>
        <View style={styles.colorGrid}>
          {AVATAR_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setAvatarColor(color)}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                avatarColor === color && styles.colorDotSelected,
              ]}>
              {avatarColor === color && <Text style={styles.colorCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.preview}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {childName.trim() ? childName.trim().slice(0, 1).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.previewName}>
            {childName.trim() || t('onboarding.childPreview')}
          </Text>
        </View>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title={isLoading ? t('onboarding.registering') : t('onboarding.createFamily')}
          onPress={handleCreateFamily}
          disabled={isLoading || !canSubmit}
        />
        <AppButton
          title={t('common.cancel')}
          variant="ghost"
          onPress={() => router.replace('/parent/dashboard')}
          disabled={isLoading}
        />
      </View>

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
  avatar: {
    alignItems: 'center',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  colorCheck: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  colorDot: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  colorDotSelected: {
    borderColor: '#12314A',
    borderWidth: 3,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  label: {
    color: '#12314A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  message: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE3CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  messageText: {
    color: '#12314A',
    fontSize: 14,
    lineHeight: 20,
  },
  preview: {
    alignItems: 'center',
    borderTopColor: '#ECE3CF',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
    paddingTop: 16,
  },
  previewName: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '800',
  },
});
