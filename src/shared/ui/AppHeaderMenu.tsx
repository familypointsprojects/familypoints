import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { FP } from '@/constants/theme';
import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';

export const AppHeaderMenu = () => {
  const { session, signOut } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOutPress = async () => {
    setIsMenuOpen(false);
    await signOut();
    router.replace('/');
  };

  const handleSettingsPress = () => {
    setIsMenuOpen(false);
    router.push('/settings');
  };

  return (
    <>
      <Pressable
        accessibilityLabel={t('common.settings')}
        accessibilityRole="button"
        onPress={() => setIsMenuOpen(true)}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
        <Svg width={25} height={25} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={3.1} fill="none" stroke={FP.primary} strokeWidth={2.2} />
          <Path
            d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.4-2.4 1a8.1 8.1 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.6A8.1 8.1 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.5 2 3.4 2.4-1a8.1 8.1 0 0 0 2.6 1.5l.4 2.6h4l.4-2.6a8.1 8.1 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5z"
            fill="none"
            stroke={FP.primary}
            strokeLinejoin="round"
            strokeWidth={1.7}
          />
        </Svg>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
        transparent
        visible={isMenuOpen}>
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={() => setIsMenuOpen(false)} />
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{t('common.settings')}</Text>
            <View style={styles.menuDivider} />
            <LanguageToggle />
            <View style={styles.menuDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={handleSettingsPress}
              style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
              <Text style={styles.menuActionText}>{t('common.settings')}</Text>
            </Pressable>
            {Boolean(session) && (
              <Pressable
                accessibilityRole="button"
                onPress={handleSignOutPress}
                style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
                <Text style={[styles.menuActionText, styles.signOutText]}>{t('auth.signOut')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    alignItems: 'center',
    backgroundColor: FP.primaryLight,
    borderColor: FP.primaryBorder,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  menuOverlay: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(18, 49, 74, 0.18)',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 58,
  },
  menuBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  menuCard: {
    backgroundColor: FP.white,
    borderColor: FP.border,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    gap: 12,
    minWidth: 248,
    padding: 16,
    shadowColor: FP.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  menuTitle: {
    color: FP.text,
    fontSize: 18,
    fontWeight: '900',
  },
  menuDivider: {
    backgroundColor: FP.border,
    height: 1,
  },
  menuAction: {
    borderRadius: 12,
    paddingVertical: 10,
  },
  menuActionText: {
    color: FP.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
  },
  signOutText: {
    color: FP.red,
  },
});
