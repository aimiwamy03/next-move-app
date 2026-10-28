import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AnimatedCairn } from '@/components/Art';
import { Avatar, Eyebrow, H1, ListRow, Screen, Spacer } from '@/components/ui';
import { useAppStore } from '@/store/AppStore';

export default function MeTab() {
  const router = useRouter();
  const { session, resetDemoToFirstDay, signOut } = useAppStore();
  const [growKey, setGrowKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setGrowKey((k) => k + 1);
    }, []),
  );

  return (
    <Screen withTabPad>
      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <Avatar initials={session.firstName.slice(0, 1).toUpperCase() || 'M'} size={84} />
        <H1 style={{ marginTop: 16 }}>Hi, {session.firstName}.</H1>
      </View>
      <View style={{ marginTop: 34 }}>
        <ListRow label="Your identity" onPress={() => router.push('/me/identity')} />
        <ListRow label="Privacy" onPress={() => router.push('/me/privacy')} />
        <ListRow
          label="Sign out"
          onPress={() => {
            signOut();
            router.replace('/welcome');
          }}
          last
        />
      </View>
      <Spacer />
      <View style={{ alignSelf: 'center', marginBottom: 8 }}>
        <AnimatedCairn width={140} stones={4} growKey={growKey} />
      </View>
      <Eyebrow style={{ marginTop: 12, textAlign: 'center' }}>Demo controls</Eyebrow>
      <ListRow label="Reset to first day" onPress={resetDemoToFirstDay} last />
    </Screen>
  );
}
