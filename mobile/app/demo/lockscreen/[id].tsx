import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { Body, H1, Screen, TextLink } from '@/components/ui';
import { colors, type } from '@/theme/tokens';

/**
 * Lock-screen mockups for the demo.
 * Copy never mentions prison, parole, or CalFresh by name.
 */
const SCREENS = {
  '1': {
    time: '7:42',
    title: 'Good morning',
    body: 'A 2 minute check in is ready when you are.',
  },
  '2': {
    time: '3:05',
    title: 'Form ready',
    body: 'Demo only. Nothing was sent. Review when you are ready.',
  },
  '3': {
    time: '8:10',
    title: 'Next Move',
    body: 'Your reminder. Nothing private shows here.',
  },
} as const;

export default function LockscreenDemo() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = SCREENS[(id as keyof typeof SCREENS) || '1'] ?? SCREENS['1'];

  return (
    <Screen style={{ backgroundColor: '#1C2420' }}>
      <TextLink light label="Close" onPress={() => safeBack(router)} />
      <View style={styles.center}>
        <Body style={{ color: colors.sage, fontSize: 64, lineHeight: 72 }}>{data.time}</Body>
        <View style={styles.banner}>
          <Body style={{ fontFamily: type.bodyMedium.fontFamily, color: colors.heading }}>
            Next Move
          </Body>
          <H1 style={{ fontSize: 22, marginTop: 4 }}>{data.title}</H1>
          <Body muted style={{ marginTop: 4 }}>
            {data.body}
          </Body>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: 28 },
  banner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
  },
});
