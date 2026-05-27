import { StyleSheet, Text, View } from 'react-native';

import { TranslationKey, useLanguage } from '@/shared/i18n';
import { childProfile } from '@/shared/mocks';
import { useFamilyPoints } from '@/shared/state';
import { PointTransactionType } from '@/shared/types/family';
import { AppCard, AppScreen, PointsBadge, SectionTitle, StatusBadge } from '@/shared/ui';
import { getTransactionTitle } from '@/shared/utils/content';
import { getBalance } from '@/shared/utils/points';

const transactionLabelKeys: Record<PointTransactionType, TranslationKey> = {
  earn: 'transactionType.earn',
  spend: 'transactionType.spend',
  penalty: 'transactionType.penalty',
  manual_adjustment: 'transactionType.manual_adjustment',
};

const getTransactionTone = (type: PointTransactionType) => {
  if (type === 'earn' || type === 'manual_adjustment') {
    return 'success';
  }

  return type === 'penalty' ? 'danger' : 'muted';
};

const formatDate = (dateValue: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(dateValue));

const ChildBalanceScreen = () => {
  const { language, t } = useLanguage();
  const { pointTransactions } = useFamilyPoints();
  const balance = getBalance(pointTransactions, childProfile.id);
  const locale = language === 'ru' ? 'ru' : 'en';

  return (
    <AppScreen title={t('common.balance')} subtitle={t('child.balance.subtitle')}>
      <AppCard>
        <SectionTitle title={t('common.currentBalance')} />
        <Text style={styles.balance}>
          {balance} {t('common.pointsShort')}
        </Text>
      </AppCard>

      <SectionTitle title={t('common.history')} />
      {pointTransactions.map((transaction) => (
        <AppCard key={transaction.id}>
          <View style={styles.header}>
            <View style={styles.textGroup}>
              <Text style={styles.title}>{getTransactionTitle(transaction, t)}</Text>
              <Text style={styles.meta}>{formatDate(transaction.createdAt, locale)}</Text>
            </View>
            <PointsBadge points={transaction.points} />
          </View>
          <StatusBadge
            label={t(transactionLabelKeys[transaction.type])}
            tone={getTransactionTone(transaction.type)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
};

export default ChildBalanceScreen;

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
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#1F2933',
    fontSize: 17,
    fontWeight: '900',
  },
  meta: {
    color: '#5F6C72',
    fontSize: 14,
  },
});
