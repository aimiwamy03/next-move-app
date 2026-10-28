import React from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Body,
  H1,
  MainButton,
  Screen,
  SecondaryButton,
  Spacer,
  Tiny,
} from '@/components/ui';
import { useAppStore } from '@/store/AppStore';
import { HOTLINE, colors } from '@/theme/tokens';
import { telUrl } from '@/lib/phone';

export default function Offline() {
  const router = useRouter();
  const { online, session } = useAppStore();

  const tryAgain = () => {
    if (online) {
      router.replace(session.onboarded ? '/(tabs)/home' : '/welcome');
    }
  };

  return (
    <Screen>
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
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
          <Path
            d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0"
            stroke={colors.green}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path d="M3 3l18 18" stroke={colors.green} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      </View>
      <H1 style={{ textAlign: 'center', marginTop: 26 }}>No internet right now.</H1>
      <Body muted center style={{ marginTop: 10 }}>
        Your answers are saved on this phone. We'll send them when you're back online.
      </Body>
      <Spacer />
      <MainButton centered showArrow={false} label="Try again" onPress={tryAgain} />
      <SecondaryButton
        warm
        label="Call the line instead"
        onPress={() => Linking.openURL(telUrl(HOTLINE))}
        style={{ marginTop: 12 }}
      />
      <Tiny>A phone call works without internet.</Tiny>
    </Screen>
  );
}
