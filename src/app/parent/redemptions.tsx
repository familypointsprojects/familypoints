import { StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { RewardRedemptionStatus } from '@/shared/types/family';
import { AppButton, AppCard, AppScreen, EmptyState, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getRewardTitle } from '@/shared/utils/content';

const redemptionStatusLabelKeys: Record<RewardRedemptionStatus, TranslationKey> = {
  requested: 'redemptionStatus.requested',
  approved: 'redemptionStatus.approved',
  rejected: 'redemptionStatus.rejected',
  fulfilled: 'redemptionStatus.fulfilled',
};

const ParentRedemptionsScreen = () => {
  const { t } = useLanguage();
  const {
    approveRewardRedemption,
    fulfillRewardRedemption,
    rejectRewardRedemption,
    rewardRedemptions,
    rewards,
  } = useFamilyPoints();
  const requests = rewardRedemptions.filter((item) => item.status !== 'rejected');

  return (
    <AppScreen title={t('parent.redemptions.title')} subtitle={t('parent.redemptions.subtitle')}>
      <SectionTitle title={t('parent.redemptions.requests')} />
      {requests.length === 0 && (
        <EmptyState title={t('common.allCaughtUp')} message={t('parent.redemptions.empty')} />
      )}

      {requests.map((redemption) => {
        const reward = rewards.find((item) => item.id === redemption.rewardId);
        const rewardTitle = reward ? getRewardTitle(reward, t) : t('common.rewards');

        return (
          <AppCard key={redemption.id}>
            <View style={styles.header}>
              <View style={styles.titleGroup}>
                <Text style={styles.title}>{rewardTitle}</Text>
                <Text style={styles.meta}>{childProfile.name}</Text>
                <StatusBadge label={t(redemptionStatusLabelKeys[redemption.status])} tone="warning" />
              </View>
              <PointsBadge points={redemption.pointsSpent} />
            </View>
            <View style={styles.actions}>
              <AppButton
                title={t('common.approve')}
                onPress={() => approveRewardRedemption(redemption.id)}
                disabled={redemption.status !== 'requested'}
                style={styles.actionButton}
              />
              <AppButton
                title={t('common.fulfill')}
                variant="secondary"
                onPress={() => fulfillRewardRedemption(redemption.id)}
                disabled={redemption.status !== 'approved'}
                style={styles.actionButton}
              />
              <AppButton
                title={t('common.reject')}
                variant="danger"
                onPress={() => rejectRewardRedemption(redemption.id)}
                disabled={redemption.status !== 'requested'}
                style={styles.actionButton}
              />
            </View>
          </AppCard>
        );
      })}
    </AppScreen>
  );
};

export default ParentRedemptionsScreen;

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: '#1F2933',
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: '#5F6C72',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
  },
});
