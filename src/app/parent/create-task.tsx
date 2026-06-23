import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import {
  genderFromAvatarId,
  questEpicLevelConfig,
  questifyTask,
  QUEST_EPIC_LEVELS,
  type QuestEpicLevel,
} from '@/shared/services/questify';
import { useFamilyPoints } from '@/shared/state';
import type { DayOfWeek } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, AppTextInput, ParentChildFilter, SegmentedControl, StatusBadge } from '@/shared/ui';
import { getTaskPointSuggestions } from '@/shared/utils/pricingGuidance';

const EPIC_LEVELS: { label: string; value: QuestEpicLevel }[] = QUEST_EPIC_LEVELS.map((value) => ({
  label: questEpicLevelConfig[value].label,
  value,
}));

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Пн' },
  { key: 'tuesday', label: 'Вт' },
  { key: 'wednesday', label: 'Ср' },
  { key: 'thursday', label: 'Чт' },
  { key: 'friday', label: 'Пт' },
  { key: 'saturday', label: 'Сб' },
  { key: 'sunday', label: 'Вс' },
];

type TaskTemplateCategory = 'home' | 'study' | 'routine' | 'help';

type TaskTemplate = {
  category: TaskTemplateCategory;
  title: string;
  description: string;
  points: number;
  isDaily?: boolean;
  availableDays?: DayOfWeek[];
};

const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const TASK_TEMPLATE_CATEGORIES: { label: string; value: TaskTemplateCategory }[] = [
  { label: 'Дом', value: 'home' },
  { label: 'Учеба', value: 'study' },
  { label: 'Режим', value: 'routine' },
  { label: 'Помощь', value: 'help' },
];

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    category: 'home',
    title: 'Заправить кровать',
    description: 'Аккуратно заправить кровать утром.',
    points: 5,
    isDaily: true,
  },
  {
    category: 'home',
    title: 'Убрать игрушки',
    description: 'Собрать игрушки и положить их на место.',
    points: 8,
  },
  {
    category: 'home',
    title: 'Навести порядок на столе',
    description: 'Убрать лишнее со стола и протереть поверхность.',
    points: 10,
  },
  {
    category: 'home',
    title: 'Помыть посуду',
    description: 'Помыть свою посуду после еды.',
    points: 10,
  },
  {
    category: 'home',
    title: 'Вынести мусор',
    description: 'Вынести мусор и поставить новый пакет.',
    points: 12,
  },
  {
    category: 'study',
    title: 'Сделать домашку',
    description: 'Выполнить домашнее задание без напоминаний.',
    points: 20,
    isDaily: true,
    availableDays: WEEKDAYS,
  },
  {
    category: 'study',
    title: 'Почитать 15 минут',
    description: 'Почитать книгу 15 минут.',
    points: 10,
    isDaily: true,
    availableDays: WEEKDAYS,
  },
  {
    category: 'study',
    title: 'Собрать портфель',
    description: 'Собрать все нужное на завтра.',
    points: 8,
    isDaily: true,
    availableDays: WEEKDAYS,
  },
  {
    category: 'study',
    title: 'Повторить слова',
    description: 'Повторить новые слова или правила 10 минут.',
    points: 10,
  },
  {
    category: 'routine',
    title: 'Почистить зубы утром и вечером',
    description: 'Почистить зубы утром и перед сном.',
    points: 6,
    isDaily: true,
  },
  {
    category: 'routine',
    title: 'Сделать зарядку',
    description: 'Сделать короткую зарядку 5-10 минут.',
    points: 8,
    isDaily: true,
  },
  {
    category: 'routine',
    title: 'Лечь спать вовремя',
    description: 'Подготовиться ко сну и лечь в договоренное время.',
    points: 10,
    isDaily: true,
  },
  {
    category: 'routine',
    title: 'Собрать одежду в стирку',
    description: 'Положить грязную одежду в корзину.',
    points: 6,
  },
  {
    category: 'help',
    title: 'Покормить питомца',
    description: 'Покормить питомца и проверить воду.',
    points: 8,
    isDaily: true,
  },
  {
    category: 'help',
    title: 'Полить растения',
    description: 'Полить растения, которые попросил родитель.',
    points: 8,
  },
  {
    category: 'help',
    title: 'Помочь с покупками',
    description: 'Разобрать покупки или помочь донести пакет.',
    points: 12,
  },
  {
    category: 'help',
    title: 'Убрать со стола после еды',
    description: 'Убрать посуду и протереть стол после еды.',
    points: 8,
    isDaily: true,
  },
];

const CreateTaskScreen = () => {
  const { t } = useLanguage();
  const { children, createTask } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<TaskTemplateCategory>('home');
  const [isDaily, setIsDaily] = useState(false);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([]);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'warning'>('success');
  const [isSaving, setIsSaving] = useState(false);
  const [epicLevel, setEpicLevel] = useState<QuestEpicLevel>('epic');
  const [isQuestifying, setIsQuestifying] = useState(false);
  const [questPreview, setQuestPreview] = useState<
    { title: string; description: string; doneCriteria: string } | null
  >(null);

  const isValid = title.trim().length > 0 && description.trim().length > 0 && Number(points) > 0;
  const canQuestify = title.trim().length > 0 || description.trim().length > 0;
  const visibleTemplates = TASK_TEMPLATES.filter((template) => template.category === selectedTemplateCategory);
  const pointSuggestions = getTaskPointSuggestions({ title, description, isDaily });

  const applyTemplate = (template: TaskTemplate) => {
    setTitle(template.title);
    setDescription(template.description);
    setPoints(String(template.points));
    setIsDaily(template.isDaily ?? false);
    setAvailableDays(template.availableDays ?? []);
    setMessage('');
  };

  const toggleDay = (day: DayOfWeek) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleQuestify = async () => {
    if (!canQuestify || isQuestifying) return;
    setIsQuestifying(true);
    setQuestPreview(null);
    setMessage('');
    try {
      const selectedChild = selectedChildId ? children.find((c) => c.id === selectedChildId) : undefined;
      const result = await questifyTask({
        title,
        description,
        epicLevel,
        childName: selectedChild?.name,
        isDaily,
        gender: genderFromAvatarId(selectedChild?.avatarId),
      });
      setQuestPreview({
        title: result.title,
        description: result.description,
        doneCriteria: result.doneCriteria,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessageTone('warning');
      setMessage(errorMessage);
    } finally {
      setIsQuestifying(false);
    }
  };

  const applyQuestPreview = () => {
    if (!questPreview) return;
    setTitle(questPreview.title);
    setDescription(questPreview.description);
    setQuestPreview(null);
  };

  const handleSubmit = async () => {
    if (!isValid || isSaving) {
      setMessageTone('warning');
      setMessage(t('parent.createTask.invalid'));
      return;
    }

    setMessageTone('success');
    setIsSaving(true);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        points: Number(points),
        childId: selectedChildId,
        isDaily,
        availableDays: isDaily ? availableDays : [],
      });
      setMessage(t('parent.createTask.success', { title: title.trim() }));
      router.replace('/parent/tasks');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessageTone('warning');
      setMessage(errorMessage);
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppScreen title={t('parent.createTask.title')} subtitle={t('parent.createTask.subtitle')}>
      <AppCard>
        <Text style={styles.templatesTitle}>Заготовки квестов</Text>
        <SegmentedControl<TaskTemplateCategory>
          options={TASK_TEMPLATE_CATEGORIES}
          value={selectedTemplateCategory}
          onChange={setSelectedTemplateCategory}
        />
        <View style={styles.templateGrid}>
          {visibleTemplates.map((template) => (
            <Pressable
              accessibilityRole="button"
              key={template.title}
              onPress={() => applyTemplate(template)}
              style={({ pressed }) => [styles.templateCard, pressed && styles.templateCardPressed]}>
              <View style={styles.templateTop}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <StatusBadge label={`${template.points} ${t('common.pointsShort')}`} tone="muted" />
              </View>
              <Text style={styles.templateDescription}>{template.description}</Text>
              {template.isDaily && (
                <Text style={styles.templateMeta}>
                  {template.availableDays?.length === WEEKDAYS.length ? 'Будни' : 'Ежедневный'}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </AppCard>

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
        <View style={styles.suggestionRow}>
          {pointSuggestions.map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.label}
              onPress={() => setPoints(String(suggestion.value))}
              style={({ pressed }) => [
                styles.suggestionChip,
                Number(points) === suggestion.value && styles.suggestionChipSelected,
                pressed && styles.suggestionChipPressed,
              ]}>
              <Text
                style={[
                  styles.suggestionValue,
                  Number(points) === suggestion.value && styles.suggestionValueSelected,
                ]}>
                {suggestion.label}: {suggestion.value}
              </Text>
              <Text
                style={[
                  styles.suggestionNote,
                  Number(points) === suggestion.value && styles.suggestionNoteSelected,
                ]}>
                {suggestion.note}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.questifyBlock}>
          <Text style={styles.questifyLabel}>✨ Превратить в квест</Text>
          <SegmentedControl<QuestEpicLevel>
            options={EPIC_LEVELS}
            value={epicLevel}
            onChange={setEpicLevel}
          />
          <Text style={styles.questifySubtitle}>{questEpicLevelConfig[epicLevel].subtitle}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canQuestify || isQuestifying}
            onPress={handleQuestify}
            style={({ pressed }) => [
              styles.questifyButton,
              (!canQuestify || isQuestifying) && styles.questifyButtonDisabled,
              pressed && styles.questifyButtonPressed,
            ]}>
            {isQuestifying ? (
              <ActivityIndicator color={FP.white} />
            ) : (
              <Text style={styles.questifyButtonText}>✨ Превратить в квест</Text>
            )}
          </Pressable>

          {questPreview && (
            <View style={styles.previewCard}>
              <Text style={styles.previewHeading}>МИССИЯ ГОТОВА</Text>
              <Text style={styles.previewTitle}>{questPreview.title}</Text>
              <Text style={styles.previewDescription}>{questPreview.description}</Text>
              <Text style={styles.previewDoneLabel}>Готово, когда</Text>
              <Text style={styles.previewDone}>{questPreview.doneCriteria}</Text>
              <View style={styles.previewActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={applyQuestPreview}
                  style={({ pressed }) => [styles.previewApply, pressed && styles.questifyButtonPressed]}>
                  <Text style={styles.previewApplyText}>Применить</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setQuestPreview(null)}
                  style={({ pressed }) => [styles.previewCancel, pressed && styles.questifyButtonPressed]}>
                  <Text style={styles.previewCancelText}>Отмена</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

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

        <AppButton
          title={isSaving ? t('common.saving') : t('parent.createTask.submit')}
          onPress={handleSubmit}
          disabled={isSaving}
        />
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
  templatesTitle: {
    color: FP.text,
    fontSize: 18,
    fontWeight: '900',
  },
  templateGrid: {
    gap: 8,
  },
  templateCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#E9D7A8',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  templateCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  templateTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  templateTitle: {
    color: FP.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  templateDescription: {
    color: FP.textSub,
    fontSize: 13,
    lineHeight: 18,
  },
  templateMeta: {
    color: FP.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: FP.primaryLight,
    borderColor: FP.primaryBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  suggestionChipPressed: {
    opacity: 0.78,
  },
  suggestionChipSelected: {
    backgroundColor: FP.primary,
    borderColor: FP.primary,
  },
  suggestionValue: {
    color: FP.primaryDark,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  suggestionValueSelected: {
    color: '#FFFFFF',
  },
  suggestionNote: {
    color: FP.textSub,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  suggestionNoteSelected: {
    color: '#EAF8F4',
  },
  questifyBlock: {
    backgroundColor: FP.primaryLight,
    borderColor: FP.primaryBorder,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  questifyLabel: {
    color: FP.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  questifySubtitle: {
    color: FP.textSub,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
    textAlign: 'center',
  },
  questifyButton: {
    alignItems: 'center',
    backgroundColor: FP.purple,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  questifyButtonDisabled: {
    opacity: 0.5,
  },
  questifyButtonPressed: {
    opacity: 0.8,
  },
  questifyButtonText: {
    color: FP.white,
    fontSize: 15,
    fontWeight: '900',
  },
  previewCard: {
    backgroundColor: FP.white,
    borderColor: FP.primaryBorder,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  previewHeading: {
    color: FP.purple,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewTitle: {
    color: FP.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  previewDescription: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 19,
  },
  previewDoneLabel: {
    color: FP.textSub,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  previewDone: {
    color: FP.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  previewApply: {
    alignItems: 'center',
    backgroundColor: FP.primaryDark,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
  },
  previewApplyText: {
    color: FP.white,
    fontSize: 14,
    fontWeight: '900',
  },
  previewCancel: {
    alignItems: 'center',
    backgroundColor: FP.muted,
    borderColor: FP.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  previewCancelText: {
    color: FP.textSub,
    fontSize: 14,
    fontWeight: '800',
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
