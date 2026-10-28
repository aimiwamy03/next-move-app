import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TabBar, TabName } from '@/components/TabBar';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state }) => {
        const routeName = state.routes[state.index]?.name ?? '';
        const active: TabName =
          routeName === 'apply'
            ? 'Apply'
            : routeName === 'breath'
              ? 'Breath'
              : routeName === 'help'
                ? 'Help'
                : routeName === 'me'
                  ? 'Me'
                  : 'Home';
        return (
          <TabBar
            active={active}
            onNavigate={(href) => router.navigate(href as '/(tabs)/home')}
          />
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="apply" />
      <Tabs.Screen name="breath" />
      <Tabs.Screen name="help" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
