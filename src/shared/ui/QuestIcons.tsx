import React from 'react';
import { Image } from 'expo-image';
import Svg, { Circle, Line, Path } from 'react-native-svg';


type IconProps = { size?: number };

/**
 * Quest-themed icon set for menu/navigation.
 * Vector ports of design/assets/icon-*.svg with shared brand palette.
 */

export const IconAlert: React.FC<IconProps> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx={60} cy={60} r={46} fill="#F5B225" stroke="#8A5A06" strokeWidth={7} />
    <Line x1={60} y1={30} x2={60} y2={66} stroke="#12314A" strokeWidth={10} strokeLinecap="round" />
    <Circle cx={60} cy={86} r={6.5} fill="#12314A" />
  </Svg>
);

export const IconMap: React.FC<IconProps> = ({ size = 26 }) => (
  <Image
    contentFit="contain"
    source={require('@/assets/images/icons/treasure-map.png')}
    style={{ width: size, height: size }}
  />
);

export const IconShield: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path
      d="M60 12 L100 24 L100 60 Q100 92 60 108 Q20 92 20 60 L20 24 Z"
      fill="#3FA88E"
      stroke="#0E5F4D"
      strokeWidth={4.5}
      strokeLinejoin="round"
    />
    <Path
      d="M60 22 L90 32 L90 60 Q90 84 60 96 Q30 84 30 60 L30 32 Z"
      fill="none"
      stroke="#2D7E68"
      strokeWidth={2}
      opacity={0.6}
    />
    <Path
      d="M60 36 L67 53 L86 55 L72 67 L77 86 L60 76 L43 86 L48 67 L34 55 L53 53 Z"
      fill="#F5B225"
      stroke="#A66A0B"
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconCoin: React.FC<IconProps> = ({ size = 26 }) => (
  <Image
    contentFit="contain"
    source={require('@/assets/images/icons/coin.png')}
    style={{ width: size, height: size }}
  />
);

export const IconChest: React.FC<IconProps> = ({ size = 26 }) => (
  <Image
    contentFit="contain"
    source={require('@/assets/images/icons/treasure-chest.png')}
    style={{ width: size, height: size }}
  />
);

export const IconOpenToyChest: React.FC<IconProps> = ({ size = 26 }) => (
  <Image
    contentFit="contain"
    source={require('@/assets/images/tab-rewards-chest-open-toys.png')}
    style={{ width: size, height: size }}
  />
);

export const IconFamily: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path
      d="M60 14 C53 6 38 8 38 22 C38 34 60 44 60 44 C60 44 82 34 82 22 C82 8 67 6 60 14 Z"
      fill="#EF5424"
      stroke="#A8341A"
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Circle cx={28} cy={62} r={11} fill="#1E9E86" stroke="#0E5F4D" strokeWidth={3} />
    <Path
      d="M12 108 Q12 82 28 82 Q44 82 44 108 Z"
      fill="#1E9E86"
      stroke="#0E5F4D"
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Circle cx={92} cy={62} r={11} fill="#EF5424" stroke="#A8341A" strokeWidth={3} />
    <Path
      d="M76 108 Q76 82 92 82 Q108 82 108 108 Z"
      fill="#EF5424"
      stroke="#A8341A"
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Circle cx={60} cy={74} r={9} fill="#F5B225" stroke="#A66A0B" strokeWidth={3} />
    <Path
      d="M47 108 Q47 88 60 88 Q73 88 73 108 Z"
      fill="#F5B225"
      stroke="#A66A0B"
      strokeWidth={3}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconFlag: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 21V4" stroke="#0E2536" strokeWidth={2.5} strokeLinecap="round" />
    <Path
      d="M6 5l11 2.5L6 12V5z"
      fill="#EF5424"
      stroke="#A8341A"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconCompass: React.FC<IconProps> = ({ size = 26 }) => (
  <Image
    contentFit="contain"
    source={require('@/assets/images/icons/compass.png')}
    style={{ width: size, height: size }}
  />
);

export const IconMissions: React.FC<IconProps> = ({ size = 26 }) => (
  <Image
    contentFit="contain"
    source={require('@/assets/images/piggy-bank-mascot.png')}
    style={{ width: size, height: size }}
  />
);

export const IconPlus: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Line x1={12} y1={5} x2={12} y2={19} stroke="#0E2536" strokeWidth={3} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke="#0E2536" strokeWidth={3} strokeLinecap="round" />
  </Svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    {/* Gear outer ring */}
    <Circle cx={60} cy={60} r={18} fill="#1C5E6E" stroke="#0A2A36" strokeWidth={4} />
    <Circle cx={60} cy={60} r={9}  fill="#E7C45A" stroke="#0A2A36" strokeWidth={3} />
    {/* Gear teeth — 6 teeth */}
    {[0,60,120,180,240,300].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 60 + 24 * Math.cos(rad);
      const y1 = 60 + 24 * Math.sin(rad);
      const x2 = 60 + 34 * Math.cos(rad);
      const y2 = 60 + 34 * Math.sin(rad);
      return (
        <Line
          key={angle}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#1C5E6E"
          strokeWidth={10}
          strokeLinecap="round"
        />
      );
    })}
  </Svg>
);
