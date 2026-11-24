import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import Icon from '../components/Icon';
import Stepper from '../components/Stepper';
import PickerSheet from '../components/PickerSheet';
import CarbScale from '../components/CarbScale';
import { getScan, setScanItems, setScanMeal, setScanUnknown } from '../lib/scanStore';
import { setFamilyPlate } from '../lib/compareStore';
import ChoiceChip from '../components/ChoiceChip';
import Sheet from '../components/Sheet';
import Input from '../components/Input';
import { makeCustomFood, validCustomCarbs } from '../lib/customFood';
import { saveCustomFood } from '../lib/storage';
import { onlyDigits } from '../lib/bangla';
import { loadProfile } from '../lib/storage';
import { findDistrict, fastTimes } from '../lib/places';
import { mealForTime, minutesOfDay } from '../lib/time';
import { scanPlate, LOW_CONFIDENCE } from '../lib/scanApi';
import { FOODS, FOOD_BY_ID, unitBn } from '../lib/foods';
import { mealTotals, foodImpact, CarbBand, MealItem, sizeScale, itemSize, sizeChoices } from '../lib/meal';
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
  const { compare } = useLocalSearchParams<{ compare?: string }>(); // 'family' = a family member's plate
  const scan = getScan();
  const [status, setStatus] = useState<Status>(scan.items.length || scan.manual ? 'done' : 'loading');
  const [errorText, setErrorText] = useState('');
  const [items, setItems] = useState<MealItem[]>(scan.items);
  const [aiCount, setAiCount] = useState(0); // how many foods the AI found
  const [unknown, setUnknown] = useState<string[]>(scan.unknown); // foods the AI saw that are not in our table
  // A plate without a photo opens the food list straight away.
  const [meal, setMeal] = useState<'iftar' | 'sehri'>(scan.meal ?? 'iftar');
  // "Add it yourself": a food the AI couldn't recognise (or that isn't in our list), with grams typed by the user.
  const [custom, setCustom] = useState<{ from: string | null; name: string; grams: string } | null>(null);
  const customGrams = custom && custom.grams !== '' ? Number(onlyDigits(custom.grams)) : null;
  const customOk = !!custom && custom.name.trim() !== '' && validCustomCarbs(customGrams);

  // Saves the user's own food on the phone, puts it on the plate, and stops warning about the unrecognised one.
  async function addCustomFood() {
    if (!custom || !customOk) return;
    const food = makeCustomFood(custom.name, customGrams as number);
    await saveCustomFood(food);
    setItems((now) => [...now, { foodId: food.id, count: 1 }]);
    if (custom.from) setUnknown((now) => now.filter((u) => u !== custom.from));
    setCustom(null);
  }

  // Sehri or iftar: picked automatically from the time of day and the district's sehri time (user can change it).
  useEffect(() => {
    if (scan.meal) return; // already chosen (e.g. came back from the forecast)
    loadProfile().then((p) => {
      const district = findDistrict(p.districtId);
      const sehriEnd = district ? fastTimes(district).sehriEnd : 4 * 60 + 30; // about 4:30 AM if no district
      const auto = mealForTime(minutesOfDay(new Date()), sehriEnd);
      setMeal(auto);
      setScanMeal(auto);
    });
  }, [scan.meal]);

  // The user changes sehri / iftar by hand.
  function pickMeal(m: 'iftar' | 'sehri') {
    setMeal(m);
    setScanMeal(m);
  }

  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; index: number } | { mode: 'match'; name: string } | null>(
    scan.manual && scan.items.length === 0 ? { mode: 'add' } : null,
  );

  // Ask the scan API about the photo (once). No photo → go back to the camera.
  useEffect(() => {
    if (scan.manual) return; // no photo: nothing to ask the AI
    if (!scan.photoBase64) {
      router.replace(compare ? { pathname: '/scan', params: { compare } } : '/scan');
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

  // Size of one piece/cup/glass: the user can pick small / regular / large or type the exact g/ml.
  const [sizeEdit, setSizeEdit] = useState<{ index: number; typed: string } | null>(null);
  const sizeItem = sizeEdit ? items[sizeEdit.index] : undefined;
  const sizeFood = sizeItem ? FOOD_BY_ID[sizeItem.foodId] : undefined;
  const typedSize = sizeEdit && sizeEdit.typed !== '' ? Number(onlyDigits(sizeEdit.typed)) : null;
  const typedSizeOk = typedSize !== null && typedSize >= 1 && typedSize <= 2000;

  // Saves a new size for one food (size = our standard portion clears the change).
  function setSize(size: number) {
    if (!sizeEdit || !sizeFood) return;
    const index = sizeEdit.index;
    setItems((now) => now.map((it, n) => (n === index ? { ...it, size: size === sizeFood.portion ? undefined : size } : it)));
    setSizeEdit(null);
  }

  // Adds a food by hand, or swaps an unsure food for the right one.
  function pickFood(foodId: string) {
    if (!picker) return;
    if (foodId === '__custom') {
      // Not in our list: type it in yourself.
      setPicker(null);
      setCustom({ from: picker.mode === 'match' ? picker.name : null, name: picker.mode === 'match' ? picker.name : '', grams: '' });
      return;
    }
    if (picker.mode === 'match') {
      // The user says which of our foods the unrecognised one is most like: count it, and stop warning about it.
      const existing = items.findIndex((i) => i.foodId === foodId);
      if (existing >= 0) setCount(existing, items[existing].count + 1);
      else setItems([...items, { foodId, count: 1 }]);
      setUnknown(unknown.filter((u) => u !== picker.name));
    } else if (picker.mode === 'add') {
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

  // Family plate: keep it and open the side-by-side comparison.
  function openCompare() {
    setFamilyPlate({ items, unknown, photoUri: scan.photoUri });
    router.replace('/compare');
  }

  // Saves the plate and opens the sugar forecast.
  function openForecast() {
    setScanItems(items);
    setScanUnknown(unknown);
    router.navigate('/forecast'); // switch to the Forecast tab (closes camera + result screens)
  }

  // The list always starts with "not in the list? type it yourself".
  const pickerOptions = [
    { id: '__custom', label: '+ তালিকায় নেই? নিজে লিখুন (নাম ও শর্করা)' },
    ...FOODS.map((f) => ({ id: f.id, label: `${f.nameBn} · ${f.nameEn}` })),
  ];

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
              <Text style={styles.title}>{compare ? 'পরিবারের প্লেট' : meal === 'sehri' ? 'আপনার সেহরি' : 'আপনার ইফতার'}</Text>
              <Text style={styles.titleEn}>{compare ? "Family member's plate" : meal === 'sehri' ? 'Your sehri plate' : 'Your iftar plate'}</Text>
            </View>
            {status === 'done' && aiCount > 0 ? (
              <View style={styles.aiChip}>
                <Icon name="auto_awesome" size={16} />
                <Text style={styles.aiChipText}>AI · {bn(aiCount)}টি খাবার</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.mealRow} accessibilityRole="radiogroup" accessibilityLabel="কোন খাবার? (Which meal?)">
            <ChoiceChip label="ইফতার" selected={meal === 'iftar'} onPress={() => pickMeal('iftar')} />
            <ChoiceChip label="সেহরি" selected={meal === 'sehri'} onPress={() => pickMeal('sehri')} />
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
                      <View style={styles.rowText}>
                      <Pressable
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
                            : `${food.nameEn.split(' (')[0]} · ${toBanglaDigits(Math.round(food.carbsPerUnit * sizeScale(item)))}g শর্করা প্রতি ${unitBn[food.unit]}`}
                        </Text>
                      </Pressable>
                        {food.unit !== 'serving' ? (
                          <Pressable
                            onPress={() => setSizeEdit({ index, typed: '' })}
                            accessibilityRole="button"
                            accessibilityLabel={`${food.nameBn}: এক ${unitBn[food.unit]} ${itemSize(item)} ${food.portionUnit}, পরিমাণ বদলান`}
                            style={[styles.sizePill, item.size ? styles.sizePillChanged : null]}
                            hitSlop={6}
                          >
                            <Icon name="edit" size={14} />
                            <Text style={styles.sizePillText}>
                              ১ {unitBn[food.unit]} = {toBanglaDigits(Math.round(itemSize(item)))} {food.portionUnit}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <Stepper value={item.count} onChange={(n) => setCount(index, n)} label={food.nameBn} />
                    </View>
                  );
                })}
              </View>

              {unknown.length > 0 ? (
                <View style={styles.unknownBox}>
                  <View style={styles.unknownHead}>
                    <Icon name="warning" size={20} color={colors.riskModerate} />
                    <Text style={styles.unknownTitle}>AI এগুলো চিনতে পারেনি</Text>
                  </View>
                  <Text style={styles.unknownText}>
                    "নিজে যোগ করুন" চেপে খাবারটি কত গ্রাম শর্করা লিখুন (প্যাকেট/লেবেল দেখে), অথবা তালিকা থেকে বেছে নিন। না করলে এর শর্করা হিসাবে থাকবে না, তাই পূর্বাভাস অসম্পূর্ণ দেখাবে।
                  </Text>
                  {unknown.map((name) => (
                    <View key={name} style={styles.unknownRow}>
                      <Text style={styles.unknownName} numberOfLines={1}>{name}</Text>
                      <Pressable onPress={() => setCustom({ from: name, name, grams: '' })} accessibilityRole="button" style={styles.unknownBtn}>
                        <Text style={styles.unknownBtnText}>নিজে যোগ করুন</Text>
                      </Pressable>
                      <Pressable onPress={() => setUnknown(unknown.filter((u) => u !== name))} accessibilityRole="button" accessibilityLabel={`${name} বাদ দিন`} style={styles.unknownSkip}>
                        <Text style={styles.unknownSkipText}>বাদ দিন</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
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

              {compare ? (
                <Button label="দুটো প্লেট তুলনা করুন" sub="Compare plates" icon="favorite" onPress={openCompare} disabled={!hasFood} />
              ) : (
                <Button label="সুগার পূর্বাভাস দেখুন" sub="See sugar forecast" icon="show_chart" onPress={openForecast} disabled={!hasFood} />
              )}
            </>
          )}

          <View style={styles.disclaimer}>
            <Icon name="info" size={14} color={colors.textSecondary} />
            <Text style={styles.disclaimerText}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.replace(compare ? { pathname: '/scan', params: { compare } } : '/scan')}
        accessibilityRole="button"
        accessibilityLabel="আবার ছবি তুলুন (Retake)"
        style={[styles.backButton, { top: insets.top + 16 }]}
        hitSlop={8}
      >
        <Icon name="arrow_back" size={22} />
      </Pressable>

      <PickerSheet
        visible={picker !== null}
        title={picker?.mode === 'replace' ? 'সঠিক খাবারটি বেছে নিন' : picker?.mode === 'match' ? `"${picker.name}" — তালিকা থেকে বেছে নিন` : 'খাবার যোগ করুন'}
        options={pickerOptions}
        selectedId={picker?.mode === 'replace' ? items[picker.index]?.foodId ?? null : null}
        onPick={pickFood}
        onClose={() => setPicker(null)}
      />

      {/* Size of one piece / cup / glass */}
      <Sheet visible={sizeEdit !== null} onClose={() => setSizeEdit(null)} title={sizeFood ? `${sizeFood.nameBn} — পরিমাণ` : 'পরিমাণ'}>
        {sizeFood && sizeItem ? (
          <View style={styles.customBody}>
            <Text style={styles.customHelp}>
              এক {unitBn[sizeFood.unit]} কত বড়? জানা থাকলে মাপ লিখুন — হিসাব আরও ঠিক হবে। (মোট = সংখ্যা × এই মাপ)
            </Text>
            <View style={styles.sizeRow}>
              {sizeChoices(sizeFood).map((c) => {
                const selected = Math.round(itemSize(sizeItem)) === c.size;
                return (
                  <Pressable
                    key={c.label}
                    onPress={() => setSize(c.size)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.sizeChoice, selected ? styles.sizeChoiceSelected : null]}
                  >
                    <Text style={styles.sizeChoiceLabel}>{c.label}</Text>
                    <Text style={styles.sizeChoiceValue}>
                      {toBanglaDigits(c.size)} {sizeFood.portionUnit}
                    </Text>
                    <Text style={styles.sizeChoiceCarbs}>
                      শর্করা {toBanglaDigits(Math.round((sizeFood.carbsPerUnit * c.size) / sizeFood.portion))}g
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Input
              label={`নিজে মাপ লিখুন (${sizeFood.portionUnit === 'ml' ? 'মিলি' : 'গ্রাম'})`}
              value={sizeEdit?.typed ?? ''}
              onChangeText={(t) => setSizeEdit((e) => (e ? { ...e, typed: onlyDigits(t).slice(0, 4) } : e))}
              placeholder={`যেমন ${toBanglaDigits(sizeFood.portion)}`}
              keyboardType="number-pad"
              maxLength={4}
              digitsOnly
            />
            {typedSizeOk ? (
              <Text style={styles.customHelp}>
                এক {unitBn[sizeFood.unit]}-তে শর্করা প্রায় {toBanglaDigits(Math.round((sizeFood.carbsPerUnit * (typedSize as number)) / sizeFood.portion))} g
              </Text>
            ) : null}
            <Button label="এই মাপ রাখুন" sub="Use this size" icon="check" onPress={() => typedSizeOk && setSize(typedSize as number)} disabled={!typedSizeOk} />
          </View>
        ) : null}
      </Sheet>

      {/* Add it yourself: name + grams of carbohydrate in one serving (no guessing by the app) */}
      <Sheet visible={custom !== null} onClose={() => setCustom(null)} title="নিজে খাবার যোগ করুন">
        <View style={styles.customBody}>
          <Input
            label="খাবারের নাম"
            value={custom?.name ?? ''}
            onChangeText={(t) => setCustom((c) => (c ? { ...c, name: t } : c))}
            placeholder="যেমন: স্প্যাগেটি"
          />
          <Input
            label="এক পরিবেশনে শর্করা (গ্রাম)"
            value={custom?.grams ?? ''}
            onChangeText={(t) => setCustom((c) => (c ? { ...c, grams: onlyDigits(t).slice(0, 3) } : c))}
            placeholder="যেমন ৪৫"
            keyboardType="number-pad"
            maxLength={3}
            digitsOnly
          />
          {custom && custom.grams !== '' && !validCustomCarbs(customGrams) ? (
            <Text style={styles.customError}>০ থেকে ৩০০ গ্রামের মধ্যে লিখুন।</Text>
          ) : null}
          <Text style={styles.customHelp}>
            প্যাকেট বা লেবেলে "Carbohydrate" দেখে লিখুন। কত দ্রুত সুগার বাড়ায় জানা নেই, তাই দ্রুত বাড়ে ধরে হিসাব হবে (নিরাপদ দিক)। জানা না থাকলে খাবারটি বাদ দিন — পূর্বাভাস তখন অসম্পূর্ণ দেখাবে।
          </Text>
          <Button label="প্লেটে যোগ করুন" sub="Add to plate" icon="add" onPress={addCustomFood} disabled={!customOk} />
          {custom?.from ? (
            <Pressable
              onPress={() => {
                const name = custom.from as string;
                setCustom(null);
                setPicker({ mode: 'match', name });
              }}
              accessibilityRole="button"
              style={styles.customLink}
            >
              <Text style={styles.customLinkText}>আমাদের তালিকায় আছে? তালিকা থেকে বেছে নিন</Text>
            </Pressable>
          ) : null}
        </View>
      </Sheet>
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
  mealRow: { flexDirection: 'row', gap: 10 },
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
  sizePill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 4, backgroundColor: colors.bgSurface, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  sizePillChanged: { backgroundColor: colors.bgPage },
  sizePillText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16, color: colors.textPrimary },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeChoice: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: radius.tile, borderWidth: 1, borderColor: colors.borderDefault, backgroundColor: colors.bgSurface },
  sizeChoiceSelected: { backgroundColor: colors.bgPage, borderColor: colors.borderBrand, borderWidth: 1.5 },
  sizeChoiceLabel: { fontFamily: fonts.banglaBold, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  sizeChoiceValue: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  sizeChoiceCarbs: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  customBody: { paddingHorizontal: 20, gap: 12 },
  customHelp: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  customError: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18, color: colors.riskHigh },
  customLink: { alignSelf: 'center', paddingVertical: 8 },
  customLinkText: { fontFamily: fonts.banglaSemiBold, fontSize: 14, lineHeight: 20, color: colors.textBrand },
  unknownBox: { backgroundColor: colors.riskModerateSoft, borderRadius: radius.tile, padding: 14, gap: 8 },
  unknownHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unknownTitle: { fontFamily: fonts.banglaBold, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  unknownText: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 19, color: colors.textPrimary },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unknownName: { flex: 1, fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  unknownBtn: { backgroundColor: colors.bgBrandStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  unknownBtnText: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.textOnBrand },
  unknownSkip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 8 },
  unknownSkipText: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
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
