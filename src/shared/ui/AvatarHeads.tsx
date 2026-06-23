import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * easyQuest avatar heads — cartoon "Brawl-Stars" style portraits.
 * Each one fills a rounded square and is meant to sit in the level card
 * avatar slot (see QuestLevelCard) or the account-settings picker.
 *
 * Add a new character: draw it here, then register it in AVATARS below.
 */

export type AvatarId = 'girl' | 'boy' | 'skeleton';

type AvatarProps = { size?: number };

const INK = '#10233F';

const GIRL_IMAGE = require('@/assets/images/avatars/girl.png');

const GirlAvatar: React.FC<AvatarProps> = ({ size = 88 }) => (
  <Image
    source={GIRL_IMAGE}
    resizeMode="cover"
    style={[styles.girlImage, { width: size, height: size, borderRadius: size * 0.16 }]}
  />
);

const BOY_IMAGE = require('@/assets/images/avatars/boy.png');

const BoyAvatar: React.FC<AvatarProps> = ({ size = 88 }) => (
  <Image
    source={BOY_IMAGE}
    resizeMode="cover"
    style={[styles.image, { width: size, height: size, borderRadius: size * 0.16 }]}
  />
);

const styles = StyleSheet.create({
  image: { backgroundColor: '#42D6F2' },
  girlImage: { backgroundColor: '#FF93BE' },
});

const SkeletonAvatar: React.FC<AvatarProps> = ({ size = 88 }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id="skBg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#9E80FF" />
        <Stop offset="1" stopColor="#6E4DE0" />
      </LinearGradient>
      <RadialGradient id="skVig" cx="0.5" cy="0.4" r="0.78">
        <Stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <Stop offset="1" stopColor="#3B2A8A" stopOpacity="0.55" />
      </RadialGradient>
      <RadialGradient id="skEye" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#7BF3FF" />
        <Stop offset="0.55" stopColor="#10C7E8" />
        <Stop offset="1" stopColor="#0A2030" />
      </RadialGradient>
    </Defs>
    <Rect x="2" y="2" width="196" height="196" rx="32" fill="url(#skBg)" />
    <Rect x="2" y="2" width="196" height="196" rx="32" fill="url(#skVig)" />
    <G strokeLinecap="round">
      <Line x1="44" y1="150" x2="156" y2="196" stroke="#E8E3F2" strokeWidth={13} />
      <Line x1="156" y1="150" x2="44" y2="196" stroke="#E8E3F2" strokeWidth={13} />
    </G>
    <G fill="#E8E3F2">
      <Circle cx="44" cy="150" r="9" />
      <Circle cx="44" cy="196" r="9" />
      <Circle cx="156" cy="150" r="9" />
      <Circle cx="156" cy="196" r="9" />
    </G>
    <G stroke={INK} strokeWidth={5} strokeLinejoin="round">
      <Path
        d="M54 92 Q54 50 100 50 Q146 50 146 92 Q146 118 130 126 L130 140 Q130 150 118 150 L82 150 Q70 150 70 140 L70 126 Q54 118 54 92 Z"
        fill="#F3F1FA"
      />
      <Path d="M82 148 Q82 166 100 166 Q118 166 118 148 Z" fill="#F3F1FA" />
    </G>
    <Ellipse cx="80" cy="96" rx="16" ry="18" fill="#1A1430" />
    <Ellipse cx="120" cy="96" rx="16" ry="18" fill="#1A1430" />
    <Circle cx="80" cy="97" r="8.5" fill="url(#skEye)" />
    <Circle cx="120" cy="97" r="8.5" fill="url(#skEye)" />
    <Circle cx="82" cy="94" r="2.6" fill="#ffffff" />
    <Circle cx="122" cy="94" r="2.6" fill="#ffffff" />
    <Path d="M100 110 L92 126 Q100 132 108 126 Z" fill="#1A1430" />
    <G stroke={INK} strokeWidth={3.5}>
      <Rect x="80" y="140" width="40" height="16" rx="4" fill="#ffffff" />
      <Line x1="93.3" y1="140" x2="93.3" y2="156" />
      <Line x1="106.6" y1="140" x2="106.6" y2="156" />
    </G>
  </Svg>
);

type AvatarMeta = {
  id: AvatarId;
  label: string;
  Component: React.FC<AvatarProps>;
};

/** Registry — settings screen maps over this to render the picker. */
export const AVATARS: AvatarMeta[] = [
  { id: 'girl', label: 'Девочка', Component: GirlAvatar },
  { id: 'boy', label: 'Мальчик', Component: BoyAvatar },
  { id: 'skeleton', label: 'Скелет', Component: SkeletonAvatar },
];

export const DEFAULT_AVATAR_ID: AvatarId = 'girl';

const BY_ID: Record<AvatarId, React.FC<AvatarProps>> = {
  girl: GirlAvatar,
  boy: BoyAvatar,
  skeleton: SkeletonAvatar,
};

/** Render an avatar by id. Accepts any string (e.g. from the DB) and falls back to the default if unknown. */
export const AvatarHead: React.FC<{ id?: string | null; size?: number }> = ({ id, size = 88 }) => {
  const Component = BY_ID[(id ?? DEFAULT_AVATAR_ID) as AvatarId] ?? BY_ID[DEFAULT_AVATAR_ID];
  return <Component size={size} />;
};
