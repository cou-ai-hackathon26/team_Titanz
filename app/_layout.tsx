import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Import each font weight on its own so the app only ships the 8 files we use (not all ~20).
import { HindSiliguri_400Regular } from '@expo-google-fonts/hind-siliguri/400Regular';
import { HindSiliguri_500Medium } from '@expo-google-fonts/hind-siliguri/500Medium';
import { HindSiliguri_600SemiBold } from '@expo-google-fonts/hind-siliguri/600SemiBold';
import { HindSiliguri_700Bold } from '@expo-google-fonts/hind-siliguri/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { colors } from '../theme/tokens';
import { screenAnimation } from '../lib/nav';

// Keep the splash screen up until fonts are ready.
SplashScreen.preventAutoHideAsync();

// Root layout: loads fonts (Bangla, English, icons), then shows all screens with no default header.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    MaterialSymbolsRounded: require('../assets/fonts/MaterialSymbolsRounded.ttf'),
    BanglaDigits_400Regular: require('../assets/fonts/BanglaDigits_400Regular.ttf'),
    BanglaDigits_500Medium: require('../assets/fonts/BanglaDigits_500Medium.ttf'),
    BanglaDigits_600SemiBold: require('../assets/fonts/BanglaDigits_600SemiBold.ttf'),
    BanglaDigits_700Bold: require('../assets/fonts/BanglaDigits_700Bold.ttf'),
  });
  const ready = fontsLoaded || !!fontError; // if a font fails, still open the app with system fonts

  // Hide the splash screen once fonts have loaded (or failed).
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={({ route }) => ({
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgApp },
          animation: screenAnimation(route.name), // tabs to the left slide in from the left
        })}
      />
    </SafeAreaProvider>
  );
}
