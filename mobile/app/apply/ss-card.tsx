import React from 'react';
import { useRouter } from 'expo-router';
import {
  BackButton,
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
import { useAppStore } from '@/store/AppStore';

export default function SSCardTask() {
  const router = useRouter();
  const { session, markSSCardDone, clearSSCardDone } = useAppStore();
  const done = session.hasSSCard;

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 20 }}>A papers step</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Social Security card</H1>
      <Body muted style={{ marginTop: 12 }}>
        You may need this for benefits and work. ssa.gov/reentry or call
        1-800-772-1213. A helper can go with you.
      </Body>
      <Body style={{ marginTop: 16 }}>
        Bring release papers if you have them. Ask for a replacement card if
        yours is missing.
      </Body>
      <Spacer />
      {done ? (
        <>
          <MainButton centered showArrow={false} label="Marked done" onPress={() => {}} disabled />
          <TextLink label="Undo — not done yet" onPress={clearSSCardDone} style={{ marginTop: 8 }} />
          <Tiny>You can undo if you tapped by mistake.</Tiny>
        </>
      ) : (
        <>
          <MainButton warm label="Mark as done" onPress={markSSCardDone} />
          <Tiny>Only tap when you actually finished this step.</Tiny>
        </>
      )}
      <TextLink label="Back to Steps" onPress={() => router.replace('/(tabs)/apply')} />
    </Screen>
  );
}
