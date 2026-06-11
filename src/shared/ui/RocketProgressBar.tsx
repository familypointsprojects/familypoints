import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { FP } from '@/constants/theme';

const rocketSource = require('../../../design/assets/mascot/easyquest-rocket-cropped.png');

// ─── Pixel-accurate measurements ─────────────────────────────────────────────
//
//  Rocket image: 900×620 px, displayed as 56×56 (contain → 56×38.6 + 8.7px gap)
//  Nozzle ring spans y=14..43 in the 56×56 container  →  height=30, centre=28.5
//
//  New layout: a single 56px-tall outer View.
//    • Rocket image fills it completely (top:0, 56×56, contain)
//    • Track (height=30) is absolutely centred: top = (56−30)/2 = 13
//    • Nozzle centre (28.5) aligns with track centre (13+15=28) within 0.5px ✓

// Rocket rendered at EXACT aspect ratio — no empty space, no contain guessing
// Source: 900×620 → display 56×39 (contentFit="fill")
const ROCKET_W   = 56;
const ROCKET_H   = Math.round(56 * 620 / 900);  // 39px
const OVERHANG   = 18;

// Nozzle ring in 56×39 display (measured via pixel scan of source image):
//   top=5.3px, bottom=34.3px, centre=19.8px
// Nozzle OPENING (where fire exits) measured at col=5 of 56×39 display:
//   top=9px, bottom=30px, height=22px, center=19.5px
// With ROCKET_TOP=8 in outer: nozzle opening top=17, bottom=38, center=27.5

const OUTER_H       = ROCKET_H + 16;   // 55
const ROCKET_TOP_PX = 8;               // rocket positioned so nozzle aligns with track

// Track = nozzle opening exactly: top=17, height=22
const TRACK_TOP = 17;
const TRACK_H   = 22;
const TRACK_PAD = 2;
const TRACK_BRD = 1;
const FILL_H    = TRACK_H - TRACK_BRD * 2 - TRACK_PAD * 2;  // 16

const GLOW_SZ   = 32;
const GLOW_TOP  = TRACK_TOP - (GLOW_SZ - TRACK_H) / 2;       // centred on track = 12

const gradientAnchors = [
  [255, 61,  36],
  [255, 100, 45],
  [247, 183, 33],
  [216, 255, 62],
] as const;
const stripeOffsets = Array.from({ length: 18 }, (_, i) => i * 15 - 48);

const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');

const getStop = (index: number, count: number) => {
  const pos    = index / (count - 1);
  const scaled = pos * (gradientAnchors.length - 1);
  const ai     = Math.min(Math.floor(scaled), gradientAnchors.length - 2);
  const t      = scaled - ai;
  const s      = gradientAnchors[ai];
  const e      = gradientAnchors[ai + 1];
  return `#${toHex(s[0]+(e[0]-s[0])*t)}${toHex(s[1]+(e[1]-s[1])*t)}${toHex(s[2]+(e[2]-s[2])*t)}`;
};

const fillStops = Array.from({ length: 32 }, (_, i) => getStop(i, 32));

type Props = { progress: number };

const clamp = (v: number) => Math.max(0, Math.min(v, 100));

export const RocketProgressBar = ({ progress }: Props) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const ratio       = clamp(progress) / 100;
  const innerW      = Math.max(trackWidth - TRACK_PAD * 2, 0);
  const fillW       = innerW * ratio;
  const fillEnd     = TRACK_PAD + fillW;   // right edge of fill, relative to track left

  return (
    // Single 56px container — rocket and track share the same coordinate space
    <View style={styles.outer}>
      {/* ── Track ── absolute, centred at TRACK_TOP = 13 */}
      <View
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        style={styles.track}>
        {trackWidth > 0 && (
          <>
            {/* Fill bar */}
            <View style={[styles.fill, { width: fillW }]}>
              <View style={styles.segments}>
                {fillStops.map(c => (
                  <View key={c} style={[styles.seg, { backgroundColor: c }]} />
                ))}
              </View>
              {stripeOffsets.map(l => (
                <View key={l} style={[styles.stripe, { left: l }]} />
              ))}
              <View style={styles.softLight} />
            </View>
          </>
        )}
      </View>

      {/* ── Glow ── absolute, centred on rocket (GLOW_TOP = 8) */}
      {trackWidth > 0 && (
        <Svg
          width={GLOW_SZ}
          height={GLOW_SZ}
          style={[styles.glow, { left: fillEnd - OVERHANG + ROCKET_W / 2 - GLOW_SZ / 2 }]}>
          <Defs>
            <RadialGradient id="g" cx="50%" cy="50%" r="50%">
              <Stop offset="0"    stopColor={FP.lime} stopOpacity="0.7" />
              <Stop offset="0.5"  stopColor={FP.cyan} stopOpacity="0.3" />
              <Stop offset="1"    stopColor={FP.cyan} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SZ / 2} cy={GLOW_SZ / 2} r={GLOW_SZ / 2} fill="url(#g)" />
        </Svg>
      )}

      {/* ── Rocket ── absolute, top:0, fills the 56px outer container */}
      {trackWidth > 0 && (
        <View style={[styles.rocket, { left: fillEnd - OVERHANG }]}>
          <Image
            source={rocketSource}
            style={styles.rocketImg}
            contentFit="fill"
            accessibilityIgnoresInvertColors
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    height: OUTER_H,
    overflow: 'visible',
    position: 'relative',
    width: '100%',
  },

  track: {
    backgroundColor: 'rgba(8,20,34,0.42)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: TRACK_BRD,
    height: TRACK_H,
    left: 0,
    overflow: 'visible',
    position: 'absolute',
    right: 0,
    top: TRACK_TOP,
  },

  fill: {
    borderRadius: 999,
    bottom: TRACK_PAD,
    left: TRACK_PAD,
    overflow: 'hidden',
    position: 'absolute',
    top: TRACK_PAD,
  },

  segments: {
    flexDirection: 'row',
    height: FILL_H,
    width: '100%',
  },
  seg: { flex: 1 },

  stripe: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    height: 28,
    position: 'absolute',
    top: -4,
    transform: [{ rotate: '18deg' }],
    width: 7,
  },

  softLight: {
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderRadius: 999,
    height: 5,
    left: 5,
    position: 'absolute',
    right: 18,
    top: 3,
  },

  glow: {
    position: 'absolute',
    top: GLOW_TOP,
    zIndex: 2,
  },

  rocket: {
    height: ROCKET_H,
    position: 'absolute',
    top: ROCKET_TOP_PX,
    width: ROCKET_W,
    zIndex: 3,
  },
  rocketImg: {
    height: ROCKET_H,
    width: ROCKET_W,
  },
});
