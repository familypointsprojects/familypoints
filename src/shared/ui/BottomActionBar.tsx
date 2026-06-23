import { ComponentType } from 'react';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
import { FP, gameText } from '@/constants/theme';

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
  const pathname = usePathname();
  const isChildArcade = pathname.startsWith('/child');

  return (
    <View style={[styles.root, isChildArcade && styles.rootArcade]}>
      <View style={[styles.shadowShell, isChildArcade && styles.shadowShellArcade]}>
        <View style={[styles.bar, isChildArcade && styles.barArcade]}>
          {items.map((item, index) => {
            const Icon = iconByType[item.icon];
            const iconSize = iconSizeByType[item.icon];
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <Pressable
                accessibilityRole="button"
                hitSlop={4}
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.item,
                  isChildArcade && styles.itemArcade,
                  isChildArcade && item.isActive && styles.itemActiveArcade,
                  isChildArcade && isFirst && styles.itemFirstArcade,
                  isChildArcade && isLast && styles.itemLastArcade,
                  pressed && styles.itemPressed,
                ]}>
                <View style={styles.iconWrap}>
                  <View style={[
                    styles.iconBox,
                    isChildArcade && styles.iconBoxArcade,
                    item.isActive && styles.iconBoxActive,
                    isChildArcade && item.isActive && styles.iconBoxActiveArcade,
                  ]}>
                    <Icon size={iconSize} />
                    {Boolean(item.badgeCount) && (
                      <View style={[styles.badge, isChildArcade && styles.badgeArcade]}>
                        {isChildArcade && <View pointerEvents="none" style={styles.badgeArcadeBottom} />}
                        <Text style={[styles.badgeText, gameText, isChildArcade && styles.badgeTextArcade]}>
                          {item.badgeCount}
                        </Text>
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
                  style={[
                    styles.label,
                    gameText,
                    isChildArcade && styles.labelArcade,
                    item.isActive && styles.labelActive,
                    isChildArcade && item.isActive && styles.labelActiveArcade,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingTop: 8,
    width: '100%',
  },
  rootArcade: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  shadowShell: {
    alignSelf: 'center',
    borderRadius: 3,
    elevation: 24,
    maxWidth: 520,
    shadowColor: '#0D2440',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    width: '100%',
  },
  shadowShellArcade: {
    borderRadius: 0,
    maxWidth: '100%',
    shadowColor: '#061426',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.22,
    shadowRadius: 0,
  },
  bar: {
    alignItems: 'center',
    backgroundColor: 'rgba(248, 251, 255, 0.98)',
    borderRadius: 3,
    borderColor: 'rgba(127, 159, 222, 0.55)',
    borderWidth: 2,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'space-between',
    minHeight: 74,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 8,
    width: '100%',
  },
  barArcade: {
    backgroundColor: '#181821',
    borderColor: '#061426',
    borderRadius: 0,
    borderWidth: 4,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    gap: 0,
    minHeight: 86,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: '#061426',
  },
  iconBox: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 2,
    borderWidth: 2,
    height: 46,
    justifyContent: 'center',
    width: 48,
  },
  iconBoxArcade: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    height: 42,
    overflow: 'visible',
    position: 'relative',
    width: 56,
  },
  iconBoxActive: {
    backgroundColor: '#E7F0FF',
    borderColor: FP.primary,
    shadowColor: FP.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 0,
    transform: [{ translateY: -3 }, { scale: 1.035 }],
  },
  iconBoxActiveArcade: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowColor: '#061426',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#FF2F2F',
    borderColor: '#061426',
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
  badgeArcade: {
    backgroundColor: '#31D63D',
    borderColor: '#061426',
    borderRadius: 11,
    borderWidth: 3,
    height: 22,
    minWidth: 22,
    overflow: 'hidden',
    paddingHorizontal: 3,
    right: -7,
    top: -5,
  },
  badgeArcadeBottom: {
    backgroundColor: '#159B27',
    bottom: 0,
    height: 4,
    left: 0,
    opacity: 0.75,
    position: 'absolute',
    right: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
  },
  badgeTextArcade: {
    fontSize: 12,
    lineHeight: 14,
    zIndex: 2,
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
    height: 46,
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
  itemArcade: {
    alignSelf: 'stretch',
    backgroundColor: '#2A252E',
    borderLeftColor: '#111018',
    borderLeftWidth: 3,
    borderRightColor: '#3A3440',
    borderRightWidth: 1,
    gap: 0,
    justifyContent: 'center',
    minHeight: 78,
    paddingHorizontal: 1,
    paddingTop: 7,
    paddingBottom: 6,
  },
  itemActiveArcade: {
    backgroundColor: '#326BFF',
    borderLeftColor: '#071426',
    borderRightColor: '#071426',
  },
  itemFirstArcade: {
    borderLeftWidth: 0,
  },
  itemLastArcade: {
    borderRightWidth: 0,
  },
  itemPressed: {
    opacity: 0.74,
    transform: [{ translateY: 1 }],
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    width: '100%',
  },
  labelArcade: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelActiveArcade: {
    color: '#FFFFFF',
  },
});
