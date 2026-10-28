import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Body,
  Card,
  Eyebrow,
  H2,
  MainButton,
  Option,
} from '@/components/ui';
import { dailyQuestions } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';

/** One check-in question at a time on home. */
export function DailyQuestionsBlock() {
  const { session, setCheckInAnswer, finishCheckIn } = useAppStore();
  const next = dailyQuestions.find((q) => !(q.id in session.checkInAnswers));
  const [selected, setSelected] = useState<string[]>([]);

  if (!next) {
    return (
      <View style={{ marginTop: 22 }}>
        <Eyebrow>Today's check in</Eyebrow>
        <Body style={{ marginTop: 12, color: '#35493B' }}>
          All done for today. Thank you.
        </Body>
      </View>
    );
  }

  const toggle = (title: string) => {
    if (next.multi) {
      setSelected((prev) =>
        prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
      );
    } else {
      setSelected([title]);
    }
  };

  const save = () => {
    if (!next.multi && selected.length === 0) return;
    setCheckInAnswer(next.id, selected);
    const answeredIds = new Set([
      ...Object.keys(session.checkInAnswers).map(Number),
      next.id,
    ]);
    if (dailyQuestions.every((q) => answeredIds.has(q.id))) {
      finishCheckIn();
    }
    setSelected([]);
  };

  const canContinue = next.multi || selected.length > 0;

  return (
    <View style={{ marginTop: 22 }}>
      <Eyebrow>
        Today's question · {next.id} of {dailyQuestions.length}
      </Eyebrow>
      <Card style={{ marginTop: 12, padding: 22 }}>
        <H2>{next.question}</H2>
        <Body muted style={{ marginTop: 8 }}>
          {next.subtitle}
        </Body>
        <View style={{ gap: 12, marginTop: 20 }}>
          {next.options.map((opt) => (
            <Option
              key={opt.title}
              title={opt.title}
              subtitle={opt.subtitle || undefined}
              selected={selected.includes(opt.title)}
              onPress={() => toggle(opt.title)}
            />
          ))}
        </View>
        <MainButton
          label={next.id === dailyQuestions.length ? 'Finish' : 'Continue'}
          onPress={save}
          disabled={!canContinue}
          style={{ marginTop: 18 }}
        />
      </Card>
    </View>
  );
}
