import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import {
  Body,
  Eyebrow,
  H1,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { reading } from '@/mock/data';

export default function ReadingSession() {
  const router = useRouter();
  const [left, setLeft] = useState(reading.minutesLeft * 60);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.ceil(left / 60);

  return (
    <Screen>
      <NavRow
        left={<TextLink label="Close" onPress={() => safeBack(router)} />}
        right={<Body muted>{left === 0 ? 'Done' : `${mins} min left`}</Body>}
      />
      <Eyebrow style={{ marginTop: 20 }}>{reading.eyebrow}</Eyebrow>
      <H1 style={{ marginTop: 8 }}>{reading.title}</H1>
      {reading.paragraphs.map((p) => (
        <Body key={p.slice(0, 24)} style={{ marginTop: 18 }}>
          {p}
        </Body>
      ))}
      <Spacer />
      <MainButton label="I'm done reading" onPress={() => router.replace('/(tabs)/home')} />
    </Screen>
  );
}
