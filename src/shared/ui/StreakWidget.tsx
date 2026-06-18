import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { TaskSubmission } from '@/shared/types/family';
import { getTaskStreakDays } from '@/shared/utils/leveling';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const StreakFlameIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 160 160">
    <Path
      d="M79 151C47 151 23 131 23 105C23 82 38 69 58 54C74 42 81 26 89 9C109 34 116 54 112 72C119 62 124 51 127 39C142 64 149 84 149 107C149 134 127 151 95 151Z"
      fill="#FF9F38"
    />
    <Path
      d="M80 146C58 146 45 133 45 115C45 101 53 91 65 80C74 71 79 59 81 47C95 63 101 79 98 94C105 86 109 78 111 70C122 85 127 99 127 115C127 134 112 146 80 146Z"
      fill="#FFD35A"
    />
    <Path
      d="M91 147C73 147 61 136 61 121C61 107 69 96 81 82C91 96 103 108 107 122C112 136 103 147 91 147Z"
      fill="#A83AFF"
    />
  </Svg>
);

/** Returns "YYYY-MM-DD" in the device's local timezone. */
const toLocalDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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
    const key = toLocalDateKey(day);
    // Compare in local timezone on both sides to avoid UTC-shift false matches
    return submissions.some(
      (s) =>
        s.childId === childId &&
        s.status === 'approved' &&
        toLocalDateKey(new Date(s.submittedAt)) === key,
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
    ? `${streakDays} ${streakDays === 1 ? 'день' : streakDays < 5 ? 'дня' : 'дней'} подряд`
    : 'Выполни задание сегодня — начни серию!';

  return (
    <View style={styles.streak}>
      <View style={styles.streakHead}>
        <View style={styles.streakHeadLeft}>
          <View style={styles.streakTitleRow}>
            <StreakFlameIcon />
            <Text style={styles.streakTitle}>Серия</Text>
          </View>
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
  streakTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    minHeight: 36,
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
