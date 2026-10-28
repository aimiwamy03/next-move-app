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
import { smsProvider } from '@/providers/sms';
import { useAppStore } from '@/store/AppStore';

export default function SignInCode() {
  const router = useRouter();
  const { session } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async (value: string) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const result = await smsProvider.verifyCode(session.phoneDigits, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setCode('');
      return;
    }
    // New account: set a PIN next
    router.replace('/sign-in/set-pin');
  };

  const onChange = (next: string) => {
    setCode(next);
    setError(null);
    if (next.length === 6) verify(next);
  };

  const resend = async () => {
    setError(null);
    setCode('');
    await smsProvider.sendCode(session.phoneDigits);
  };

  return (
    <Screen>
      <NavRow left={<BackButton onPress={() => router.replace('/welcome')} />} />
      <Eyebrow style={{ marginTop: 20 }}>New account</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Enter the code</H1>
      <Body muted style={{ marginTop: 10 }}>
        We sent 6 numbers to {formatPhoneDisplay(session.phoneDigits)}. Tap the boxes and type, or use the code from your text.
      </Body>

      <CodeInput
        value={code}
        onChange={onChange}
        length={6}
        mode="otp"
        error={!!error}
        accessibilityLabel="Six digit one time code"
      />

      {error ? <Note>{error}</Note> : (
        <Tiny style={{ marginTop: 16 }}>On a phone, your keyboard can fill this from the text message.</Tiny>
      )}

      <Spacer />
      <TextLink label="Send a new code" onPress={resend} />
      <TextLink label="Wrong number?" onPress={() => router.replace('/welcome')} />
    </Screen>
  );
}
