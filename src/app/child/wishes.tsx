import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, PointsBadge, SectionTitle } from '@/shared/ui';
import { getWishTitle } from '@/shared/utils/content';
import { getBalance, getProgressPercent } from '@/shared/utils/points';

const ChildWishesScreen = () => {
  const { t } = useLanguage();
  const { addWish, pointTransactions, wishes } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const balance = getBalance(pointTransactions, childProfile.id);

  const canAddWish = title.trim().length > 0 && Number(price) > 0;

  const handleAddWish = () => {
    if (!canAddWish) {
      return;
    }

    addWish({
      title: title.trim(),
      price: Number(price),
    });
    setTitle('');
    setPrice('');
  };

  return (
    <AppScreen title={t('common.wishes')} subtitle={t('child.wishes.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.addWish')} />
        <AppTextInput
          label={t('common.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('child.wishes.titlePlaceholder')}
        />
        <AppTextInput
          label={t('common.price')}
          value={price}
          onChangeText={setPrice}
          placeholder={t('child.wishes.pricePlaceholder')}
          keyboardType="number-pad"
        />
        <AppButton title={t('common.addWish')} onPress={handleAddWish} disabled={!canAddWish} />
      </AppCard>

      <SectionTitle title={t('common.wishlist')} />
      {wishes.map((wish) => {
        const progress = getProgressPercent(balance, wish.price);
        const wishTitle = getWishTitle(wish, t);

        return (
          <AppCard key={wish.id}>
            <View style={styles.header}>
              <Text style={styles.title}>{wishTitle}</Text>
              <PointsBadge points={wish.price} prefix={t('common.goal')} />
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.meta}>{t('child.wishes.progress', { progress, balance })}</Text>
          </AppCard>
        );
      })}
    </AppScreen>
  );
};

export default ChildWishesScreen;

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#1F2933',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: '#E8ECEE',
    borderRadius: 8,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#58A4B0',
    height: 12,
  },
  meta: {
    color: '#5F6C72',
    fontSize: 14,
  },
});
