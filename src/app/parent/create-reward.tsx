import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { RewardType } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle } from '@/shared/ui';

const rewardTypes: RewardType[] = ['screen_time', 'experience', 'toy', 'treat', 'wish'];

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
  wish: 'rewardType.wish',
};

const CreateRewardScreen = () => {
  const { t } = useLanguage();
  const { createReward } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<RewardType>('experience');
  const [isSaving, setIsSaving] = useState(false);
  const priceValue = Number(price);
  const isValid = title.trim().length > 0 && priceValue > 0;

  const handleSubmit = async () => {
    if (!isValid || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await createReward({ title: title.trim(), price: priceValue, type });
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexGrow: 1,
    minWidth: 140,
  },
});
