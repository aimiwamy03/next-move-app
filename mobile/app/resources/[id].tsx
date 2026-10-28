import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  NavRow,
  Screen,
  Spacer,
  TextLink,
  Tiny,
} from '@/components/ui';
import {
  IconBenefits,
  IconCall,
  IconClock,
  IconHealth,
  IconHome,
  IconId,
  IconOfficer,
  IconPhoneDevice,
  IconPin,
} from '@/components/ResourceIcons';
import { HOTLINE, colors, radius, sizes, type } from '@/theme/tokens';
import { telUrl } from '@/lib/phone';

const DETAILS: Record<
  string,
  {
    eyebrow: string;
    title: string;
    note: string;
    mapsQuery: string;
    rows: { icon: string; text: string }[];
  }
> = {
  housing: {
    eyebrow: 'A place to stay',
    title: 'Oakland Night Shelter',
    note: 'Confirm where you are going tonight, and how you will get there.',
    mapsQuery: 'Oakland Night Shelter 14th Broadway Oakland',
    rows: [
      { icon: 'clock', text: 'Check in from 5pm. Beds are first come.' },
      { icon: 'pin', text: 'Near 14th and Broadway. Ask about longer stays too.' },
    ],
  },
  phone: {
    eyebrow: 'A phone',
    title: 'Free phone signup',
    note: 'Lifeline and other free phone programs.',
    mapsQuery: 'Boundless Freedom Project Oakland',
    rows: [
      { icon: 'clock', text: 'Tuesdays at the BFP office, 10am to 2pm.' },
      { icon: 'phone', text: 'Bring any ID you have. A helper can walk you through it.' },
    ],
  },
  id: {
    eyebrow: 'ID & papers',
    title: 'ID and papers help',
    note: 'State ID, release papers, Social Security card.',
    mapsQuery: 'DMV Oakland California',
    rows: [
      { icon: 'id', text: 'DMV for a state ID or a receipt that you applied.' },
      { icon: 'benefits', text: 'Keep release papers with you — you need them for benefits and check-in.' },
      { icon: 'pin', text: 'Ask a helper about a Social Security card or birth certificate.' },
    ],
  },
  benefits: {
    eyebrow: 'Benefits',
    title: 'Reinstate your benefits',
    note: 'CalFresh, Medi-Cal, and Social Security.',
    mapsQuery: 'Alameda County Social Services Oakland',
    rows: [
      { icon: 'benefits', text: 'Start CalFresh and Medi-Cal with your release papers.' },
      { icon: 'clock', text: 'Social Security: ssa.gov/reentry or 1-800-772-1213.' },
      { icon: 'pin', text: 'Your county reentry office can help with the forms.' },
    ],
  },
  health: {
    eyebrow: 'Health care',
    title: 'Meds and a clinic',
    note: 'Bridge your meds before they run out.',
    mapsQuery: 'community health clinic Oakland',
    rows: [
      { icon: 'health', text: 'Bring any medical records from custody if you have them.' },
      { icon: 'clock', text: 'Request refills before your last dose.' },
      { icon: 'pin', text: 'Ask for a community clinic near Oakland.' },
    ],
  },
  officer: {
    eyebrow: 'Your officer',
    title: 'First check-in',
    note: 'Parole or probation — report when required.',
    mapsQuery: 'Alameda County Probation Oakland',
    rows: [
      { icon: 'officer', text: 'Know their name, office, and your first date and time.' },
      { icon: 'benefits', text: 'Bring your release or discharge papers.' },
      { icon: 'pin', text: 'Ask a helper if you need the address or a ride.' },
    ],
  },
};

function RowIcon({ kind }: { kind: string }) {
  if (kind === 'clock') return <IconClock />;
  if (kind === 'pin') return <IconPin />;
  if (kind === 'phone') return <IconPhoneDevice />;
  if (kind === 'home') return <IconHome />;
  if (kind === 'benefits') return <IconBenefits />;
  if (kind === 'health') return <IconHealth />;
  if (kind === 'officer') return <IconOfficer />;
  return <IconId />;
}

export default function ResourceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = DETAILS[id ?? ''] ?? DETAILS.housing;

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Spacer max={30} />
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <H1 style={{ marginTop: 6 }}>{data.title}</H1>
      <Body muted style={{ marginTop: 8 }}>
        {data.note}
      </Body>

      <View style={styles.facts}>
        {data.rows.map((row) => (
          <View key={row.text} style={styles.fact}>
            <View style={styles.iconBox}>
              <RowIcon kind={row.icon} />
            </View>
            <Body style={styles.factText}>{row.text}</Body>
          </View>
        ))}
      </View>

      <Spacer />

      <Pressable
        onPress={() =>
          Linking.openURL(
            `https://maps.apple.com/?q=${encodeURIComponent(data.mapsQuery)}`,
          )
        }
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <IconPin color={colors.white} />
        <Text style={styles.ctaLabel}>Get directions</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL(telUrl(HOTLINE))}
        style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel="Call a person now"
      >
        <IconCall />
        <Text style={styles.ghostLabel}>Call a person now</Text>
      </Pressable>
      <Tiny style={{ marginTop: 8, textAlign: 'center' }}>
        Dials now on your phone. If nobody answers, leave a short message with
        your name and number, or try again during daytime hours.
      </Tiny>

      <TextLink label="Back to resources" onPress={() => safeBack(router)} style={{ marginTop: 12 }} />
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
