import { Href } from 'expo-router';

type BackRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

/** Go back if possible; otherwise land on a safe screen (avoids GO_BACK warnings). */
export function safeBack(router: BackRouter, fallback: Href = '/(tabs)/home') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
