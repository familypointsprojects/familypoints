import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';
import { FP } from '@/constants/theme';

const CreateParentScreen = () => {
  const { t } = useLanguage();
  const { activeFamilyId } = useFamilyPoints();

  const [hasFullPermissions, setHasFullPermissions] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!activeFamilyId) {
      setError(t('parent.inviteParent.noFamily'));
      return;
    }

    setError('');
    router.replace({
      pathname: '/parent/invite-parent',
      params: { hasFullPermissions: String(hasFullPermissions) },
    });
  };

  return (
    <AppScreen
      title={t('parent.children.roleParent')}
      subtitle={t('parent.inviteParent.subtitle')}
    >
      <AppCard>
        <SectionTitle title={t('parent.inviteParent.introTitle')} />
        <Text style={styles.helperText}>
          {t('parent.inviteParent.introBody')}
        </Text>
      </AppCard>

      <SectionTitle title={t('parent.permissions.title')} />

      <TouchableOpacity
        style={[styles.permCard, hasFullPermissions && styles.permCardSelected]}
        onPress={() => setHasFullPermissions(true)}
      >
        <Text style={styles.permEmoji}>🔓</Text>
        <View style={styles.permInfo}>
          <Text style={styles.permTitle}>{t('parent.permissions.full')}</Text>
          <Text style={styles.permDesc}>{t('parent.permissions.fullDesc')}</Text>
        </View>
        {hasFullPermissions && <Text style={styles.permCheck}>✓</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.permCard, !hasFullPermissions && styles.permCardSelected]}
        onPress={() => setHasFullPermissions(false)}
      >
        <Text style={styles.permEmoji}>🔒</Text>
        <View style={styles.permInfo}>
          <Text style={styles.permTitle}>{t('parent.permissions.limited')}</Text>
          <Text style={styles.permDesc}>{t('parent.permissions.limitedDesc')}</Text>
        </View>
        {!hasFullPermissions && <Text style={styles.permCheck}>✓</Text>}
      </TouchableOpacity>

      {Boolean(error) && (
        <AppCard>
          <StatusBadge label={t('common.error')} tone="warning" />
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      )}

      <AppButton
        title={t('parent.inviteParent.createLink')}
        onPress={handleCreate}
        disabled={!activeFamilyId}
      />

      <AppButton
        title={t('common.back')}
        variant="ghost"
        onPress={() => router.back()}
      />
    </AppScreen>
  );
};

export default CreateParentScreen;

const styles = StyleSheet.create({
  permCard: {
    alignItems: 'center',
    backgroundColor: FP.card,
    borderColor: FP.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 16,
  },
  permCardSelected: {
    borderColor: FP.primary,
    backgroundColor: FP.primaryLight,
  },
  permEmoji: {
    fontSize: 28,
  },
  permInfo: {
    flex: 1,
  },
  permTitle: {
    color: FP.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  permDesc: {
    color: FP.textSub,
    fontSize: 13,
  },
  permCheck: {
    color: FP.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  errorText: {
    color: '#E2483B',
    fontSize: 14,
    marginTop: 8,
  },
  helperText: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 20,
  },
});
