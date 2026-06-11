import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppCard,
  AppScreen,
  EmptyState,
  ParentChildFilter,
  PointsBadge,
  SectionTitle,
  SegmentedControl,
  SegmentedControlOption,
  StatusBadge,
} from '@/shared/ui';
import { IconAlert } from '@/shared/ui/QuestIcons';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';
import { canManage } from '@/shared/utils/permissions';
import { getDailyTaskBalance } from '@/shared/utils/pricingGuidance';

type ParentTaskKindFilter = 'all' | 'daily' | 'one_time';

const ParentTasksScreen = () => {
  const { t } = useLanguage();
  const { activeParentId, children, deleteTask, parents, setTaskStatus, taskSubmissions, tasks, updateTask } = useFamilyPoints();
  const currentParent = parents?.find((p) => p.id === activeParentId);
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [kindFilter, setKindFilter] = useState<ParentTaskKindFilter>('all');
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const [pendingBalanceTaskId, setPendingBalanceTaskId] = useState<string | null>(null);
  const [balancingTaskId, setBalancingTaskId] = useState<string | null>(null);
  const pendingDeleteTask = tasks.find((task) => task.id === pendingDeleteTaskId);
  const pendingBalanceTask = tasks.find((task) => task.id === pendingBalanceTaskId);
  const pendingBalance = pendingBalanceTask?.isDaily ? getDailyTaskBalance(pendingBalanceTask) : undefined;
  const childFilteredTasks = selectedChildId
    ? tasks.filter((task) =>
        !task.childId ||
        task.childId === selectedChildId ||
        taskSubmissions.some(
          (submission) => submission.childId === selectedChildId && submission.taskId === task.id,
        ),
      )
    : tasks;
  const visibleTasks = childFilteredTasks
    .filter((task) => {
      if (kindFilter === 'daily') {
        return Boolean(task.isDaily);
      }

      if (kindFilter === 'one_time') {
        return !task.isDaily;
      }

      return true;
    })
    .sort((firstTask, secondTask) => {
      const firstHasRecommendation =
        firstTask.isDaily && getDailyTaskBalance(firstTask).status !== 'ok';
      const secondHasRecommendation =
        secondTask.isDaily && getDailyTaskBalance(secondTask).status !== 'ok';

      if (firstHasRecommendation !== secondHasRecommendation) {
        return Number(secondHasRecommendation) - Number(firstHasRecommendation);
      }

      return Number(Boolean(secondTask.isDaily)) - Number(Boolean(firstTask.isDaily));
    });
  const kindFilterOptions: SegmentedControlOption<ParentTaskKindFilter>[] = [
    { label: 'Все', value: 'all' },
    { label: 'Ежедневные', value: 'daily' },
    { label: 'Разовые', value: 'one_time' },
  ];

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

  const getTaskBalanceReason = () => {
    if (!pendingBalance) {
      return '';
    }

    if (pendingBalance.status === 'expensive') {
      return 'Баллов слишком много для daily-квеста. Это может быстро разогнать экономику.';
    }

    if (pendingBalance.status === 'cheap') {
      return 'Баллов маловато. Ребенку может быть неинтересно делать это каждый день.';
    }

    return 'Цена выглядит нормально.';
  };

  const handleBalanceTask = async (taskId: string, points: number) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    setBalancingTaskId(taskId);

    try {
      await updateTask({
        taskId,
        title: getTaskTitle(task, t),
        description: getTaskDescription(task, t),
        points,
        status: task.status,
        childId: task.childId,
        isDaily: task.isDaily,
        availableDays: task.availableDays,
      });
    } finally {
      setBalancingTaskId(null);
    }
  };

  const handleSetTaskStatus = async (taskId: string, status: 'active' | 'inactive') => {
    const task = tasks.find((item) => item.id === taskId);

    await setTaskStatus({ taskId, status });

    if (!task || status !== 'active' || !task.isDaily) {
      return;
    }

    const dailyBalance = getDailyTaskBalance(task);

    if (dailyBalance.status !== 'ok' && dailyBalance.suggestedPrice !== task.points) {
      setPendingBalanceTaskId(task.id);
    }
  };

  return (
    <AppScreen title={t('common.tasks')} subtitle={t('parent.tasks.subtitle')}>
      <ParentChildFilter
        childrenList={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />
      <SegmentedControl options={kindFilterOptions} value={kindFilter} onChange={setKindFilter} />

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
      {visibleTasks.length === 0 && (
        <EmptyState title={t('common.allCaughtUp')} message={t('parent.tasks.emptyForChild')} />
      )}

      {visibleTasks.map((task) => {
        const tone = task.status === 'active' ? 'success' : 'muted';
        const statusLabel = task.status === 'active' ? t('common.active') : t('common.inactive');
        const childSubmission = selectedChildId
          ? taskSubmissions
              .filter(
                (submission) =>
                  submission.childId === selectedChildId && submission.taskId === task.id,
              )
              .sort(
                (a, b) =>
                  new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
              )[0]
          : undefined;
        const dailyBalance = task.isDaily ? getDailyTaskBalance(task) : undefined;
        const shouldShowBalanceAction = dailyBalance && dailyBalance.status !== 'ok';
        const dailyBalanceTone = dailyBalance?.status === 'ok' ? 'success' : 'warning';
        const canBalanceTask = !task.createdBy || canManage(currentParent, task.createdBy);

        return (
          <AppCard key={task.id} style={task.isDaily ? styles.dailyCard : styles.oneTimeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{getTaskTitle(task, t)}</Text>
              <View style={styles.badges}>
                <StatusBadge
                  label={task.isDaily ? 'Ежедневный' : 'Разовый'}
                  tone={task.isDaily ? 'warning' : 'muted'}
                />
                <StatusBadge
                  label={task.childId ? children.find((child) => child.id === task.childId)?.name ?? t('common.child') : t('common.allChildren')}
                  tone="muted"
                />
                <StatusBadge label={statusLabel} tone={tone} />
                {dailyBalance && (
                  <StatusBadge label={dailyBalance.note} tone={dailyBalanceTone} />
                )}
                {childSubmission && (
                  <StatusBadge
                    label={
                      childSubmission.status === 'approved'
                        ? t('common.approved')
                        : childSubmission.status === 'rejected'
                          ? t('common.rejected')
                          : t('common.pendingStatus')
                    }
                    tone={
                      childSubmission.status === 'approved'
                        ? 'success'
                        : childSubmission.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  />
                )}
              </View>
            </View>
            <Text style={styles.description}>{getTaskDescription(task, t)}</Text>
            <PointsBadge points={task.points} />
            {dailyBalance && dailyBalance.status !== 'ok' && (
              <Text style={styles.balanceHint}>Рекомендовано: {dailyBalance.suggestedPrice}</Text>
            )}
            {canBalanceTask && (
              <View style={styles.actions}>
                {shouldShowBalanceAction && dailyBalance.suggestedPrice !== task.points && (
                  <AppButton
                    title={balancingTaskId === task.id ? t('common.saving') : 'Рекомендация!'}
                    leftIcon={balancingTaskId === task.id ? undefined : <IconAlert />}
                    variant="secondary"
                    onPress={() => setPendingBalanceTaskId(task.id)}
                    disabled={balancingTaskId === task.id}
                    style={styles.actionButton}
                  />
                )}
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
                    void handleSetTaskStatus(
                      task.id,
                      task.status === 'active' ? 'inactive' : 'active',
                    )
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
            )}
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
      <Modal
        animationType="fade"
        onRequestClose={() => setPendingBalanceTaskId(null)}
        transparent
        visible={Boolean(pendingBalanceTaskId)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPendingBalanceTaskId(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Рекомендация по баллам</Text>
            {pendingBalanceTask && (
              <Text style={styles.modalTaskTitle}>{getTaskTitle(pendingBalanceTask, t)}</Text>
            )}
            <Text style={styles.modalText}>{getTaskBalanceReason()}</Text>
            {pendingBalance && (
              <Text style={styles.modalRecommendation}>
                Рекомендую: {pendingBalance.suggestedPrice} баллов
              </Text>
            )}
            <View style={styles.modalActions}>
              <AppButton
                title={t('common.cancel')}
                variant="secondary"
                onPress={() => setPendingBalanceTaskId(null)}
                style={styles.actionButton}
              />
              {pendingBalanceTask && pendingBalance && (
                <AppButton
                  title="Сбалансировать"
                  onPress={() => {
                    void handleBalanceTask(pendingBalanceTask.id, pendingBalance.suggestedPrice);
                    setPendingBalanceTaskId(null);
                  }}
                  style={styles.actionButton}
                />
              )}
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
  dailyCard: {
    backgroundColor: '#FFFBF0',
    borderColor: FP.accent,
    borderLeftWidth: 5,
    borderWidth: 1,
  },
  oneTimeCard: {
    borderColor: '#ECE3CF',
    borderWidth: 1,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  balanceHint: {
    color: '#6B7B86',
    fontSize: 13,
    fontWeight: '700',
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
  modalRecommendation: {
    color: FP.primaryDark,
    fontSize: 15,
    fontWeight: '900',
  },
  modalTitle: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '900',
  },
});
