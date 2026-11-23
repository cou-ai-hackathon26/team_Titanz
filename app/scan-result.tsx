import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import Icon from '../components/Icon';
import Stepper from '../components/Stepper';
import PickerSheet from '../components/PickerSheet';
import CarbScale from '../components/CarbScale';
import { getScan, setScanItems } from '../lib/scanStore';
import { scanPlate, LOW_CONFIDENCE } from '../lib/scanApi';
import { FOODS, FOOD_BY_ID, unitBn } from '../lib/foods';
import { mealTotals, foodImpact, CarbBand, MealItem } from '../lib/meal';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// Colours for Low / Moderate / High (dots, chip, load bar).
const bandColor: Record<CarbBand, { strong: string; soft: string; chip: string }> = {
  low: { strong: colors.riskLow, soft: colors.riskLowSoft, chip: 'কম · Low' },
  moderate: { strong: colors.riskModerate, soft: colors.riskModerateSoft, chip: 'মাঝারি · Moderate' },
  high: { strong: colors.riskHigh, soft: colors.riskHighSoft, chip: 'বেশি · High' },
};

// Rounds to a whole number and writes it in Bangla digits.
const bn = (n: number) => toBanglaDigits(Math.round(n));

type Status = 'loading' | 'done' | 'error';

// Screen 06 · Scan Result: the photo, AI-found foods with − / + counts, total carbs,
// glycemic load and carb level. Unsure foods are marked; any food can be added by hand.
export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const scan = getScan();
  const [status, setStatus] = useState<Status>(scan.items.length || scan.manual ? 'done' : 'loading');
  const [errorText, setErrorText] = useState('');
  const [items, setItems] = useState<MealItem[]>(scan.items);
  const [aiCount, setAiCount] = useState(0); // how many foods the AI found
  const [unknown, setUnknown] = useState<string[]>([]); // foods the AI saw that are not in our table
  // A plate without a photo opens the food list straight away.
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; index: number } | null>(
    scan.manual && scan.items.length === 0 ? { mode: 'add' } : null,
  );

  // Ask the scan API about the photo (once). No photo → go back to the camera.
  useEffect(() => {
    if (scan.manual) return; // no photo: nothing to ask the AI
    if (!scan.photoBase64) {
      router.replace('/scan');
      return;
    }
    if (scan.items.length) return; // came back from the forecast: keep the user's edits
    let cancelled = false;
    scanPlate(scan.photoBase64)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items.map((i) => ({ foodId: i.id, count: i.count, unsure: i.confidence < LOW_CONFIDENCE })));
        setAiCount(result.items.length);
        setUnknown(result.unknown);
        setStatus('done');
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setErrorText(error.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [scan.photoBase64, scan.items.length, scan.manual]);

  const totals = mealTotals(items);
  const look = bandColor[totals.band];
  const hasFood = items.some((i) => i.count > 0);

  // Changes how many of one food are on the plate.
  function setCount(index: number, count: number) {
    setItems(items.map((it, i) => (i === index ? { ...it, count } : it)));
  }

  // Adds a food by hand, or swaps an unsure food for the right one.
  function pickFood(foodId: string) {
    if (!picker) return;
    if (picker.mode === 'add') {
      const existing = items.findIndex((i) => i.foodId === foodId);
      if (existing >= 0) setCount(existing, Math.max(1, items[existing].count));
      else setItems([...items, { foodId, count: 1 }]);
    } else {
      const index = picker.index;
      const other = items.findIndex((i, n) => n !== index && i.foodId === foodId);
      if (other >= 0) setItems(items.filter((_, n) => n !== index)); // already in the list: just drop the wrong row
      else setItems(items.map((it, n) => (n === index ? { ...it, foodId, unsure: false } : it)));
    }
    setPicker(null);
  }

  // Saves the plate and opens the sugar forecast.
  function openForecast() {
    setScanItems(items);
    router.navigate('/forecast'); // switch to the Forecast tab (closes camera + result screens)
  }

  const pickerOptions = FOODS.map((f) => ({ id: f.id, label: `${f.nameBn} · ${f.nameEn}` }));

  return (
    <View style={styles.screen}>
      <StatusBar style={scan.manual ? 'dark' : 'light'} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        {scan.manual ? (
          <View style={{ height: insets.top + 72 }} /> // no photo: just room for the back button
        ) : scan.photoUri ? (
          <Image source={{ uri: scan.photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.photo} />
        )}

        <View style={styles.sheet}>
          <View style={styles.headRow}>
            <View>
              <Text style={styles.title}>আপনার ইফতার</Text>
              <Text style={styles.titleEn}>Your iftar plate</Text>
            </View>
            {status === 'done' && aiCount > 0 ? (
              <View style={styles.aiChip}>
                <Icon name="auto_awesome" size={16} />
                <Text style={styles.aiChipText}>AI · {bn(aiCount)}টি খাবার</Text>
              </View>
            ) : null}
          </View>

          {status === 'loading' ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.bgBrandStrong} size="large" />
              <Text style={styles.loadingText}>AI খাবার চিনছে…</Text>
              <Text style={styles.loadingSub}>Reading your plate</Text>
            </View>
          ) : (
            <>
              {status === 'error' ? (
                <View style={styles.errorBox}>
                  <Icon name="info" size={20} color={colors.riskHigh} />
                  <Text style={styles.errorText}>{errorText}</Text>
                </View>
              ) : null}

              <View style={styles.tiles}>
                <View style={styles.tile}>
                  <View style={styles.tileLabelRow}>
                    <View style={[styles.dot, { backgroundColor: look.strong }]} />
                    <Text style={styles.tileLabel}>মোট শর্করা</Text>
                  </View>
                  <View style={styles.tileValueRow}>
                    <Text style={styles.tileValue}>{bn(totals.carbs)}</Text>
                    <Text style={styles.tileUnit}>g</Text>
                  </View>
                </View>
                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>গ্লাইসেমিক লোড</Text>
                  <View style={styles.tileValueRow}>
                    <Text style={styles.tileValue}>{bn(totals.gl)}</Text>
                    <Text style={styles.tileUnitBn}>আনুমানিক</Text>
                  </View>
                </View>
              </View>

              {hasFood ? <CarbScale carbs={totals.carbs} band={totals.band} /> : null}

              <View style={styles.listHead}>
                <Text style={styles.listTitle}>খাবারগুলো</Text>
                <Text style={styles.listHint}>পরিমাণ ঠিক করুন</Text>
              </View>

              <View style={styles.list}>
                {items.length === 0 ? <Text style={styles.empty}>কোনো খাবার নেই। নিচে থেকে যোগ করুন।</Text> : null}
                {items.map((item, index) => {
                  const food = FOOD_BY_ID[item.foodId];
                  if (!food) return null;
                  return (
                    <View key={item.foodId} style={styles.row}>
                      <View style={[styles.rowDot, { backgroundColor: bandColor[item.unsure ? 'moderate' : foodImpact(item.foodId)].strong }]} />
                      <Pressable
                        style={styles.rowText}
                        onPress={() => setPicker({ mode: 'replace', index })}
                        accessibilityRole="button"
                        accessibilityLabel={`${food.nameBn}${item.unsure ? ', AI নিশ্চিত নয়' : ''}`}
                        accessibilityHint="খাবার বদলাতে চাপুন"
                      >
                        <Text style={styles.rowName}>
                          {food.nameBn}
                          {item.unsure ? '?' : ''}
                        </Text>
                        <Text style={styles.rowSub}>
                          {item.unsure
                            ? 'AI নিশ্চিত নয় — ঠিক না হলে বদলান'
                            : `${food.nameEn.split(' (')[0]} · ${toBanglaDigits(Math.round(food.carbsPerUnit))}g প্রতি ${unitBn[food.unit]}`}
                        </Text>
                      </Pressable>
                      <Stepper value={item.count} onChange={(n) => setCount(index, n)} label={food.nameBn} />
                    </View>
                  );
                })}
              </View>

              {unknown.length > 0 ? (
                <Text style={styles.unknown}>তালিকার বাইরে: {unknown.join(', ')} (শর্করা হিসাবে ধরা হয়নি)</Text>
              ) : null}

              <Pressable
                onPress={() => setPicker({ mode: 'add' })}
                accessibilityRole="button"
                accessibilityLabel="আরও খাবার যোগ করুন (Add food)"
                style={({ pressed }) => [styles.addRow, pressed ? styles.addRowPressed : null]}
              >
                <Icon name="add" size={22} />
                <Text style={styles.addText}>আরও খাবার যোগ করুন</Text>
              </Pressable>

              <Button label="সুগার পূর্বাভাস দেখুন" sub="See sugar forecast" icon="show_chart" onPress={openForecast} disabled={!hasFood} />
            </>
          )}

          <View style={styles.disclaimer}>
            <Icon name="info" size={14} color={colors.textSecondary} />
            <Text style={styles.disclaimerText}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.replace('/scan')}
        accessibilityRole="button"
        accessibilityLabel="আবার ছবি তুলুন (Retake)"
        style={[styles.backButton, { top: insets.top + 16 }]}
        hitSlop={8}
      >
        <Icon name="arrow_back" size={22} />
      </Pressable>

      <PickerSheet
        visible={picker !== null}
        title={picker?.mode === 'replace' ? 'সঠিক খাবারটি বেছে নিন' : 'খাবার যোগ করুন'}
        options={pickerOptions}
        selectedId={picker?.mode === 'replace' ? items[picker.index]?.foodId ?? null : null}
        onPick={pickFood}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgSurface },
  photo: { width: '100%', height: 340, backgroundColor: colors.textPrimary },
  backButton: { position: 'absolute', left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    marginTop: -40,
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 18,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.banglaBold, fontSize: 24, lineHeight: 32, color: colors.textPrimary },
  titleEn: { fontFamily: fonts.english, fontSize: 14, lineHeight: 17, color: colors.textSecondary },
  aiChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgPage, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  aiChipText: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  loadingText: { fontFamily: fonts.banglaSemiBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  loadingSub: { fontFamily: fonts.english, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.riskHighSoft, borderRadius: radius.input, padding: 12 },
  errorText: { flex: 1, fontFamily: fonts.banglaMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, backgroundColor: colors.bgSurfaceMuted, borderRadius: radius.tile, padding: 16, gap: 4 },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileLabel: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  tileValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tileValue: { fontFamily: fonts.banglaBold, fontSize: 30, lineHeight: 36, color: colors.textPrimary },
  tileUnit: { fontFamily: fonts.english, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  tileUnitBn: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  listHint: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  list: { gap: 8 },
  empty: { fontFamily: fonts.bangla, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgSurfaceMuted, borderRadius: radius.tile, paddingLeft: 16, paddingRight: 12, paddingVertical: 12 },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  rowText: { flex: 1 },
  rowName: { fontFamily: fonts.banglaSemiBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  rowSub: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  unknown: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDefault,
    borderRadius: radius.tile,
    paddingVertical: 18,
  },
  addRowPressed: { backgroundColor: colors.bgSurfaceMuted },
  addText: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  disclaimerText: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
