import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../components/Txt'; // <Text> that draws Bangla digits clearly
import { loadMealPlans, loadReadings, MealPlan, Reading } from '../../lib/storage';
import { FOOD_BY_ID } from '../../lib/foods';
import { FORECAST } from '../../lib/forecast';
import { adviceFor } from '../../lib/hypo';
import { dayPart, minutesOfDay, shortDate } from '../../lib/time';
import { formatClock } from '../../lib/places';
import { toBanglaDigits } from '../../lib/bangla';
import { colors, fonts, radius } from '../../theme/tokens';
import FadeIn from '../../components/FadeIn';

// "২২/১১ · সন্ধ্যা ৬:১২ PM" for a saved item.
function when(iso: string): string {
  const d = new Date(iso);
  return `${shortDate(d)} · ${dayPart(minutesOfDay(d))} ${formatClock(minutesOfDay(d))}`;
}

// Screen 10 · History (simple first version): saved iftar plans and sugar readings, newest first.
// The weekly chart from Figma comes later; this already shows everything the user saved.
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);

  // Reload every time the screen is shown.
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadMealPlans(), loadReadings()]).then(([m, r]) => {
        setPlans(m);
        setReadings(r);
      });
    }, []),
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 24 }]}>
        <View>
          <Text style={styles.title}>ইতিহাস</Text>
          <Text style={styles.subtitle}>History</Text>
        </View>

        <Text style={styles.section}>ইফতার পরিকল্পনা</Text>
        {plans.length === 0 ? <Text style={styles.empty}>এখনো কোনো পরিকল্পনা রাখা হয়নি। প্লেট স্ক্যান করে "এই পরিকল্পনা রাখুন" চাপুন।</Text> : null}
        {plans.slice(0, 20).map((p, pi) => {
          const safe = p.peakAfter <= FORECAST.SAFE_HIGH;
          const foods = p.items.map((i) => `${FOOD_BY_ID[i.foodId]?.nameBn ?? i.foodId} ${toBanglaDigits(i.count)}`).join(', ');
          return (
            <FadeIn key={p.date} delay={Math.min(pi * 40, 320)}>
            <View style={styles.row}>
              <View style={[styles.rowDot, { backgroundColor: safe ? colors.riskLow : colors.riskHigh }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{when(p.date)}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {foods}
                  {p.walk15 ? ' · ১৫ মিনিট হাঁটা' : ''}
                </Text>
                <Text style={styles.rowSub}>
                  সর্বোচ্চ সুগার প্রায় {toBanglaDigits(p.peakNow.toFixed(1))} → {toBanglaDigits(p.peakAfter.toFixed(1))} mmol/L
                </Text>
              </View>
              <View style={[styles.chip, { backgroundColor: safe ? colors.riskLowSoft : colors.riskHighSoft }]}>
                <Text style={[styles.chipText, { color: safe ? colors.riskLow : colors.riskHigh }]}>{safe ? 'নিরাপদ' : 'বেশি'}</Text>
              </View>
            </View>
            </FadeIn>
          );
        })}

        <Text style={styles.section}>সুগারের মাপ</Text>
        {readings.length === 0 ? <Text style={styles.empty}>এখনো কোনো মাপ নেই। হোমে "শেষ সুগার" কার্ডে চেপে লিখুন।</Text> : null}
        {readings.slice(0, 30).map((r, ri) => {
          const a = adviceFor(r.value);
          const look =
            a === 'break-fast' || a === 'very-high'
              ? { color: colors.riskHigh, soft: colors.riskHighSoft, text: a === 'break-fast' ? 'কম' : 'অনেক বেশি' }
              : a === 'high'
                ? { color: colors.riskModerate, soft: colors.riskModerateSoft, text: 'বেশি' }
                : { color: colors.riskLow, soft: colors.riskLowSoft, text: 'স্বাভাবিক' };
          return (
            <FadeIn key={r.date} delay={Math.min(ri * 40, 320)}>
            <View style={styles.row}>
              <View style={[styles.rowDot, { backgroundColor: look.color }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{toBanglaDigits(r.value.toFixed(1))} mmol/L</Text>
                <Text style={styles.rowSub}>{when(r.date)}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: look.soft }]}>
                <Text style={[styles.chipText, { color: look.color }]}>{look.text}</Text>
              </View>
            </View>
            </FadeIn>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 36, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.english, fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  section: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary, marginTop: 8 },
  empty: { fontFamily: fonts.bangla, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgSurface, borderRadius: radius.tile, padding: 16 },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  rowSub: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  chip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16 },
});
