import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useState, useEffect } from 'react';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { familyPointsDataSource, isFamilyPointsBackendConfigured } from '@/shared/services/familyPoints';
import { isSupabaseConfigured, getSupabaseClient } from '@/shared/services/supabase';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppCard,
  AppScreen,
  AppTextInput,
  AvatarHead,
  AvatarPickerModal,
  LanguageToggle,
  SectionTitle,
  StatusBadge,
} from '@/shared/ui';

const SettingsScreen = () => {
  const { t } = useLanguage();
  const { session, signOut, deleteAccount } = useAuth();
  const { familyName, updateFamilyName, activeFamilyId, updateChildAvatar } = useFamilyPoints();
  const { activeChild, activeChildId } = useActiveChild();
  const avatarId = activeChild?.avatarId;
  const [isAvatarPickerVisible, setAvatarPickerVisible] = useState(false);

  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [editedFamilyName, setEditedFamilyName] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;

    getSupabaseClient().auth.getSession().then(({ data: sessionData }) => {
      const email = sessionData.session?.user?.email ?? null;
      if (email) { setUserEmail(email); return; }
      // Фолбэк через getUser
      getSupabaseClient().auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email ?? null);
      });
    });
  }, [session]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Это действие необратимо. Ваш аккаунт и все данные будут удалены навсегда. Продолжить?')
      : true; // на native покажем Alert ниже

    if (!confirmed) return;

    try {
      await deleteAccount();
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось удалить аккаунт';
      if (Platform.OS === 'web') {
        window.alert(msg);
      }
    }
  };

  const handleStartEditFamily = () => {
    setEditedFamilyName(familyName ?? '');
    setIsEditingFamily(true);
  };

  const handleSaveFamilyName = () => {
    if (editedFamilyName.trim()) {
      updateFamilyName({ familyName: editedFamilyName.trim() });
    }
    setIsEditingFamily(false);
  };

  return (
    <AppScreen title={t('settings.title')} subtitle={t('settings.subtitle')}>
      {/* Language */}
      <AppCard>
        <SectionTitle title={t('common.language')} />
        <LanguageToggle />
      </AppCard>

      {activeChildId ? (
        <AppCard>
          <SectionTitle title="Аватар" />
          <View style={styles.row}>
            <View style={styles.avatarPreview}>
              <AvatarHead id={avatarId} size={64} />
            </View>
            <AppButton
              title="Сменить аватар"
              variant="secondary"
              onPress={() => setAvatarPickerVisible(true)}
            />
          </View>
        </AppCard>
      ) : null}
      {activeFamilyId && (
        <AppCard>
          <SectionTitle title="Семья" />
          {isEditingFamily ? (
            <View style={styles.stack}>
              <AppTextInput
                label="Название семьи"
                value={editedFamilyName}
                onChangeText={setEditedFamilyName}
                placeholder="Например: Семья Ивановых"
                autoFocus
              />
              <View style={styles.row}>
                <AppButton
                  title="Сохранить"
                  onPress={handleSaveFamilyName}
                  style={styles.flex}
                />
                <AppButton
                  title="Отмена"
                  variant="ghost"
                  onPress={() => setIsEditingFamily(false)}
                  style={styles.flex}
                />
              </View>
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={styles.familyName}>{familyName ?? '—'}</Text>
              <AppButton
                title="Изменить"
                variant="secondary"
                onPress={handleStartEditFamily}
              />
            </View>
          )}
        </AppCard>
      )}

      <AppCard>
        <SectionTitle title={t('settings.session')} />
        {session ? (
          <View style={styles.stack}>
            <StatusBadge label={t('auth.signedInAs', { name: session.name })} tone="success" />
            {userEmail && (
              <View style={styles.emailRow}>
                <Text style={styles.emailLabel}>📧</Text>
                <Text style={styles.emailText}>{userEmail}</Text>
              </View>
            )}
            <Text style={styles.meta}>
              {session.role === 'parent' ? t('auth.roleParent') : t('auth.roleChild')}
            </Text>
          </View>
        ) : (
          <StatusBadge label={t('auth.signedOut')} tone="warning" />
        )}
      </AppCard>

      <AppCard>
        <SectionTitle title={t('settings.dataSource')} />
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.activeSource')}</Text>
          <StatusBadge
            label={
              familyPointsDataSource === 'supabase'
                ? t('settings.sourceSupabase')
                : t('settings.sourceLocal')
            }
            tone={isFamilyPointsBackendConfigured ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.supabaseConfigured')}</Text>
          <StatusBadge
            label={isSupabaseConfigured ? t('common.success') : t('settings.notConfigured')}
            tone={isSupabaseConfigured ? 'success' : 'warning'}
          />
        </View>
        <Text style={styles.meta}>{t('settings.dataSourceHint')}</Text>
      </AppCard>

      <AppCard>
        <SectionTitle title={t('settings.account')} />
        <View style={styles.stack}>
          <AppButton
            title={t('auth.signOut')}
            variant="danger"
            onPress={handleSignOut}
            disabled={!session}
          />
          <AppButton
            title="Удалить аккаунт"
            variant="ghost"
            onPress={handleDeleteAccount}
            disabled={!session}
          />
        </View>
      </AppCard>

      <AvatarPickerModal
        visible={isAvatarPickerVisible}
        currentId={avatarId}
        title="Сменить аватар"
        confirmLabel="Сохранить"
        onConfirm={(id) => {
          if (activeChildId) {
            updateChildAvatar({ childId: activeChildId, avatarId: id });
          }
        }}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </AppScreen>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  label: {
    color: '#12314A',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  familyName: {
    color: '#12314A',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10233F',
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailLabel: {
    fontSize: 14,
  },
  emailText: {
    color: '#12314A',
    fontSize: 14,
    fontWeight: '600',
  },
});
