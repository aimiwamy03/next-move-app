import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  NavRow,
  Screen,
  Tiny,
} from '@/components/ui';
import { Celebration } from '@/components/Celebration';
import { dummyJobs } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { colors, radius, type } from '@/theme/tokens';

export default function EmploymentJobs() {
  const router = useRouter();
  const { session, applyToJob } = useAppStore();
  const [party, setParty] = React.useState(false);

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 12 }}>Employment · Sample list</Eyebrow>
      <H1 style={{ marginTop: 6 }}>Openings near you</H1>
      <Body muted style={{ marginTop: 8 }}>
        Sample jobs for the demo — not live postings. Company, pay, and place
        are shown so you can practice reading an opening.
      </Body>

      <View style={{ marginTop: 22, gap: 12 }}>
        {dummyJobs.map((job) => {
          const practiced = session.appliedJobIds.includes(job.id);
          return (
            <View key={job.id} style={[styles.card, practiced && styles.cardDone]}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.meta}>{job.company}</Text>
              <Text style={styles.meta}>{job.place}</Text>
              <Text style={styles.pay}>
                {job.pay} · {job.when}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => Linking.openURL(job.applyUrl)}
                  style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}
                  accessibilityRole="link"
                >
                  <Text style={styles.linkLabel}>Sample apply link</Text>
                </Pressable>
                <Pressable
                  disabled={practiced}
                  onPress={() => {
                    applyToJob(job.id);
                    setParty(true);
                  }}
                  style={({ pressed }) => [
                    styles.practiceBtn,
                    practiced && styles.practiceDone,
                    pressed && !practiced && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.practiceLabel, practiced && { color: colors.green }]}>
                    {practiced ? 'Practiced' : 'Practice apply'}
                  </Text>
                  {!practiced ? (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 12h14m-6-6 6 6-6 6"
                        stroke={colors.terracottaText}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : null}
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
      <Tiny style={{ marginTop: 12 }}>
        Example links go to placeholder pages. Nothing is submitted for real.
      </Tiny>

      <Celebration
        visible={party}
        title="Practice tap saved."
        body="This was a demo apply — not a real application."
        onDone={() => setParty(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.button,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 16,
    gap: 4,
  },
  cardDone: {
    backgroundColor: colors.sage,
    borderColor: colors.green,
  },
  title: {
    fontFamily: type.optionTitle.fontFamily,
    fontSize: 20,
    color: colors.ink,
  },
  meta: {
    ...type.bodyMuted,
    marginTop: 2,
  },
  pay: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 17,
    color: colors.green,
    marginTop: 6,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  linkBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  linkLabel: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 16,
    color: colors.green,
  },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.button,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  practiceDone: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  practiceLabel: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 16,
    color: colors.terracottaText,
  },
});
