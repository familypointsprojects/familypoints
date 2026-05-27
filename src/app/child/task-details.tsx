import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, EmptyState, PointsBadge, StatusBadge } from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';

const ChildTaskDetailsScreen = () => {
  const { t } = useLanguage();
  const { submitTaskWithProof, taskSubmissions, tasks } = useFamilyPoints();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const [proofNote, setProofNote] = useState('');

  const currentTaskId = taskId ?? tasks[0]?.id;
  const task = tasks.find((taskItem) => taskItem.id === currentTaskId);
  const isSubmitted = task
    ? taskSubmissions.some(
        (submission) =>
          submission.taskId === task.id &&
          submission.childId === childProfile.id &&
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

  const handleSubmitTask = () => {
    submitTaskWithProof(task.id, proofNote);
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
            <AppButton title={t('common.iDidIt')} onPress={handleSubmitTask} />
          </>
        )}
      </AppCard>
    </AppScreen>
  );
};

export default ChildTaskDetailsScreen;

const styles = StyleSheet.create({
  description: {
    color: '#34444C',
    fontSize: 16,
    lineHeight: 23,
  },
});
