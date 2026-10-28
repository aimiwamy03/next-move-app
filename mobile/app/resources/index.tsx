import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BackButton,
  Body,
  Eyebrow,
  Field,
  H1,
  MainButton,
  NavRow,
  Screen,
  TextLink,
  Tiny,
} from '@/components/ui';
import {
  IconBenefits,
  IconChevron,
  IconFood,
  IconHealth,
  IconHome,
  IconId,
  IconOfficer,
} from '@/components/ResourceIcons';
import { resources } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { HOTLINE, colors, radius, type } from '@/theme/tokens';
import { telUrl } from '@/lib/phone';

const ICONS: Record<string, React.ReactNode> = {
  food: <IconFood />,
  housing: <IconHome />,
  id: <IconId />,
  benefits: <IconBenefits />,
  health: <IconHealth />,
  officer: <IconOfficer />,
};

export default function Resources() {
  const router = useRouter();
  const { session, patch } = useAppStore();
  const [editingZip, setEditingZip] = useState(false);
  const [draftZip, setDraftZip] = useState(session.zipCode || '94607');

  const saveZip = () => {
    const cleaned = draftZip.replace(/\D/g, '').slice(0, 5);
    if (cleaned.length === 5) {
      patch({ zipCode: cleaned });
      setDraftZip(cleaned);
      setEditingZip(false);
    }
  };

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <Eyebrow style={{ marginTop: 12 }}>Resources</Eyebrow>
      <H1 style={{ marginTop: 6 }}>What do you need today?</H1>

      {editingZip ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Body muted>Confirm or change your ZIP</Body>
          <Field
            value={draftZip}
            onChangeText={setDraftZip}
            keyboardType="number-pad"
            maxLength={5}
            placeholder="94607"
            accessibilityLabel="ZIP code"
          />
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <TextLink label="Save ZIP" onPress={saveZip} />
            <TextLink
              label="Cancel"
              onPress={() => {
                setDraftZip(session.zipCode || '94607');
                setEditingZip(false);
              }}
            />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setDraftZip(session.zipCode || '94607');
            setEditingZip(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Near ${session.zipCode}. Tap to change ZIP`}
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
        >
          <Body muted>
            Near {session.zipCode || '94607'} · Tap to confirm or change
          </Body>
        </Pressable>
      )}

      <ScrollView
        style={{ flex: 1, marginTop: 24 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {resources.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => {
              if (r.id === 'food') router.push('/resources/food');
              else router.push(`/resources/${r.id}` as '/resources/food');
            }}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel={r.title}
          >
            <View style={styles.iconBox}>{ICONS[r.id]}</View>
            <View style={styles.copy}>
              <Text style={styles.title}>{r.title}</Text>
              <Text style={styles.sub}>{r.subtitle}</Text>
            </View>
            <IconChevron />
          </Pressable>
        ))}

        <MainButton
          centered
          showArrow={false}
          label="Not sure? Call a person now"
          onPress={() => Linking.openURL(telUrl(HOTLINE))}
          style={{ marginTop: 16, marginBottom: 4 }}
        />
        <Tiny>
          Opens your phone and dials now. If nobody answers, leave a short
          message with your name and number, or try again during daytime hours.
        </Tiny>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    fontFamily: type.optionTitle.fontFamily,
    fontSize: 20,
    color: colors.ink,
  },
  sub: {
    ...type.bodyMuted,
    marginTop: 2,
  },
});
