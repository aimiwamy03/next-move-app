import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
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
import { bfpHelper } from '@/mock/data';
import { api } from '@/providers/api';
import { telUrl } from '@/lib/phone';
import { useAppStore } from '@/store/AppStore';
import { colors, radius, type } from '@/theme/tokens';

type Phase = 'compose' | 'prefer';
type ContactVia = 'call' | 'text' | null;

export default function HelperHandoff() {
  const router = useRouter();
  const { online } = useAppStore();
  const [phase, setPhase] = useState<Phase>('compose');
  const [message, setMessage] = useState('');
  const [contactVia, setContactVia] = useState<ContactVia>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDescription = /\S/.test(message);
  const canSubmit = hasDescription && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (!online) {
      router.push('/offline');
      return;
    }
    setError(null);
    setBusy(true);
    const res = await api.requestHelperHandoff();
    setBusy(false);
    if (!res.ok) {
      setError('Could not reach a helper right now. Try calling now instead.');
      return;
    }
    setPhase('prefer');
  };

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 20 }}>A person, not a form</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Want {bfpHelper.name} to help?</H1>
      <Body muted style={{ marginTop: 12 }}>
        {bfpHelper.role}. Usually available {bfpHelper.hours}.
      </Body>
      <Body style={{ marginTop: 16 }}>
        They can help you apply for real. This demo did not send a form to the county.
      </Body>
      <Spacer />

      {phase === 'compose' ? (
        <>
          <TextInput
            value={message}
            onChangeText={(t) => {
              setMessage(t);
              setError(null);
            }}
            placeholder="Short description of your situation"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={styles.input}
            maxLength={280}
            accessibilityLabel="Short description for your helper"
          />
          <Tiny style={{ textAlign: 'right', marginTop: 4 }}>{message.trim().length}/280</Tiny>
          {error ? <Body style={{ marginTop: 10, color: '#8E4A2C' }}>{error}</Body> : null}
          <MainButton
            warm
            label="Submit"
            onPress={submit}
            disabled={!canSubmit}
            style={{ marginTop: 16 }}
          />
          <Tiny style={{ marginTop: 8 }}>
            In this demo the request is simulated. Nobody is notified for real.
          </Tiny>
        </>
      ) : (
        <>
          <Body style={{ fontFamily: type.optionTitle.fontFamily, fontSize: 22 }}>
            Do I prefer to be called or texted?
          </Body>
          <Body muted style={{ marginTop: 8 }}>
            Your note was sent. Pick how {bfpHelper.name} should reach you.
          </Body>
          <View style={styles.choiceRow}>
            <Pressable
              onPress={() => setContactVia('call')}
              style={[styles.choice, contactVia === 'call' && styles.choiceOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: contactVia === 'call' }}
            >
              <Text style={[styles.choiceLabel, contactVia === 'call' && styles.choiceLabelOn]}>
                Call
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setContactVia('text')}
              style={[styles.choice, contactVia === 'text' && styles.choiceOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: contactVia === 'text' }}
            >
              <Text style={[styles.choiceLabel, contactVia === 'text' && styles.choiceLabelOn]}>
                Text
              </Text>
            </Pressable>
          </View>
          {contactVia ? (
            <Tiny style={{ marginTop: 10 }}>
              Got it — they’ll {contactVia === 'call' ? 'call' : 'text'} when they can.
            </Tiny>
          ) : (
            <Tiny style={{ marginTop: 10 }}>Choose one so they know how to reach you.</Tiny>
          )}
          <MainButton
            label="Done"
            onPress={() => safeBack(router)}
            disabled={!contactVia}
            style={{ marginTop: 18 }}
          />
        </>
      )}

      <TextLink
        label={`Call now · ${bfpHelper.phoneDisplay}`}
        onPress={() => Linking.openURL(telUrl(bfpHelper.phone))}
        style={{ marginTop: 16 }}
      />
      <Tiny>
        Opens your phone and dials now. If nobody answers, leave a short message
        with your name and number.
      </Tiny>
      <TextLink label="Not now" onPress={() => safeBack(router)} style={{ marginTop: 8 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 120,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 14,
    fontFamily: type.body.fontFamily,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  choice: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: {
    borderColor: colors.green,
    backgroundColor: colors.sage,
  },
  choiceLabel: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 18,
    color: colors.ink,
  },
  choiceLabelOn: {
    color: colors.green,
  },
});
