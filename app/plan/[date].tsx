import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../components/Txt'; // <Text> that draws Bangla digits clearly
import BackButton from '../../components/BackButton';
import ForecastChart from '../../components/ForecastChart';
import FadeIn from '../../components/FadeIn';
import Icon from '../../components/Icon';
import { goBack } from '../../lib/nav';
import { loadMealPlans, loadReadings, MealPlan, Reading } from '../../lib/storage';
import { FOOD_BY_ID } from '../../lib/foods';
import { forecast, FORECAST } from '../../lib/forecast';
import { mealTotals, MealItem } from '../../lib/meal';
import { adviceFor } from '../../lib/hypo';
import { dayPart, minutesOfDay, sameDay, shortDate } from '../../lib/time';
import { formatClock } from '../../lib/places';
import { toBanglaDigits } from '../../lib/bangla';
import { colors, fonts, radius } from '../../theme/tokens';

const bn1 = (n: number) => toBanglaDigits(n.toFixed(1));
const bn0 = (n: number) => toBanglaDigits(Math.round(n));

// History detail: everything about one saved plan — when, which meal, the foods and their sugar,
// the 2-hour curve, the estimated peak, and the glucometer readings from the same day.
export default function PlanDetailScreen() {
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [plan, setPlan] = useState<MealPlan | null | undefined>(undefined); // undefined = still loading
  const [readings, setReadings] = useState<Reading[]>([]);

  // Find this plan and that day's readings.
  useEffect(() => {
    Promise.all([loadMealPlans(), loadReadings()]).then(([plans, all]) => {
      const found = plans.find((p) => p.date === date) ?? null;
      setPlan(found);
      if (found) setReadings(all.filter((r) => sameDay(new Date(r.date), new Date(found.date))));
    });
  }, [date]);

  if (plan === undefined) return <View style={styles.screen} />;

  const header = (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <BackButton onPress={() => goBack('/history')} />
      <Text style={styles.topTitle}>পরিকল্পনার বিস্তারিত</Text>
      <View style={styles.topBarSpace} />
    </View>
  );

  if (!plan) {
    return (
      <View style={styles.screen}>
        {header}
        <Text style={styles.empty}>এই পরিকল্পনাটি আর পাওয়া যাচ্ছে না।</Text>
      </View>
    );
  }

  const when = new Date(plan.date);
  const items: MealItem[] = plan.items.map((i) => ({ foodId: i.foodId, count: i.count }));
  const totals = mealTotals(items);
  const before = forecast(items); // the saved plate, without the walk
  const after = forecast(items, { walk15: plan.walk15 }); // with the walk, if they planned one
  const safe = plan.peakAfter <= FORECAST.SAFE_HIGH;
  const mealBn = plan.meal === 'sehri' ? 'সেহরি' : 'ইফতার';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {header}

        <FadeIn style={styles.card}>
          <View style={styles.headRow}>
            <View style={styles.mealChip}>
              <Icon name={plan.meal === 'sehri' ? 'wb_twilight' : 'nightlight'} size={16} />
              <Text style={styles.mealChipText}>{mealBn}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: safe ? colors.riskLowSoft : colors.riskHighSoft }]}>
              <Text style={[styles.chipText, { color: safe ? colors.riskLow : colors.riskHigh }]}>{safe ? 'নিরাপদ সীমায়' : 'সীমার বেশি'}</Text>
            </View>
          </View>
          <Text style={styles.when}>
            {shortDate(when)} · {dayPart(minutesOfDay(when))} {formatClock(minutesOfDay(when))}
          </Text>
          <Text style={styles.peakLabel}>সর্বোচ্চ সুগার (আনুমানিক)</Text>
          <Text style={styles.peak}>
            {bn1(plan.peakNow)} → {bn1(plan.peakAfter)} <Text style={styles.unit}>mmol/L</Text>
          </Text>
          <View style={styles.totalsRow}>
            <Text style={styles.small}>মোট শর্করা {bn0(totals.carbs)} g</Text>
            <Text style={styles.small}>গ্লাইসেমিক লোড {bn0(totals.gl)}</Text>
            {plan.walk15 ? <Text style={styles.small}>১৫ মিনিট হাঁটা</Text> : null}
          </View>
        </FadeIn>

        <FadeIn delay={80} style={styles.card}>
          <Text style={styles.cardTitle}>২ ঘণ্টার সুগার পূর্বাভাস</Text>
          <ForecastChart now={before} after={after} />
          <Text style={styles.small}>সবুজ রেখা = এই পরিকল্পনা{plan.walk15 ? ' (হাঁটাসহ)' : ''}। পরিসর ±১৫%।</Text>
        </FadeIn>

        <FadeIn delay={160} style={styles.card}>
          <Text style={styles.cardTitle}>খাবারগুলো</Text>
          {items.map((i) => {
            const food = FOOD_BY_ID[i.foodId];
            if (!food) return null;
            return (
              <View key={i.foodId} style={styles.foodRow}>
                <View style={styles.flex}>
                  <Text style={styles.foodName}>
                    {food.nameBn} × {toBanglaDigits(i.count)}
                  </Text>
                  <Text style={styles.small}>{food.nameEn}</Text>
                </View>
                <Text style={styles.foodCarbs}>{bn0(food.carbsPerUnit * i.count)} g শর্করা</Text>
              </View>
            );
          })}
        </FadeIn>

        <FadeIn delay={240} style={styles.card}>
          <Text style={styles.cardTitle}>সেদিনের সুগারের মাপ</Text>
          {readings.length === 0 ? <Text style={styles.small}>সেদিন কোনো মাপ রাখা হয়নি।</Text> : null}
          {readings.map((r) => {
            const a = adviceFor(r.value);
            const color = a === 'break-fast' || a === 'very-high' ? colors.riskHigh : a === 'high' ? colors.riskModerate : colors.riskLow;
            const t = new Date(r.date);
            return (
              <View key={r.date} style={styles.foodRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.foodName, styles.flex]}>{bn1(r.value)} mmol/L</Text>
                <Text style={styles.small}>
                  {dayPart(minutesOfDay(t))} {formatClock(minutesOfDay(t))}
                </Text>
              </View>
            );
          })}
        </FadeIn>

        <Text style={styles.disclaimer}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  topTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  empty: { fontFamily: fonts.bangla, fontSize: 15, lineHeight: 22, color: colors.textSecondary, padding: 20 },
  card: { backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 18, gap: 10 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgPage, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  mealChipText: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  chip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16 },
  when: { fontFamily: fonts.banglaSemiBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  peakLabel: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  peak: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 36, color: colors.textPrimary },
  unit: { fontFamily: fonts.english, fontSize: 14, color: colors.textSecondary },
  totalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardTitle: { fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  flex: { flex: 1 },
  foodName: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  foodCarbs: { fontFamily: fonts.banglaMedium, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  dot: { width: 10, height: 10, borderRadius: 5 },
  small: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  disclaimer: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
