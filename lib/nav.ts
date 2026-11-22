import { router, Href } from 'expo-router';

// Goes back one screen. If there is no screen to go back to (e.g. the app was opened
// straight on this screen), it opens `fallback` instead, so the back arrow never does nothing.
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
