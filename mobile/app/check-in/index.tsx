import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BreathingRings } from '@/components/Art';
import {
  BackButton,
  Body,
  H1,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  TextLink,
  Tiny,
} from '@/components/ui';
import { formatMs, useBreathingAudio } from '@/hooks/useBreathingAudio';
import { colors, radius, type } from '@/theme/tokens';

export default function CheckInBreathe() {
  const router = useRouter();
  const [exerciseOn, setExerciseOn] = useState(true);
  const [wantSound, setWantSound] = useState(true);
  const { playing, positionMs, durationMs, toggle, pause, stop } = useBreathingAudio(wantSound);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const goQuestions = async () => {
    setWantSound(false);
    await stop();
    router.push('/check-in/1');
  };

  const onToggleExercise = async () => {
    if (exerciseOn) {
      setExerciseOn(false);
      setWantSound(false);
      await pause();
    } else {
      setExerciseOn(true);
    }
  };

  const onToggleSound = async () => {
    if (!exerciseOn) setExerciseOn(true);
    const next = !playing;
    setWantSound(next);
    await toggle();
  };

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Spacer max={24} />
      <H1 style={{ textAlign: 'center' }}>Want a breath first?</H1>
      <Body muted center style={{ marginTop: 8 }}>
        Optional. Follow the rings — expand with breathe in,{'\n'}ease out with breathe out.
      </Body>
      <Spacer />
      <BreathingRings guided pulsing={exerciseOn} size={250} />
      <Pressable
        onPress={onToggleExercise}
        style={{
          marginTop: 20,
          alignSelf: 'center',
          minHeight: 52,
          paddingHorizontal: 28,
          borderRadius: radius.button,
          backgroundColor: colors.sage,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel={exerciseOn ? 'Pause exercise' : 'Resume exercise'}
      >
        <Text style={{ fontFamily: type.bodyMedium.fontFamily, fontSize: 20, color: colors.green }}>
          {exerciseOn ? 'Pause exercise' : 'Resume exercise'}
        </Text>
      </Pressable>
      <TextLink
        label={playing ? 'Mute sound' : 'Play guided sound'}
        onPress={onToggleSound}
        style={{ marginTop: 4 }}
      />
      {durationMs > 0 ? (
        <Tiny>
          {formatMs(positionMs)} of {formatMs(durationMs)}
          {playing ? '' : ' · muted'}
        </Tiny>
      ) : (
        <Tiny>Starting guided sound…</Tiny>
      )}
      <Spacer />
      <MainButton label="Continue to questions" onPress={goQuestions} />
      <TextLink label="Skip breathing" onPress={goQuestions} style={{ marginTop: 4 }} />
    </Screen>
  );
}
