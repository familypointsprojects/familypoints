import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { gameText } from '@/constants/theme';
import { OutlineText } from '@/shared/ui/OutlineText';

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
    <View pointerEvents="none" style={styles.containerHighlight} />
    <View pointerEvents="none" style={styles.containerBottom} />
    {options.map((option) => {
      const isActive = option.value === value;

      return (
        <Pressable
          accessibilityRole="button"
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.option, isActive && styles.optionActive]}>
          <View pointerEvents="none" style={[styles.optionHighlight, isActive && styles.optionHighlightActive]} />
          <View pointerEvents="none" style={[styles.optionBottom, isActive && styles.optionBottomActive]} />
          <OutlineText style={[styles.label, gameText, isActive && styles.labelActive]} numberOfLines={1}>
            {option.label}
          </OutlineText>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#30364F',
    borderColor: '#061426',
    borderRadius: 2,
    borderWidth: 4,
    flexDirection: 'row',
    gap: 5,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#061426',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.24,
        shadowRadius: 0,
      },
      android: { elevation: 2 },
      web: { boxShadow: '3px 3px 0 #061426, inset 0 2px 0 #19B8F2' },
    }) as ViewStyle,
  },
  containerHighlight: {
    backgroundColor: '#19B8F2',
    height: 2,
    left: 14,
    position: 'absolute',
    right: 14,
    top: 5,
    zIndex: 0,
  },
  containerBottom: {
    backgroundColor: '#061426',
    bottom: 0,
    height: 5,
    left: 0,
    opacity: 0.55,
    position: 'absolute',
    right: 0,
    zIndex: 0,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#3A4058',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    overflow: 'hidden',
    paddingHorizontal: 7,
    position: 'relative',
  },
  optionHighlight: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    height: 3,
    left: 8,
    position: 'absolute',
    right: 10,
    top: 5,
    zIndex: 1,
  },
  optionHighlightActive: {
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  optionBottom: {
    backgroundColor: '#061426',
    bottom: 0,
    height: 5,
    left: 0,
    opacity: 0.40,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  optionBottomActive: {
    backgroundColor: '#C98A00',
    opacity: 1,
  },
  optionActive: {
    backgroundColor: '#FFC400',
    ...Platform.select({
      ios: {
        shadowColor: '#061426',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.24,
        shadowRadius: 0,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 0 #C98A00' },
    }) as ViewStyle,
  },
  label: {
    color: '#DDF8FF',
    fontSize: 12,
    textAlign: 'center',
    zIndex: 2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
