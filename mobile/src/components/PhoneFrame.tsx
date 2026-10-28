import React, { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '@/theme/tokens';

const PHONE_W = 390;
const PHONE_H = 844;

/**
 * On web, always show the app inside a centered iPhone shell.
 * Pure layout (no mount gates) so static/SSR HTML still shows the phone.
 * Sizing uses CSS max dimensions via inline styles derived from window when available.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width: vw, height: vh } = useWindowDimensions();

  const layout = useMemo(() => {
    // Prefer real browser size when present (client). Fall back to a phone-ish
    // default for SSR so we still emit a shell instead of a blank stage.
    const winW =
      Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : vw;
    const winH =
      Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : vh;

    const safeW = Math.max(winW || 390, 320);
    const safeH = Math.max(winH || 844, 480);
    const pad = 24;
    const maxW = Math.max(280, safeW - pad);
    const maxH = Math.max(480, safeH - pad);
    const aspect = PHONE_W / PHONE_H;
    let slotW = Math.min(PHONE_W, maxW);
    let slotH = slotW / aspect;
    if (slotH > maxH) {
      slotH = maxH;
      slotW = slotH * aspect;
    }
    slotW = Math.round(slotW);
    slotH = Math.round(slotH);
    const s = slotW / PHONE_W;
    return {
      slotW,
      slotH,
      radius: Math.round(48 * s),
      bezelRadius: Math.round(40 * s),
      pad: Math.max(6, Math.round(10 * s)),
      islandW: Math.round(120 * s),
      islandH: Math.max(22, Math.round(34 * s)),
      homeW: Math.round(120 * s),
      homeH: Math.max(4, Math.round(5 * s)),
    };
  }, [vw, vh]);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const innerW = layout.slotW - layout.pad * 2;
  const innerH = layout.slotH - layout.pad * 2;

  return (
    <View style={styles.stage} testID="phone-stage">
      <View
        style={{
          width: layout.slotW,
          height: layout.slotH,
          borderRadius: layout.radius,
          backgroundColor: '#0B0E0C',
          padding: layout.pad,
        }}
      >
        <View
          style={{
            width: innerW,
            height: innerH,
            borderRadius: layout.bezelRadius,
            backgroundColor: colors.cream,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <View style={styles.islandWrap} pointerEvents="none">
            <View
              style={{
                width: layout.islandW,
                height: layout.islandH,
                borderRadius: layout.islandH / 2,
                backgroundColor: '#0B0E0C',
              }}
            />
          </View>

          <View style={styles.screen}>{children}</View>

          <View style={styles.homeWrap} pointerEvents="none">
            <View
              style={{
                width: layout.homeW,
                height: layout.homeH,
                borderRadius: layout.homeH / 2,
                backgroundColor: 'rgba(0,0,0,0.28)',
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121816',
  },
  islandWrap: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cream,
  },
  homeWrap: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
});
