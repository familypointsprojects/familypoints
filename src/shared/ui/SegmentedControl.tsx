import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';

export type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <View style={styles.container}>
    {options.map((option) => {
      const isActive = option.value === value;

      return (
        <Pressable
          accessibilityRole="button"
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.option, isActive && styles.optionActive]}>
          <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: FP.muted,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  option: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  optionActive: {
    backgroundColor: FP.white,
  },
  label: {
    color: FP.textSub,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelActive: {
    color: FP.text,
    fontWeight: '900',
  },
});
