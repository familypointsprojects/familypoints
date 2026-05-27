import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { RewardType } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getRewardTitle } from '@/shared/utils/content';

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
};

const ParentRewardsScreen = () => {
  const { t } = useLanguage();
  const { rewards, setRewardActive } = useFamilyPoints();

  return (
    <AppScreen title={t('common.rewards')} subtitle={t('parent.rewards.subtitle')}>
      <SectionTitle title={t('common.availableRewards')} />
      <View style={styles.topActions}>
        <AppButton title={t('parent.rewards.create')} onPress={() => router.push('/parent/create-reward')} />
        <AppButton
          title={t('parent.redemptions.title')}
          variant="secondary"
          onPress={() => router.push('/parent/redemptions')}
        />
      </View>
      {rewards.map((reward) => (
        <AppCard key={reward.id}>
          <View style={styles.header}>
            <Text style={styles.title}>{getRewardTitle(reward, t)}</Text>
            <View style={styles.badges}>
              <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} tone="muted" />
              <StatusBadge
                label={reward.isActive === false ? t('common.inactive') : t('common.active')}
                tone={reward.isActive === false ? 'warning' : 'success'}
              />
            </View>
          </View>
          <PointsBadge points={reward.price} prefix={t('common.price')} />
          <AppButton
            title={reward.isActive === false ? t('common.activate') : t('common.deactivate')}
            variant="ghost"
            onPress={() =>
              setRewardActive({
                rewardId: reward.id,
                isActive: reward.isActive === false,
              })
            }
          />
        </AppCard>
      ))}
    </AppScreen>
  );
};

export default ParentRewardsScreen;

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
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  topActions: {
    gap: 10,
  },
});
