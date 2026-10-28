import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Cairn } from '@/components/Art';
import {
  Body,
  Eyebrow,
  H1,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  TextLink,
  Tiny,
} from '@/components/ui';

export default function FormReady() {
  const router = useRouter();

  return (
    <Screen>
      <NavRow right={<TextLink label="Close" onPress={() => router.replace('/(tabs)/apply')} />} />
      <Spacer />
      <View style={{ alignSelf: 'center' }}>
        <Cairn width={150} stones={4} sparkle />
      </View>
      <Eyebrow style={{ textAlign: 'center', marginTop: 20 }}>Demo only</Eyebrow>
      <H1 style={{ textAlign: 'center', marginTop: 8 }}>Your form is ready</H1>
      <Body muted center style={{ marginTop: 8 }}>
        Nothing has been sent.{'\n'}This app does not submit applications.
      </Body>
      <Tiny style={{ marginTop: 12, textAlign: 'center' }}>
        You finished a practice walkthrough — not a real CalFresh filing.
      </Tiny>
      <Spacer />
      <MainButton
        centered
        showArrow={false}
        label="See your form (PDF)"
        onPress={() => router.push('/apply/pdf')}
      />
      <MainButton
        warm
        centered
        showArrow
        label="Talk to a helper to apply for real"
        onPress={() => router.push('/apply/helper')}
        style={{ marginTop: 10 }}
      />
      <TextLink
        label="Continue to Steps"
        onPress={() => router.replace('/(tabs)/apply')}
        style={{ marginTop: 10 }}
      />
    </Screen>
  );
}
