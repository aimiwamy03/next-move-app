import React, { useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Cairn } from '@/components/Art';
import {
  Body,
  Field,
  H1,
  MainButton,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { digitsOnly, formatPhoneDisplay, isValidUsPhone, telUrl } from '@/lib/phone';
import { authProvider } from '@/providers/auth';
import { smsProvider } from '@/providers/sms';
import { useAppStore } from '@/store/AppStore';
import { HOTLINE, HOTLINE_DISPLAY } from '@/theme/tokens';

export default function Welcome() {
  const router = useRouter();
  const { patch, online } = useAppStore();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    setError(null);
    if (!isValidUsPhone(phone)) {
      setError('Enter a 10-digit phone number starting with 2 to 9.');
      return;
    }
    if (!online) {
      router.push('/offline');
      return;
    }

    const digits = digitsOnly(phone);
    setBusy(true);
    patch({ phoneDigits: digits });

    try {
      const { exists } = await authProvider.lookup(digits);
      if (exists) {
        router.push('/sign-in/pin');
        return;
      }

      const sent = await smsProvider.sendCode(digits);
      if (!sent.ok) {
        setError(sent.error);
        return;
      }
      router.push('/sign-in/code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Spacer max={28} />
      <Cairn width={120} stones={3} sparkle />
      <H1 hero style={{ textAlign: 'center', marginTop: 18 }}>
        Next Move
      </H1>
      <Body muted center style={{ marginTop: 8 }}>
        Small steps for your first weeks home.{'\n'}From the people at BFP.
      </Body>

      <H1 style={{ marginTop: 28, fontSize: 26 }}>What's your phone number?</H1>
      <Field
        value={formatPhoneDisplay(phone)}
        onChangeText={(t) => {
          setPhone(digitsOnly(t));
          setError(null);
        }}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus
        accessibilityLabel="Phone number"
        style={{ marginTop: 16 }}
        placeholder="(510) 555-0100"
      />
      {error ? <Body style={{ marginTop: 12, color: '#8E4A2C' }}>{error}</Body> : null}

      <Spacer />
      <MainButton
        label="Continue"
        onPress={onContinue}
        disabled={busy || phone.length < 10}
      />
      <TextLink
        label="Call without an account"
        onPress={() => Linking.openURL(telUrl(HOTLINE))}
        style={{ marginTop: 8 }}
      />
      <Body muted center style={{ marginTop: 4 }}>
        {HOTLINE_DISPLAY}
      </Body>
    </Screen>
  );
}
