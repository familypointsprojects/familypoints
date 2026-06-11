import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  IconAlert,
  IconChest,
  IconCoin,
  IconCompass,
  IconFamily,
  IconMap,
  IconMissions,
  IconSettings,
  IconShield,
} from '@/shared/ui/QuestIcons';
import { FP } from '@/constants/theme';

export type BottomActionIcon =
  | 'children'
  | 'create'
  | 'home'
  | 'missions'
  | 'points'
  | 'requests'
  | 'review'
  | 'rewards'
  | 'settings'
  | 'tasks'
  | 'wishes';

export type BottomActionItem = {
  attention?: boolean;
  badgeCount?: number;
  icon: BottomActionIcon;
  isActive?: boolean;
  key: string;
  label: string;
  onPress: () => void;
};

type BottomActionBarProps = {
  items: BottomActionItem[];
};

const iconByType = {
  children: IconFamily,
  create: IconShield,
  home: IconCompass,
  missions: IconMissions,
  points: IconCoin,
  requests: IconFamily,
  review: IconCoin,
  rewards: IconChest,
  settings: IconSettings,
  tasks: IconMap,
  wishes: IconShield,
} satisfies Record<BottomActionIcon, ComponentType<{ size?: number }>>;

export const BottomActionBar = ({ items }: BottomActionBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {items.map((item) => {
        const Icon = iconByType[item.icon];

        return (
          <Pressable
            accessibilityRole="button"
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
            <View style={styles.iconWrap}>
              <View style={styles.iconBox}>
                <Icon size={38} />
                {Boolean(item.badgeCount) && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badgeCount}</Text>
                  </View>
                )}
                {item.attention && (
                  <View style={item.badgeCount ? styles.attentionBadgeWithCount : styles.attentionBadge}>
                    <IconAlert size={20} />
                  </View>
                )}
              </View>
            </View>
            <Text
              style={[styles.label, item.isActive && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    height: 38,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: FP.orange,
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  attentionBadge: {
    position: 'absolute',
    right: -7,
    top: -7,
  },
  attentionBadgeWithCount: {
    left: -7,
    position: 'absolute',
    top: -7,
  },
  bar: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: FP.border,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    elevation: 10,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    shadowColor: FP.primaryDark,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  itemPressed: {
    opacity: 0.7,
    transform: [{ translateY: 1 }],
  },
  label: {
    color: '#8B9CAF',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
    width: '100%',
  },
  labelActive: {
    color: FP.primary,
  },
});
