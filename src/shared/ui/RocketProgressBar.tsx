import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const pigRunnerSource = require('@/assets/images/pig-running-coins-progress.png');

// ─── Layout measurements ──────────────────────────────────────────────────────
const ROCKET_W      = 60;
const ROCKET_H      = 40;
const OVERHANG      = 30;

const OUTER_H       = 58;
const ROCKET_TOP_PX = 20;

const TRACK_TOP     = 34;
const TRACK_TOP_COMPACT = 16;
const TRACK_H       = 24;
const TRACK_PAD     = 2;
const FILL_LEFT_INSET = 2;
const FILL_RIGHT_INSET = 5;
const TRACK_BRD     = 1;
const FILL_H        = TRACK_H - TRACK_BRD * 2 - TRACK_PAD * 2;  // 18

const GLOW_SZ       = 36;
const GLOW_TOP      = TRACK_TOP - (GLOW_SZ - TRACK_H) / 2;  // 28
const GLOW_TOP_COMPACT = TRACK_TOP_COMPACT - (GLOW_SZ - TRACK_H) / 2;

// ─── Coin gradient colours ─────────────────────────────────────────────────────
const gradientAnchors = [
  [208, 111,  8],   // deep coin edge
  [247, 183, 33],   // brand gold
  [255, 216, 77],   // coin shine
  [255, 200, 56],   // warm filled edge
] as const;

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

type Props = { progress: number; showRunner?: boolean; showGlow?: boolean; compact?: boolean };
const clamp = (v: number) => Math.max(0, Math.min(v, 100));

export const RocketProgressBar = ({
  compact = false,
  progress,
  showRunner = true,
  showGlow = true,
}: Props) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const ratio   = clamp(progress) / 100;
  const innerW  = Math.max(trackWidth - FILL_LEFT_INSET - FILL_RIGHT_INSET, 0);
  const fillW   = innerW * ratio;
  const fillEnd = FILL_LEFT_INSET + fillW;
  const glowTop = compact ? GLOW_TOP_COMPACT : GLOW_TOP;
  const runnerTop = compact ? 2 : ROCKET_TOP_PX;
  const trackTop = compact ? TRACK_TOP_COMPACT : TRACK_TOP;
  const stripeOffsets = useMemo(
    () => Array.from({ length: Math.ceil(innerW / 15) + 8 }, (_, i) => i * 15 - 48),
    [innerW],
  );

  return (
    <View style={[styles.outer, compact && styles.outerCompact]}>
      {/* ── Track ── */}
      <View
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        style={[styles.track, { top: trackTop }]}>
        {trackWidth > 0 && (
          <>
            <View style={[styles.fill, { width: fillW }]}>
              <View style={[styles.segments, { width: innerW }]}>
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

      {/* ── Glow (coin gold) ── */}
      {trackWidth > 0 && showGlow && (
        <Svg
          width={GLOW_SZ}
          height={GLOW_SZ}
          style={[styles.glow, { left: fillEnd - OVERHANG + ROCKET_W / 2 - GLOW_SZ / 2, top: glowTop }]}>
          <Defs>
            <RadialGradient id="g" cx="50%" cy="50%" r="50%">
              <Stop offset="0"   stopColor="#FFD84D" stopOpacity="0.72" />
              <Stop offset="0.5" stopColor="#F7B721" stopOpacity="0.32" />
              <Stop offset="1"   stopColor="#D88B08" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SZ / 2} cy={GLOW_SZ / 2} r={GLOW_SZ / 2} fill="url(#g)" />
        </Svg>
      )}

      {/* ── Pig runner (centred in track) ── */}
      {trackWidth > 0 && showRunner && (
        <View style={[styles.runner, { left: fillEnd - OVERHANG, top: runnerTop }]}>
          <Image
            source={pigRunnerSource}
            style={styles.runnerImg}
            contentFit="contain"
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
  outerCompact: {
    height: 40,
  },

  track: {
    backgroundColor: 'rgba(102,58,0,0.38)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    borderWidth: TRACK_BRD,
    height: TRACK_H,
    left: 0,
    overflow: 'visible',
    position: 'absolute',
    right: 0,
  },

  fill: {
    borderRadius: 999,
    bottom: TRACK_PAD,
    left: FILL_LEFT_INSET,
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
    height: 32,
    position: 'absolute',
    top: -6,
    transform: [{ rotate: '18deg' }],
    width: 7,
  },

  softLight: {
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderRadius: 999,
    height: 5,
    left: 5,
    position: 'absolute',
    right: 18,
    top: 3,
  },

  glow: {
    position: 'absolute',
    zIndex: 2,
  },

  runner: {
    height: ROCKET_H,
    position: 'absolute',
    width: ROCKET_W,
    zIndex: 3,
  },
  runnerImg: {
    height: ROCKET_H,
    width: ROCKET_W,
  },
});
