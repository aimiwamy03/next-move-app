import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Avatar,
  BackButton,
  Body,
  Card,
  H1,
  NavRow,
  Screen,
  Spacer,
  TextLink,
} from '@/components/ui';
import { announcements } from '@/mock/data';
import { colors, type } from '@/theme/tokens';

function Heart({ filled, size = 22 }: { filled: boolean; size?: number }) {
  const stroke = filled ? colors.terracotta : colors.muted;
  const fill = filled ? colors.terracotta : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 7.5a3.9 3.9 0 0 1 7 3.3C19 15.6 12 20 12 20z"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
}

export default function CommunityAnnouncements() {
  const router = useRouter();
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <Screen>
      <NavRow left={<BackButton />} />
      <H1 style={{ marginTop: 8 }}>Community</H1>
      <View style={{ flexDirection: 'row', gap: 28, marginTop: 8 }}>
        <TextLink label="Events" onPress={() => router.replace('/community')} />
        <Body
          style={{
            fontFamily: type.bodyMedium.fontFamily,
            fontSize: 18,
            borderBottomWidth: 2,
            borderBottomColor: colors.terracotta,
            paddingBottom: 6,
          }}
        >
          Announcements
        </Body>
      </View>
      <Spacer max={16} />
      {announcements.map((a) => {
        const isLiked = !!liked[a.id];
        const count = a.thanks + (isLiked ? 1 : 0);
        return (
          <Card key={a.id} style={{ padding: 18, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Avatar initials={a.initials} size={44} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: type.bodyMedium.fontFamily }}>{a.author}</Body>
                <Body muted>{a.when}</Body>
              </View>
            </View>
            <Body style={{ marginTop: 12 }}>{a.body}</Body>
            <Pressable
              onPress={() => setLiked((s) => ({ ...s, [a.id]: !s[a.id] }))}
              style={styles.likeRow}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              hitSlop={8}
            >
              <Heart filled={isLiked} />
              <Text style={[styles.likeCount, isLiked && styles.likeCountOn]}>{count}</Text>
            </Pressable>
          </Card>
        );
      })}
      <Spacer />
      <TextLink label="Ask a question" onPress={() => router.push('/apply/helper')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  likeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontFamily: type.body.fontFamily,
    fontSize: 17,
    color: colors.muted,
  },
  likeCountOn: {
    color: colors.terracottaText,
    fontFamily: type.bodyMedium.fontFamily,
  },
});
