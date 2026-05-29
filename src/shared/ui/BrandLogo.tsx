import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const logoSource = require('../../../assets/brand/easyquest-logo.svg');

type BrandLogoProps = {
  height?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  width?: number;
};

export const BrandLogo = ({ height, size = 72, style, width }: BrandLogoProps) => {
  const resolvedHeight = height ?? size;
  const resolvedWidth = width ?? Math.round(resolvedHeight * 2.15);

  return (
    <View style={[styles.shell, { height: resolvedHeight, width: resolvedWidth }, style]}>
      <Image
        source={logoSource}
        style={styles.image}
        contentFit="contain"
        accessibilityLabel="easyQuest"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
  },
  shell: {
    maxWidth: '100%',
    overflow: 'hidden',
  },
});
