import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';
import { colors, radius, sizes, type } from '@/theme/tokens';
import { Cairn } from '@/components/Art';

const COLORS = [colors.terracotta, colors.green, colors.peach, colors.greenMid, '#7E9A84', '#E8B49A'];

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  buttonLabel?: string;
  onDone: () => void;
};

export function Celebration({
  visible,
  title,
  body = 'Nice work. One small step done.',
  buttonLabel = 'Keep going',
  onDone,
}: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 400,
        color: COLORS[i % COLORS.length],
        size: 8 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 80,
      })),
    [visible],
  );

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    let player: ReturnType<typeof createAudioPlayer> | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      // Soft chime: brief play of guided audio, then stop — no second asset needed.
      player = createAudioPlayer(require('../../assets/audio/five-minute-breathing-ucla.mp3'));
      player.volume = 0.35;
      player.play();
      stopTimer = setTimeout(() => {
        try {
          player?.pause();
        } catch {
          /* ignore */
        }
      }, 900);
    } catch {
      // Audio optional
    }
    return () => {
      if (stopTimer) clearTimeout(stopTimer);
      try {
        player?.pause();
        player?.release();
      } catch {
        /* ignore */
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDone}>
      <View style={styles.backdrop}>
        {pieces.map((p) => (
          <ConfettiPiece key={p.id} {...p} />
        ))}
        <View style={styles.card}>
          <Cairn width={110} stones={3} sparkle />
          <Text style={[type.h1, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
          <Text style={[type.bodyMuted, { textAlign: 'center', marginTop: 8 }]}>{body}</Text>
          <Pressable onPress={onDone} style={styles.btn} accessibilityRole="button">
            <Text style={type.button}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ConfettiPiece({
  left,
  delay,
  color,
  size,
  drift,
}: {
  left: number;
  delay: number;
  color: string;
  size: number;
  drift: number;
}) {
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, {
          toValue: 700,
          duration: 2200 + Math.random() * 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: drift,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, drift, opacity, x, y]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: `${left}%`,
        width: size,
        height: size * 1.4,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }, { translateX: x }, { rotate: `${drift}deg` }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(46, 58, 49, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: 28,
    alignItems: 'center',
  },
  btn: {
    marginTop: 24,
    height: sizes.mainButton,
    borderRadius: radius.button,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 22,
  },
});
