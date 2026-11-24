import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../components/Txt'; // <Text> that draws Bangla digits clearly
import { loadMealPlans, loadReadings, MealPlan, Reading } from '../../lib/storage';
import { FOOD_BY_ID } from '../../lib/foods';
import { FORECAST } from '../../lib/forecast';
import { adviceFor } from '../../lib/hypo';
import { dayKey, dayPart, minutesOfDay, shortDate } from '../../lib/time';
import { formatClock } from '../../lib/places';
import { toBanglaDigits } from '../../lib/bangla';
import { colors, fonts, radius } from '../../theme/tokens';
import FadeIn from '../../components/FadeIn';
import PressScale from '../../components/PressScale';
import Icon from '../../components/Icon';

// "২২/১১ · সন্ধ্যা ৬:১২ PM" for a saved item.
function when(iso: string): string {
  const d = new Date(iso);
  return `${shortDate(d)} · ${dayPart(minutesOfDay(d))} ${formatClock(minutesOfDay(d))}`;
}

// Screen 10 · History: saved meal plans and sugar readings, newest first. Tap a plan for its details.
// Opened from a day on Home (?day=2026-11-23), it shows only that day, with a button to see everything.
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day?: string }>();
  const [allPlans, setPlans] = useState<MealPlan[]>([]);
  const [allReadings, setReadings] = useState<Reading[]>([]);
  const onDay = (iso: string) => !day || dayKey(new Date(iso)) === day;
  const plans = allPlans.filter((p) => onDay(p.date));
  const readings = allReadings.filter((r) => onDay(r.date));
  const dayLabel = day ? shortDate(new Date(`${day}T12:00:00`)) : '';

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

        {day ? (
          <View style={styles.dayBar}>
            <Icon name="calendar_month" size={18} />
            <Text style={styles.dayText}>{dayLabel} তারিখের তথ্য</Text>
            <PressScale onPress={() => router.setParams({ day: '' })} style={styles.dayAll} accessibilityRole="button">
              <Text style={styles.dayAllText}>সব দেখুন</Text>
            </PressScale>
          </View>
        ) : null}

        <Text style={styles.section}>খাবারের পরিকল্পনা</Text>
        {plans.length === 0 ? (
          <Text style={styles.empty}>{day ? 'এই দিনে কোনো পরিকল্পনা নেই।' : 'এখনো কোনো পরিকল্পনা রাখা হয়নি। প্লেট স্ক্যান করে "এই পরিকল্পনা রাখুন" চাপুন।'}</Text>
        ) : null}
        {plans.slice(0, 20).map((p, pi) => {
          const incomplete = (p.missing?.length ?? 0) > 0; // some foods were not counted: never call it safe
          const safe = !incomplete && p.peakAfter <= FORECAST.SAFE_HIGH;
          const foods = p.items.map((i) => `${FOOD_BY_ID[i.foodId]?.nameBn ?? i.foodId} ${toBanglaDigits(i.count)}`).join(', ');
          return (
            <FadeIn key={p.date} delay={Math.min(pi * 40, 320)}>
            <PressScale
              pressedScale={0.98}
              style={styles.row}
              onPress={() => router.push({ pathname: '/plan/[date]', params: { date: p.date } })}
              accessibilityRole="button"
              accessibilityLabel={`${when(p.date)} এর পরিকল্পনা, বিস্তারিত দেখুন`}
            >
              <View style={[styles.rowDot, { backgroundColor: safe ? colors.riskLow : colors.riskHigh }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>
                  {p.meal === 'sehri' ? 'সেহরি' : 'ইফতার'} · {when(p.date)}
                </Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {foods}
                  {p.walk15 ? ' · ১৫ মিনিট হাঁটা' : ''}
                </Text>
                <Text style={styles.rowSub}>
                  সর্বোচ্চ সুগার প্রায় {toBanglaDigits(p.peakNow.toFixed(1))} → {toBanglaDigits(p.peakAfter.toFixed(1))} mmol/L
                </Text>
              </View>
              <View style={[styles.chip, { backgroundColor: incomplete ? colors.riskModerateSoft : safe ? colors.riskLowSoft : colors.riskHighSoft }]}>
                <Text style={[styles.chipText, { color: incomplete ? colors.riskModerate : safe ? colors.riskLow : colors.riskHigh }]}>{incomplete ? 'অসম্পূর্ণ' : safe ? 'নিরাপদ' : 'বেশি'}</Text>
              </View>
              <Icon name="arrow_forward" size={18} color={colors.textSecondary} />
            </PressScale>
            </FadeIn>
          );
        })}

        <Text style={styles.section}>সুগারের মাপ</Text>
        {readings.length === 0 ? (
          <Text style={styles.empty}>{day ? 'এই দিনে কোনো মাপ নেই।' : 'এখনো কোনো মাপ নেই। হোমে "শেষ সুগার" কার্ডে চেপে লিখুন।'}</Text>
        ) : null}
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
  dayBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgPage, borderRadius: radius.tile, paddingVertical: 10, paddingLeft: 14, paddingRight: 8 },
  dayText: { flex: 1, fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  dayAll: { backgroundColor: colors.bgSurface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  dayAllText: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  chip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16 },
});
