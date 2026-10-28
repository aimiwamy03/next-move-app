import React from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  MainButton,
  NavRow,
  ProgressSegments,
  Screen,
  Spacer,
  TextLink,
  Tiny,
} from '@/components/ui';
import { expectSteps } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { HOTLINE, HOTLINE_DISPLAY, colors } from '@/theme/tokens';
import { telUrl } from '@/lib/phone';

function StepIcon({ kind }: { kind: (typeof expectSteps)[number]['icon'] }) {
  const stroke = colors.green;
  if (kind === 'clock') {
    return (
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={1.8} />
        <Path d="M12 7v5l3 2" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  if (kind === 'msg') {
    return (
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <Path d="M4 5h16v11H9l-5 4z" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    );
  }
  if (kind === 'send') {
    return (
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <Path d="M3 11l18-8-8 18-2-8z" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    );
  }
  if (kind === 'hand') {
    return (
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L7 14"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h8l4 4v14H6z" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 13h6M9 17h4" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function ExpectStep() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const step = Math.min(5, Math.max(1, Number(stepParam) || 1));
  const data = expectSteps[step - 1];
  const { patch } = useAppStore();
  const last = step === 5;

  const callNow = () => {
    patch({ applyProgress: 'on_call' });
    Linking.openURL(telUrl(HOTLINE)).catch(() => {});
    router.push('/apply/call');
  };

  return (
    <Screen>
      <NavRow
        left={<BackButton onPress={() => (step === 1 ? safeBack(router) : router.push(`/apply/expect/${step - 1}`))} />}
        right={<TextLink label="Skip" onPress={callNow} />}
      />
      <ProgressSegments current={step} />
      <Spacer />
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 20,
          backgroundColor: colors.sage,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        }}
      >
        <StepIcon kind={data.icon} />
      </View>
      <Eyebrow style={{ textAlign: 'center', marginTop: 28 }}>Step {step} of 5</Eyebrow>
      <H1 style={{ textAlign: 'center', marginTop: 8 }}>{data.title}</H1>
      <Body muted center style={{ marginTop: 10 }}>
        {data.body}
      </Body>
      <Spacer />
      {last ? (
        <>
          <MainButton warm centered showArrow={false} label="Call now" onPress={callNow} />
          <Tiny>{HOTLINE_DISPLAY}. Free to call.</Tiny>
        </>
      ) : (
        <>
          <MainButton
            label="Continue"
            onPress={() => {
              patch({ applyProgress: 'expecting' });
              router.push(`/apply/expect/${step + 1}`);
            }}
          />
          <Tiny>What to expect on the call.</Tiny>
        </>
      )}
    </Screen>
  );
}
