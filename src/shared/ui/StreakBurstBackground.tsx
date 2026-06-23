import { Image, StyleSheet, View } from 'react-native';

/**
 * Brawl Stars-style comic explosion used as the streak card background.
 * The burst is anchored to the RIGHT side of the card and fills the whole
 * surface uniformly (no scrim).
 */

const BURST = require('@/assets/images/streak-burst-bg.png');

type Props = {
  /** Card corner radius so the burst clips to the same rounding. */
  radius?: number;
};

export const StreakBurstBackground = ({ radius = 22 }: Props) => (
  <View
    style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
    pointerEvents="none"
  >
    <Image source={BURST} style={styles.img} resizeMode="cover" />
  </View>
);

const styles = StyleSheet.create({
  img: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: undefined,
    height: undefined,
  },
});
