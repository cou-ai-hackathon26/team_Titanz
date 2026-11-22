import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { colors, fonts } from '../theme/tokens';

// TEMPORARY placeholder for screen 02 · Risk Quiz. The real quiz is the next feature (M2).
export default function RiskQuizPlaceholder() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.box}>
        <Text style={styles.title}>ঝুঁকি যাচাই</Text>
        <Text style={styles.body}>এই অংশটি পরের ধাপে তৈরি হবে। (Risk quiz: coming next)</Text>
      </View>
      <Button label="ফিরে যান" sub="Back" variant="Secondary" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp, padding: 24, justifyContent: 'space-between' },
  box: { marginTop: 40, gap: 8 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary },
  body: { fontFamily: fonts.bangla, fontSize: 16, lineHeight: 22, color: colors.textSecondary },
});
