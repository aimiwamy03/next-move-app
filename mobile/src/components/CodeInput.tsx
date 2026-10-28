import React, { useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, type } from '@/theme/tokens';

type Props = {
  value: string;
  onChange: (digits: string) => void;
  length?: number;
  error?: boolean;
  /** sms-otp for OTP, or plain number pad for PIN */
  mode?: 'otp' | 'pin';
  autoFocus?: boolean;
  accessibilityLabel?: string;
};

/**
 * Mobile-friendly code entry: real TextInput (SMS autofill on iOS/Android)
 * with digit boxes as the visual.
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  error,
  mode = 'otp',
  autoFocus = true,
  accessibilityLabel,
}: Props) {
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => inputRef.current?.focus?.(), 250);
    return () => clearTimeout(t);
  }, [autoFocus]);

  return (
    <Pressable onPress={() => inputRef.current?.focus?.()} style={styles.wrap}>
      <View style={styles.codes}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={[
              styles.box,
              i === value.length && !error && styles.cur,
              !!error && styles.boxErr,
            ]}
          >
            <Text style={styles.digit}>{d.trim()}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(raw) => onChange(raw.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType={mode === 'otp' ? 'oneTimeCode' : 'none'}
        autoComplete={mode === 'otp' ? (Platform.OS === 'android' ? 'sms-otp' : 'one-time-code') : 'off'}
        importantForAutofill="yes"
        maxLength={length}
        caretHidden
        style={styles.input}
        accessibilityLabel={accessibilityLabel ?? (mode === 'otp' ? 'One time code' : 'PIN')}
        showSoftInputOnFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 28, position: 'relative' },
  codes: { flexDirection: 'row', gap: 10 },
  box: {
    flex: 1,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.codeIdle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxErr: { borderColor: colors.codeError },
  cur: { borderWidth: 2, borderColor: colors.terracotta },
  digit: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 28,
    color: colors.ink,
  },
  // Full-size invisible field so taps and SMS autofill always hit a real input
  input: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: colors.ink,
    fontSize: 1,
  },
});
