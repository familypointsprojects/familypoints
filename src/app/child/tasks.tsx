import { useRef, useState } from 'react';
import { Image } from 'expo-image';
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
import Svg, { Path, Polygon, Polyline } from 'react-native-svg';

import { FP, gameText } from '@/constants/theme';
import { OutlineText } from '@/shared/ui/OutlineText';
import { useLanguage } from '@/shared/i18n';
import { Task, TaskSubmission } from '@/shared/types/family';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import {
  AppButton,
  AppScreen,
  AppTextInput,
  BalancePill,
  EmptyState,
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
const IMG_PIRATE_GUIDE = require('@/assets/images/pirate-variants/generated-pack/flat-pirate-16-reading-map.png');
const IMG_DAILY_CALENDAR = require('@/assets/images/icons/calendar.png');

type Tab = 'available' | 'pending';

// ─── Accent palette for task icons ──────────────────────────────────────────
const ICON_PALETTES = [
  { bg: '#19B8F2', border: '#061426', rail: '#FFC400', fg: '#123F7C', card: '#30364F', inner: '#8FE7FF', bottom: '#24293F' },
  { bg: '#F36B1D', border: '#061426', rail: '#FFC400', fg: '#5A1605', card: '#29334F', inner: '#FFB400', bottom: '#20263A' },
  { bg: '#C229E8', border: '#061426', rail: '#D642FF', fg: '#FFFFFF', card: '#30364F', inner: '#D642FF', bottom: '#24293F' },
  { bg: '#35D638', border: '#061426', rail: '#FFC400', fg: '#07501A', card: '#13B7EF', inner: '#35D638', bottom: '#0D79B6' },
  { bg: '#FFC400', border: '#061426', rail: '#F36B1D', fg: '#5C3300', card: '#29334F', inner: '#FFE066', bottom: '#20263A' },
  { bg: '#C229E8', border: '#061426', rail: '#19B8F2', fg: '#FFFFFF', card: '#30364F', inner: '#C229E8', bottom: '#24293F' },
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

const MissionPlate = ({
  fill,
  stroke,
}: {
  fill: string;
  stroke: string;
}) => (
  <Svg
    pointerEvents="none"
    preserveAspectRatio="none"
    style={StyleSheet.absoluteFill}
    viewBox="0 0 100 100">
    <Polygon fill={fill} points="0,0 97,0 100,100 0,100" />
    <Polyline fill="none" points="0,0 97,0 100,100 0,100" stroke={stroke} strokeLinejoin="round" strokeWidth={5} />
    <Polyline fill="none" points="22,8 64,8" stroke="rgba(255,255,255,0.34)" strokeLinecap="round" strokeWidth={3} />
  </Svg>
);

// ─── Quest action button ─────────────────────────────────────────────────────
//  "Взять!"  — active quest (blue)
//  "Заново"  — rejected quest (orange)
const QuestButton = ({ tone = 'blue' }: { tone?: 'blue' | 'orange' }) => {
  const isOrange = tone === 'orange';
  return (
    <View style={[questBtnStyles.pill, isOrange ? questBtnStyles.pillOrange : questBtnStyles.pillBlue]}>
      <View pointerEvents="none" style={questBtnStyles.pillHighlight} />
      <View
        pointerEvents="none"
        style={[questBtnStyles.pillBottom, { backgroundColor: isOrange ? '#A43A12' : '#1E9F24' }]}
      />
      <OutlineText style={[questBtnStyles.label, gameText]}>{isOrange ? 'Снова!' : 'Старт!'}</OutlineText>
    </View>
  );
};

const questBtnStyles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: 3,
    borderColor: '#061426',
    borderWidth: 3,
    justifyContent: 'center',
    minHeight: 36,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 7,
    position: 'relative',
  },
  pillHighlight: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    height: 3,
    left: 8,
    position: 'absolute',
    right: 10,
    top: 4,
    zIndex: 1,
  },
  pillBottom: {
    bottom: 0,
    height: 5,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  pillBlue: {
    backgroundColor: '#35D638',
    ...(Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.42, shadowRadius: 0 },
      android: { elevation: 4 },
      web: { boxShadow: '0 3px 0 #1E9F24' },
    }) as ViewStyle),
  },
  pillOrange: {
    backgroundColor: '#F36B1D',
    ...(Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.40, shadowRadius: 0 },
      android: { elevation: 4 },
      web: { boxShadow: '0 3px 0 #A43A12' },
    }) as ViewStyle),
  },
  label: {
    color: '#041426',
    fontSize: 14,
    letterSpacing: 0,
    zIndex: 4,
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
  featured?: boolean;
  done?: boolean;
  pending?: boolean;
  rejected?: boolean;
  onPress: () => void;
};

const TaskCard = ({ task, index, featured, done, pending, rejected, onPress }: TaskCardProps) => {
  const { t } = useLanguage();
  const palette = ICON_PALETTES[index % ICON_PALETTES.length];
  const Icon = done ? IconCheck : TASK_ICONS[index % TASK_ICONS.length];

  // Pick icon block color
  const iconBg   = done ? '#35D638' : rejected ? '#F36B1D' : pending ? '#FFC400' : palette.bg;
  const outlineColor = palette.border;

  const inner = (
    <View style={[styles.taskCardShell, featured && styles.taskCardShellFeatured]}>
      <View
        style={[
          styles.taskCard,
          featured && styles.taskCardFeatured,
          done && styles.taskCardDone,
        ]}>
        <MissionPlate
          fill={done ? '#0F9D2A' : featured ? '#343A55' : palette.card}
          stroke={outlineColor}
        />
        <View pointerEvents="none" style={[styles.taskCardLeftBorder, { backgroundColor: outlineColor }]} />
        {featured && (
          <View pointerEvents="none" style={styles.dailyQuestBadge}>
            <Image contentFit="contain" source={IMG_DAILY_CALENDAR} style={styles.dailyQuestIcon} />
          </View>
        )}
        {/* Full-height color block */}
        <View style={[styles.taskColorBlock, { backgroundColor: iconBg }]}>
          <View style={[styles.taskIconMedallion, { borderColor: outlineColor }]}>
            <Icon />
          </View>
        </View>

        {/* Right: task info */}
        <View style={styles.taskContent}>
          {/* Title */}
          <OutlineText style={[styles.taskTitle, featured && styles.taskTitleFeatured, done && styles.taskTitleDone]} numberOfLines={2}>
            {getTaskTitle(task, t)}
          </OutlineText>
          {/* Description */}
          <Text style={[styles.taskDesc, featured && styles.taskDescFeatured]} numberOfLines={2}>
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
                  <BalancePill compact points={task.points} />
                )}

                {/* Action button */}
                <QuestButton tone={rejected ? 'orange' : 'blue'} />
              </>
            )}
          </View>
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
          <View style={styles.dailyGuidePanel}>
            <View style={styles.dailyGuideCopy}>
              <View style={styles.dailyGuideBarWrap}>
                <View style={styles.dailyGuideBar}>
                  <View pointerEvents="none" style={styles.dailyGuideInset1} />
                  <View pointerEvents="none" style={styles.dailyGuideInset2} />
                  <View style={styles.dailyGuideBarContent}>
                    <OutlineText style={[styles.sectionTitle, styles.dailyGuideTitle]}>{t('child.tasks.todayTitle')}</OutlineText>
                  </View>
                </View>
              </View>
              <Image contentFit="contain" source={IMG_DAILY_CALENDAR} style={styles.dailyHeaderIcon} />
            </View>
            <View style={styles.pirateStage}>
              <Image
                contentFit="contain"
                source={IMG_PIRATE_GUIDE}
                style={styles.pirateGuide}
              />
            </View>
          </View>

          <View style={styles.taskListCompact}>
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
                  featured
                  done={isDone}
                  pending={isPending}
                  rejected={isRejected}
                  onPress={() => handleOpen(task)}
                />
              );
            })}
          </View>
        </>
      )}

      {/* ── Available / Pending tabs ── */}
      <SegmentedControl options={tabOptions} value={tab} onChange={setTab} />

      {tab === 'available' && (
        <>
          <View style={styles.sectionRow}>
            <OutlineText style={styles.sectionTitle}>{t('common.availableTasks')}</OutlineText>
          </View>
          {availableTasks.length === 0 ? (
            <EmptyState title={t('common.availableTasks')} message={t('child.tasks.allDone')} />
          ) : (
            <View style={styles.taskListCompact}>
              {availableTasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onPress={() => handleOpen(task)}
                />
              ))}
            </View>
          )}
        </>
      )}

      {tab === 'pending' && (
        <>
          <View style={styles.sectionRow}>
            <OutlineText style={styles.sectionTitle}>{t('child.tasks.tabPending')}</OutlineText>
          </View>
          {pendingTasks.length === 0 ? (
            <EmptyState
              title={t('child.tasks.pendingEmptyTitle')}
              message={t('child.tasks.pendingEmptyMessage')}
            />
          ) : (
            <View style={styles.taskListCompact}>
              {pendingTasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  pending
                  onPress={() => handleOpen(task)}
                />
              ))}
            </View>
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
                    <BalancePill compact points={selectedTask.points} />
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
  dailyGuidePanel: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    overflow: 'visible',
    paddingVertical: 5,
    position: 'relative',
  },
  dailyGuideCopy: {
    alignSelf: 'center',
    flex: 1,
    minWidth: 0,
    paddingLeft: 22,
    position: 'relative',
    zIndex: 2,
  },
  dailyGuideBarWrap: {
    transform: [{ skewX: '-8deg' }],
  },
  dailyGuideBar: {
    backgroundColor: '#1B2A3D',
    borderColor: '#0A1626',
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 40,
    overflow: 'hidden',
    paddingLeft: 31,
    paddingRight: 20,
    paddingVertical: 5,
  },
  dailyGuideInset1: {
    borderColor: 'rgba(0,0,0,0.18)',
    borderLeftWidth: 0,
    borderWidth: 6,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dailyGuideInset2: {
    borderColor: 'rgba(0,0,0,0.30)',
    borderLeftWidth: 0,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dailyGuideBarContent: {
    transform: [{ skewX: '8deg' }],
  },
  pirateStage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: -7,
    position: 'absolute',
    right: 10,
    width: 86,
    zIndex: 3,
  },
  pirateGuide: {
    height: 112,
    width: 92,
    zIndex: 2,
  },
  dailyHeaderIcon: {
    height: 56,
    left: -11,
    position: 'absolute',
    top: -8,
    width: 56,
    zIndex: 5,
  },
  sectionTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 18,
  },
  dailyGuideTitle: {
    fontSize: 16,
    lineHeight: 19,
  },
  taskListCompact: {
    gap: 8,
  },

  // ── Task card ──────────────────────────────────────────────────────────────
  cardPressed: {
    opacity: 0.82,
    transform: [{ translateY: 2 }, { scale: 0.992 }],
  },
  taskCardShell: {
    paddingBottom: 0,
    paddingTop: 2,
    paddingRight: 0,
    position: 'relative',
  },
  taskCardShellFeatured: {
    paddingLeft: 0,
  },
  taskCard: {
    flexDirection: 'row',
    minHeight: 104,
    overflow: 'visible',
    position: 'relative',
  },
  taskCardFeatured: {
    transform: [{ scale: 1.006 }],
  },
  taskCardDone: {
    opacity: 0.72,
  },
  taskCardLeftBorder: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
    zIndex: 3,
  },
  dailyQuestBadge: {
    height: 32,
    position: 'absolute',
    right: 12,
    top: 9,
    width: 32,
    zIndex: 6,
  },
  dailyQuestIcon: {
    height: '100%',
    width: '100%',
  },
  // Full-height color block on the left
  taskColorBlock: {
    alignItems: 'center',
    borderRadius: 2,
    justifyContent: 'center',
    marginLeft: 8,
    marginVertical: 10,
    overflow: 'hidden',
    position: 'relative',
    width: 56,
    zIndex: 4,
  },
  taskIconMedallion: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 3,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    transform: [{ skewX: '3deg' }],
    width: 40,
  },
  // Right content area
  taskContent: {
    flex: 1,
    gap: 3,
    minWidth: 0,
    padding: 12,
    paddingLeft: 12,
    position: 'relative',
    zIndex: 4,
  },
  taskTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
  taskTitleFeatured: {
    paddingRight: 46,
  },
  taskTitleDone: {
    color: '#FFFFFF',
  },
  taskDesc: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  taskDescFeatured: {
    paddingRight: 46,
  },
  // Footer row inside card: reward badge + action button
  taskFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 5,
  },
  // Done pill (replaces reward + button)
  donePill: {
    backgroundColor: '#35D638',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  donePillText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
  },
  // Status chips inside footer
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipWarn: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
  },
  statusChipDangerBg: {
    backgroundColor: '#F36B1D',
  },
  statusChipDanger: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 12,
  },

  // Streak widget
  streak: {
    backgroundColor: FP.graphite,
    borderRadius: 3,
    padding: 16,
    gap: 12,
    ...(Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.24, shadowRadius: 0 },
      android: { elevation: 6 },
      web: { boxShadow: '4px 4px 0 #061426' },
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
    ...gameText,
    color: FP.white,
    fontSize: 16,
  },
  streakSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: FP.lime,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakBadgeText: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 14,
  },
  streakDays: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayCellHot: {
    backgroundColor: FP.lime,
  },
  dayLetter: {
    ...gameText,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
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
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
    borderRadius: 1,
    height: 4,
    width: 40,
  },
  sheetContent: {
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    ...gameText,
    color: '#FFFFFF',
    fontSize: 22,
  },
  sheetSubtitle: {
    color: FP.textSub,
    fontSize: 14,
    marginTop: -4,
  },
  sheetCard: {
    backgroundColor: '#30364F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    gap: 12,
    padding: 16,
    ...(Platform.select({
      ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.26, shadowRadius: 0 },
      android: { elevation: 3 },
      web: { boxShadow: '4px 4px 0 #061426' },
    }) as ViewStyle),
  },
  detailDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 23,
  },
});
