import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle, StatusBadge } from '@/shared/ui';
import { FP } from '@/constants/theme';

const EditParentScreen = () => {
  const { parentId, parentName, parentHasFullPermissions } = useLocalSearchParams<{
    parentId: string;
    parentName: string;
    parentHasFullPermissions: string;
  }>();

  const { updateParent } = useFamilyPoints();

  const [name, setName] = useState(parentName ?? '');
  const [hasFullPermissions, setHasFullPermissions] = useState(
    parentHasFullPermissions === 'true',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Введите имя родителя');
      return;
    }

    if (!parentId) return;

    setError('');
    setIsLoading(true);

    try {
      await updateParent({ parentId, name: name.trim(), hasFullPermissions });
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen title="Редактировать родителя" subtitle="Измените имя или права доступа">
      <AppCard>
        <SectionTitle title="Имя" />
        <AppTextInput
          label="Имя родителя"
          value={name}
          onChangeText={setName}
          placeholder="Например: Мама"
          autoFocus
        />
      </AppCard>

      <SectionTitle title="Права доступа" />

      <TouchableOpacity
        style={[styles.permCard, hasFullPermissions && styles.permCardSelected]}
        onPress={() => setHasFullPermissions(true)}
      >
        <Text style={styles.permEmoji}>🔓</Text>
        <View style={styles.permInfo}>
          <Text style={styles.permTitle}>Полные права</Text>
          <Text style={styles.permDesc}>
            Может одобрять, отклонять, добавлять и удалять любые квесты и награды
          </Text>
        </View>
        {hasFullPermissions && <Text style={styles.permCheck}>✓</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.permCard, !hasFullPermissions && styles.permCardSelected]}
        onPress={() => setHasFullPermissions(false)}
      >
        <Text style={styles.permEmoji}>🔒</Text>
        <View style={styles.permInfo}>
          <Text style={styles.permTitle}>Только свои</Text>
          <Text style={styles.permDesc}>
            Управляет только квестами и наградами, которые создал сам
          </Text>
        </View>
        {!hasFullPermissions && <Text style={styles.permCheck}>✓</Text>}
      </TouchableOpacity>

      {Boolean(error) && (
        <AppCard>
          <StatusBadge label="Ошибка" tone="warning" />
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      )}

      <AppButton
        title={isLoading ? 'Сохраняем...' : 'Сохранить'}
        onPress={handleSave}
        disabled={isLoading || !name.trim()}
      />

      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator color={FP.accent} />
        </View>
      )}

      <AppButton
        title="Назад"
        variant="ghost"
        onPress={() => router.back()}
        disabled={isLoading}
      />
    </AppScreen>
  );
};

export default EditParentScreen;

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
  loader: {
    alignItems: 'center',
  },
});
