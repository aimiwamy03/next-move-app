import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { Body, NavRow, Screen, TextLink, Tiny } from '@/components/ui';
import { marcusAnswers, marcusProfile } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme/tokens';

const FAKE_LINES = [90, 70, 80, 60, 85, 50, 75, 65];

export default function PdfViewer() {
  const router = useRouter();
  const { session } = useAppStore();

  return (
    <Screen style={{ paddingHorizontal: 16 }}>
      <NavRow
        left={<TextLink label="Done" onPress={() => safeBack(router)} />}
        right={
          <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
            <Body style={{ fontFamily: type.bodyMedium.fontFamily }}>CF 285.pdf</Body>
            <TextLink label="Share" onPress={() => {}} />
          </View>
        }
      />
      <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={styles.stage}>
        <View style={styles.page}>
          <Body style={{ fontFamily: type.bodyMedium.fontFamily }}>
            Application for CalFresh Benefits
          </Body>
          <Body muted>CF 285. Demo preview — not submitted.</Body>
          <View style={styles.box}>
            <Body>Name: {marcusAnswers.full_name}</Body>
            <Body style={{ marginTop: 4 }}>County: {marcusProfile.countyShort}</Body>
            <Body style={{ marginTop: 4 }}>
              Cash on hand: ${String(session.formAnswers.cash_and_bank ?? marcusAnswers.cash_and_bank)}
            </Body>
          </View>
          {FAKE_LINES.map((w, i) => (
            <View key={i} style={[styles.line, { width: `${w}%` }]} />
          ))}
          <View style={styles.sig}>
            <Body muted>Signature</Body>
            {session.signaturePaths.length > 0 ? (
              <Body style={{ marginTop: 8, color: colors.green }}>Signed on device</Body>
            ) : (
              <Body muted style={{ marginTop: 8 }}>
                Not signed yet
              </Body>
            )}
          </View>
          <Body muted style={{ marginTop: 16 }}>
            Social Security number fields stay blank. We never collect an SSN.
          </Body>
        </View>
      </ScrollView>
      <Tiny>Page 1 of 9 · Demo only — nothing has been sent</Tiny>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: '#E9E3D8',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    minHeight: 520,
  },
  page: {
    backgroundColor: colors.white,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  box: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 10,
  },
  line: {
    height: 8,
    borderRadius: 2,
    backgroundColor: '#E6E1D8',
    marginTop: 10,
  },
  sig: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#999',
    paddingTop: 6,
  },
});
