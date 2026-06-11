import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { FP } from '@/constants/theme';
import { TaskSubmission } from '@/shared/types/family';
import { getTaskStreakDays } from '@/shared/utils/leveling';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const getWeekActiveDays = (submissions: TaskSubmission[], childId: string): boolean[] => {
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const key = day.toISOString().split('T')[0];
    return submissions.some(
      (s) => s.childId === childId && s.status === 'approved' && s.submittedAt.startsWith(key),
    );
  });
};

type StreakWidgetProps = {
  taskSubmissions: TaskSubmission[];
  childId: string;
};

export const StreakWidget = ({ taskSubmissions, childId }: StreakWidgetProps) => {
  const streakDays = getTaskStreakDays(taskSubmissions, childId);
  const weekDays = getWeekActiveDays(taskSubmissions, childId);
  const hasStreak = streakDays > 0;

  const subText = hasStreak
    ? `${streakDays} ${streakDays === 1 ? 'день' : streakDays < 5 ? 'дня' : 'дней'} подряд 🔥`
    : 'Выполни задание сегодня — начни серию!';

  return (
    <View style={styles.streak}>
      <View style={styles.streakHead}>
        <View style={styles.streakHeadLeft}>
          <Text style={styles.streakTitle}>🔥 Серия</Text>
          <Text style={styles.streakSub}>{subText}</Text>
        </View>
        {hasStreak && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{streakDays}</Text>
          </View>
        )}
      </View>
      <View style={styles.streakDays}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={[styles.dayCell, weekDays[i] && styles.dayCellHot]}>
            <Text style={[styles.dayLetter, weekDays[i] && styles.dayLetterHot]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  streak: {
    backgroundColor: FP.graphite,
    borderRadius: 22,
    gap: 12,
    padding: 16,
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
    fontSize: 12,
    fontWeight: '900',
  },
  dayLetterHot: {
    color: '#10233F',
  },
});
