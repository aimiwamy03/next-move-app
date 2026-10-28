import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Body,
  Eyebrow,
  H1,
  NavRow,
  OverwhelmedButton,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { callScriptQuestions } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { colors } from '@/theme/tokens';

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function OnCall() {
  const router = useRouter();
  const { pauseForBreathe, patch } = useAppStore();
  const [seconds, setSeconds] = useState(0);
  const [qIndex, setQIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setQIndex((i) => (i + 1) % callScriptQuestions.length);
    }, 18000);
    return () => clearInterval(t);
  }, []);

  return (
    <Screen>
      <NavRow
        left={<Eyebrow>On the call</Eyebrow>}
        right={
          <Body style={{ fontFamily: 'DMSans_500Medium' }}>{formatTimer(seconds)}</Body>
        }
      />
      <Spacer max={60} />
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.sage,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10c2.5-3 4.5-3 7 0s4.5 3 7 0 2.5-2 4-2"
            stroke={colors.green}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M3 15c2.5-3 4.5-3 7 0s4.5 3 7 0 2.5-2 4-2"
            stroke={colors.green}
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.7}
          />
        </Svg>
      </View>
      <Body muted style={{ marginTop: 22 }}>
        It is asking
      </Body>
      <H1 style={{ marginTop: 6 }}>{callScriptQuestions[qIndex]}</H1>
      <Body muted style={{ marginTop: 12 }}>
        You can say "just me" or "skip."
      </Body>
      <Spacer />
      <OverwhelmedButton
        onPress={() => {
          pauseForBreathe('/apply/call');
          router.push('/breathe');
        }}
      />
      <TextLink
        label="End call"
        onPress={() => {
          patch({ applyProgress: 'ready_to_sign' });
          router.replace('/apply/sign');
        }}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}
