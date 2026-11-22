import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import { colors, fonts, radius } from '../theme/tokens';
import { toBanglaDigits } from '../lib/bangla';
import { CARB_BANDS, CarbBand } from '../lib/meal';

const SCALE_END = 150; // grams at the right end of the bar; more than this sits at the very end ("১৫০+")

// Colours and words for each carb level.
const looks: Record<CarbBand, { strong: string; soft: string; chip: string; meaning: string }> = {
  low: { strong: colors.riskLow, soft: colors.riskLowSoft, chip: 'কম · Low', meaning: 'শর্করা কম — সুগার অল্প বাড়বে।' },
  moderate: {
    strong: colors.riskModerate,
    soft: colors.riskModerateSoft,
    chip: 'মাঝারি · Moderate',
    meaning: 'শর্করা মাঝারি — সুগার কিছুটা বাড়বে।',
  },
  high: {
    strong: colors.riskHigh,
    soft: colors.riskHighSoft,
    chip: 'বেশি · High',
    meaning: 'শর্করা বেশি — কিছু খাবার কমালে সুগার কম বাড়বে।',
  },
};

type Props = {
  carbs: number; // grams of carbohydrate on the plate
  band: CarbBand;
};

// The "শর্করার মাত্রা" bar: three sections sized by grams (0–45, 45–75, 75–150+),
// a marker showing exactly where this plate is, and one plain sentence saying what it means.
export default function CarbScale({ carbs, band }: Props) {
  const look = looks[band];
  const where = Math.min(Math.max(carbs / SCALE_END, 0), 1); // 0 = left end, 1 = right end
  const grams = Math.round(carbs);
  const [width, setWidth] = useState(0); // bar width in pixels, measured on screen
  const x = where * width; // the plate's exact spot on the bar
  const bubbleLeft = Math.min(Math.max(x - BUBBLE_WIDTH / 2, 0), Math.max(width - BUBBLE_WIDTH, 0)); // keep the number on screen

  // Width of each section, in proportion to its grams.
  const parts: { band: CarbBand; from: number; to: number; text: string }[] = [
    { band: 'low', from: 0, to: CARB_BANDS.lowBelow, text: `কম < ${toBanglaDigits(CARB_BANDS.lowBelow)}g` },
    { band: 'moderate', from: CARB_BANDS.lowBelow, to: CARB_BANDS.highAbove, text: `মাঝারি` },
    { band: 'high', from: CARB_BANDS.highAbove, to: SCALE_END, text: `বেশি > ${toBanglaDigits(CARB_BANDS.highAbove)}g` },
  ];

  return (
    <View style={styles.box} accessible accessibilityLabel={`শর্করার মাত্রা: ${grams} গ্রাম, ${look.chip}`}>
      <View style={styles.head}>
        <Text style={styles.title}>শর্করার মাত্রা</Text>
        <View style={[styles.chip, { backgroundColor: look.soft }]}>
          <Text style={[styles.chipText, { color: look.strong }]}>{look.chip}</Text>
        </View>
      </View>

      {/* Marker: the plate's grams in a bubble, with a pointer at its exact place on the bar */}
      <View style={styles.markerTrack} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <>
            <View style={[styles.bubble, { left: bubbleLeft, backgroundColor: look.strong }]}>
              <Text style={styles.bubbleText}>{toBanglaDigits(grams)}g</Text>
            </View>
            <View style={[styles.pointer, { left: Math.min(Math.max(x - 6, 0), width - 12), borderTopColor: look.strong }]} />
          </>
        ) : null}
      </View>

      <View style={styles.bar}>
        {parts.map((p) => (
          <View
            key={p.band}
            style={[styles.part, { flex: p.to - p.from, backgroundColor: p.band === band ? look.strong : looks[p.band].soft }]}
          />
        ))}
      </View>

      <View style={styles.labels}>
        {parts.map((p) => (
          <Text
            key={p.band}
            style={[styles.label, { flex: p.to - p.from }, p.band === 'moderate' ? styles.center : null, p.band === 'high' ? styles.right : null]}
            numberOfLines={1}
          >
            {p.text}
          </Text>
        ))}
      </View>

      <Text style={[styles.meaning, { color: look.strong }]}>{look.meaning}</Text>
    </View>
  );
}

const BUBBLE_WIDTH = 64;

const styles = StyleSheet.create({
  box: { gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  chip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.banglaSemiBold, fontSize: 12, lineHeight: 16 },
  markerTrack: { height: 32 },
  bubble: { position: 'absolute', top: 0, width: BUBBLE_WIDTH, alignItems: 'center', borderRadius: radius.pill, paddingVertical: 3 },
  bubbleText: { fontFamily: fonts.banglaBold, fontSize: 14, lineHeight: 19, color: colors.textOnBrand },
  pointer: {
    position: 'absolute',
    top: 25,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bar: { flexDirection: 'row', gap: 4, height: 10 },
  part: { height: 10, borderRadius: 5 },
  labels: { flexDirection: 'row', gap: 4 },
  label: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  meaning: { fontFamily: fonts.banglaSemiBold, fontSize: 14, lineHeight: 20, marginTop: 2 },
});
