import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { CodeInput } from '@/components/CodeInput';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  MainButton,
  NavRow,
  Note,
  Screen,
  Spacer,
  Tiny,
} from '@/components/ui';
import { authProvider } from '@/providers/auth';
import { useAppStore } from '@/store/AppStore';

export default function SetPin() {
  const router = useRouter();
  const { session, patch } = useAppStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onCreateDone = (value: string) => {
    if (value.length !== 4) return;
    setPin(value);
    setStep('confirm');
    setConfirm('');
    setError(null);
  };

  const onConfirm = async (value: string) => {
    if (value.length !== 4 || busy) return;
    if (value !== pin) {
      setError("Those PINs didn't match. Try again.");
      setConfirm('');
      return;
    }
    setBusy(true);
    const result = await authProvider.setPin(session.phoneDigits, pin, {
      firstName: session.firstName,
      onboarded: false,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    patch({ signedIn: true, onboarded: false });
    router.replace('/onboarding/name');
  };

  return (
    <Screen>
      <NavRow
        left={
          <BackButton
            onPress={() => {
              if (step === 'confirm') {
                setStep('create');
                setPin('');
                setConfirm('');
                setError(null);
              } else {
                router.replace('/welcome');
              }
            }}
          />
        }
      />
      <Eyebrow style={{ marginTop: 20 }}>Secure your account</Eyebrow>
      <H1 style={{ marginTop: 8 }}>
        {step === 'create' ? 'Choose a 4-digit PIN' : 'Type your PIN again'}
      </H1>
      <Body muted style={{ marginTop: 10 }}>
        {step === 'create'
          ? 'You will use this PIN next time instead of a text code.'
          : 'Make sure it matches.'}
      </Body>

      {step === 'create' ? (
        <CodeInput
          key="create"
          value={pin}
          onChange={(next) => {
            setPin(next);
            setError(null);
            if (next.length === 4) onCreateDone(next);
          }}
          length={4}
          mode="pin"
          error={!!error}
        />
      ) : (
        <CodeInput
          key="confirm"
          value={confirm}
          onChange={(next) => {
            setConfirm(next);
            setError(null);
            if (next.length === 4) onConfirm(next);
          }}
          length={4}
          mode="pin"
          error={!!error}
        />
      )}

      {error ? <Note>{error}</Note> : null}

      <Spacer />
      {step === 'confirm' ? (
        <MainButton
          label="Save PIN"
          onPress={() => onConfirm(confirm)}
          disabled={busy || confirm.length !== 4}
        />
      ) : (
        <Tiny>Pick numbers you can remember. Not your birthday if you can help it.</Tiny>
      )}
    </Screen>
  );
}
