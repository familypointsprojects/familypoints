import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import type { ChildProfile } from '@/shared/types/family';

type ParentChildFilterProps = {
  childrenList: ChildProfile[];
  label?: string;
  selectedChildId?: string;
  onChange: (childId?: string) => void;
};

export const ParentChildFilter = ({
  childrenList,
  label,
  selectedChildId,
  onChange,
}: ParentChildFilterProps) => {
  const { t } = useLanguage();

  if (childrenList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t('parent.filters.child')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(undefined)}
          style={[styles.chip, !selectedChildId && styles.chipActive]}>
          <Text style={[styles.chipText, !selectedChildId && styles.chipTextActive]}>
            {t('common.allChildren')}
          </Text>
        </Pressable>

        {childrenList.map((child) => {
          const isActive = child.id === selectedChildId;

          return (
            <Pressable
              accessibilityRole="button"
              key={child.id}
              onPress={() => onChange(child.id)}
              style={[styles.chip, isActive && styles.chipActive]}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {child.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: '#6B7B86',
    fontSize: 13,
    fontWeight: '800',
  },
  chips: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E7E9',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: '#12314A',
    borderColor: '#12314A',
  },
  chipText: {
    color: '#6B7B86',
    fontSize: 14,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
