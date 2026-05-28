import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { Task } from '@/shared/types/family';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppCard,
  AppScreen,
  AppTextInput,
  EmptyState,
  PointsBadge,
  SectionTitle,
  SegmentedControl,
  StatusBadge,
} from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';
import { getAvailableTasksForChild, getPendingTasksForChild } from '@/shared/utils/tasks';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_THRESHOLD = 80;

type Tab = 'available' | 'pending';

const ChildTasksScreen = () => {
  const { t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { submitTaskWithProof, taskSubmissions, tasks } = useFamilyPoints();

  const availableTasks = getAvailableTasksForChild(tasks, taskSubmissions, activeChildId);
  const pendingTasks = getPendingTasksForChild(tasks, taskSubmissions, activeChildId);

  const [tab, setTab] = useState<Tab>('available');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const combinedY = Animated.add(sheetAnim, panY);

  const closeSheet = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      panY.setValue(0);
      setModalVisible(false);
      cb?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) panY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_THRESHOLD || g.vy > 0.6) {
          Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            panY.setValue(0);
            sheetAnim.setValue(SCREEN_HEIGHT);
            setModalVisible(false);
            setSelectedTask(null);
            setProofNote('');
          });
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
        }
      },
    }),
  ).current;

  const isSubmitted = selectedTask
    ? taskSubmissions.some(
        (s) => s.taskId === selectedTask.id && s.childId === activeChildId && s.status === 'pending',
      )
    : false;

  const handleOpen = (task: Task) => {
    setSelectedTask(task);
    setProofNote('');
    panY.setValue(0);
    sheetAnim.setValue(SCREEN_HEIGHT);
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 220,
        overshootClamping: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    closeSheet(() => {
      setSelectedTask(null);
      setProofNote('');
    });
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTaskWithProof(selectedTask.id, proofNote);
      handleClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Ошибка', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabOptions = [
    { label: `${t('child.tasks.tabAvailable')} (${availableTasks.length})`, value: 'available' as Tab },
    { label: `${t('child.tasks.tabPending')} (${pendingTasks.length})`, value: 'pending' as Tab },
  ];

  return (
    <AppScreen title={t('common.tasks')} subtitle={t('child.tasks.subtitle')}>
      <SegmentedControl options={tabOptions} value={tab} onChange={setTab} />

      {tab === 'available' && (
        <>
          <SectionTitle title={t('common.availableTasks')} />
          {availableTasks.map((task) => (
            <AppCard key={task.id}>
              <View style={styles.header}>
                <Text style={styles.title}>{getTaskTitle(task, t)}</Text>
                <PointsBadge points={task.points} />
              </View>
              <Text style={styles.description}>{getTaskDescription(task, t)}</Text>
              <AppButton
                title={t('common.openDetails')}
                variant="secondary"
                onPress={() => handleOpen(task)}
              />
            </AppCard>
          ))}
        </>
      )}

      {tab === 'pending' && (
        <>
          <SectionTitle title={t('child.tasks.tabPending')} />
          {pendingTasks.length === 0 ? (
            <EmptyState
              title={t('child.tasks.pendingEmptyTitle')}
              message={t('child.tasks.pendingEmptyMessage')}
            />
          ) : (
            pendingTasks.map((task) => (
              <AppCard key={task.id}>
                <View style={styles.header}>
                  <Text style={styles.title}>{getTaskTitle(task, t)}</Text>
                  <PointsBadge points={task.points} />
                </View>
                <Text style={styles.description}>{getTaskDescription(task, t)}</Text>
                <View style={styles.pendingRow}>
                  <StatusBadge label={t('common.waitingForApproval')} tone="warning" />
                  <AppButton
                    title={t('common.openDetails')}
                    variant="secondary"
                    onPress={() => handleOpen(task)}
                  />
                </View>
              </AppCard>
            ))
          )}
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleClose}>
        <View style={styles.modalRoot}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          <Animated.View style={[styles.sheet, { transform: [{ translateY: combinedY }] }]}>
            <View style={styles.sheetHandle} {...panResponder.panHandlers}>
              <View style={styles.sheetHandleBar} />
            </View>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}>
              {selectedTask && (
                <>
                  <Text style={styles.sheetTitle}>{getTaskTitle(selectedTask, t)}</Text>
                  <Text style={styles.sheetSubtitle}>{t('child.taskDetails.subtitle')}</Text>
                  <AppCard>
                    <Text style={styles.detailDescription}>{getTaskDescription(selectedTask, t)}</Text>
                    <PointsBadge points={selectedTask.points} />
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
                  <AppButton title={t('common.close')} variant="ghost" onPress={handleClose} />
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
    color: FP.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 21,
  },
  pendingRow: {
    gap: 10,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(14, 37, 54, 0.45)',
  },
  sheet: {
    backgroundColor: FP.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 4,
  },
  sheetHandle: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sheetHandleBar: {
    backgroundColor: FP.tan,
    borderRadius: 3,
    height: 4,
    width: 40,
  },
  sheetContent: {
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: FP.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  sheetSubtitle: {
    color: FP.textSub,
    fontSize: 14,
    marginTop: -4,
  },
  detailDescription: {
    color: FP.ink,
    fontSize: 16,
    lineHeight: 23,
  },
});
