import React from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { colors } from '@/theme/tokens';

const promises = [
  { title: 'We keep only what your forms need.' },
  { title: 'Call answers clear after 7 days.' },
  { title: 'We never ask for your Social Security number.' },
];

export default function OnboardingPrivacy() {
  const router = useRouter();

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 20 }}>Our promise</Eyebrow>
      <H1 style={{ marginTop: 8 }}>Your story stays yours.</H1>
      <View style={{ marginTop: 28, gap: 18 }}>
        {promises.map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.sage,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke={colors.green}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Body style={{ flex: 1, paddingTop: 10 }}>{p.title}</Body>
          </View>
        ))}
      </View>
      <Spacer />
      <MainButton label="Sounds good" onPress={() => router.push('/onboarding/reminders')} />
      <TextLink
        label="Read the full privacy notes"
        onPress={() => router.push('/me/privacy')}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}
