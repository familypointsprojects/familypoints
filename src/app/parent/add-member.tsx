import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { AppScreen } from '@/shared/ui';
import { FP } from '@/constants/theme';

const AddMemberScreen = () => {
  const { t } = useLanguage();

  return (
    <AppScreen title={t('parent.children.add')} subtitle={t('parent.children.roleSelect')}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/parent/create-child')}
      >
        <Text style={styles.emoji}>👦</Text>
        <View style={styles.info}>
          <Text style={styles.title}>{t('parent.children.roleChild')}</Text>
          <Text style={styles.subtitle}>Ребёнок выполняет квесты и тратит баллы на награды</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/parent/create-parent')}
      >
        <Text style={styles.emoji}>👨‍👩‍👧</Text>
        <View style={styles.info}>
          <Text style={styles.title}>{t('parent.children.roleParent')}</Text>
          <Text style={styles.subtitle}>Родитель управляет квестами, наградами и одобряет заявки</Text>
        </View>
      </TouchableOpacity>
    </AppScreen>
  );
};

export default AddMemberScreen;

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: FP.card,
    borderColor: FP.border,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    padding: 20,
  },
  emoji: {
    fontSize: 40,
  },
  info: {
    flex: 1,
  },
  title: {
    color: FP.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 14,
  },
});
