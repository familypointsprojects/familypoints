import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import type { DayOfWeek } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, AppTextInput, StatusBadge } from '@/shared/ui';

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Пн' },
  { key: 'tuesday', label: 'Вт' },
  { key: 'wednesday', label: 'Ср' },
  { key: 'thursday', label: 'Чт' },
  { key: 'friday', label: 'Пт' },
  { key: 'saturday', label: 'Сб' },
  { key: 'sunday', label: 'Вс' },
];

const CreateTaskScreen = () => {
  const { t } = useLanguage();
  const { createTask } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [isDaily, setIsDaily] = useState(false);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([]);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'warning'>('success');

  const isValid = title.trim().length > 0 && description.trim().length > 0 && Number(points) > 0;

  const toggleDay = (day: DayOfWeek) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = () => {
    if (!isValid) {
      setMessageTone('warning');
      setMessage(t('parent.createTask.invalid'));
      return;
    }

    setMessageTone('success');
    createTask({
      title: title.trim(),
      description: description.trim(),
      points: Number(points),
      isDaily,
      availableDays: isDaily ? availableDays : [],
    });
    setMessage(t('parent.createTask.success', { title: title.trim() }));
    setTitle('');
    setDescription('');
    setPoints('');
    setIsDaily(false);
    setAvailableDays([]);
  };

  return (
    <AppScreen title={t('parent.createTask.title')} subtitle={t('parent.createTask.subtitle')}>
      <AppCard>
        <AppTextInput
          label={t('common.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('parent.createTask.titlePlaceholder')}
        />
        <AppTextInput
          label={t('common.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('parent.createTask.descriptionPlaceholder')}
          multiline
        />
        <AppTextInput
          label={t('common.points')}
          value={points}
          onChangeText={setPoints}
          placeholder={t('parent.createTask.pointsPlaceholder')}
          keyboardType="number-pad"
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

        <AppButton title={t('parent.createTask.submit')} onPress={handleSubmit} />
      </AppCard>

      {Boolean(message) && (
        <View style={styles.message}>
          <StatusBadge
            label={messageTone === 'success' ? t('common.success') : t('common.checkForm')}
            tone={messageTone}
          />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
    </AppScreen>
  );
};

export default CreateTaskScreen;

const styles = StyleSheet.create({
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
  message: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE3CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  messageText: {
    color: FP.ink,
    fontSize: 14,
    lineHeight: 20,
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
