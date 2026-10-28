import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Body,
  Card,
  Eyebrow,
  H1,
  H2,
  MainButton,
  Screen,
} from '@/components/ui';
import { recommendSteps, StepAction } from '@/lib/recommendSteps';
import { openStep } from '@/lib/stepNav';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme/tokens';

function reasonLine(answers: Record<number, string[]>) {
  const weighing = answers[4] ?? [];
  const talk = answers[5]?.[0];
  if (talk === 'Yes, call me') return 'You asked for a person today.';
  if (weighing.includes('Food')) return 'Food came up in your check-in.';
  if (weighing.includes('Housing')) return 'Housing came up in your check-in.';
  if (weighing.includes('Money')) return 'Money came up — openings can help.';
  if (weighing.includes('Parole or probation')) return 'Check-in with your officer matters today.';
  if (weighing.includes('Family')) return 'Family is on your mind.';
  if (answers[1]?.[0] === 'Heavy' || answers[3]?.[0] === 'A little') {
    return 'A small step fits today.';
  }
  return 'Picked from today’s check-in.';
}

export default function ApplyTab() {
  const router = useRouter();
  const { session } = useAppStore();

  const { suggested, more } = useMemo(
    () =>
      recommendSteps(session.checkInAnswers ?? {}, {
        hasSSCard: session.hasSSCard,
        hasBankCard: session.hasBankCard,
        applyProgress: session.applyProgress,
        appliedJobIds: session.appliedJobIds,
      }),
    [session],
  );

  const top = suggested[0];
  const restSuggested = suggested.slice(1);

  const run = (action: StepAction) => {
    openStep(router, action, session.applyProgress);
  };

  return (
    <Screen withTabPad>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Eyebrow style={{ marginTop: 12 }}>Steps</Eyebrow>
        <H1 style={{ marginTop: 6 }}>One thing today.</H1>
        <Body muted style={{ marginTop: 8 }}>
          {reasonLine(session.checkInAnswers ?? {})}
        </Body>

        {top ? (
          <Card tint style={{ marginTop: 22, padding: 20, gap: 12 }}>
            <Eyebrow>Suggested for you</Eyebrow>
            <H2 style={{ marginTop: 2 }}>{top.title}</H2>
            <MainButton
              label={top.done ? 'Review' : top.cta}
              onPress={() => run(top)}
              style={{ height: 56, marginTop: 4 }}
            />
          </Card>
        ) : null}

        {[...restSuggested, ...more].length > 0 ? (
          <Card style={{ marginTop: 22, padding: 16, gap: 0 }}>
            <Body muted style={{ marginBottom: 10 }}>
              Other tasks
            </Body>
            {[...restSuggested, ...more].map((a, i, arr) => (
              <OptionRow
                key={a.id}
                title={a.title}
                cta={a.done ? 'Review' : a.cta}
                done={a.done}
                onPress={() => run(a)}
                last={i === arr.length - 1}
              />
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function OptionRow({
  title,
  cta = 'Start',
  done,
  onPress,
  last,
}: {
  title: string;
  cta?: string;
  done?: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && onPress && { opacity: 0.9 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.title, done && { color: colors.green }]}>{title}</Text>
      <View style={styles.ctaRow}>
        <Text style={[styles.cta, done && { color: colors.green }]}>{cta}</Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12h14m-6-6 6 6-6 6"
            stroke={done ? colors.green : colors.terracottaText}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  title: {
    flex: 1,
    fontFamily: type.optionTitle.fontFamily,
    fontSize: 18,
    color: colors.ink,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cta: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 17,
    color: colors.terracottaText,
  },
});
