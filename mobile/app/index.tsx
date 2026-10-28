import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/AppStore';

export default function Index() {
  const { session, online } = useAppStore();

  if (!online) return <Redirect href="/offline" />;
  if (!session.signedIn || !session.onboarded) return <Redirect href="/welcome" />;
  return <Redirect href="/(tabs)/home" />;
}
