import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type OutlineTextProps = TextProps & {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  /** Colour of the crisp outline / bottom edge drawn around the glyphs. */
  outlineColor?: string;
  /** Even outline thickness around the whole perimeter, in px. */
  outlineWidth?: number;
  /** Extra dark thickness added below the glyphs (the "sole"), in px. */
  bottomDepth?: number;
  /** Fill colour of the text on top. */
  fillColor?: string;
  /** Optional style for the wrapping View. */
  containerStyle?: StyleProp<ViewStyle>;
};

// 8 unit directions — a dark copy in each builds the even perimeter outline.
const UNIT8: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

/**
 * White text with a crisp dark outline — thin and even around the top/sides,
 * thicker along the bottom so it reads as depth (the chunky "game button"
 * look from Brawl Stars / the SHOP button).
 *
 * Drop-in for <Text>: pass the same style you'd give a Text (e.g. gameText).
 */
export const OutlineText = ({
  children,
  style,
  outlineColor = '#0A1A2F',
  outlineWidth = 1.5,
  bottomDepth = 3,
  fillColor = '#FFFFFF',
  containerStyle,
  ...rest
}: OutlineTextProps) => {
  // Build the list of dark-copy offsets: an even outline ring first, then a
  // stack of copies pushed downward so the bottom edge grows thicker than top.
  const offsets: Array<[number, number]> = UNIT8.map(([dx, dy]) => [
    dx * outlineWidth,
    dy * outlineWidth,
  ]);
  for (let d = 1; d <= bottomDepth; d++) {
    const y = outlineWidth + d;
    offsets.push([0, y]);
    offsets.push([-outlineWidth, y]);
    offsets.push([outlineWidth, y]);
  }

  return (
    <View style={[styles.wrap, containerStyle]}>
      {offsets.map(([tx, ty], i) => (
        <Text
          key={i}
          {...rest}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            style,
            styles.copy,
            {
              color: outlineColor,
              textShadowColor: 'transparent',
              textShadowRadius: 0,
              transform: [{ translateX: tx }, { translateY: ty }],
            },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text {...rest} style={[style, { color: fillColor }]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    flexShrink: 1,
  },
  copy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
