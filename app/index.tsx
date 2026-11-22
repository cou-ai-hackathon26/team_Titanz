import { View, StyleSheet } from 'react-native';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Button from '../components/Button';
import { colors, fonts } from '../theme/tokens';

// Screen 00a · Welcome: full mosque photo, app name, title and "Get started" button.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {/* Photo (two layers, exactly as in Figma) */}
      <Image source={require('../assets/onboarding/welcome-photo-1.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
      <Image source={require('../assets/onboarding/welcome-photo-2.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
      {/* Dark shade so the white text is easy to read */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A1A12" stopOpacity={0.35} />
            <Stop offset="0.35" stopColor="#0A1A12" stopOpacity={0.05} />
            <Stop offset="0.62" stopColor="#0A1A12" stopOpacity={0.75} />
            <Stop offset="1" stopColor="#0A1A12" stopOpacity={0.97} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#shade)" />
      </Svg>

      <View style={[styles.top, { marginTop: insets.top + 24 }]}>
        <Text style={styles.appName}>রোজা-সেফ</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(40, insets.bottom + 16) }]}>
        <Text style={styles.title}>রোজা রাখুন{'\n'}নিরাপদে</Text>
        <Text style={styles.subtitle}>ডায়াবেটিস নিয়ে রমজানের নিরাপদ সঙ্গী</Text>
        <View style={styles.spacer} />
        <Button label="শুরু করুন" sub="Get started" variant="Light" onPress={() => router.push('/guide/1')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.textPrimary },
  top: { height: 40, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  appName: { fontFamily: fonts.banglaBold, fontSize: 26, lineHeight: 35, color: colors.textOnBrand },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 14 },
  title: { fontFamily: fonts.banglaBold, fontSize: 40, lineHeight: 50, color: colors.textOnBrand },
  subtitle: { fontFamily: fonts.bangla, fontSize: 17, lineHeight: 23, color: colors.textOnBrand, opacity: 0.8 },
  spacer: { height: 12 },
});
