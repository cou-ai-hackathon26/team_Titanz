import { router, Href } from 'expo-router';

// Goes back one screen. If there is no screen to go back to (e.g. the app was opened
// straight on this screen), it opens `fallback` instead, so the back arrow never does nothing.
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

// Clears all screens behind and opens Home, so the phone's back button can't return to
// onboarding or old screens. Home becomes the only screen in the history.
export function goHomeFresh() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/home');
}

// Clears all screens and opens the Welcome screen (used after deleting all data).
export function startOver() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/');
}
