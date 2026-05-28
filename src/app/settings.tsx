import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { familyPointsDataSource, isFamilyPointsBackendConfigured } from '@/shared/services/familyPoints';
import { isSupabaseConfigured } from '@/shared/services/supabase';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle, StatusBadge } from '@/shared/ui';

const SettingsScreen = () => {
  const { t } = useLanguage();
  const { session, signOut } = useAuth();
  const { familyName, updateFamilyName, activeFamilyId } = useFamilyPoints();

  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [editedFamilyName, setEditedFamilyName] = useState('');

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
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
        </View>
      </AppCard>
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
  meta: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
});
