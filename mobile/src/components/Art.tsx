import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { colors, type } from '@/theme/tokens';

function stonePath(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const pts: [number, number][] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const wobble = 1 + (((seed * 17 + i * 13) % 11) - 5) * 0.012;
    pts.push([cx + rx * wobble * Math.cos(a), cy + ry * wobble * Math.sin(a)]);
  }
  let d = `M${(pts[0][0] + pts[n - 1][0]) / 2},${(pts[0][1] + pts[n - 1][1]) / 2}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    d += ` Q${p[0]},${p[1]} ${(p[0] + q[0]) / 2},${(p[1] + q[1]) / 2}`;
  }
  return d + 'Z';
}

export function Cairn({
  width = 150,
  stones = 4,
  sparkle = false,
  leaves = false,
  top = colors.terracotta,
  visibleStones,
  sparkleOpacity = 1,
}: {
  width?: number;
  stones?: number;
  sparkle?: boolean;
  leaves?: boolean;
  top?: string;
  /** How many stones to show from the bottom (for stacking animation). */
  visibleStones?: number;
  sparkleOpacity?: number;
}) {
  const shown = visibleStones ?? stones;
  const h = width * 1.05;
  const cx = width / 2;
  let y = h - 10;
  let rx = width * 0.42;
  let ry = width * 0.11;
  const cols = [colors.stone1, colors.stone2, colors.stone3, top];
  const layers: React.ReactNode[] = [];

  layers.push(
    <Path
      key="g"
      d={`M${width * 0.06},${h - 6} Q${cx},${h - 14} ${width * 0.94},${h - 6}`}
      stroke={colors.ground}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0.6}
    />,
  );

  for (let i = 0; i < stones; i++) {
    const fill = i < stones - 1 ? cols[i] : top;
    const ox = (i % 2 === 0 ? -1 : 1) * width * 0.02;
    if (i < shown) {
      layers.push(
        <Path key={`s${i}`} d={stonePath(cx + ox, y - ry, rx, ry, 3 + i)} fill={fill} />,
      );
      layers.push(
        <Path
          key={`o${i}`}
          d={stonePath(cx + ox + 1, y - ry - 1, rx * 0.98, ry * 0.96, 10 + i)}
          fill="none"
          stroke={colors.green}
          strokeWidth={1.4}
          strokeOpacity={0.45}
        />,
      );
    }
    y -= ry * 1.85;
    rx *= 0.78;
    ry *= 0.95;
  }

  if (leaves && shown >= 2) {
    const leafOpacity = Math.min(1, (shown - 1) / 2);
    layers.push(
      <Ellipse
        key="leafL"
        cx={width * 0.18}
        cy={h * 0.28}
        rx={10}
        ry={5}
        fill={colors.greenMid}
        opacity={0.85 * leafOpacity}
        transform={`rotate(-40 ${width * 0.18} ${h * 0.28})`}
      />,
    );
    layers.push(
      <Ellipse
        key="leafR"
        cx={width * 0.82}
        cy={h * 0.48}
        rx={9}
        ry={4.5}
        fill={colors.greenMid}
        opacity={0.8 * leafOpacity}
        transform={`rotate(35 ${width * 0.82} ${h * 0.48})`}
      />,
    );
  }

  if (sparkle && sparkleOpacity > 0.05) {
    const sparks: [number, number][] = [
      [width * 0.1, h * 0.25],
      [width * 0.88, h * 0.18],
      [width * 0.95, h * 0.55],
      [width * 0.05, h * 0.6],
      [width * 0.5, h * 0.02],
    ];
    sparks.forEach(([sx, sy], i) => {
      layers.push(
        <Path
          key={`x${i}`}
          d={`M${sx},${sy - 6}V${sy + 6}M${sx - 6},${sy}H${sx + 6}`}
          stroke={colors.terracotta}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={sparkleOpacity}
        />,
      );
    });
  }

  return (
    <Svg width={width} height={h} viewBox={`-10 -10 ${width + 20} ${h + 20}`}>
      {layers}
    </Svg>
  );
}

/** Stacks stones rapidly into a finished cairn — replay with growKey. */
export function AnimatedCairn({
  width = 150,
  stones = 4,
  growKey = 0,
}: {
  width?: number;
  stones?: number;
  growKey?: number;
}) {
  const [visible, setVisible] = useState(0);
  const [sparkle, setSparkle] = useState(0);
  const scale = useRef(new Animated.Value(0.94)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    setVisible(0);
    setSparkle(0);
    scale.setValue(0.94);
    lift.setValue(14);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const start = Date.now();
    const duration = 720;
    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.2);
      setVisible(eased * stones);
      setSparkle(Math.max(0, (eased - 0.75) / 0.25));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setVisible(stones);
        setSparkle(1);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [growKey, stones, scale, lift]);

  return (
    <Animated.View style={{ transform: [{ translateY: lift }, { scale }], alignItems: 'center' }}>
      <Cairn
        width={width}
        stones={stones}
        visibleStones={Math.ceil(visible)}
        sparkle
        leaves
        sparkleOpacity={sparkle}
      />
    </Animated.View>
  );
}

export function Sun({ r = 30 }: { r?: number }) {
  const s = r * 2 + 24;
  const c = s / 2;
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const x1 = c + (r + 5) * Math.cos(a);
    const y1 = c + (r + 5) * Math.sin(a);
    const x2 = c + (r + 10) * Math.cos(a);
    const y2 = c + (r + 10) * Math.sin(a);
    rays.push(
      <Path
        key={i}
        d={`M${x1},${y1}L${x2},${y2}`}
        stroke={colors.peach}
        strokeWidth={2.4}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Path d={stonePath(c, c, r, r, 5)} fill={colors.peach} />
      {rays}
    </Svg>
  );
}

const PETAL_OUTER = '#F0B8C8';
const PETAL_MID = '#E89AAD';
const PETAL_INNER = '#F6CDD8';
const FLOWER_CENTER = '#F6D9A8';
const FLOWER_CENTER_RING = '#E8B49A';
const BUD_PINK = '#E8A0B4';
const LEAF = '#7E9A84';
const LEAF_LIGHT = '#9BB39E';

/**
 * Grows with weekly check-ins (0–7).
 * On focus/mount, rapidly animates from a sprout into the end state for this week.
 */
export function Sprig({
  height: baseHeight = 100,
  daysComplete = 0,
  growKey = 0,
}: {
  height?: number;
  /** Checked-in days this week, 0–7 */
  daysComplete?: number;
  /** Change to replay the rapid grow-in (e.g. when returning to Home). */
  growKey?: number;
}) {
  const target = Math.max(0, Math.min(7, Math.round(daysComplete)));
  const [days, setDays] = useState(0);
  const [bloom, setBloom] = useState(0);
  const reduceMotion = useRef(false);
  const scale = useRef(new Animated.Value(0.92)).current;
  const lift = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    if (reduceMotion.current || target <= 0) {
      setDays(target);
      setBloom(target >= 6 ? 1 : 0);
      scale.setValue(1);
      lift.setValue(0);
      return;
    }

    setDays(0);
    setBloom(0);
    scale.setValue(0.88);
    lift.setValue(18);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const start = Date.now();
    const duration = 850;
    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (Date.now() - start) / duration);
      // Ease out so it rushes into the bloom.
      const eased = 1 - Math.pow(1 - t, 2.4);
      const d = eased * target;
      setDays(d);
      // Flower pops in in the last stretch.
      const bloomT = target >= 6 ? Math.max(0, (eased - 0.72) / 0.28) : 0;
      setBloom(bloomT);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setDays(target);
        setBloom(target >= 6 ? 1 : 0);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, growKey, scale, lift]);

  const grow = days / 7;
  const headPad = 48;
  const stemH = baseHeight + 70; // fixed canvas for full height
  const height = stemH + headPad;
  const w = Math.max(110, height * 0.62);
  const stemX = w / 2;
  const tipY = headPad;
  // Stem drawn height grows with progress (from bottom).
  const stemTop = tipY + 6 + (1 - grow) * (stemH * 0.55);

  const leafCount = Math.min(7, Math.max(0, Math.floor(2 + days)));
  const leafTs = [0.86, 0.74, 0.62, 0.5, 0.38, 0.26, 0.16].slice(0, leafCount);

  const showBud = days >= 4 && days < 6 && bloom < 0.2;
  const showFlower = bloom > 0.05;

  const petalR = 16 * (0.55 + bloom * 0.45);
  const petalReach = 18 * (0.5 + bloom * 0.5);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: lift }, { scale }],
        alignItems: 'center',
        height,
        justifyContent: 'flex-end',
      }}
    >
      <Svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <Path
          d={`M${stemX},${height - 2} C${stemX - 10},${height * 0.58} ${stemX + 12},${height * 0.3} ${stemX},${stemTop}`}
          stroke={LEAF}
          strokeWidth={2.6 + grow}
          fill="none"
          strokeLinecap="round"
        />
        {leafTs.map((t, i) => {
          const appear = Math.min(1, Math.max(0, (days - i * 0.85) / 1.2));
          if (appear <= 0) return null;
          const y = tipY + 10 + (height - tipY - 18) * t;
          const side = i % 2 === 0 ? 1 : -1;
          const span = (14 + (i % 3) * 2 + grow * 4) * (0.4 + appear * 0.6);
          const lx = stemX + side * (span * 0.55 + 6);
          const rot = side * (-32 - (i % 3) * 4);
          return (
            <Ellipse
              key={i}
              cx={lx}
              cy={y}
              rx={span}
              ry={(6.5 + grow) * (0.5 + appear * 0.5)}
              fill={i % 2 === 0 ? LEAF : LEAF_LIGHT}
              opacity={0.55 + appear * 0.35}
              transform={`rotate(${rot} ${lx} ${y})`}
            />
          );
        })}
        {showBud ? (
          <>
            <Ellipse cx={stemX} cy={stemTop - 4} rx={9} ry={14} fill={BUD_PINK} opacity={0.95} />
            <Ellipse cx={stemX} cy={stemTop - 8} rx={6} ry={9} fill={PETAL_INNER} opacity={0.9} />
          </>
        ) : null}
        {showFlower ? (
          <>
            <Ellipse
              cx={stemX}
              cy={tipY + 2}
              rx={34 * bloom}
              ry={34 * bloom}
              fill={PETAL_INNER}
              opacity={0.35 * bloom}
            />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const px = stemX + Math.cos(rad) * petalReach;
              const py = tipY + Math.sin(rad) * petalReach;
              return (
                <Ellipse
                  key={`o-${deg}`}
                  cx={px}
                  cy={py}
                  rx={petalR}
                  ry={petalR * 0.72}
                  fill={PETAL_OUTER}
                  transform={`rotate(${deg} ${px} ${py})`}
                  opacity={0.5 + bloom * 0.42}
                />
              );
            })}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const px = stemX + Math.cos(rad) * (petalReach * 0.62);
              const py = tipY + Math.sin(rad) * (petalReach * 0.62);
              return (
                <Ellipse
                  key={`i-${deg}`}
                  cx={px}
                  cy={py}
                  rx={petalR * 0.78}
                  ry={petalR * 0.55}
                  fill={PETAL_MID}
                  transform={`rotate(${deg} ${px} ${py})`}
                  opacity={0.55 + bloom * 0.4}
                />
              );
            })}
            <Ellipse cx={stemX} cy={tipY} rx={11 * bloom} ry={11 * bloom} fill={FLOWER_CENTER_RING} />
            <Ellipse cx={stemX} cy={tipY} rx={8 * bloom} ry={8 * bloom} fill={FLOWER_CENTER} />
            <Ellipse
              cx={stemX - 2}
              cy={tipY - 2.5}
              rx={2.2 * bloom}
              ry={1.6 * bloom}
              fill="#FFF6E8"
              opacity={0.85 * bloom}
            />
          </>
        ) : null}
      </Svg>
    </Animated.View>
  );
}


export function BreathingRings({
  label,
  sub,
  size = 260,
  dark = false,
  holdable = false,
  /** Drive the expand/contract loop. When false, freeze at current size. */
  pulsing = true,
  /** One inhale or exhale duration in ms. */
  phaseMs = 4000,
  /**
   * When true, center text is “Breathe in” / “Breathe out” locked to the
   * expand/contract animation. Pass label/sub only as overrides (e.g. peeks).
   */
  guided = true,
}: {
  label?: string;
  sub?: string;
  size?: number;
  dark?: boolean;
  holdable?: boolean;
  pulsing?: boolean;
  phaseMs?: number;
  guided?: boolean;
}) {
  const breath = useRef(new Animated.Value(0)).current;
  const cancelled = useRef(false);
  const [holding, setHolding] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cue, setCue] = useState<'in' | 'out'>('in');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subInfo = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subInfo.remove();
  }, []);

  useEffect(() => {
    cancelled.current = false;
    if (reduceMotion) {
      breath.setValue(0);
      setCue('in');
      return;
    }
    // Pause / inactive: stop the loop but keep the current scale (no snap shut).
    if (!pulsing) {
      return;
    }
    if (holdable) {
      setCue(holding ? 'in' : 'out');
      Animated.timing(breath, {
        toValue: holding ? 1 : 0,
        duration: phaseMs,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start();
      return;
    }

    // Manual loop so cue text flips with each phase (same moment size changes).
    const runIn = () => {
      if (cancelled.current) return;
      setCue('in');
      Animated.timing(breath, {
        toValue: 1,
        duration: phaseMs,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled.current) return;
        runOut();
      });
    };
    const runOut = () => {
      if (cancelled.current) return;
      setCue('out');
      Animated.timing(breath, {
        toValue: 0,
        duration: phaseMs,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled.current) return;
        runIn();
      });
    };
    runIn();
    return () => {
      cancelled.current = true;
      breath.stopAnimation();
    };
  }, [reduceMotion, holdable, holding, breath, pulsing, phaseMs]);

  const c1 = dark ? colors.greenDarkRing : '#C9D6C0';
  const c2 = dark ? colors.greenDarkRing2 : '#A8BFA8';
  const c3 = dark ? colors.greenMid : colors.green;
  const ripple = dark ? 'rgba(126,154,132,0.45)' : 'rgba(126,154,132,0.55)';

  const coreScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const midScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const outerScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.34] });
  const outerOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.42] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] });

  const displayLabel = guided
    ? cue === 'in'
      ? 'Breathe in'
      : 'Breathe out'
    : (label ?? '');
  // Keep sub short so it fits the core circle with the cue.
  const displaySub = guided ? (pulsing ? '' : 'Paused') : (sub ?? '');
  const coreSize = size * 0.52;
  const labelSize = Math.max(12, Math.min(guided ? 14 : 15, coreSize * 0.17));
  const subSize = Math.max(10, labelSize * 0.78);

  const ring = (
    <View style={{ width: size * 1.45, height: size * 1.45, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: ripple,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c1,
            opacity: outerOpacity,
            transform: [{ scale: outerScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: midScale }] }}>
        <View
          style={[
            styles.ring,
            {
              width: size * 0.82,
              height: size * 0.82,
              borderRadius: (size * 0.82) / 2,
              backgroundColor: c2,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: coreScale }] }}>
            <View
              style={[
                styles.ringInner,
                {
                  width: coreSize,
                  height: coreSize,
                  borderRadius: coreSize / 2,
                  backgroundColor: c3,
                  paddingHorizontal: 6,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: type.h2.fontFamily,
                  color: colors.white,
                  fontSize: labelSize,
                  lineHeight: labelSize * 1.15,
                  textAlign: 'center',
                }}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {displayLabel}
              </Text>
              {displaySub ? (
                <Text
                  style={{
                    fontFamily: type.body.fontFamily,
                    color: colors.white,
                    fontSize: subSize,
                    lineHeight: subSize * 1.2,
                    textAlign: 'center',
                    marginTop: 2,
                    opacity: 0.9,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {displaySub}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );

  if (!holdable) return ring;

  return (
    <Pressable
      onPressIn={() => setHolding(true)}
      onPressOut={() => setHolding(false)}
      accessibilityRole="button"
      accessibilityLabel="Hold to breathe in, release to breathe out"
    >
      {ring}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringInner: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  halo: {
    position: 'absolute',
  },
});
