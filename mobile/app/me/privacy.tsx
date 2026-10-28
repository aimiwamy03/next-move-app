import React from 'react';
import { useRouter } from 'expo-router';
import { BackButton, Body, H1, NavRow, Screen, Spacer } from '@/components/ui';

export default function Privacy() {
  const router = useRouter();

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Spacer max={50} />
      <H1>Your privacy</H1>
      <Body style={{ marginTop: 16 }}>
        We never ask for your Social Security number on a call.
      </Body>
      <Body style={{ marginTop: 14 }}>
        Your answers clear after 7 days, or when a helper takes over.
      </Body>
    </Screen>
  );
}
