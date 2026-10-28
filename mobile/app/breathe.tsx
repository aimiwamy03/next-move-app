import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BreathingRings } from '@/components/Art';
import { Body, H1, Screen, Spacer, TextLink, Tiny } from '@/components/ui';
import { formatMs, useBreathingAudio } from '@/hooks/useBreathingAudio';
import { useAppStore } from '@/store/AppStore';
import { HOTLINE, colors, radius, sizes, type } from '@/theme/tokens';
import { telUrl } from '@/lib/phone';

export default function OverwhelmedBreathe() {
  const router = useRouter();
  const { session, clearBreatheReturn } = useAppStore();
  const [exerciseOn, setExerciseOn] = useState(true);
  const [wantSound, setWantSound] = useState(true);
  const { playing, positionMs, durationMs, toggle, pause, stop } = useBreathingAudio(wantSound);

  const returnTo = session.returnAfterBreathe || '/(tabs)/home';
  const fromCall = typeof returnTo === 'string' && returnTo.includes('call');

  useEffect(() => () => {
    stop();
  }, [stop]);

  const goBack = async () => {
    setWantSound(false);
    await stop();
    clearBreatheReturn();
    router.replace(returnTo as '/(tabs)/home');
  };

  const onToggleExercise = async () => {
    if (exerciseOn) {
      setExerciseOn(false);
      setWantSound(false);
      await pause();
    } else {
      setExerciseOn(true);
      setWantSound(true);
      if (!playing) await toggle();
    }
  };

  return (
    <Screen dark>
      <Spacer max={40} />
      <H1 light style={{ textAlign: 'center' }}>
        That's okay.{'\n'}Let's breathe.
      </H1>
      <Body style={{ color: colors.sage, textAlign: 'center', marginTop: 10 }}>
        Follow the rings. Expand on breathe in,{'\n'}ease out on breathe out.
      </Body>
      <Spacer />
      <BreathingRings guided pulsing={exerciseOn} size={270} dark />
      <Pressable
        onPress={onToggleExercise}
        style={{
          marginTop: 16,
          alignSelf: 'center',
          minHeight: 48,
          paddingHorizontal: 22,
          borderRadius: radius.button,
          backgroundColor: colors.greenDarkRing2,
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel={exerciseOn ? 'Pause exercise' : 'Resume exercise'}
      >
        <Text style={{ color: colors.white, fontSize: 18, fontFamily: type.bodyMedium.fontFamily }}>
          {exerciseOn ? 'Pause exercise' : 'Resume exercise'}
        </Text>
      </Pressable>
      {durationMs > 0 ? (
        <Tiny style={{ color: colors.sage }}>
          Sound {formatMs(positionMs)} of {formatMs(durationMs)}
        </Tiny>
      ) : null}

      <Spacer />

      {fromCall ? (
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          <Body style={{ color: colors.peach, textAlign: 'center' }}>Your call is paused.</Body>
          <Body style={{ color: colors.sage, textAlign: 'center', marginTop: 4 }}>
            Nothing on the call is lost.
          </Body>
        </View>
      ) : (
        <Body style={{ color: colors.sage, textAlign: 'center', marginBottom: 16 }}>
          Your place is saved. Nothing is lost.
        </Body>
      )}

      <Pressable
        onPress={goBack}
        style={{
          height: sizes.mainButton,
          borderRadius: radius.button,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="Back to what I was doing"
      >
        <Text style={[type.button, { color: colors.green }]}>Back to what I was doing</Text>
      </Pressable>
      <TextLink
        light
        label="Talk to a person"
        onPress={() => Linking.openURL(telUrl(HOTLINE))}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}
