import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, HindSiliguri_400Regular, HindSiliguri_700Bold } from '@expo-google-fonts/hind-siliguri';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { colors } from '../theme/tokens';

// Keep the splash screen up until fonts are ready.
SplashScreen.preventAutoHideAsync();

// Root layout: loads fonts, then shows all screens with no default header.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HindSiliguri_400Regular,
    HindSiliguri_700Bold,
    Inter_400Regular,
    Inter_700Bold,
  });

  // Hide the splash screen once fonts have loaded.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgApp },
        animation: 'slide_from_right',
      }}
    />
  );
}
