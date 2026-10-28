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

export default function BankCardTask() {
  const router = useRouter();
  const { session, markBankCardDone, clearBankCardDone } = useAppStore();
  const done = session.hasBankCard;

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 20 }}>A money step</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Get a bank card</H1>
      <Body muted style={{ marginTop: 12 }}>
        Many benefits and paychecks need an account. Ask a helper which free
        checking options work near you.
      </Body>
      <Body style={{ marginTop: 16 }}>
        Bring any ID you have. If you do not have one yet, start with ID help
        under Resources.
      </Body>
      <Spacer />
      {done ? (
        <>
          <MainButton centered showArrow={false} label="Marked done" onPress={() => {}} disabled />
          <TextLink label="Undo — not done yet" onPress={clearBankCardDone} style={{ marginTop: 8 }} />
          <Tiny>You can undo if you tapped by mistake.</Tiny>
        </>
      ) : (
        <>
          <MainButton warm label="Mark as done" onPress={markBankCardDone} />
          <Tiny>Only tap when you actually finished this step.</Tiny>
        </>
      )}
      <TextLink label="Back to Steps" onPress={() => router.replace('/(tabs)/apply')} />
    </Screen>
  );
}
