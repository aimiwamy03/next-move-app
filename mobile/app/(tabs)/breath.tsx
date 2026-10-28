import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { BreathingRings } from '@/components/Art';
import { Body, Eyebrow, Screen } from '@/components/ui';
import { formatMs, useBreathingAudio } from '@/hooks/useBreathingAudio';
import { breathTracks, BreathTrack } from '@/mock/breathTracks';
import { colors, radius, type } from '@/theme/tokens';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');
/** Rings dominate the first viewport — they teach the breath rhythm. */
const RING = Math.min(300, SCREEN_W * 0.72);
/** Page width — slightly less than screen so neighbors peek. */
const ITEM_W = Math.min(SCREEN_W * 0.82, RING + 40);
const SIDE_PAD = (SCREEN_W - ITEM_W) / 2;
const PHASE_MS = 4000;

function PauseIcon({ color = colors.green }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5h3v14H8V5zm5 0h3v14h-3V5z" fill={color} />
    </Svg>
  );
}

function PlayIcon({ color = colors.green }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l11-7L8 5z" fill={color} />
    </Svg>
  );
}

function CarouselRing({
  item,
  index,
  scrollX,
  active,
  pulsing,
}: {
  item: BreathTrack;
  index: number;
  scrollX: Animated.Value;
  active: boolean;
  pulsing: boolean;
}) {
  const inputRange = [(index - 1) * ITEM_W, index * ITEM_W, (index + 1) * ITEM_W];
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.78, 1, 0.78],
    extrapolate: 'clamp',
  });
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.45, 1, 0.45],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.item, { opacity, transform: [{ scale }] }]}>
      <BreathingRings
        guided={active}
        label={item.title.split(' ').slice(0, 2).join(' ')}
        sub=" "
        size={RING}
        dark
        pulsing={pulsing}
        phaseMs={PHASE_MS}
      />
    </Animated.View>
  );
}

export default function BreathTab() {
  const listRef = useRef<FlatList<BreathTrack>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const uiIndexRef = useRef(0);
  const [uiIndex, setUiIndex] = useState(0);
  /** Settled track — only changes on snap / dot tap (drives audio). */
  const [trackIndex, setTrackIndex] = useState(0);
  /** Preserve play intent across track swaps. */
  const [wantPlaying, setWantPlaying] = useState(true);
  /** Visual rhythm stays on unless the user pauses the exercise. */
  const [exerciseOn, setExerciseOn] = useState(true);

  const track = breathTracks[trackIndex] ?? breathTracks[0];
  const uiTrack = breathTracks[uiIndex] ?? breathTracks[0];
  const { playing, positionMs, durationMs, play, toggle, pause, stop } = useBreathingAudio(
    wantPlaying,
    track.source,
  );

  useFocusEffect(
    useCallback(() => {
      setExerciseOn(true);
      setWantPlaying(true);
      play();
      return () => {
        setWantPlaying(false);
        pause();
        stop();
      };
    }, [play, pause, stop]),
  );

  const settleTo = useCallback((i: number) => {
    const next = Math.max(0, Math.min(breathTracks.length - 1, i));
    uiIndexRef.current = next;
    setUiIndex(next);
    setTrackIndex((prev) => {
      if (prev !== next) Haptics.selectionAsync().catch(() => {});
      return next;
    });
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / ITEM_W);
        if (i >= 0 && i < breathTracks.length && i !== uiIndexRef.current) {
          uiIndexRef.current = i;
          setUiIndex(i);
        }
      },
    },
  );

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    settleTo(Math.round(e.nativeEvent.contentOffset.x / ITEM_W));
  };

  const onToggleExercise = async () => {
    if (exerciseOn) {
      setExerciseOn(false);
      setWantPlaying(false);
      await pause();
    } else {
      setExerciseOn(true);
    }
  };

  const onToggleSound = async () => {
    if (!exerciseOn) setExerciseOn(true);
    const next = !playing;
    setWantPlaying(next);
    await toggle();
  };

  return (
    <Screen dark withTabPad style={{ paddingHorizontal: 0 }}>
      <View style={styles.topRow}>
        <Eyebrow style={{ color: colors.peach }}>Breathe</Eyebrow>
        <Body style={styles.count}>
          {uiIndex + 1}/{breathTracks.length}
        </Body>
      </View>

      <View style={styles.carousel}>
        <Animated.FlatList
          ref={listRef}
          data={breathTracks}
          keyExtractor={(t) => t.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={ITEM_W}
          snapToAlignment="start"
          disableIntervalMomentum
          bounces
          contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
          getItemLayout={(_, i) => ({ length: ITEM_W, offset: ITEM_W * i, index: i })}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item, index: i }) => (
            <CarouselRing
              item={item}
              index={i}
              scrollX={scrollX}
              active={i === trackIndex}
              pulsing={i === trackIndex && exerciseOn}
            />
          )}
        />
      </View>

      <Body style={styles.hint}>Follow the ring · swipe to change sound</Body>

      <View style={styles.dots}>
        {breathTracks.map((t, i) => (
          <Pressable
            key={t.id}
            onPress={() => {
              listRef.current?.scrollToOffset({ offset: ITEM_W * i, animated: true });
              settleTo(i);
            }}
            hitSlop={10}
            style={[styles.dot, i === uiIndex && styles.dotOn]}
          />
        ))}
      </View>

      <View style={styles.copy}>
        <Body style={styles.trackTitle}>{uiTrack.title}</Body>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={onToggleExercise}
          style={styles.pauseBtn}
          accessibilityRole="button"
          accessibilityLabel={exerciseOn ? 'Pause exercise' : 'Resume exercise'}
        >
          {exerciseOn ? <PauseIcon /> : <PlayIcon />}
        </Pressable>
        <Pressable onPress={onToggleSound} style={styles.stopBtn} accessibilityRole="button">
          <Text style={styles.stopLabel}>{playing ? 'Mute sound' : 'Play sound'}</Text>
        </Pressable>
      </View>

      {durationMs > 0 && playing ? (
        <Body style={styles.time}>
          {formatMs(positionMs)} of {formatMs(durationMs)}
        </Body>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    paddingHorizontal: 28,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: colors.sage,
    fontSize: 17,
  },
  carousel: {
    marginTop: 4,
    height: RING * 1.5,
  },
  item: {
    width: ITEM_W,
    height: RING * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    paddingHorizontal: 32,
    marginTop: 10,
    alignItems: 'center',
  },
  trackTitle: {
    textAlign: 'center',
    color: colors.sage,
    fontSize: 17,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(254,251,245,0.28)',
  },
  dotOn: {
    backgroundColor: colors.white,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hint: {
    textAlign: 'center',
    color: 'rgba(254,251,245,0.55)',
    marginTop: 2,
    fontSize: 16,
  },
  controls: {
    marginTop: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopLabel: {
    ...type.button,
    color: colors.green,
  },
  time: {
    textAlign: 'center',
    color: colors.sage,
    marginTop: 10,
    marginBottom: 4,
  },
});
