import { Redirect } from 'expo-router';

/** Phone entry now lives on /welcome. Keep this route for old links. */
export default function SignInIndex() {
  return <Redirect href="/welcome" />;
}
