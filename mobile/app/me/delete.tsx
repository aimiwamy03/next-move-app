import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import {
  BackButton,
  Body,
  H1,
  MainButton,
  NavRow,
  Screen,
  SecondaryButton,
  Spacer,
  TextLink,
} from '@/components/ui';
import { useAppStore } from '@/store/AppStore';
import { api } from '@/providers/api';
import { authProvider } from '@/providers/auth';

export default function DeleteConfirm() {
  const router = useRouter();
  const { session, deleteAll, signOut, online } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!online) {
      router.push('/offline');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.deleteAccount();
      await authProvider.deleteAccount(session.phoneDigits);
      await deleteAll();
      router.replace('/welcome');
    } catch {
      setError('Something went wrong. Try again, or just sign out.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Spacer max={50} />
      <H1>Delete your info?</H1>
      <Body style={{ marginTop: 16 }}>
        Your name, answers and saved forms leave this app.
      </Body>
      <Body muted style={{ marginTop: 12 }}>
        This demo never sends forms to the county.
      </Body>
      {error ? <Body style={{ marginTop: 12, color: '#8E4A2C' }}>{error}</Body> : null}
      <Spacer />
      {/* Keep is the main (safe) action */}
      <MainButton
        centered
        showArrow={false}
        label="Keep my info"
        onPress={() => safeBack(router)}
        disabled={busy}
      />
      <SecondaryButton
        warm
        label="Yes, delete my info"
        onPress={onDelete}
        style={{ marginTop: 12 }}
      />
      <TextLink
        label="Just sign out instead"
        onPress={() => {
          signOut();
          router.replace('/welcome');
        }}
        style={{ marginTop: 6 }}
      />
    </Screen>
  );
}
