import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SignaturePad } from '@/components/SignaturePad';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  H2,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  TextLink,
  Tiny,
} from '@/components/ui';
import { useAppStore } from '@/store/AppStore';
import { colors } from '@/theme/tokens';

export default function SignForm() {
  const router = useRouter();
  const { session, setSignature, clearSignature, patch } = useAppStore();
  const [paths, setPaths] = useState(session.signaturePaths);
  const [error, setError] = useState<string | null>(null);

  const onChange = (next: string[]) => {
    setPaths(next);
    setSignature(next);
    setError(null);
  };

  const review = () => {
    if (paths.length === 0) {
      setError('Sign with your finger before reviewing.');
      return;
    }
    patch({
      applyProgress: 'sent',
      faxConfirmationId: null,
      signaturePaths: paths,
    });
    router.replace('/apply/sent');
  };

  return (
    <Screen>
      <NavRow
        left={<BackButton />}
        right={<Body muted>CalFresh</Body>}
      />
      <Eyebrow style={{ marginTop: 12 }}>Demo practice</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Sign your form.</H1>
      <Body muted style={{ marginTop: 10 }}>
        Practice signing with your finger. This demo does not send anything to the county.
      </Body>
      <Spacer max={16} />
      <SignaturePad
        paths={paths}
        onChange={onChange}
        onClear={() => {
          setPaths([]);
          clearSignature();
        }}
      />
      <TextLink
        label="Preview form (PDF)"
        onPress={() => router.push('/apply/pdf')}
        style={{ marginTop: 10 }}
      />
      {error ? <Body style={{ marginTop: 12, color: '#8E4A2C' }}>{error}</Body> : null}

      <View
        style={{
          marginTop: 28,
          padding: 18,
          borderRadius: 16,
          backgroundColor: colors.sage,
          gap: 8,
        }}
      >
        <H2>What happens next</H2>
        <Body>1. You review the practice form on the next screen.</Body>
        <Body>2. Nothing is sent to the county from this app.</Body>
        <Body>3. A helper can walk you through applying for real.</Body>
      </View>

      <Spacer max={20} />
      <MainButton warm label="Review your form" onPress={review} />
      <Tiny>Demo only — reviewing is not filing.</Tiny>
    </Screen>
  );
}