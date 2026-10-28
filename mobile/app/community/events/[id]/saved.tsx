import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cairn } from '@/components/Art';
import {
  Body,
  H1,
  MainButton,
  NavRow,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { events } from '@/mock/data';

export default function EventSaved() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = events.find((e) => e.id === id) ?? events[0];

  return (
    <Screen>
      <NavRow right={<TextLink label="Close" onPress={() => router.replace('/community')} />} />
      <Spacer />
      <View style={{ alignSelf: 'center' }}>
        <Cairn width={120} stones={3} sparkle />
      </View>
      <H1 style={{ textAlign: 'center', marginTop: 24 }}>You're on the list.</H1>
      <Body muted center style={{ marginTop: 8 }}>
        {event.title}.{'\n'}
        {event.when}.
      </Body>
      <Spacer />
      <MainButton
        centered
        showArrow={false}
        label="Back to community"
        onPress={() => router.replace('/community')}
      />
    </Screen>
  );
}
