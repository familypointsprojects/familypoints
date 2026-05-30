import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number };

/**
 * Quest-themed icon set for menu/navigation.
 * Vector ports of design/assets/icon-*.svg with shared brand palette.
 */

export const IconMap: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path
      d="M22 28 Q14 30 14 42 L14 88 Q14 100 26 102 L94 102 Q106 100 106 88 L106 32 Q106 22 96 22 L30 22 Q24 22 22 28 Z"
      fill="#EAD9AE"
      stroke="#A87E40"
      strokeWidth={3.5}
      strokeLinejoin="round"
    />
    <Ellipse cx={20} cy={32} rx={9} ry={5.5} fill="#D9C49A" stroke="#A87E40" strokeWidth={2.5} />
    <Ellipse cx={100} cy={92} rx={9} ry={5.5} fill="#D9C49A" stroke="#A87E40" strokeWidth={2.5} />
    <Path
      d="M32 76 Q50 60 70 76 Q85 88 92 74"
      fill="none"
      stroke="#8B5E2E"
      strokeWidth={3.5}
      strokeDasharray="4 5"
      strokeLinecap="round"
    />
    <Circle cx={32} cy={76} r={3.5} fill="#8B5E2E" />
    <Line x1={84} y1={62} x2={100} y2={78} stroke="#A23410" strokeWidth={4} strokeLinecap="round" />
    <Line x1={100} y1={62} x2={84} y2={78} stroke="#A23410" strokeWidth={4} strokeLinecap="round" />
  </Svg>
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
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx={60} cy={64} r={50} fill="#A66A0B" />
    <Circle cx={60} cy={60} r={48} fill="#F6B72A" stroke="#A66A0B" strokeWidth={3.5} />
    <Circle cx={60} cy={60} r={40} fill="none" stroke="#D9920F" strokeWidth={2} />
    <Path
      d="M60 30 L69 50 L91 52 L74 66 L80 88 L60 76 L40 88 L46 66 L29 52 L51 50 Z"
      fill="#FCD063"
      stroke="#A66A0B"
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconChest: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Rect x={12} y={56} width={96} height={50} rx={5} fill="#7A4D24" stroke="#3E2511" strokeWidth={3.5} />
    <Path
      d="M12 60 Q12 22 60 22 Q108 22 108 60 L108 64 L12 64 Z"
      fill="#A56A33"
      stroke="#3E2511"
      strokeWidth={3.5}
      strokeLinejoin="round"
    />
    <Line x1={12} y1={82} x2={108} y2={82} stroke="#5E3919" strokeWidth={2} opacity={0.5} />
    <Rect x={11} y={60} width={98} height={8} fill="#F5B225" stroke="#A66A0B" strokeWidth={2} />
    <Rect x={18} y={78} width={7} height={25} fill="#F5B225" stroke="#A66A0B" strokeWidth={1.8} />
    <Rect x={95} y={78} width={7} height={25} fill="#F5B225" stroke="#A66A0B" strokeWidth={1.8} />
    <Rect x={52} y={62} width={16} height={22} rx={2} fill="#F5B225" stroke="#A66A0B" strokeWidth={2.5} />
    <Circle cx={60} cy={69} r={2.8} fill="#3E2511" />
    <Rect x={58.4} y={69} width={3.2} height={8} fill="#3E2511" />
  </Svg>
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
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx={60} cy={60} r={48} fill="#E7C45A" stroke="#A66A0B" strokeWidth={4} />
    <Circle cx={60} cy={60} r={36} fill="#1C5E6E" stroke="#0A2A36" strokeWidth={2} />
    <Line x1={60} y1={20} x2={60} y2={26} stroke="#FCE9B6" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={60} y1={94} x2={60} y2={100} stroke="#FCE9B6" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={20} y1={60} x2={26} y2={60} stroke="#FCE9B6" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={94} y1={60} x2={100} y2={60} stroke="#FCE9B6" strokeWidth={2.5} strokeLinecap="round" />
    <Path
      d="M60 28 L74 60 L60 92 L46 60 Z"
      fill="#FBE3C0"
      stroke="#A8841A"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path d="M60 28 L74 60 L60 60 Z" fill="#EF5424" />
    <Circle cx={60} cy={60} r={4.5} fill="#F6B72A" stroke="#A66A0B" strokeWidth={1.5} />
  </Svg>
);

export const IconMissions: React.FC<IconProps> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    {/* Jar body */}
    <Rect x={28} y={42} width={64} height={64} rx={14} fill="#3FA88E" stroke="#0E5F4D" strokeWidth={3.5} />
    {/* Jar lid */}
    <Rect x={22} y={30} width={76} height={18} rx={8} fill="#1E9E86" stroke="#0E5F4D" strokeWidth={3} />
    {/* Coin slot */}
    <Rect x={52} y={30} width={16} height={5} rx={2.5} fill="#0A4A3C" />
    {/* Star */}
    <Path
      d="M60 56 L64 67 L76 67 L67 74 L70 85 L60 78 L50 85 L53 74 L44 67 L56 67 Z"
      fill="#F5B225"
      stroke="#A66A0B"
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Line x1={12} y1={5} x2={12} y2={19} stroke="#0E2536" strokeWidth={3} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke="#0E2536" strokeWidth={3} strokeLinecap="round" />
  </Svg>
);
