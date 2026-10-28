import React from 'react';
import { useRouter } from 'expo-router';
import {
  BackButton,
  Body,
  H1,
  MainButton,
  NavRow,
  Screen,
  SecondaryButton,
  Spacer,
} from '@/components/ui';
import { authProvider } from '@/providers/auth';
import { useAppStore } from '@/store/AppStore';

export default function OnboardingReminders() {
  const router = useRouter();
  const { session, patch } = useAppStore();

  const finish = async (remindersEnabled: boolean) => {
    await authProvider.markOnboarded(session.phoneDigits, session.firstName);
    patch({
      remindersEnabled,
      onboarded: true,
      signedIn: true,
      isFirstDay: true,
      dayHome: 1,
      applyProgress: 'not_started',
    });
    router.replace('/(tabs)/home');
  };

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Spacer max={40} />
      <H1>Good morning, {session.firstName}</H1>
      <Body muted style={{ marginTop: 10 }}>
        Ready for a 2 minute check in?
      </Body>
      <H1 style={{ marginTop: 28, fontSize: 26 }}>A gentle nudge each morning?</H1>
      <Body muted style={{ marginTop: 10 }}>
        One a day. Nothing about your case shows on your lock screen.
      </Body>
      <Spacer />
      <MainButton label="Turn on reminders" onPress={() => finish(true)} />
      <SecondaryButton label="Not now" onPress={() => finish(false)} style={{ marginTop: 12 }} />
    </Screen>
  );
}
