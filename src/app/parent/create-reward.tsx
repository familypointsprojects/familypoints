import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import type { DayOfWeek, RewardType } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle } from '@/shared/ui';

const rewardTypes: RewardType[] = ['screen_time', 'experience', 'toy', 'treat', 'wish'];

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
  const { createReward } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<RewardType>('experience');
  const [isDailyReward, setIsDailyReward] = useState(false);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([]);
  const [requiresDailyQuests, setRequiresDailyQuests] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const priceValue = Number(price);
  const isValid = title.trim().length > 0 && priceValue > 0;

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
        <SectionTitle title={t('common.rewards')} />
        <AppTextInput
          label={t('common.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('parent.rewards.titlePlaceholder')}
        />
        <AppTextInput
          label={t('common.price')}
          value={price}
          onChangeText={(value) => setPrice(value.replace(/[^\d]/g, ''))}
          placeholder={t('parent.rewards.pricePlaceholder')}
          keyboardType="number-pad"
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
