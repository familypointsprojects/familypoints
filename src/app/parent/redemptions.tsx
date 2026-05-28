import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { RewardRedemption, RewardRedemptionStatus, RewardType } from '@/shared/types/family';
import {
  AppButton,
  AppCard,
  AppScreen,
  EmptyState,
  PointsBadge,
  SectionTitle,
  SegmentedControl,
  SegmentedControlOption,
  StatusBadge,
} from '@/shared/ui';
import { getRewardTitle } from '@/shared/utils/content';

type ParentRedemptionsTab = 'requests' | 'received' | 'rejected';

const redemptionStatusLabelKeys: Record<RewardRedemptionStatus, TranslationKey> = {
  requested: 'redemptionStatus.requested',
  approved: 'redemptionStatus.approved',
  rejected: 'redemptionStatus.rejected',
  fulfilled: 'redemptionStatus.fulfilled',
};

const rewardTypeLabelKeys: Record<RewardType, TranslationKey> = {
  screen_time: 'rewardType.screen_time',
  experience: 'rewardType.experience',
  toy: 'rewardType.toy',
  treat: 'rewardType.treat',
  wish: 'rewardType.wish',
};

const ParentRedemptionsScreen = () => {
  const { t } = useLanguage();
  const { getChildName } = useActiveChild();
  const [activeTab, setActiveTab] = useState<ParentRedemptionsTab>('requests');
  const {
    approveRewardRedemption,
    fulfillRewardRedemption,
    rejectRewardRedemption,
    rewardRedemptions,
    rewards,
    setRewardActive,
  } = useFamilyPoints();
  const requests = rewardRedemptions.filter(
    (item) => item.status === 'requested' || item.status === 'approved',
  );
  const received = rewardRedemptions.filter((item) => item.status === 'fulfilled');
  const rejected = rewardRedemptions.filter((item) => item.status === 'rejected');
  const tabOptions: SegmentedControlOption<ParentRedemptionsTab>[] = [
    { label: t('parent.redemptions.requests'), value: 'requests' },
    { label: t('common.received'), value: 'received' },
    { label: t('parent.redemptions.rejected'), value: 'rejected' },
  ];

  const renderHistoryCard = (redemption: RewardRedemption, showRepeat: boolean) => {
    const reward = rewards.find((item) => item.id === redemption.rewardId);
    const rewardTitle = reward ? getRewardTitle(reward, t) : t('common.rewards');

    return (
      <AppCard key={redemption.id}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>{rewardTitle}</Text>
            <Text style={styles.meta}>{getChildName(redemption.childId)}</Text>
            <View style={styles.badges}>
              {reward && <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />}
              <StatusBadge
                label={t(redemptionStatusLabelKeys[redemption.status])}
                tone={redemption.status === 'fulfilled' ? 'success' : 'danger'}
              />
            </View>
          </View>
          <PointsBadge points={redemption.pointsSpent} />
        </View>
        {showRepeat && reward?.isActive === false && (
          <AppButton
            title={t('parent.redemptions.repeatReward')}
            variant="secondary"
            onPress={() => setRewardActive({ rewardId: reward.id, isActive: true })}
          />
        )}
      </AppCard>
    );
  };

  return (
    <AppScreen title={t('parent.redemptions.title')} subtitle={t('parent.redemptions.subtitle')}>
      <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'requests' && (
        <>
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
                    <Text style={styles.meta}>{getChildName(redemption.childId)}</Text>
                    <View style={styles.badges}>
                      {reward && <StatusBadge label={t(rewardTypeLabelKeys[reward.type])} />}
                      <StatusBadge
                        label={t(redemptionStatusLabelKeys[redemption.status])}
                        tone="warning"
                      />
                    </View>
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
        </>
      )}

      {activeTab === 'received' && (
        <>
          <SectionTitle title={t('common.receivedRewardsAndWishes')} />
          {received.length === 0 && (
            <EmptyState
              title={t('common.received')}
              message={t('parent.redemptions.receivedEmpty')}
            />
          )}
          {received.map((redemption) => renderHistoryCard(redemption, true))}
        </>
      )}

      {activeTab === 'rejected' && (
        <>
          <SectionTitle title={t('parent.redemptions.rejected')} />
          {rejected.length === 0 && (
            <EmptyState
              title={t('parent.redemptions.rejected')}
              message={t('parent.redemptions.rejectedEmpty')}
            />
          )}
          {rejected.map((redemption) => renderHistoryCard(redemption, false))}
        </>
      )}
    </AppScreen>
  );
};

export default ParentRedemptionsScreen;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
  },
  badges: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
  },
  title: {
    color: '#12314A',
    fontSize: 18,
    fontWeight: '900',
  },
  titleGroup: {
    flex: 1,
    gap: 6,
  },
});
