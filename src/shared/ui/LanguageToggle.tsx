import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { Language, useLanguage } from '@/shared/i18n';

const languages: Language[] = ['ru', 'en'];

export const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('common.language')}</Text>
      <View accessibilityLabel={t('common.language')} style={styles.container}>
        {languages.map((item) => {
          const isActive = item === language;
          const label = item === 'ru' ? 'RU' : 'EN';

          return (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setLanguage(item)}
              style={({ pressed }) => [
                styles.option,
                isActive && styles.activeOption,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.optionText, isActive && styles.activeText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    alignSelf: 'flex-start',
    backgroundColor: FP.white,
    borderColor: FP.primaryBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  option: {
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  activeOption: {
    backgroundColor: FP.primaryDark,
  },
  optionText: {
    color: FP.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  activeText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.72,
  },
});
