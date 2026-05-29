import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { IconChest, IconCoin, IconMap } from '@/shared/ui/QuestIcons';

const ICON_SIZE = 26;

export const QuestFlowPill = () => {
  const { t } = useLanguage();

  return (
    <View style={styles.pill}>
      <View style={styles.item}>
        <IconMap size={ICON_SIZE} />
        <Text style={styles.label}>{t('welcome.flowQuests')}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>

      <View style={styles.item}>
        <IconCoin size={ICON_SIZE} />
        <Text style={styles.label}>{t('welcome.flowPoints')}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>

      <View style={styles.item}>
        <IconChest size={ICON_SIZE} />
        <Text style={styles.label}>{t('welcome.flowRewards')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: FP.white,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: FP.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 12px rgba(18,49,74,0.08)' },
    }),
  },
  item: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
  },
  label: {
    color: FP.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  chevron: {
    color: FP.textSub,
    fontSize: 18,
    marginBottom: 16,
    lineHeight: 18,
  },
});
