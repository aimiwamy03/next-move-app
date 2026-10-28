import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Card,
  Eyebrow,
  H1,
  MainButton,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { events } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme/tokens';

/** Community tab — events + announcements (replaces Resources hub). */
export default function CommunityTab() {
  const router = useRouter();
  const { saveEvent } = useAppStore();

  return (
    <Screen withTabPad>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        <H1 style={{ marginTop: 8 }}>Community</H1>
        <View style={{ flexDirection: 'row', gap: 28, marginTop: 8, alignItems: 'flex-end' }}>
          <Body
            style={{
              fontFamily: type.bodyMedium.fontFamily,
              fontSize: 18,
              borderBottomWidth: 2,
              borderBottomColor: colors.terracotta,
              paddingBottom: 6,
              color: colors.ink,
            }}
          >
            Events
          </Body>
          <TextLink label="Announcements" onPress={() => router.push('/community/announcements')} />
        </View>
        <Spacer max={16} />
        {events.map((e) => (
          <Card key={e.id} style={{ padding: 20, marginBottom: 14 }}>
            <Eyebrow>{e.when}</Eyebrow>
            <Body style={{ ...type.optionTitle, marginTop: 6 }}>{e.title}</Body>
            <Body muted style={{ marginTop: 4 }}>
              {e.place}
            </Body>
            <MainButton
              label="Save my spot"
              onPress={() => {
                saveEvent(e.id);
                router.push(`/community/events/${e.id}/saved`);
              }}
              style={{ marginTop: 16, height: 56 }}
            />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
