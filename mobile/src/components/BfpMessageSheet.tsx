import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Body, H1, H2, MainButton, Tiny } from '@/components/ui';
import { bfpHelper } from '@/mock/data';
import { colors, radius, type } from '@/theme/tokens';

type Phase = 'compose' | 'confirm';
type ContactVia = 'text' | 'call' | null;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function BfpMessageSheet({ visible, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('compose');
  const [message, setMessage] = useState('');
  const [contactVia, setContactVia] = useState<ContactVia>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setPhase('compose');
    setMessage('');
    setContactVia(null);
    setError(null);
    onClose();
  };

  const send = () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError('Write a short note so the team knows how to help.');
      return;
    }
    setError(null);
    setPhase('confirm');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {phase === 'compose' ? (
            <>
              <H2>Message the BFP team</H2>
              <Body muted style={{ marginTop: 8 }}>
                Briefly explain your situation. {bfpHelper.name} or another helper will follow up.
              </Body>
              <TextInput
                value={message}
                onChangeText={(t) => {
                  setMessage(t);
                  setError(null);
                }}
                placeholder="What’s going on today?"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={styles.input}
                maxLength={280}
                accessibilityLabel="Message to BFP team"
              />
              <Tiny style={{ textAlign: 'right' }}>{message.trim().length}/280</Tiny>
              {error ? <Body style={{ marginTop: 8, color: '#8E4A2C' }}>{error}</Body> : null}
              <MainButton warm label="Send request" onPress={send} style={{ marginTop: 16 }} />
              <Pressable onPress={resetAndClose} style={styles.cancel} accessibilityRole="button">
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <H1 style={{ fontSize: 28, lineHeight: 34 }}>Request sent</H1>
              <Body muted style={{ marginTop: 10 }}>
                Your message was sent to the BFP team. They will be in contact shortly.
              </Body>
              <Body style={{ marginTop: 16 }}>How should they reach you?</Body>
              <View style={styles.choiceRow}>
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
              </View>
              {contactVia ? (
                <Tiny style={{ marginTop: 10 }}>
                  Got it — they’ll {contactVia === 'text' ? 'text' : 'call'} you when they can.
                </Tiny>
              ) : (
                <Tiny style={{ marginTop: 10 }}>Pick text or call so they know how to reach you.</Tiny>
              )}
              <MainButton
                label="Done"
                onPress={resetAndClose}
                disabled={!contactVia}
                style={{ marginTop: 18 }}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 36, 32, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 22,
  },
  input: {
    marginTop: 16,
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
  cancel: {
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 18,
    color: colors.green,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
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
