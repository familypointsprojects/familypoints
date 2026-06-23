import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';

import { AVATARS, AvatarId } from './AvatarHeads';

type AvatarPickerProps = {
  value?: AvatarId | null;
  onChange: (id: AvatarId) => void;
  size?: number;
};

/** Grid of selectable avatar heads. Highlights the current selection. */
export const AvatarPicker = ({ value, onChange, size = 88 }: AvatarPickerProps) => (
  <View style={styles.grid}>
    {AVATARS.map(({ id, label, Component }) => {
      const selected = id === value;
      return (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => onChange(id)}
          style={({ pressed }) => [styles.opt, pressed && styles.optPressed]}>
          <View style={[styles.thumb, selected && styles.thumbSelected]}>
            <Component size={size} />
          </View>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const INK = '#10233F';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  opt: { alignItems: 'center', gap: 8 },
  optPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  thumbSelected: {
    borderColor: FP.lime,
    transform: [{ translateY: -2 }],
  },
  label: {
    fontWeight: '700',
    fontSize: 14,
    color: FP.textSub,
  },
  labelSelected: { color: INK },
});
