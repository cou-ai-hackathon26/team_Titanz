import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import ForecastChart from '../components/ForecastChart';
import FadeIn from '../components/FadeIn';
import Icon from '../components/Icon';
import { goBack, goHomeFresh } from '../lib/nav';
import { getCompare, ComparePlate } from '../lib/compareStore';
import { forecast, Forecast, FORECAST } from '../lib/forecast';
import { foodImpact } from '../lib/meal';
import { checkPlate } from '../lib/plateCheck';
import { FOOD_BY_ID } from '../lib/foods';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

const bn1 = (n: number) => toBanglaDigits(n.toFixed(1));
const bn0 = (n: number) => toBanglaDigits(Math.round(n));

// Household plate comparison: the user's plate and a family member's plate from the same iftar, side by side.
// Both curves show what each plate would do to the USER's sugar (our estimate), so they can choose what to share.
export default function CompareScreen() {
  const insets = useSafeAreaInsets();
  const { mine, family } = getCompare();

  if (!mine || !family) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingHorizontal: 20, gap: 16 }]}>
        <BackButton onPress={() => goBack('/home')} />
        <Text style={styles.small}>তুলনা করতে আগে দুটো প্লেট দরকার। পূর্বাভাস স্ক্রিন থেকে "পরিবারের প্লেটের সাথে তুলনা" চাপুন।</Text>
      </View>
    );
  }

  const myItems = mine.items.filter((i) => i.count > 0);
  const famItems = family.items.filter((i) => i.count > 0);
  const myF = forecast(myItems);
  const famF = forecast(famItems);
  const myCheck = checkPlate(myItems, mine.unknown);
  const famCheck = checkPlate(famItems, family.unknown);
  const diff = famF.peak - myF.peak; // + means the family plate would raise the user's sugar more

  // Foods on the family plate that barely raise sugar (fine to share) and ones that raise it a lot.
  const famIds = [...new Set(famItems.map((i) => i.foodId))];
  const share = famIds.filter((id) => foodImpact(id) === 'low').map((id) => FOOD_BY_ID[id]?.nameBn).filter(Boolean);
  const leave = famIds
    .filter((id) => foodImpact(id) === 'high' && !myItems.some((m) => m.foodId === id))
    .map((id) => FOOD_BY_ID[id]?.nameBn)
    .filter(Boolean);

  const diffText =
    Math.abs(diff) < 0.3
      ? 'দুটো প্লেটে আপনার সুগার প্রায় একই রকম বাড়বে।'
      : diff > 0
        ? `পরিবারের প্লেট খেলে আপনার সুগার প্রায় ${bn1(diff)} mmol/L বেশি উঠত।`
        : `পরিবারের প্লেট খেলে আপনার সুগার প্রায় ${bn1(-diff)} mmol/L কম উঠত — ওটা আপনার জন্য হালকা।`;

  // Starts another family member's plate (same flow, the user's plate stays).
  function anotherPlate() {
    router.push({ pathname: '/scan', params: { compare: 'family' } });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => goBack('/forecast')} />
          <Text style={styles.topTitle}>পরিবারের সাথে তুলনা</Text>
          <View style={styles.topBarSpace} />
        </View>

        <Text style={styles.intro}>একই ইফতার, দুটো প্লেট। দুটো হিসাবই আপনার সুগারের জন্য (আনুমানিক)।</Text>

        <FadeIn style={styles.columns}>
          <PlateColumn title="আমার প্লেট" plate={mine} f={myF} complete={myCheck.complete} accent={colors.bgBrandStrong} />
          <PlateColumn title="পরিবারের প্লেট" plate={family} f={famF} complete={famCheck.complete} accent={colors.riskHigh} />
        </FadeIn>

        <FadeIn delay={100} style={styles.card}>
          <Text style={styles.cardTitle}>২ ঘণ্টায় আপনার সুগার</Text>
          <ForecastChart now={famF} after={myF} />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.bgBrandStrong }]} />
              <Text style={styles.small}>আমার প্লেট</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.riskHigh, opacity: 0.8 }]} />
              <Text style={styles.small}>পরিবারের প্লেট (আপনি খেলে)</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={180} style={styles.card}>
          <Text style={styles.cardTitle}>কী বোঝা গেল</Text>
          <Line icon="show_chart" text={diffText} />
          {share.length ? <Line icon="check" text={`একসাথে খেতে পারেন (সুগার কম বাড়ায়): ${share.join(', ')}`} /> : null}
          {leave.length ? <Line icon="info" text={`এগুলো পরিবারের জন্য রাখুন, আপনার সুগার বেশি বাড়াতে পারে: ${leave.join(', ')}`} /> : null}
          {!myCheck.complete || !famCheck.complete ? (
            <Line icon="warning" text="কোনো প্লেটে চেনা যায়নি এমন খাবার আছে, তাই সেই প্লেটের সংখ্যা কমপক্ষে হিসাব — আসল সুগার বেশি হতে পারে।" warn />
          ) : null}
        </FadeIn>

        <Button label="আরেকজনের প্লেট দেখুন" sub="Compare another plate" icon="photo_camera" variant="Secondary" onPress={anotherPlate} />
        <Button label="হোমে যান" sub="Go to home" onPress={goHomeFresh} />
        <Text style={styles.disclaimer}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
      </ScrollView>
    </View>
  );
}

// One plate: photo, carbs, glycemic load, the user's estimated peak, status and the food list.
function PlateColumn({ title, plate, f, complete, accent }: { title: string; plate: ComparePlate; f: Forecast; complete: boolean; accent: string }) {
  const safe = complete && f.peak <= FORECAST.SAFE_HIGH;
  const status = !complete ? { text: 'অসম্পূর্ণ', color: colors.riskModerate, soft: colors.riskModerateSoft } : safe ? { text: 'নিরাপদ সীমায়', color: colors.riskLow, soft: colors.riskLowSoft } : { text: 'সীমার বেশি', color: colors.riskHigh, soft: colors.riskHighSoft };
  return (
    <View style={styles.column}>
      {plate.photoUri ? <Image source={{ uri: plate.photoUri }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, styles.noPhoto]}><Icon name="edit" size={22} color={colors.textSecondary} /></View>}
      <View style={styles.columnHead}>
        <View style={[styles.colDot, { backgroundColor: accent }]} />
        <Text style={styles.columnTitle}>{title}</Text>
      </View>
      <Text style={styles.peak}>{complete ? `${bn1(f.peakLow)}–${bn1(f.peakHigh)}` : `≥ ${bn1(f.peakLow)}`}</Text>
      <Text style={styles.small}>সর্বোচ্চ সুগার · mmol/L</Text>
      <View style={[styles.chip, { backgroundColor: status.soft }]}>
        <Text style={[styles.chipText, { color: status.color }]}>{status.text}</Text>
      </View>
      <Text style={styles.stat}>শর্করা {bn0(f.carbs)} g</Text>
      <Text style={styles.stat}>গ্লাইসেমিক লোড {bn0(f.gl)}</Text>
      <View style={styles.foods}>
        {plate.items.filter((i) => i.count > 0).map((i) => (
          <Text key={i.foodId} style={styles.small} numberOfLines={1}>
            {FOOD_BY_ID[i.foodId]?.nameBn ?? i.foodId} × {toBanglaDigits(i.count)}
          </Text>
        ))}
        {plate.unknown.map((u) => (
          <Text key={u} style={[styles.small, { color: colors.riskModerate }]} numberOfLines={1}>
            {u} (হিসাবে নেই)
          </Text>
        ))}
      </View>
    </View>
  );
}

// One plain-language takeaway with an icon.
function Line({ icon, text, warn = false }: { icon: 'show_chart' | 'check' | 'info' | 'warning'; text: string; warn?: boolean }) {
  return (
    <View style={styles.line}>
      <Icon name={icon} size={18} color={warn ? colors.riskHigh : colors.textPrimary} />
      <Text style={[styles.lineText, warn ? { color: colors.riskHigh } : null]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 16, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  topTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  intro: { fontFamily: fonts.bangla, fontSize: 14, lineHeight: 20, color: colors.textSecondary, paddingHorizontal: 4 },
  columns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 12, gap: 6 },
  photo: { height: 96, borderRadius: radius.tile, backgroundColor: colors.bgSurfaceMuted },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  columnHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  colDot: { width: 10, height: 10, borderRadius: 5 },
  columnTitle: { fontFamily: fonts.banglaBold, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  peak: { fontFamily: fonts.banglaBold, fontSize: 22, lineHeight: 30, color: colors.textPrimary },
  chip: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16 },
  stat: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 19, color: colors.textPrimary },
  foods: { gap: 2, marginTop: 4 },
  card: { backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 16, gap: 10 },
  cardTitle: { fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 3, borderRadius: 2 },
  line: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  lineText: { flex: 1, fontFamily: fonts.bangla, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  small: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  disclaimer: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 17, color: colors.textSecondary, textAlign: 'center' },
});
