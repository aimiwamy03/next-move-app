import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  MainButton,
  NavRow,
  Option,
  ProgressSegments,
  Screen,
  Spacer,
  Tiny,
} from '@/components/ui';
import { dailyQuestions } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';

export default function CheckInStep() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const step = Math.min(dailyQuestions.length, Math.max(1, Number(stepParam) || 1));
  const q = dailyQuestions[step - 1];
  const { session, setCheckInAnswer, finishCheckIn } = useAppStore();
  const [selected, setSelected] = useState<string[]>(session.checkInAnswers[step] ?? []);
  const advancing = useRef(false);

  useEffect(() => {
    advancing.current = false;
    setSelected(session.checkInAnswers[step] ?? []);
  }, [step, session.checkInAnswers]);

  const goNext = (answers: string[]) => {
    setCheckInAnswer(step, answers);
    if (step >= dailyQuestions.length) {
      finishCheckIn();
      router.replace('/check-in/done');
      return;
    }
    router.push(`/check-in/${step + 1}`);
  };

  const isLast = step >= dailyQuestions.length;
  /** Auto-advance on tap for early single-choice questions only — not the call-me step. */
  const autoAdvance = !q.multi && !isLast;

  const onPick = (title: string) => {
    if (q.multi) {
      setSelected((prev) =>
        prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
      );
      return;
    }
    setSelected([title]);
    if (!autoAdvance) return;
    if (advancing.current) return;
    advancing.current = true;
    setTimeout(() => goNext([title]), 220);
  };

  return (
    <Screen>
      <NavRow
        left={
          <BackButton
            onPress={() => (step === 1 ? safeBack(router) : router.push(`/check-in/${step - 1}`))}
          />
        }
      />
      <ProgressSegments total={dailyQuestions.length} current={step} />
      <Spacer max={q.options.length < 4 ? 70 : 40} />
      <Eyebrow>
        {step} of {dailyQuestions.length}. Check in
      </Eyebrow>
      <H1 style={{ marginTop: 10 }}>{q.question}</H1>
      <Body muted style={{ marginTop: 10 }}>
        {q.subtitle}
      </Body>
      <View style={{ gap: 12, marginTop: q.options.length < 4 ? 36 : 28 }}>
        {q.options.map((opt) => (
          <Option
            key={opt.title}
            title={opt.title}
            subtitle={opt.subtitle || undefined}
            selected={selected.includes(opt.title)}
            onPress={() => onPick(opt.title)}
          />
        ))}
      </View>
      <Spacer />
      {!autoAdvance ? (
        <MainButton
          label={isLast ? 'Finish check in' : 'Continue'}
          onPress={() => goNext(selected)}
          disabled={!q.multi && selected.length === 0}
        />
      ) : null}
      {q.tiny ? <Tiny>{q.tiny}</Tiny> : null}
    </Screen>
  );
}
