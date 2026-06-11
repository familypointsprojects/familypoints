import { KeyboardTypeOptions, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { FP } from '@/constants/theme';

type AppTextInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoFocus?: TextInputProps['autoFocus'];
};

export const AppTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  secureTextEntry = false,
  autoCapitalize,
  autoFocus,
}: AppTextInputProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#8B9CAF"
      keyboardType={keyboardType}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoFocus={autoFocus}
    />
  </View>
);

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    color: FP.text,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 50,
    borderColor: FP.primaryBorder,
    borderRadius: 16,
    borderWidth: 1.5,
    color: FP.text,
    backgroundColor: FP.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
