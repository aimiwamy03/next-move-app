import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  BackButton,
  Body,
  Eyebrow,
  Field,
  H1,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  Tiny,
} from '@/components/ui';
import { useAppStore } from '@/store/AppStore';

export default function OnboardingName() {
  const router = useRouter();
  const { session, patch } = useAppStore();
  const [name, setName] = useState(session.firstName || '');
  const [error, setError] = useState<string | null>(null);

  const continueNext = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Add a first name or nickname to continue.');
      return;
    }
    if (trimmed.length > 40) {
      setError('Keep it under 40 characters.');
      return;
    }
    patch({ firstName: trimmed });
    router.push('/onboarding/privacy');
  };

  return (
    <Screen>
      <NavRow left={<BackButton onPress={() => router.replace('/welcome')} />} />
      <Eyebrow style={{ marginTop: 20 }}>Welcome</Eyebrow>
      <H1 style={{ marginTop: 8 }}>What should we call you?</H1>
      <Body muted style={{ marginTop: 10 }}>
        Just a first name. A nickname is fine.
      </Body>
      <Field
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError(null);
        }}
        autoCapitalize="words"
        autoFocus
        accessibilityLabel="First name"
        style={{ marginTop: 28, fontSize: 26 }}
      />
      {error ? <Body style={{ marginTop: 12, color: '#8E4A2C' }}>{error}</Body> : null}
      <Spacer />
      <MainButton label="Continue" onPress={continueNext} disabled={!name.trim()} />
      <Tiny>You can change this anytime.</Tiny>
    </Screen>
  );
}
