import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  NavRow,
  Screen,
  Spacer,
} from '@/components/ui';
import { IconCall, IconClock, IconPin } from '@/components/ResourceIcons';
import { foodPlaces } from '@/mock/data';
import { colors, radius, sizes, type } from '@/theme/tokens';
import { telUrl } from '@/lib/phone';

export default function ResourceFood() {
  const router = useRouter();
  const place = foodPlaces[0];

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Spacer max={30} />
      <Eyebrow>Food</Eyebrow>
      <H1 style={{ marginTop: 6 }}>{place.name}</H1>
      <Body muted style={{ marginTop: 8 }}>
        {place.note}
      </Body>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <View style={styles.iconBox}>
            <IconClock />
          </View>
          <Body style={styles.factText}>{place.detail}</Body>
        </View>
        <View style={styles.fact}>
          <View style={styles.iconBox}>
            <IconPin />
          </View>
          <Body style={styles.factText}>{place.meta}</Body>
        </View>
      </View>

      <Spacer />

      <Pressable
        onPress={() =>
          Linking.openURL(
            `https://maps.apple.com/?q=${encodeURIComponent(`${place.name} Oakland`)}`,
          )
        }
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <IconPin color={colors.white} />
        <Text style={styles.ctaLabel}>Get directions</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL(telUrl(place.phone))}
        style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <IconCall />
        <Text style={styles.ghostLabel}>Call them</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  facts: { marginTop: 28, gap: 18 },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factText: { flex: 1, paddingTop: 10 },
  cta: {
    height: sizes.mainButton,
    borderRadius: radius.button,
    backgroundColor: colors.terracottaButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: { ...type.button, color: colors.white },
  ghost: {
    marginTop: 12,
    height: sizes.secondaryButton,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ghostLabel: { ...type.button, color: colors.green },
});
