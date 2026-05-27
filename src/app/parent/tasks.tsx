import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';

const ParentTasksScreen = () => {
  const { t } = useLanguage();
  const { setTaskStatus, tasks } = useFamilyPoints();

  return (
    <AppScreen title={t('common.tasks')} subtitle={t('parent.tasks.subtitle')}>
      <SectionTitle title={t('common.taskList')} />
      {tasks.map((task) => {
        const tone = task.status === 'active' ? 'success' : 'muted';
        const statusLabel = task.status === 'active' ? t('common.active') : t('common.inactive');

        return (
          <AppCard key={task.id}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{getTaskTitle(task, t)}</Text>
              <StatusBadge label={statusLabel} tone={tone} />
            </View>
            <Text style={styles.description}>{getTaskDescription(task, t)}</Text>
            <PointsBadge points={task.points} />
            <View style={styles.actions}>
              <AppButton
                title={t('common.edit')}
                variant="secondary"
                onPress={() => router.push(`/parent/edit-task?taskId=${task.id}`)}
                style={styles.actionButton}
              />
              <AppButton
                title={task.status === 'active' ? t('common.deactivate') : t('common.activate')}
                variant="ghost"
                onPress={() =>
                  setTaskStatus({
                    taskId: task.id,
                    status: task.status === 'active' ? 'inactive' : 'active',
                  })
                }
                style={styles.actionButton}
              />
            </View>
          </AppCard>
        );
      })}
    </AppScreen>
  );
};

export default ParentTasksScreen;

const styles = StyleSheet.create({
  cardHeader: {
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
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
