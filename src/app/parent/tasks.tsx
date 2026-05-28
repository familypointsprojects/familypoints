import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';

const ParentTasksScreen = () => {
  const { t } = useLanguage();
  const { deleteTask, setTaskStatus, tasks } = useFamilyPoints();
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const pendingDeleteTask = tasks.find((task) => task.id === pendingDeleteTaskId);

  const handleDeleteTaskPress = (taskId: string) => {
    setPendingDeleteTaskId(taskId);
  };

  const handleCancelDeleteTask = () => {
    setPendingDeleteTaskId(null);
  };

  const handleConfirmDeleteTask = () => {
    if (!pendingDeleteTaskId) {
      return;
    }

    deleteTask({ taskId: pendingDeleteTaskId });
    setPendingDeleteTaskId(null);
  };

  return (
    <AppScreen title={t('common.tasks')} subtitle={t('parent.tasks.subtitle')}>
      <SectionTitle
        title={t('common.taskList')}
        action={
          <AppButton
            title={t('parent.createTask.title')}
            onPress={() => router.push('/parent/create-task')}
            style={styles.createButton}
          />
        }
      />
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
              <AppButton
                title={t('common.delete')}
                variant="danger"
                onPress={() => handleDeleteTaskPress(task.id)}
                style={styles.actionButton}
              />
            </View>
          </AppCard>
        );
      })}
      <Modal
        animationType="fade"
        onRequestClose={handleCancelDeleteTask}
        transparent
        visible={Boolean(pendingDeleteTaskId)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCancelDeleteTask} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('parent.tasks.deleteTitle')}</Text>
            {pendingDeleteTask && (
              <Text style={styles.modalTaskTitle}>{getTaskTitle(pendingDeleteTask, t)}</Text>
            )}
            <Text style={styles.modalText}>{t('parent.tasks.deleteMessage')}</Text>
            <View style={styles.modalActions}>
              <AppButton
                title={t('common.cancel')}
                variant="secondary"
                onPress={handleCancelDeleteTask}
                style={styles.actionButton}
              />
              <AppButton
                title={t('parent.tasks.deleteConfirm')}
                variant="danger"
                onPress={handleConfirmDeleteTask}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#12314A',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  createButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE3CF',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    width: '88%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 49, 74, 0.26)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalTaskTitle: {
    color: '#12314A',
    fontSize: 17,
    fontWeight: '900',
  },
  modalText: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
  modalTitle: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '900',
  },
});
