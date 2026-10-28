import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BackButton,
  Body,
  Eyebrow,
  H1,
  ListRow,
  NavRow,
  Screen,
} from '@/components/ui';
import { marcusProfile } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';

export default function IdentityScreen() {
  const router = useRouter();
  const { session } = useAppStore();

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 12 }}>Identity</Eyebrow>
      <H1 style={{ marginTop: 6 }}>Who you are</H1>

      <Body muted style={{ marginTop: 28 }}>
        Name
      </Body>
      <Body style={{ marginTop: 4 }}>{session.firstName || marcusProfile.firstName}</Body>

      <Body muted style={{ marginTop: 20 }}>
        Phone
      </Body>
      <Body style={{ marginTop: 4 }}>{marcusProfile.phoneDisplay}</Body>

      <Body muted style={{ marginTop: 20 }}>
        Born
      </Body>
      <Body style={{ marginTop: 4 }}>Jan 9, 1988</Body>

      <Body muted style={{ marginTop: 20 }}>
        County
      </Body>
      <Body style={{ marginTop: 4 }}>{marcusProfile.county}</Body>

      <View style={{ marginTop: 32 }}>
        <ListRow
          label="Change what we call you"
          onPress={() => router.push('/onboarding/name')}
          last
        />
      </View>
    </Screen>
  );
}
