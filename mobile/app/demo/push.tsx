import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { Body, H1, Screen, TextLink } from '@/components/ui';
import { colors, type } from '@/theme/tokens';

export default function PushBannerDemo() {
  const router = useRouter();

  return (
    <Screen>
      <TextLink label="Close" onPress={() => safeBack(router)} />
      <View style={styles.banner}>
        <Body style={{ fontFamily: type.bodyMedium.fontFamily, color: colors.green }}>
          Next Move
        </Body>
        <H1 style={{ fontSize: 22, marginTop: 4 }}>Your next thing is ready</H1>
        <Body muted style={{ marginTop: 4 }}>
          Open when you have a quiet minute.
        </Body>
      </View>
      <Body muted center style={{ marginTop: 24 }}>
        Demo only. Not a real push notification.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 80,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardLine,
    padding: 18,
  },
});
