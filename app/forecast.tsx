import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import Icon, { IconName } from '../components/Icon';
import Stepper from '../components/Stepper';
import Toggle from '../components/Toggle';
import ForecastChart from '../components/ForecastChart';
import { goBack } from '../lib/nav';
import { getScan } from '../lib/scanStore';
import { saveMealPlan } from '../lib/storage';
import { FOOD_BY_ID } from '../lib/foods';
import { forecast, forecastWith, noChanges, changedPlate, changeEffect, FORECAST, WhatIf, Zone, Forecast } from '../lib/forecast';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// One decimal in Bangla digits, e.g. 11.34 → "১১.৩".
const bn1 = (n: number) => toBanglaDigits(n.toFixed(1));

// Colour of a peak: green inside the safe band, red above or below it.
const zoneColor = (z: Zone) => (z === 'safe' ? colors.riskLow : colors.riskHigh);

// What one change does to the peak, in words: "−২.৪ mmol", "+০.৩ mmol" or "প্রভাব খুব কম".
function effectText(delta: number): { text: string; color: string } {
  if (Math.abs(delta) < 0.05) return { text: 'প্রভাব খুব কম', color: colors.textSecondary };
  return delta < 0
    ? { text: `−${bn1(-delta)} mmol`, color: colors.riskLow }
    : { text: `+${bn1(delta)} mmol`, color: colors.riskModerate };
}

// One sentence about the plan's peak.
function summary(f: Forecast): string {
  if (f.zone === 'high') return 'সুগার নিরাপদ সীমার উপরে যেতে পারে — নিচের পরিবর্তনগুলো চেষ্টা করুন।';
  if (f.zone === 'low') return 'সুগার খুব কম থাকতে পারে — শরীর খারাপ লাগলে এখনই সুগার মাপুন।';
  return 'এই প্লেটে সুগার নিরাপদ সীমার মধ্যে থাকার কথা।';
}

// Screen 07 · Sugar Forecast: 2-hour curve for the plate as scanned vs. with the user's changes,
// plus three "what if" controls that redraw the curve instantly (no AI call: this is our own maths).
export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const items = getScan().items.filter((i) => i.count > 0);
  const [whatIf, setWhatIf] = useState<WhatIf>(() => noChanges(items));
  const [saved, setSaved] = useState(false);

  // No plate yet (e.g. opened directly): ask the user to scan first.
  if (items.length === 0) {
    return (
      <View style={[styles.screen, styles.empty, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.emptyTitle}>আগে প্লেট স্ক্যান করুন</Text>
        <Text style={styles.emptyBody}>পূর্বাভাস দেখাতে ইফতারের খাবারগুলো জানা দরকার।</Text>
        <Button label="প্লেট স্ক্যান করুন" sub="Scan plate" icon="photo_camera" onPress={() => router.replace('/scan')} style={styles.emptyButton} />
      </View>
    );
  }

  const now = forecast(items);
  const after = forecastWith(items, whatIf);
  const reduceFood = whatIf.reduceFoodId ? FOOD_BY_ID[whatIf.reduceFoodId] : undefined;
  const reduceFrom = items.find((i) => i.foodId === whatIf.reduceFoodId)?.count ?? 0;
  const reduceEffect = effectText(changeEffect(items, whatIf, 'reduce'));
  const cholaEffect = effectText(changeEffect(items, whatIf, 'chola'));
  const walkEffect = effectText(changeEffect(items, whatIf, 'walk'));

  // Saves the changed plate as tonight's plan and goes home.
  async function savePlan() {
    await saveMealPlan({
      date: new Date().toISOString(),
      items: changedPlate(items, whatIf).filter((i) => i.count > 0).map(({ foodId, count }) => ({ foodId, count })),
      walk15: whatIf.walk15,
      peakNow: now.peak,
      peakAfter: after.peak,
    });
    setSaved(true);
    router.replace('/home');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => goBack('/scan-result')} />
          <Text style={styles.topTitle}>সুগার পূর্বাভাস</Text>
          <View style={styles.topBarSpace} />
        </View>

        <View style={styles.card}>
          <View style={styles.headRow}>
            <Text style={styles.headText}>ইফতারের পর সর্বোচ্চ সুগার</Text>
            <View style={styles.estimateChip}>
              <Icon name="info" size={16} />
              <Text style={styles.estimateText}>আনুমানিক · Estimate</Text>
            </View>
          </View>

          <View style={styles.tiles}>
            <PeakTile label="এখনকার প্লেট" dot={colors.riskHigh} f={now} />
            <PeakTile label="পরিবর্তনের পর" dot={colors.bgBrandStrong} f={after} />
          </View>

          <ForecastChart now={now} after={after} />

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.riskHigh, opacity: 0.8 }]} />
              <Text style={styles.legendText}>এখনকার প্লেট</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.bgBrandStrong }]} />
              <Text style={styles.legendText}>পরিবর্তনের পর</Text>
            </View>
          </View>

          <Text style={[styles.summary, { color: zoneColor(after.zone) }]}>{summary(after)}</Text>
          <Text style={styles.assume}>ইফতারের আগে সুগার {bn1(FORECAST.BASELINE_DEFAULT)} mmol/L ধরে হিসাব।</Text>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.whatIfTitle}>কী বদলালে কী হয়?</Text>
            <Text style={styles.whatIfSub}>Try a change — the curve updates instantly</Text>
          </View>

          {reduceFood ? (
            <ControlRow icon="bakery_dining" title={`${reduceFood.nameBn} কমান`} effect={reduceEffect}
              detail={`${toBanglaDigits(reduceFrom)}টি → ${toBanglaDigits(whatIf.reduceTo)}টি`}>
              <Stepper
                value={whatIf.reduceTo}
                max={reduceFrom}
                onChange={(n) => setWhatIf({ ...whatIf, reduceTo: n })}
                label={reduceFood.nameBn}
              />
            </ControlRow>
          ) : null}

          <ControlRow icon="eco" title="ছোলা যোগ করুন" detail="+১ কাপ" effect={cholaEffect}>
            <Toggle value={whatIf.addChola} onChange={(v) => setWhatIf({ ...whatIf, addChola: v })} label="ছোলা যোগ করুন" />
          </ControlRow>

          <ControlRow icon="directions_walk" title="১৫ মিনিট হাঁটা" detail="ইফতারের পর" effect={walkEffect}>
            <Toggle value={whatIf.walk15} onChange={(v) => setWhatIf({ ...whatIf, walk15: v })} label="১৫ মিনিট হাঁটা" />
          </ControlRow>
        </View>

        <Button label="এই পরিকল্পনা রাখুন" sub="Save this plan" icon="check" onPress={savePlan} disabled={saved} />

        <View style={styles.disclaimer}>
          <Icon name="info" size={14} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// A grey tile with the peak as a range (e.g. "১১.৩–১৫.৩ mmol/L"), coloured by where it lands.
function PeakTile({ label, dot, f }: { label: string; dot: string; f: Forecast }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${f.peakLow.toFixed(1)} থেকে ${f.peakHigh.toFixed(1)} mmol/L`}>
      <View style={styles.tileLabelRow}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
      <Text style={[styles.tileValue, { color: zoneColor(f.zone) }]} numberOfLines={1}>
        {bn1(f.peakLow)}–{bn1(f.peakHigh)}
      </Text>
      <Text style={styles.tileUnit}>mmol/L</Text>
    </View>
  );
}

// One what-if row: icon, title, what it changes and its effect on the peak, and its control.
function ControlRow(props: { icon: IconName; title: string; detail: string; effect: { text: string; color: string }; children: React.ReactNode }) {
  return (
    <View style={styles.control}>
      <View style={styles.controlIcon}>
        <Icon name={props.icon} size={20} />
      </View>
      <View style={styles.controlText}>
        <Text style={styles.controlTitle}>{props.title}</Text>
        <Text style={[styles.controlSub, { color: props.effect.color }]}>
          {props.detail} · {props.effect.text}
        </Text>
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  topTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  card: { backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 20, gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headText: { fontFamily: fonts.bangla, fontSize: 14, lineHeight: 19, color: colors.textSecondary, flexShrink: 1 },
  estimateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgSurfaceMuted, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  estimateText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16, color: colors.textPrimary },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: colors.bgSurfaceMuted, borderRadius: radius.tile, padding: 14, gap: 2 },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tileLabel: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  tileValue: { fontFamily: fonts.banglaBold, fontSize: 21, lineHeight: 28 }, // Figma 26, but the clear digit font is wider: 21 fits "১২.০–১৫.৯" on a 390 px phone
  tileUnit: { fontFamily: fonts.english, fontSize: 12, lineHeight: 14, color: colors.textSecondary },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 3, borderRadius: 2 },
  legendText: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  summary: { fontFamily: fonts.banglaSemiBold, fontSize: 14, lineHeight: 20 },
  assume: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: -8 },
  whatIfTitle: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  whatIfSub: { fontFamily: fonts.english, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  control: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSurfaceMuted, alignItems: 'center', justifyContent: 'center' },
  controlText: { flex: 1 },
  controlTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  controlSub: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  disclaimerText: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontFamily: fonts.banglaBold, fontSize: 22, lineHeight: 30, color: colors.textPrimary },
  emptyBody: { fontFamily: fonts.bangla, fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  emptyButton: { alignSelf: 'stretch' },
});
