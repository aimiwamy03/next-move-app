import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Lora_500Medium } from '@expo-google-fonts/lora';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { PhoneFrame } from '@/components/PhoneFrame';
import { AppStoreProvider, useAppStore } from '@/store/AppStore';
import { colors } from '@/theme/tokens';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const root = segments[0] as string | undefined;
    const publicRoots = new Set([
      'welcome',
      'sign-in',
      'onboarding',
      'offline',
      'demo',
      'breathe',
      undefined,
    ]);

    if (!session.signedIn) {
      if (!publicRoots.has(root) && root !== 'index') {
        router.replace('/welcome');
      }
      return;
    }

    if (session.signedIn && !session.onboarded) {
      if (root !== 'onboarding' && root !== 'me') {
        router.replace('/onboarding/name');
      }
    }
  }, [ready, session.signedIn, session.onboarded, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  // Web never blocks on fonts — show UI immediately, fonts swap in when loaded.
  const fontsReady = Platform.OS === 'web' || fontsLoaded || !!fontError;

  return (
    <PhoneFrame>
      {!fontsReady ? (
        <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : (
        <GestureHandlerRootView style={{ flex: 1, width: '100%', height: '100%' }}>
          <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
            <AppStoreProvider>
              <AuthGate>
                <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: colors.cream }}>
                  <StatusBar style="dark" />
                  <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { flex: 1, backgroundColor: colors.cream } }} />
                </View>
              </AuthGate>
            </AppStoreProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      )}
    </PhoneFrame>
  );
}
