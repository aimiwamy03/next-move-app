import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Cairn, Sprig, Sun } from '@/components/Art';
import { BfpMessageSheet } from '@/components/BfpMessageSheet';
import {
  Avatar,
  Body,
  Card,
  Eyebrow,
  H1,
  H2,
  ListRow,
  MainButton,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { CheckInTracker } from '@/components/home/CheckInTracker';
import { DailyQuestionsBlock } from '@/components/home/DailyQuestions';
import { DEMO_TODAY_KEY, demoWeekDays, toDateKey } from '@/lib/demoDate';
import { recommendSteps } from '@/lib/recommendSteps';
import { openStep } from '@/lib/stepNav';
import { bfpHelper } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { colors } from '@/theme/tokens';

function weekCheckInCount(doneDates: string[], todayDone: boolean) {
  const done = new Set(doneDates);
  if (todayDone) done.add(DEMO_TODAY_KEY);
  return demoWeekDays().filter((d) => done.has(toDateKey(d))).length;
}

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}.`;
  if (h < 17) return `Midday, ${name}.`;
  return `Good evening, ${name}.`;
}

function Top({ initials }: { initials: string }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Pressable
        onPress={() => router.push('/(tabs)/me')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
      >
        <Avatar initials={initials} size={40} />
      </Pressable>
    </View>
  );
}

export function HomeB() {
  const router = useRouter();
  const { session } = useAppStore();
  const next =
    session.applyProgress === 'sent'
      ? {
          title: 'Read for 6 minutes.',
          body: 'A short evening read.',
          cta: 'Start',
          href: '/reading' as const,
        }
      : session.checkInDoneToday || !session.isFirstDay
        ? {
            title: 'Sign your CalFresh form.',
            body: 'About 3 minutes of practice. Nothing is sent.',
            cta: 'Start',
            href: '/apply/sign' as const,
          }
        : {
            title: 'Check in for today.',
            body: 'One calm breath. Then easy Yes or No.',
            cta: 'Start',
            href: '/check-in' as const,
          };

  return (
    <Screen withTabPad>
      <Top initials={session.firstName.slice(0, 1).toUpperCase() || 'M'} />
      <Eyebrow style={{ marginTop: 18 }}>Day {session.dayHome} home</Eyebrow>
      <H1 style={{ marginTop: 6 }}>{greeting(session.firstName)}</H1>
      <Spacer />
      <View style={{ alignItems: 'center' }}>
        <Sun />
      </View>
      <Eyebrow style={{ textAlign: 'center', marginTop: 18 }}>Your next thing</Eyebrow>
      <H1 hero style={{ textAlign: 'center', marginTop: 8 }}>
        {next.title}
      </H1>
      <Body muted center style={{ marginTop: 8 }}>
        {next.body}
      </Body>
      <Spacer />
      <MainButton warm label={next.cta} onPress={() => router.push(next.href)} />
      <TextLink
        label="See everything else"
        onPress={() => router.push('/(tabs)/help')}
        style={{ marginTop: 6 }}
      />
    </Screen>
  );
}

export function HomeA() {
  const router = useRouter();
  const { session } = useAppStore();
  return (
    <Screen withTabPad style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }}>
        <Top initials={session.firstName.slice(0, 1).toUpperCase() || 'M'} />
        <Eyebrow style={{ marginTop: 18 }}>Day {session.dayHome} home</Eyebrow>
        <H1 style={{ marginTop: 6 }}>{greeting(session.firstName)}</H1>
        <Card tint style={{ marginTop: 28, padding: 22, gap: 14 }}>
          <H2>Check in</H2>
          <Body muted style={{ marginTop: -8 }}>
            One calm breath with sound. Then easy Yes or No.
          </Body>
          <MainButton
            label="Start with a breath"
            onPress={() => router.push('/check-in')}
            style={{ height: 56 }}
          />
        </Card>
        <ListRow
          label="Apply for CalFresh"
          meta="10 min"
          onPress={() => router.push('/(tabs)/apply')}
        />
        <DailyQuestionsBlock />
        <ListRow label="Read for 6 minutes" onPress={() => router.push('/reading')} last />
      </ScrollView>
    </Screen>
  );
}

export function HomeC() {
  const router = useRouter();
  const { session } = useAppStore();
  const moments = [
    { when: 'Morning', title: 'Check in', state: session.checkInDoneToday ? 'done' : 'now' },
    {
      when: 'Midday',
      title: 'Sign your form',
      state: session.checkInDoneToday
        ? session.applyProgress === 'sent'
          ? 'done'
          : 'now'
        : 'later',
    },
    { when: 'Evening', title: 'Read for 6 minutes', state: 'later' },
  ] as const;

  return (
    <Screen withTabPad>
      <Top initials={session.firstName.slice(0, 1).toUpperCase() || 'M'} />
      <Eyebrow style={{ marginTop: 18 }}>Day {session.dayHome} home</Eyebrow>
      <H1 style={{ marginTop: 6 }}>{greeting(session.firstName)}</H1>
      <View style={{ alignSelf: 'center', marginTop: 26 }}>
        <Cairn width={110} stones={Math.max(1, session.stonesToday || 1)} top={colors.terracotta} />
      </View>
      <Body muted center style={{ marginTop: 8 }}>
        {session.stonesToday || 0} stone{(session.stonesToday || 0) === 1 ? '' : 's'} so far today.
      </Body>
      <View style={{ marginTop: 18 }}>
        {moments.map((m, i) => (
          <View
            key={m.when}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingVertical: 16,
              borderBottomWidth: i < moments.length - 1 ? 1 : 0,
              borderBottomColor: colors.line,
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor:
                  m.state === 'done' ? colors.green : m.state === 'now' ? colors.terracotta : colors.track,
              }}
            />
            <View style={{ flex: 1 }}>
              <Body muted>{m.when}</Body>
              <Body
                style={{
                  fontSize: 20,
                  fontFamily: 'DMSans_500Medium',
                  textDecorationLine: m.state === 'done' ? 'line-through' : 'none',
                  color: m.state === 'done' ? '#8B867B' : colors.ink,
                  borderBottomWidth: m.state === 'now' ? 2 : 0,
                  borderBottomColor: colors.terracotta,
                  alignSelf: 'flex-start',
                }}
              >
                {m.title}
              </Body>
            </View>
          </View>
        ))}
      </View>
      <Spacer />
      <MainButton
        label="Start midday"
        onPress={() =>
          router.push(session.checkInDoneToday ? '/apply/sign' : '/check-in')
        }
      />
    </Screen>
  );
}

function MessageBfpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Ask for Help"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        maxWidth: 160,
      }}
    >
      <Body
        style={{
          fontFamily: 'DMSans_500Medium',
          fontSize: 15,
          color: colors.green,
          textAlign: 'right',
          flexShrink: 1,
        }}
      >
        Ask for Help
      </Body>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.green,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5Z"
            stroke={colors.white}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

export function HomeD() {
  const router = useRouter();
  const { session } = useAppStore();
  const done = session.checkInDoneToday;
  const daysComplete = weekCheckInCount(session.checkInDaysDone ?? [], done);
  const [growKey, setGrowKey] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);

  const nextStep = useMemo(() => {
    if (!done) return null;
    const { suggested } = recommendSteps(session.checkInAnswers ?? {}, {
      hasSSCard: session.hasSSCard,
      hasBankCard: session.hasBankCard,
      applyProgress: session.applyProgress,
      appliedJobIds: session.appliedJobIds,
    });
    return suggested[0] ?? null;
  }, [done, session]);

  useFocusEffect(
    React.useCallback(() => {
      setGrowKey((k) => k + 1);
    }, []),
  );

  return (
    <Screen withTabPad>
      <View
        style={{
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Eyebrow>Day {session.dayHome} home</Eyebrow>
          <H1 style={{ marginTop: 6 }}>{greeting(session.firstName)}</H1>
        </View>
        <MessageBfpButton onPress={() => setMessageOpen(true)} />
      </View>

      <Card tint style={{ marginTop: 28, padding: 22, gap: 14 }}>
        <H2>Check in</H2>
        <Body muted>
          {done ? 'You already checked in today.' : 'One breath, then 5 short questions.'}
        </Body>
        <MainButton
          label={done ? 'Done for today' : 'Start'}
          onPress={() => router.push('/check-in')}
          disabled={done}
          style={{ height: 56 }}
        />
      </Card>

      <Card style={{ marginTop: 14, padding: 22, gap: 10 }}>
        <Eyebrow>Your BFP helper</Eyebrow>
        <H2 style={{ marginTop: 2 }}>{bfpHelper.name}</H2>
        <Body muted>
          {bfpHelper.role}. Always here if you need a person — tap to check in with them.
        </Body>
        <MainButton
          label="Talk to your helper"
          onPress={() => router.push('/apply/helper')}
          style={{ height: 56, marginTop: 4 }}
        />
      </Card>

      {done && nextStep ? (
        <Card style={{ marginTop: 14, padding: 22, gap: 12 }}>
          <Eyebrow>Suggested next</Eyebrow>
          <H2 style={{ marginTop: 2 }}>{nextStep.title}</H2>
          <Body muted>From today’s check-in.</Body>
          <MainButton
            warm
            label={nextStep.cta}
            onPress={() => openStep(router, nextStep, session.applyProgress)}
            style={{ height: 56 }}
          />
        </Card>
      ) : null}
      <CheckInTracker doneDates={session.checkInDaysDone ?? []} todayDone={done} />
      <Spacer />
      <View style={{ alignSelf: 'center', marginBottom: 20 }}>
        <Sprig daysComplete={daysComplete} growKey={growKey} />
      </View>

      <BfpMessageSheet visible={messageOpen} onClose={() => setMessageOpen(false)} />
    </Screen>
  );
}

export function HomeFirstDay() {
  const router = useRouter();
  const { session } = useAppStore();
  return (
    <Screen withTabPad style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }}>
        <Top initials={session.firstName.slice(0, 1).toUpperCase() || 'M'} />
        <Eyebrow style={{ marginTop: 18 }}>Day 1 home</Eyebrow>
        <H1 style={{ marginTop: 6 }}>Welcome home, {session.firstName}.</H1>
        <Body muted style={{ marginTop: 8 }}>
          Today, just one small thing.
        </Body>
        <Card tint style={{ marginTop: 28, padding: 22, gap: 14 }}>
          <Body muted>Your first stone is waiting.</Body>
          <H2>Check in</H2>
          <Body muted>One breath with calm sound. Then big Yes or No.</Body>
          <MainButton label="Start" onPress={() => router.push('/check-in')} />
        </Card>
        <ListRow
          label="Apply for CalFresh"
          meta="10 min"
          onPress={() => router.push('/(tabs)/apply')}
        />
        <DailyQuestionsBlock />
      </ScrollView>
    </Screen>
  );
}
