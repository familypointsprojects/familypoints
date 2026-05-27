import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, EmptyState, SectionTitle } from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';

const EditTaskScreen = () => {
  const { t } = useLanguage();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { tasks, updateTask } = useFamilyPoints();
  const task = tasks.find((item) => item.id === taskId);
  const [title, setTitle] = useState(task ? getTaskTitle(task, t) : '');
  const [description, setDescription] = useState(task ? getTaskDescription(task, t) : '');
  const [points, setPoints] = useState(task ? String(task.points) : '');

  if (!task) {
    return (
      <AppScreen title={t('parent.editTask.title')}>
        <EmptyState
          title={t('child.taskDetails.notFoundTitle')}
          message={t('child.taskDetails.notFoundMessage')}
        />
      </AppScreen>
    );
  }

  const isValid = title.trim().length > 0 && description.trim().length > 0 && Number(points) > 0;

  const handleSave = () => {
    if (!isValid) {
      return;
    }

    updateTask({
      taskId: task.id,
      title: title.trim(),
      description: description.trim(),
      points: Number(points),
      status: task.status,
    });
    router.replace('/parent/tasks');
  };

  return (
    <AppScreen title={t('parent.editTask.title')} subtitle={t('parent.editTask.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.taskList')} />
        <AppTextInput label={t('common.title')} value={title} onChangeText={setTitle} />
        <AppTextInput
          label={t('common.description')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <AppTextInput
          label={t('common.points')}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
        />
        <View style={styles.actions}>
          <AppButton title={t('common.save')} onPress={handleSave} disabled={!isValid} />
          <AppButton title={t('common.cancel')} variant="ghost" onPress={() => router.replace('/parent/tasks')} />
        </View>
      </AppCard>
    </AppScreen>
  );
};

export default EditTaskScreen;

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
});
