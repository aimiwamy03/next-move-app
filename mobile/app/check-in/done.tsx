import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Cairn } from '@/components/Art';
import { Body, H1, MainButton, Screen, Spacer } from '@/components/ui';
import { useAppStore } from '@/store/AppStore';

export default function CheckInDone() {
  const router = useRouter();
  const { session, patch } = useAppStore();

  return (
    <Screen>
      <Spacer max={48} />
      <View style={{ alignSelf: 'center' }}>
        <Cairn width={150} stones={4} sparkle />
      </View>
      <H1 style={{ textAlign: 'center', marginTop: 24 }}>A new stone for today.</H1>
      <Body muted center style={{ marginTop: 8 }}>
        Thanks for checking in, {session.firstName}.
      </Body>
      <Spacer />
      <MainButton
        label="Small steps for today"
        onPress={() => {
          patch({ isFirstDay: false });
          router.replace('/(tabs)/apply');
        }}
      />
    </Screen>
  );
}
