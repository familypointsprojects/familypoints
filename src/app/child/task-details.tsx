import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, EmptyState, PointsBadge, StatusBadge } from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';

const ChildTaskDetailsScreen = () => {
  const { t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { submitTaskWithProof, taskSubmissions, tasks } = useFamilyPoints();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const [proofNote, setProofNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTaskId = taskId ?? tasks[0]?.id;
  const task = tasks.find((taskItem) => taskItem.id === currentTaskId);
  const isSubmitted = task
    ? taskSubmissions.some(
        (submission) =>
          submission.taskId === task.id &&
          submission.childId === activeChildId &&
          submission.status === 'pending',
      )
    : false;

  if (!task) {
    return (
      <AppScreen title={t('child.taskDetails.title')}>
        <EmptyState
          title={t('child.taskDetails.notFoundTitle')}
          message={t('child.taskDetails.notFoundMessage')}
        />
      </AppScreen>
    );
  }

  const handleSubmitTask = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTaskWithProof(task.id, proofNote);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Ошибка', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen title={getTaskTitle(task, t)} subtitle={t('child.taskDetails.subtitle')}>
      <AppCard>
        <Text style={styles.description}>{getTaskDescription(task, t)}</Text>
        <PointsBadge points={task.points} />
        {isSubmitted ? (
          <StatusBadge label={t('common.waitingForApproval')} tone="warning" />
        ) : (
          <>
            <AppTextInput
              label={t('child.taskDetails.proofNote')}
              value={proofNote}
              onChangeText={setProofNote}
              placeholder={t('child.taskDetails.proofPlaceholder')}
              multiline
            />
            <AppButton
              title={isSubmitting ? '...' : t('common.iDidIt')}
              onPress={handleSubmitTask}
              disabled={isSubmitting}
            />
          </>
        )}
      </AppCard>
    </AppScreen>
  );
};

export default ChildTaskDetailsScreen;

const styles = StyleSheet.create({
  description: {
    color: '#12314A',
    fontSize: 16,
    lineHeight: 23,
  },
});
