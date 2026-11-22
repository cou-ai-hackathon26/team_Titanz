import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import { goBack } from '../lib/nav';
import { getScan } from '../lib/scanStore';
import { mealTotals } from '../lib/meal';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts } from '../theme/tokens';

// TEMPORARY placeholder for screen 07 · Sugar Forecast (next feature, M5). Shows the plate totals it will use.
export default function ForecastPlaceholder() {
  const totals = mealTotals(getScan().items);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.box}>
        <Text style={styles.title}>সুগার পূর্বাভাস</Text>
        <Text style={styles.body}>এই অংশটি পরের ধাপে তৈরি হবে। (Forecast: coming next)</Text>
        <Text style={styles.body}>
          এই প্লেট: শর্করা {toBanglaDigits(Math.round(totals.carbs))}g, গ্লাইসেমিক লোড {toBanglaDigits(Math.round(totals.gl))}
        </Text>
      </View>
      <Button label="ফিরে যান" sub="Back" variant="Secondary" onPress={() => goBack('/scan-result')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp, padding: 24, justifyContent: 'space-between' },
  box: { marginTop: 40, gap: 8 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary },
  body: { fontFamily: fonts.bangla, fontSize: 16, lineHeight: 22, color: colors.textSecondary },
});
