import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import type { DayOfWeek, RewardType } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, AppTextInput, ParentChildFilter, SectionTitle, SegmentedControl, StatusBadge } from '@/shared/ui';
import { getRewardPriceSuggestions } from '@/shared/utils/pricingGuidance';

const rewardTypes: RewardType[] = ['screen_time', 'experience', 'toy', 'treat', 'wish'];

type RewardTemplateCategory = 'screen_time' | 'experience' | 'treat' | 'toy';

type RewardTemplate = {
  category: RewardTemplateCategory;
  title: string;
  price: number;
  type: RewardType;
  isDailyReward?: boolean;
};

const REWARD_TEMPLATE_CATEGORIES: { label: string; value: RewardTemplateCategory }[] = [
  { label: 'Экран', value: 'screen_time' },
  { label: 'Активность', value: 'experience' },
  { label: 'Вкусняшки', value: 'treat' },
  { label: 'Покупка', value: 'toy' },
];

const REWARD_TEMPLATES: RewardTemplate[] = [
  { category: 'screen_time', title: 'YouTube — 30 минут', price: 10, type: 'screen_time', isDailyReward: true },
  { category: 'screen_time', title: 'YouTube — 1 час', price: 20, type: 'screen_time', isDailyReward: true },
  { category: 'screen_time', title: 'Видеоигры — 30 минут', price: 15, type: 'screen_time', isDailyReward: true },
  { category: 'screen_time', title: 'Видеоигры — 1 час', price: 25, type: 'screen_time', isDailyReward: true },
  { category: 'screen_time', title: 'Фильм или мультфильм', price: 30, type: 'screen_time' },
  { category: 'screen_time', title: 'TikTok — 15 минут', price: 10, type: 'screen_time', isDailyReward: true },
  { category: 'experience', title: 'Поход в кино', price: 120, type: 'experience' },
  { category: 'experience', title: 'Кафе или ресторан', price: 100, type: 'experience' },
  { category: 'experience', title: 'Боулинг', price: 150, type: 'experience' },
  { category: 'experience', title: 'Парк развлечений', price: 200, type: 'experience' },
  { category: 'experience', title: 'Поездка в аквапарк', price: 250, type: 'experience' },
  { category: 'experience', title: 'Прогулка куда захочу', price: 80, type: 'experience' },
  { category: 'treat', title: 'Мороженое', price: 20, type: 'treat' },
  { category: 'treat', title: 'Пицца на выбор', price: 50, type: 'treat' },
  { category: 'treat', title: 'Торт или пирожное', price: 40, type: 'treat' },
  { category: 'treat', title: 'Чипсы или снеки', price: 15, type: 'treat' },
  { category: 'treat', title: 'Сладости на выбор', price: 20, type: 'treat' },
  { category: 'treat', title: 'Фастфуд', price: 60, type: 'treat' },
  { category: 'toy', title: 'Набор LEGO', price: 300, type: 'toy' },
  { category: 'toy', title: 'Новая книга', price: 80, type: 'toy' },
  { category: 'toy', title: 'Настольная игра', price: 200, type: 'toy' },
  { category: 'toy', title: 'Карточки (Pokémon и др.)', price: 100, type: 'toy' },
  { category: 'toy', title: 'Игрушка на выбор', price: 150, type: 'toy' },
  { category: 'toy', title: 'Канцелярия на выбор', price: 60, type: 'toy' },
];

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
  wish: 'rewardType.wish',
};

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Пн' },
  { key: 'tuesday', label: 'Вт' },
  { key: 'wednesday', label: 'Ср' },
  { key: 'thursday', label: 'Чт' },
  { key: 'friday', label: 'Пт' },
  { key: 'saturday', label: 'Сб' },
  { key: 'sunday', label: 'Вс' },
];

const CreateRewardScreen = () => {
  const { t } = useLanguage();
  const { children, createReward, rewards, tasks } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<RewardType>('experience');
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<RewardTemplateCategory>('screen_time');
  const [isDailyReward, setIsDailyReward] = useState(false);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([]);
  const [requiresDailyQuests, setRequiresDailyQuests] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const priceValue = Number(price);
  const isValid = title.trim().length > 0 && priceValue > 0;
  const visibleTemplates = REWARD_TEMPLATES.filter((tpl) => tpl.category === selectedTemplateCategory);

  const applyTemplate = (template: RewardTemplate) => {
    setTitle(template.title);
    setPrice(String(template.price));
    setType(template.type);
    setIsDailyReward(template.isDailyReward ?? false);
    setAvailableDays([]);
    setRequiresDailyQuests(false);
  };
  const priceSuggestions = getRewardPriceSuggestions({
    rewardType: type,
    isDailyReward,
    childId: selectedChildId,
    rewards,
    tasks,
  });

  const toggleDay = (day: DayOfWeek) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async () => {
    if (!isValid || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await createReward({
        title: title.trim(),
        price: priceValue,
        type,
        childId: selectedChildId,
        isDailyReward,
        availableDays: isDailyReward ? availableDays : [],
        requiresDailyQuestsCompleted: isDailyReward ? requiresDailyQuests : false,
      });
      router.replace('/parent/rewards');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppScreen title={t('parent.rewards.create')} subtitle={t('parent.rewards.createSubtitle')}>
      <AppCard>
        <Text style={styles.templatesTitle}>Заготовки наград</Text>
        <SegmentedControl<RewardTemplateCategory>
          options={REWARD_TEMPLATE_CATEGORIES}
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
                <StatusBadge label={`${template.price} ${t('common.pointsShort')}`} tone="muted" />
              </View>
              {template.isDailyReward && (
                <Text style={styles.templateMeta}>Ежедневная</Text>
              )}
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title={t('common.rewards')} />
        <AppTextInput
          label={t('common.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('parent.rewards.titlePlaceholder')}
        />
        <View style={styles.typeGrid}>
          {rewardTypes.map((item) => (
            <AppButton
              key={item}
              title={t(rewardTypeLabelKeys[item])}
              variant={type === item ? 'primary' : 'secondary'}
              onPress={() => setType(item)}
              style={styles.typeButton}
            />
          ))}
        </View>

        <ParentChildFilter
          childrenList={children}
          label={t('parent.assignment.child')}
          selectedChildId={selectedChildId}
          onChange={setSelectedChildId}
        />

        {/* Daily reward toggle */}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Ежедневная награда</Text>
          <Switch
            value={isDailyReward}
            onValueChange={setIsDailyReward}
            trackColor={{ true: FP.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {isDailyReward && (
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

            <Pressable
              onPress={() => setRequiresDailyQuests((v) => !v)}
              style={styles.checkboxRow}>
              <View style={[styles.checkbox, requiresDailyQuests && styles.checkboxChecked]}>
                {requiresDailyQuests && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Открывать только после выполнения ежедневных квестов
              </Text>
            </Pressable>
          </>
        )}

        <AppTextInput
          label={t('common.price')}
          value={price}
          onChangeText={(value) => setPrice(value.replace(/[^\d]/g, ''))}
          placeholder={t('parent.rewards.pricePlaceholder')}
          keyboardType="number-pad"
        />
        <View style={styles.suggestionRow}>
          {priceSuggestions.map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.label}
              onPress={() => setPrice(String(suggestion.value))}
              style={({ pressed }) => [
                styles.suggestionChip,
                priceValue === suggestion.value && styles.suggestionChipSelected,
                pressed && styles.suggestionChipPressed,
              ]}>
              <Text
                style={[
                  styles.suggestionValue,
                  priceValue === suggestion.value && styles.suggestionValueSelected,
                ]}>
                {suggestion.label}: {suggestion.value}
              </Text>
              <Text
                style={[
                  styles.suggestionNote,
                  priceValue === suggestion.value && styles.suggestionNoteSelected,
                ]}>
                {suggestion.note}
              </Text>
            </Pressable>
          ))}
        </View>

        <AppButton
          title={isSaving ? t('common.saving') : t('parent.rewards.create')}
          onPress={handleSubmit}
          disabled={!isValid || isSaving}
        />
      </AppCard>
    </AppScreen>
  );
};

export default CreateRewardScreen;

const styles = StyleSheet.create({
  templateCard: {
    backgroundColor: FP.primaryLight,
    borderColor: FP.primaryBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 140,
    padding: 10,
    gap: 4,
  },
  templateCardPressed: {
    opacity: 0.75,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateMeta: {
    color: FP.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
  templateTitle: {
    color: FP.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  templateTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  templatesTitle: {
    color: FP.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  checkboxRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: FP.tan,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: FP.primary,
    borderColor: FP.primary,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxLabel: {
    color: FP.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
  divider: {
    backgroundColor: FP.border,
    height: 1,
    marginVertical: 4,
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
  typeButton: {
    flexGrow: 1,
    minWidth: 140,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
