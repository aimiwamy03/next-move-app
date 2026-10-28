import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { CodeInput } from '@/components/CodeInput';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  NavRow,
  Note,
  Screen,
  Spacer,
  TextLink,
  Tiny,
} from '@/components/ui';
import { formatPhoneDisplay } from '@/lib/phone';
import { authProvider } from '@/providers/auth';
import { smsProvider } from '@/providers/sms';
import { useAppStore } from '@/store/AppStore';

export default function EnterPin() {
  const router = useRouter();
  const { session, patch } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async (value: string) => {
    if (value.length !== 4 || busy) return;
    setBusy(true);
    setError(null);
    const result = await authProvider.verifyPin(session.phoneDigits, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setPin('');
      return;
    }

    patch({
      signedIn: true,
      phoneDigits: session.phoneDigits,
      firstName: result.account.firstName || session.firstName || 'Friend',
      onboarded: Boolean(result.account.onboarded),
      isFirstDay: !result.account.onboarded,
    });

    if (result.account.onboarded) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/onboarding/name');
    }
  };

  return (
    <Screen>
      <NavRow left={<BackButton onPress={() => router.replace('/welcome')} />} />
      <Eyebrow style={{ marginTop: 20 }}>Welcome back</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Enter your PIN</H1>
      <Body muted style={{ marginTop: 10 }}>
        For {formatPhoneDisplay(session.phoneDigits)}.
      </Body>

      <CodeInput
        value={pin}
        onChange={(next) => {
          setPin(next);
          setError(null);
          if (next.length === 4) verify(next);
        }}
        length={4}
        mode="pin"
        error={!!error}
        accessibilityLabel="Four digit PIN"
      />

      {error ? <Note>{error}</Note> : null}

      <Spacer />
      <TextLink
        label="Use a code instead"
        onPress={async () => {
          await smsProvider.sendCode(session.phoneDigits);
          router.push('/sign-in/code');
        }}
      />
      <TextLink label="Wrong number?" onPress={() => router.replace('/welcome')} />
      <Tiny>Demo PIN for Marcus: 1234</Tiny>
    </Screen>
  );
}
