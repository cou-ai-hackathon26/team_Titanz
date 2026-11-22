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

// The four bottom-nav tabs, left to right.
export type TabPath = '/home' | '/forecast' | '/history' | '/check';
const TAB_ORDER: TabPath[] = ['/home', '/forecast', '/history', '/check'];

// Name of the tab screen that should slide in from the LEFT on its next opening (null = from the right).
let slideFromLeft: string | null = null;

// Which slide a screen uses: a tab to the left of the current one comes in from the left, everything else from the right.
export function screenAnimation(routeName: string): 'slide_from_left' | 'slide_from_right' {
  return routeName === slideFromLeft ? 'slide_from_left' : 'slide_from_right';
}

// Opens a bottom-nav tab. Home always stays underneath, so the back button goes to Home.
export function openTab(from: TabPath, to: TabPath) {
  if (to === from) return;
  if (to === '/home') {
    router.dismissTo('/home'); // go back down to Home (slides from the left, like going back)
    return;
  }
  slideFromLeft = TAB_ORDER.indexOf(to) < TAB_ORDER.indexOf(from) ? to.slice(1) : null;
  setTimeout(() => (slideFromLeft = null), 700); // after the slide, going back to Home looks normal again
  if (from !== '/home') router.dismissTo('/home'); // keep only Home underneath the new tab
  router.push(to);
}
