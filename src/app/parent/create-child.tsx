import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle, StatusBadge } from '@/shared/ui';

const AVATAR_COLORS = [
  '#1E9E86', // teal
  '#EF5A24', // orange
  '#F5B225', // gold
  '#2BA84A', // green
  '#3E8ED0', // blue
  '#7C6BD6', // purple
  '#E86A9C', // pink
  '#12314A', // navy
];

const CreateChildScreen = () => {
  const { createChild, activeFamilyId } = useFamilyPoints();

  const isFirstChild = !activeFamilyId;

  const [familyName, setFamilyName] = useState('');
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (isFirstChild && !familyName.trim()) {
      setError('Введите название семьи');
      return;
    }

    if (!name.trim()) {
      setError('Введите имя ребёнка');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const childId = await createChild({
        name: name.trim(),
        avatarColor,
        ...(isFirstChild ? { familyName: familyName.trim() } : {}),
      });

      // Сразу переходим на экран генерации инвайта
      router.replace({
        pathname: '/parent/invite-child',
        params: { childId, childName: name.trim() },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось создать ребёнка');
      setIsLoading(false);
    }
  };

  return (
    <AppScreen
      title={isFirstChild ? 'Создать семью' : 'Добавить ребёнка'}
      subtitle={isFirstChild ? 'Дайте семье название и добавьте первого ребёнка' : 'Заполните данные и получите ссылку для входа'}
    >

      {isFirstChild && (
        <AppCard>
          <SectionTitle title="Название семьи" />
          <AppTextInput
            label="Как называется ваша семья?"
            value={familyName}
            onChangeText={setFamilyName}
            placeholder="Например: Семья Ивановых"
            autoFocus
          />
        </AppCard>
      )}

      <AppCard>
        <SectionTitle title="Имя" />
        <AppTextInput
          label="Имя ребёнка"
          value={name}
          onChangeText={setName}
          placeholder="Например: Миша"
          autoFocus={!isFirstChild}
        />
      </AppCard>

      <AppCard>
        <SectionTitle title="Цвет аватара" />
        <View style={styles.colorGrid}>
          {AVATAR_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setAvatarColor(color)}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                avatarColor === color && styles.colorDotSelected,
              ]}
            >
              {avatarColor === color && (
                <Text style={styles.colorCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Превью аватара */}
        <View style={styles.preview}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {name.trim() ? name.trim().slice(0, 1).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.previewName}>{name.trim() || 'Имя ребёнка'}</Text>
        </View>
      </AppCard>

      {Boolean(error) && (
        <AppCard>
          <StatusBadge label="Ошибка" tone="warning" />
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      )}

      <AppButton
        title={isLoading ? 'Создаём...' : 'Создать и получить QR-код'}
        onPress={handleCreate}
        disabled={isLoading || !name.trim()}
      />
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator color="#1E9E86" />
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

export default CreateChildScreen;

const styles = StyleSheet.create({
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
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
  colorCheck: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  preview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECE3CF',
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
  previewName: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '800',
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
