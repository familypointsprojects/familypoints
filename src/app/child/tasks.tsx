import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle } from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';
import { getActiveTasks } from '@/shared/utils/tasks';

const ChildTasksScreen = () => {
  const { t } = useLanguage();
  const { tasks } = useFamilyPoints();
  const activeTasks = getActiveTasks(tasks);

  return (
    <AppScreen title={t('common.tasks')} subtitle={t('child.tasks.subtitle')}>
      <SectionTitle title={t('common.availableTasks')} />
      {activeTasks.map((task) => (
        <AppCard key={task.id}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTaskTitle(task, t)}</Text>
            <PointsBadge points={task.points} />
          </View>
          <Text style={styles.description}>{getTaskDescription(task, t)}</Text>
          <AppButton
            title={t('common.openDetails')}
            variant="secondary"
            onPress={() => router.push(`/child/task-details?taskId=${task.id}`)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
};

export default ChildTasksScreen;

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#1F2933',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: '#5F6C72',
    fontSize: 14,
    lineHeight: 21,
  },
});
