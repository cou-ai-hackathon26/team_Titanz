import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import { colors, fonts } from '../theme/tokens';

// TEMPORARY placeholder for screen 04 · Home. For now it opens the meal scan, the pre-iftar check and the risk check.
export default function HomePlaceholder() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.box}>
        <Text style={styles.title}>হোম</Text>
        <Text style={styles.body}>এই অংশটি পরে তৈরি হবে। (Home: coming later)</Text>
      </View>
      <View style={styles.actions}>
        <Button label="ইফতারের প্লেট স্ক্যান করুন" sub="Scan iftar plate" icon="photo_camera" onPress={() => router.push('/scan')} />
        <Button label="ইফতারের আগে শরীর চেক" sub="Pre-iftar check" icon="health_and_safety" variant="Secondary" onPress={() => router.push('/check')} />
        <Button label="আবার ঝুঁকি যাচাই" sub="Redo risk check" variant="Secondary" onPress={() => router.push('/risk-quiz')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp, padding: 24, justifyContent: 'space-between' },
  box: { marginTop: 40, gap: 8 },
  actions: { gap: 12 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary },
  body: { fontFamily: fonts.bangla, fontSize: 16, lineHeight: 22, color: colors.textSecondary },
});
