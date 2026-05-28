import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    color: '#6B7B86',
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F3EE',
    borderColor: '#E3F3EE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  option: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  activeOption: {
    backgroundColor: '#15786A',
  },
  optionText: {
    color: '#15786A',
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
