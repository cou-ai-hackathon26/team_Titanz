import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/tokens';

// Temporary start screen: proves fonts and colors work. Replaced by Welcome (00a) next.
export default function StartScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>রোজা-সেফ</Text>
        <Text style={styles.sub}>Roza-Safe · setup works</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.bgPage, borderRadius: 24, padding: 32, alignItems: 'center' },
  title: { fontFamily: fonts.banglaBold, fontSize: 32, color: colors.textPrimary },
  sub: { fontFamily: fonts.english, fontSize: 16, color: colors.textSecondary, marginTop: 8 },
});
