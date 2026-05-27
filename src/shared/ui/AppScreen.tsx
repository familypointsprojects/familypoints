import { PropsWithChildren } from 'react';
import { router, usePathname } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FP } from '@/constants/theme';
import { useLanguage } from '@/shared/i18n';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';

type AppScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export const AppScreen = ({
  title,
  subtitle,
  showBackButton,
  children,
  contentStyle,
}: AppScreenProps) => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const shouldShowBackButton = showBackButton ?? pathname !== '/';

  const handleBackPress = () => {
    try {
      if (router.canDismiss()) {
        router.dismiss();
        return;
      }
    } catch {
      router.replace('/');
      return;
    }

    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]}>
        <View style={styles.topBar}>
          {shouldShowBackButton ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleBackPress}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backText}>{t('common.back')}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <LanguageToggle />
        </View>

        {Boolean(title || subtitle) && (
          <View style={styles.header}>
            {Boolean(title) && <Text style={styles.title}>{title}</Text>}
            {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FP.bg,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backText: {
    color: FP.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  title: {
    color: FP.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 15,
    lineHeight: 22,
  },
});
