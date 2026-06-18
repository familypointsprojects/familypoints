import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';
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

const iconSizeByType = {
  children: 34,
  create: 34,
  home: 34,
  missions: 37,
  points: 33,
  requests: 34,
  review: 33,
  rewards: 36,
  settings: 34,
  tasks: 34,
  wishes: 34,
} satisfies Record<BottomActionIcon, number>;

export const BottomActionBar = ({ items }: BottomActionBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={styles.shadowShell}>
        <GlassView
          colorScheme="light"
          glassEffectStyle="regular"
          tintColor="rgba(241, 246, 253, 0.9)"
          style={styles.bar}>
          <View pointerEvents="none" style={styles.glassRim} />
          <View pointerEvents="none" style={styles.innerTopHighlight} />
          {items.map((item) => {
            const Icon = iconByType[item.icon];
            const iconSize = iconSizeByType[item.icon];

            return (
              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
                <View style={styles.iconWrap}>
                  <View style={[styles.iconBox, item.isActive && styles.iconBoxActive]}>
                    <Icon size={iconSize} />
                    {Boolean(item.badgeCount) && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badgeCount}</Text>
                      </View>
                    )}
                    {item.attention && (
                      <View style={item.badgeCount ? styles.attentionBadgeWithCount : styles.attentionBadge}>
                        <IconAlert size={18} />
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  style={[styles.label, item.isActive && styles.labelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </GlassView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingTop: 6,
    width: '100%',
  },
  shadowShell: {
    alignSelf: 'center',
    borderRadius: 30,
    elevation: 24,
    maxWidth: 520,
    shadowColor: '#0D2440',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    width: '100%',
  },
  bar: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 249, 253, 0.97)',
    borderRadius: 30,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'space-between',
    minHeight: 68,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
    width: '100%',
  },
  glassRim: {
    borderBottomColor: 'rgba(75, 62, 48, 0.11)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderLeftColor: 'rgba(75, 62, 48, 0.08)',
    borderLeftWidth: 1,
    borderRightColor: 'rgba(75, 62, 48, 0.08)',
    borderRightWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.32)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  innerTopHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    height: 1,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 1,
  },
  iconBox: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconBoxActive: {
    transform: [{ translateY: -1 }, { scale: 1.015 }],
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  attentionBadge: {
    position: 'absolute',
    right: -6,
    top: -4,
  },
  attentionBadgeWithCount: {
    left: -6,
    position: 'absolute',
    top: -4,
  },
  iconWrap: {
    alignItems: 'center',
    height: 39,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 2,
    zIndex: 1,
  },
  itemPressed: {
    opacity: 0.74,
    transform: [{ translateY: 1 }],
  },
  label: {
    color: '#8295A8',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
    width: '100%',
  },
  labelActive: {
    color: FP.primary,
  },
});
