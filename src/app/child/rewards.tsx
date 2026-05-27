import { StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { RewardRedemptionStatus, RewardType } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getRewardTitle } from '@/shared/utils/content';
import { getBalance } from '@/shared/utils/points';

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
};

const redemptionStatusLabelKeys: Record<RewardRedemptionStatus, TranslationKey> = {
  requested: 'redemptionStatus.requested',
  approved: 'redemptionStatus.approved',
  rejected: 'redemptionStatus.rejected',
  fulfilled: 'redemptionStatus.fulfilled',
};

const ChildRewardsScreen = () => {
  const { t } = useLanguage();
  const { pointTransactions, redeemReward, rewardRedemptions, rewards } = useFamilyPoints();
  const balance = getBalance(pointTransactions, childProfile.id);
  const availableRewards = rewards.filter((reward) => reward.isActive !== false);

  return (
    <AppScreen title={t('common.rewards')} subtitle={t('child.rewards.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.yourBalance')} />
        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>
      </AppCard>

      <SectionTitle title={t('common.availableRewards')} />
      {availableRewards.map((reward) => {
        const canRedeem = balance >= reward.price;
        const request = rewardRedemptions.find(
          (redemption) =>
            redemption.rewardId === reward.id &&
            redemption.childId === childProfile.id &&
            redemption.status !== 'rejected',
        );

        return (
          <AppCard key={reward.id}>
            <View style={styles.header}>
              <View style={styles.titleGroup}>
                <Text style={styles.title}>{getRewardTitle(reward, t)}</Text>
                <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />
              </View>
              <PointsBadge points={reward.price} />
            </View>
            {request && (
              <StatusBadge
                label={t(redemptionStatusLabelKeys[request.status])}
                tone={request.status === 'fulfilled' ? 'success' : 'warning'}
              />
            )}
            <AppButton
              title={canRedeem ? t('common.redeem') : t('common.notEnoughPoints')}
              onPress={() => redeemReward(reward.id)}
              disabled={!canRedeem || Boolean(request)}
              variant={canRedeem ? 'primary' : 'secondary'}
            />
          </AppCard>
        );
      })}
    </AppScreen>
  );
};

export default ChildRewardsScreen;

const styles = StyleSheet.create({
  balance: {
    color: '#1F2933',
    fontSize: 42,
    fontWeight: '900',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: '#1F2933',
    fontSize: 18,
    fontWeight: '900',
  },
});
