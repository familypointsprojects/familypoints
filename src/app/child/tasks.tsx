import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { Task, TaskSubmission } from '@/shared/types/family';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppScreen,
  AppTextInput,
  EmptyState,
  PointsBadge,
  SegmentedControl,
  StatusBadge,
} from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';
import {
  getAvailableTasksForChild,
  getDailyTasksForToday,
  getPendingTasksForChild,
  getTodaySubmission,
  hasSubmittedDailyTaskToday,
} from '@/shared/utils/tasks';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_THRESHOLD = 80;

type Tab = 'available' | 'pending';

// ─── Accent palette for task icons ──────────────────────────────────────────
const ICON_PALETTES = [
  { bg: '#E5EFFF', border: '#BFD7F5', fg: FP.primary },
  { bg: '#DDF8FF', border: '#A0E8F8', fg: '#0B6F8A' },
  { bg: FP.mintLight, border: '#A6EFCC', fg: '#15786A' },
  { bg: FP.accentLight, border: '#F1D28A', fg: FP.accentDark },
  { bg: FP.orangeLight, border: '#FFCBB0', fg: FP.orangeDark },
  { bg: '#EDE9FF', border: '#C5B8FF', fg: '#5040C4' },
] as const;

// ─── Small SVG icons used in task cards ──────────────────────────────────────
const IconCheck = () => (
  <Svg width={26} height={26} viewBox="0 0 32 32">
    <Path
      d="M8 16.5l5.2 5.2L24.5 9.5"
      fill="none"
      stroke={FP.green}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconStar = () => (
  <Svg width={26} height={26} viewBox="0 0 32 32">
    <Path
      d="M16 4l3 9 9 3-9 3-3 11-3-11-9-3 9-3z"
      fill={FP.accent}
      stroke={FP.accentDark}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

const IconBolt = () => (
  <Svg width={26} height={26} viewBox="0 0 32 32">
    <Path
      d="M18 4L10 18h8l-4 10 12-14h-8z"
      fill={FP.orange}
      stroke={FP.orangeDark}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

const IconBook = () => (
  <Svg width={26} height={26} viewBox="0 0 32 32">
    <Path
      d="M9 6h12a4 4 0 014 4v16H11a4 4 0 01-4-4V8a2 2 0 012-2z"
      fill={FP.primary}
      stroke={FP.primaryDark}
      strokeWidth={1.8}
    />
    <Path d="M12 10h9M12 15h8" stroke={FP.lime} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconLeaf = () => (
  <Svg width={26} height={26} viewBox="0 0 32 32">
    <Path
      d="M16 27V15"
      stroke="#15786a"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Path
      d="M16 16c-6-1-9-5-8-10 6 0 9 4 8 10z"
      fill={FP.mint}
      stroke="#15786a"
      strokeWidth={1.8}
    />
    <Path
      d="M17 18c6-2 9-6 7-11-6 1-8 5-7 11z"
      fill={FP.lime}
      stroke="#7da100"
      strokeWidth={1.8}
    />
  </Svg>
);

const TASK_ICONS = [IconStar, IconBolt, IconBook, IconLeaf, IconStar, IconBolt] as const;

// ─── Quest action button ─────────────────────────────────────────────────────
//  "Взять!"  — active quest (blue)
//  "Заново"  — rejected quest (orange)
const QuestButton = ({ tone = 'blue' }: { tone?: 'blue' | 'orange' }) => {
  const isOrange = tone === 'orange';
  return (
    <View style={[questBtnStyles.pill, isOrange ? questBtnStyles.pillOrange : questBtnStyles.pillBlue]}>
      <Text style={questBtnStyles.label}>{isOrange ? 'Снова!' : 'Старт!'}</Text>
    </View>
  );
};

const questBtnStyles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: 99,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillBlue: {
    backgroundColor: FP.primary,
    ...(Platform.select({
      ios: { shadowColor: FP.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(22,71,183,0.32)' },
    }) as ViewStyle),
  },
  pillOrange: {
    backgroundColor: FP.orange,
    ...(Platform.select({
      ios: { shadowColor: FP.orangeDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(255,100,45,0.32)' },
    }) as ViewStyle),
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});

// ─── Task card ────────────────────────────────────────────────────────────────
//
//  Layout:
//  ┌──────────────────────────────────────────────┐
//  │ [COLOR BLOCK] │  Title (bold, large)          │
//  │   64 wide     │  Description (2 lines)        │
//  │   full height │  ───────────────────────────  │
//  │               │  ● X бал.          [▶ button] │
//  └──────────────────────────────────────────────┘
//
//  Color block = full-height solid bg matching the icon palette.
//  Footer row = reward badge left, action button right.
//  Whole card is Pressable (except done tasks).

type TaskCardProps = {
  task: Task;
  index: number;
  done?: boolean;
  pending?: boolean;
  rejected?: boolean;
  onPress: () => void;
};

const TaskCard = ({ task, index, done, pending, rejected, onPress }: TaskCardProps) => {
  const { t } = useLanguage();
  const palette = ICON_PALETTES[index % ICON_PALETTES.length];
  const Icon = done ? IconCheck : TASK_ICONS[index % TASK_ICONS.length];

  // Pick icon block color
  const iconBg   = done ? '#D4F5E5' : rejected ? '#FFE0E3' : pending ? '#FFF6D6' : palette.bg;
  const iconFg   = done ? '#15786A' : rejected ? '#A8210A' : pending ? '#8B5904' : palette.fg;

  const inner = (
    <View style={[styles.taskCard, done && styles.taskCardDone]}>
      {/* Full-height color block */}
      <View style={[styles.taskColorBlock, { backgroundColor: iconBg }]}>
        <Icon />
      </View>

      {/* Right: task info */}
      <View style={styles.taskContent}>
        {/* Title */}
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]} numberOfLines={2}>
          {getTaskTitle(task, t)}
        </Text>
        {/* Description */}
        <Text style={styles.taskDesc} numberOfLines={2}>
          {getTaskDescription(task, t)}
        </Text>

        {/* Footer row: reward + action */}
        <View style={styles.taskFooter}>
          {done ? (
            <View style={styles.donePill}>
              <Text style={styles.donePillText}>Выполнено ✓</Text>
            </View>
          ) : (
            <>
              {/* Status chip or reward */}
              {pending ? (
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipWarn}>На проверке ⏳</Text>
                </View>
              ) : rejected ? (
                <View style={[styles.statusChip, styles.statusChipDangerBg]}>
                  <Text style={styles.statusChipDanger}>Попробуй ещё ↩</Text>
                </View>
              ) : (
                <PointsBadge points={task.points} />
              )}

              {/* Action button */}
              <QuestButton tone={rejected ? 'orange' : 'blue'} />
            </>
          )}
        </View>
      </View>
    </View>
  );

  if (done) return inner;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed ? styles.cardPressed : undefined}>
      {inner}
    </Pressable>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const ChildTasksScreen = () => {
  const { t } = useLanguage();
  const { activeChildId } = useActiveChild();
  const { submitTaskWithProof, taskSubmissions, tasks } = useFamilyPoints();

  const dailyTasks = getDailyTasksForToday(tasks, activeChildId);
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
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabOptions = [
    { label: `${t('child.tasks.tabAvailable')} (${availableTasks.length})`, value: 'available' as Tab },
    { label: `${t('child.tasks.tabPending')} (${pendingTasks.length})`, value: 'pending' as Tab },
  ];

  return (
    <AppScreen
      title={t('common.tasks')}
      subtitle={t('child.tasks.subtitle')}>

      {/* ── Daily Quests ── */}
      {dailyTasks.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <View style={styles.boltBadge}>
              <Svg width={14} height={14} viewBox="0 0 32 32">
                <Path d="M18 4L10 18h8l-4 10 12-14h-8z" fill={FP.orange} strokeWidth={0} />
              </Svg>
            </View>
            <Text style={styles.sectionTitle}>{t('child.tasks.todayTitle')}</Text>
          </View>

          {dailyTasks.map((task, i) => {
            const submission = getTodaySubmission(taskSubmissions, task.id, activeChildId);
            const isDone = submission?.status === 'approved';
            const isPending = submission?.status === 'pending';
            const isRejected = submission?.status === 'rejected';

            return (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                done={isDone}
                pending={isPending}
                rejected={isRejected}
                onPress={() => handleOpen(task)}
              />
            );
          })}
        </>
      )}

      {/* ── Available / Pending tabs ── */}
      <SegmentedControl options={tabOptions} value={tab} onChange={setTab} />

      {tab === 'available' && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('common.availableTasks')}</Text>
          </View>
          {availableTasks.length === 0 ? (
            <EmptyState title={t('common.availableTasks')} message={t('child.tasks.allDone')} />
          ) : (
            availableTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                onPress={() => handleOpen(task)}
              />
            ))
          )}
        </>
      )}

      {tab === 'pending' && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('child.tasks.tabPending')}</Text>
          </View>
          {pendingTasks.length === 0 ? (
            <EmptyState
              title={t('child.tasks.pendingEmptyTitle')}
              message={t('child.tasks.pendingEmptyMessage')}
            />
          ) : (
            pendingTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                pending
                onPress={() => handleOpen(task)}
              />
            ))
          )}
        </>
      )}

      {/* ── Bottom Sheet Modal ── */}
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
                  <View style={styles.sheetCard}>
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
                  </View>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Section headers
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: -4,
  },
  boltBadge: {
    alignItems: 'center',
    backgroundColor: FP.orangeLight,
    borderRadius: 8,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  sectionTitle: {
    color: FP.ink,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  // ── Task card ──────────────────────────────────────────────────────────────
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  taskCard: {
    backgroundColor: FP.card,
    borderColor: FP.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    ...(Platform.select({
      ios: { shadowColor: FP.primaryDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 20 },
      android: { elevation: 3 },
      web: { boxShadow: '0 8px 24px rgba(16,35,63,0.10)' },
    }) as ViewStyle),
  },
  taskCardDone: {
    borderColor: '#C2EEDD',
    opacity: 0.72,
  },
  // Full-height color block on the left
  taskColorBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    paddingVertical: 18,
  },
  // Right content area
  taskContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
    padding: 14,
    paddingLeft: 12,
  },
  taskTitle: {
    color: FP.ink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  taskTitleDone: {
    color: FP.textSub,
  },
  taskDesc: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Footer row inside card: reward badge + action button
  taskFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  // Done pill (replaces reward + button)
  donePill: {
    backgroundColor: FP.greenLight,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  donePillText: {
    color: FP.green,
    fontSize: 12,
    fontWeight: '700',
  },
  // Status chips inside footer
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEC',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipWarn: {
    color: '#8B5904',
    fontSize: 12,
    fontWeight: '700',
  },
  statusChipDangerBg: {
    backgroundColor: '#FFF0F0',
  },
  statusChipDanger: {
    color: '#A8210A',
    fontSize: 12,
    fontWeight: '700',
  },

  // Streak widget
  streak: {
    backgroundColor: FP.graphite,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    ...(Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.18, shadowRadius: 28 },
      android: { elevation: 6 },
      web: { boxShadow: '0 14px 32px rgba(0,0,0,0.18)' },
    }) as ViewStyle),
  },
  streakHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakHeadLeft: {
    flex: 1,
    gap: 2,
  },
  streakTitle: {
    color: FP.white,
    fontSize: 16,
    fontWeight: '900',
  },
  streakSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: FP.lime,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakBadgeText: {
    color: '#264000',
    fontSize: 14,
    fontWeight: '900',
  },
  streakDays: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayCellHot: {
    backgroundColor: FP.lime,
  },
  dayLetter: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '900',
  },
  dayLetterHot: {
    color: '#10233F',
  },

  // Bottom sheet
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
  sheetCard: {
    backgroundColor: FP.card,
    borderColor: FP.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...(Platform.select({
      ios: { shadowColor: FP.primaryDark, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.10, shadowRadius: 24 },
      android: { elevation: 3 },
      web: { boxShadow: '0 12px 28px rgba(16,35,63,0.10)' },
    }) as ViewStyle),
  },
  detailDescription: {
    color: FP.ink,
    fontSize: 16,
    lineHeight: 23,
  },
});
