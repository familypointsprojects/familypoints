import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { TaskSubmission } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, EmptyState, SectionTitle, StatusBadge } from '@/shared/ui';
import { getTaskTitle } from '@/shared/utils/content';
import { findTask } from '@/shared/utils/tasks';

const ParentSubmissionsScreen = () => {
  const { t } = useLanguage();
  const { approveSubmission, rejectSubmission, taskSubmissions, tasks } = useFamilyPoints();

  const pendingSubmissions = taskSubmissions.filter((submission) => submission.status === 'pending');

  const handleReview = (submissionId: string, status: TaskSubmission['status']) => {
    if (status === 'approved') {
      approveSubmission(submissionId);
      return;
    }

    rejectSubmission(submissionId);
  };

  return (
    <AppScreen title={t('parent.submissions.title')} subtitle={t('parent.submissions.subtitle')}>
      <SectionTitle title={t('common.pending')} />
      {pendingSubmissions.length === 0 && (
        <EmptyState title={t('common.allCaughtUp')} message={t('parent.submissions.empty')} />
      )}

      {pendingSubmissions.map((submission) => {
        const task = findTask(tasks, submission.taskId);
        const taskTitle = task ? getTaskTitle(task, t) : t('child.taskDetails.notFoundTitle');

        return (
          <AppCard key={submission.id}>
            <View style={styles.row}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoText}>{t('common.photo')}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{taskTitle}</Text>
                <Text style={styles.meta}>{childProfile.name}</Text>
                {Boolean(submission.proofNote) && (
                  <Text style={styles.proof}>{submission.proofNote}</Text>
                )}
                <StatusBadge label={t('common.pendingStatus')} tone="warning" />
              </View>
            </View>
            <View style={styles.actions}>
              <AppButton
                title={t('common.approve')}
                onPress={() => handleReview(submission.id, 'approved')}
                style={styles.actionButton}
              />
              <AppButton
                title={t('common.reject')}
                variant="danger"
                onPress={() => handleReview(submission.id, 'rejected')}
                style={styles.actionButton}
              />
            </View>
          </AppCard>
        );
      })}
    </AppScreen>
  );
};

export default ParentSubmissionsScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#E5EEF1',
    borderRadius: 8,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  photoText: {
    color: '#5F6C72',
    fontSize: 13,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: '#1F2933',
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: '#5F6C72',
    fontSize: 14,
  },
  proof: {
    color: '#34444C',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
