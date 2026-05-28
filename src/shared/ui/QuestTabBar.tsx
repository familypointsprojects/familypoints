import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FP } from '@/constants/theme';
import { TranslationKey, useLanguage } from '@/shared/i18n';
import {
  IconChest,
  IconCoin,
  IconCompass,
  IconFamily,
  IconMap,
  IconPlus,
  IconShield,
} from './QuestIcons';

type IconComponent = React.FC<{ size?: number }>;

type TabItem = {
  key: string;
  labelKey: TranslationKey;
  route: string;
  Icon: IconComponent;
  fab?: boolean;
};

const childItems: TabItem[] = [
  { key: 'home', labelKey: 'common.home', route: '/child/dashboard', Icon: IconCompass },
  { key: 'tasks', labelKey: 'common.tasks', route: '/child/tasks', Icon: IconMap },
  { key: 'balance', labelKey: 'child.quick.points', route: '/child/balance', Icon: IconCoin },
  { key: 'rewards', labelKey: 'common.rewards', route: '/child/rewards', Icon: IconChest },
];

const parentItems: TabItem[] = [
  { key: 'home', labelKey: 'common.children', route: '/parent/dashboard', Icon: IconFamily },
  { key: 'submissions', labelKey: 'parent.quick.review', route: '/parent/submissions', Icon: IconShield },
  { key: 'create', labelKey: 'parent.quick.create', route: '/parent/create-task', Icon: IconPlus, fab: true },
  { key: 'rewards', labelKey: 'parent.quick.rewards', route: '/parent/rewards', Icon: IconChest },
  { key: 'tasks', labelKey: 'parent.quick.tasks', route: '/parent/tasks', Icon: IconMap },
];

type QuestTabBarProps = {
  role: 'child' | 'parent';
  active: string;
};

export const QuestTabBar: React.FC<QuestTabBarProps> = ({ role, active }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const items = role === 'child' ? childItems : parentItems;

  const go = (route: string, isActive: boolean) => {
    if (isActive) return;
    router.push(route as never);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {items.map((item) => {
        const isActive = item.key === active;
        const Icon = item.Icon;

        if (item.fab) {
          return (
            <Pressable
              key={item.key}
              onPress={() => go(item.route, false)}
              accessibilityRole="button"
              accessibilityLabel={t(item.labelKey)}
              style={({ pressed }) => [styles.fabWrap, pressed && styles.pressed]}
            >
              <View style={styles.fab}>
                <Icon size={26} />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={item.key}
            onPress={() => go(item.route, isActive)}
            accessibilityRole="button"
            accessibilityLabel={t(item.labelKey)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Icon size={26} />
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: FP.white,
    borderTopWidth: 1,
    borderTopColor: FP.border,
    paddingTop: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A9B6BF',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: FP.primaryDark,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: FP.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: FP.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  pressed: {
    opacity: 0.65,
  },
});
