import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import type { DayOfWeek } from '@/shared/types/family';
import {
  AppButton,
  AppCard,
  AppScreen,
  AppTextInput,
  EmptyState,
  ParentChildFilter,
  SectionTitle,
} from '@/shared/ui';
import { getTaskDescription, getTaskTitle } from '@/shared/utils/content';

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Пн' },
  { key: 'tuesday', label: 'Вт' },
  { key: 'wednesday', label: 'Ср' },
  { key: 'thursday', label: 'Чт' },
  { key: 'friday', label: 'Пт' },
  { key: 'saturday', label: 'Сб' },
  { key: 'sunday', label: 'Вс' },
];

const EditTaskScreen = () => {
  const { t } = useLanguage();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { children, tasks, updateTask } = useFamilyPoints();
  const task = tasks.find((item) => item.id === taskId);
  const [title, setTitle] = useState(task ? getTaskTitle(task, t) : '');
  const [description, setDescription] = useState(task ? getTaskDescription(task, t) : '');
  const [points, setPoints] = useState(task ? String(task.points) : '');
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(task?.childId);
  const [isDaily, setIsDaily] = useState(task?.isDaily ?? false);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>(task?.availableDays ?? []);

  if (!task) {
    return (
      <AppScreen title={t('parent.editTask.title')}>
        <EmptyState
          title={t('child.taskDetails.notFoundTitle')}
          message={t('child.taskDetails.notFoundMessage')}
        />
      </AppScreen>
    );
  }

  const isValid = title.trim().length > 0 && description.trim().length > 0 && Number(points) > 0;

  const toggleDay = (day: DayOfWeek) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSave = () => {
    if (!isValid) {
      return;
    }

    updateTask({
      taskId: task.id,
      title: title.trim(),
      description: description.trim(),
      points: Number(points),
      status: task.status,
      childId: selectedChildId,
      isDaily,
      availableDays: isDaily ? availableDays : [],
    });
    router.replace('/parent/tasks');
  };

  return (
    <AppScreen title={t('parent.editTask.title')} subtitle={t('parent.editTask.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.taskList')} />
        <AppTextInput label={t('common.title')} value={title} onChangeText={setTitle} />
        <AppTextInput
          label={t('common.description')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <AppTextInput
          label={t('common.points')}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
        />

        <ParentChildFilter
          childrenList={children}
          label={t('parent.assignment.child')}
          selectedChildId={selectedChildId}
          onChange={setSelectedChildId}
        />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Ежедневный квест</Text>
          <Switch
            value={isDaily}
            onValueChange={setIsDaily}
            trackColor={{ true: FP.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {isDaily && (
          <>
            <Text style={styles.daysLabel}>
              Дни недели{availableDays.length === 0 ? ' (каждый день)' : ''}
            </Text>
            <View style={styles.daysRow}>
              {ALL_DAYS.map(({ key, label }) => {
                const selected = availableDays.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleDay(key)}
                    style={[styles.dayChip, selected && styles.dayChipSelected]}>
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.actions}>
          <AppButton title={t('common.save')} onPress={handleSave} disabled={!isValid} />
          <AppButton title={t('common.cancel')} variant="ghost" onPress={() => router.replace('/parent/tasks')} />
        </View>
      </AppCard>
    </AppScreen>
  );
};

export default EditTaskScreen;

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  daysLabel: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: -4,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    alignItems: 'center',
    borderColor: FP.tan,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayChipSelected: {
    backgroundColor: FP.primary,
    borderColor: FP.primary,
  },
  dayChipText: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '700',
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: FP.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
