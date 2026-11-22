import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { goHomeFresh } from '../lib/nav';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import Icon from '../components/Icon';
import RiskGauge from '../components/RiskGauge';
import { loadRisk, loadProfile, RiskRecord, Profile } from '../lib/storage';
import { scoreDar, getElement, DarBand, DarResult } from '../lib/dar';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// What we say for each band (wording follows docs/LOGIC.md and the safety rules in docs/RULES.md).
const bandText: Record<DarBand, { chip: string; color: string; soft: string; title: string; titleEn: string; advice: string }> = {
  low: {
    chip: 'কম ঝুঁকি · Low risk',
    color: colors.riskLow,
    soft: colors.riskLowSoft,
    title: 'সাবধানে রোজা রাখতে পারেন',
    titleEn: 'You can fast with care',
    advice: 'রোজার আগে একবার ডাক্তারের সাথে কথা বলে নিন, বিশেষ করে ওষুধ নিলে।',
  },
  moderate: {
    chip: 'মাঝারি ঝুঁকি · Moderate risk',
    color: colors.riskModerate,
    soft: colors.riskModerateSoft,
    title: 'রোজায় কিছুটা ঝুঁকি আছে',
    titleEn: 'Fasting has some risk',
    advice: 'রোজার দিনে বারবার সুগার মাপুন। রোজার আগে ডাক্তারের সাথে কথা বলুন।',
  },
  high: {
    chip: 'উচ্চ ঝুঁকি · High risk',
    color: colors.riskHigh,
    soft: colors.riskHighSoft,
    title: 'রোজা রাখা আপনার জন্য নিরাপদ নাও হতে পারে',
    titleEn: 'Fasting may not be safe for you',
    advice: 'রোজা রাখার আগে অবশ্যই ডাক্তার দেখান।',
  },
};

// Builds a plain-text summary the user can send to their doctor (WhatsApp, SMS, etc.).
function reportText(profile: Profile, record: RiskRecord, result: DarResult): string {
  const lines = [
    'রোজা-সেফ · রোজার ঝুঁকি যাচাই (IDF-DAR 2021)',
    `নাম: ${profile.name || '—'}, বয়স: ${profile.age ? toBanglaDigits(profile.age) : '—'}`,
    `তারিখ: ${new Date(record.date).toLocaleDateString('bn-BD')}`,
    `স্কোর: ${toBanglaDigits(result.score)} · ${bandText[result.band].chip}`,
    '',
    'উত্তর:',
    ...Object.entries(record.answers).map(([id, optId]) => {
      const el = getElement(id);
      const opt = el.options.find((o) => o.id === optId);
      return `• ${el.questionEn}: ${opt ? opt.labelEn : optId} (${toBanglaDigits(opt ? opt.points : 0)})`;
    }),
    '',
    'স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only',
  ];
  return lines.join('\n');
}

// Screen 03 · Risk Result: gauge with the score, band chip, what it means, why, and next steps.
export default function RiskResultScreen() {
  const insets = useSafeAreaInsets();
  const [record, setRecord] = useState<RiskRecord | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);

  // Load the saved result. If there is none (e.g. opened directly), send the user to the quiz.
  useEffect(() => {
    Promise.all([loadRisk(), loadProfile()]).then(([r, p]) => {
      if (!r) setMissing(true);
      setRecord(r);
      setProfile(p);
    });
  }, []);

  useEffect(() => {
    if (missing) router.replace('/risk-quiz');
  }, [missing]);

  if (!record || !profile) return <View style={styles.screen} />;

  const result = scoreDar(record.answers); // re-score from the saved answers, so it always matches the table
  const look = bandText[result.band];
  const quickQuiz = result.unanswered.length > 0; // some IDF-DAR questions were skipped

  // Opens the phone's share menu with the text report.
  async function share() {
    try {
      await Share.share({ message: reportText(profile!, record!, result) });
    } catch {
      // Sharing not available (e.g. some browsers) — nothing else to do.
    }
  }

  const goHome = () => goHomeFresh();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={goHome} accessibilityRole="button" accessibilityLabel="বন্ধ করুন (Close)" hitSlop={8} style={styles.roundButton}>
            <Icon name="close" size={22} />
          </Pressable>
          <Text style={styles.topTitle}>আপনার ফলাফল</Text>
          <View style={styles.topBarSpace} />
        </View>

        <View style={styles.scoreCard}>
          <RiskGauge score={result.score} color={look.color} />
          <View style={[styles.bandChip, { backgroundColor: look.soft }]}>
            <View style={[styles.dot, { backgroundColor: look.color }]} />
            <Text style={[styles.bandChipText, { color: look.color }]}>{look.chip}</Text>
          </View>
          <View style={styles.legend}>
            <LegendDot color={colors.riskLow} label="কম" />
            <LegendDot color={colors.riskModerate} label="মাঝারি" />
            <LegendDot color={colors.riskHigh} label="উচ্চ" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{look.title}</Text>
          <Text style={styles.titleEn}>{look.titleEn}</Text>
          <View style={[styles.advice, { backgroundColor: look.soft }]}>
            <Icon name="stethoscope" size={20} color={look.color} />
            <Text style={styles.adviceText}>{look.advice}</Text>
          </View>
          <Text style={styles.why}>কেন এই ফলাফল?</Text>
          {result.reasons.length > 0 ? (
            <View style={styles.reasons}>
              {result.reasons.slice(0, 4).map((r) => (
                <View key={r.text} style={styles.reasonChip}>
                  <View style={[styles.dot, { backgroundColor: r.points >= 3.5 ? colors.riskHigh : colors.riskModerate }]} />
                  <Text style={styles.reasonText}>{r.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noReasons}>আপনার উত্তরে বড় কোনো ঝুঁকি পাওয়া যায়নি।</Text>
          )}
          {result.checks.length > 0 ? (
            <>
              <Text style={styles.why}>যা পরীক্ষা করানো দরকার</Text>
              <View style={styles.reasons}>
                {result.checks.map((c) => (
                  <View key={c} style={styles.reasonChip}>
                    <Icon name="help" size={14} color={colors.textSecondary} />
                    <Text style={styles.reasonText}>{c}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          {quickQuiz && result.band !== 'high' ? (
            <Text style={styles.note}>
              এটি ছোট যাচাই, কয়েকটি প্রশ্ন বাদ রাখা হয়েছে। তাই আসল ঝুঁকি কিছুটা বেশি হতে পারে।
            </Text>
          ) : null}
        </View>

        <Button label="ডাক্তারকে দেখানোর রিপোর্ট" sub="Share report with doctor" icon="ios_share" variant="Secondary" onPress={share} />
        <Button label="হোমে যান" sub="Go to home" onPress={goHome} />

        <View style={styles.disclaimer}>
          <Icon name="info" size={14} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// One coloured dot with a word, for the Low / Moderate / High legend.
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  topBarSpace: { width: 44, height: 44 },
  topTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  scoreCard: { backgroundColor: colors.bgSurface, borderRadius: radius.card, paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', gap: 8 },
  bandChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  bandChipText: { fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  card: { backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 20, gap: 10 },
  title: { fontFamily: fonts.banglaBold, fontSize: 20, lineHeight: 28, color: colors.textPrimary },
  titleEn: { fontFamily: fonts.english, fontSize: 14, lineHeight: 17, color: colors.textSecondary },
  advice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.input, padding: 12 },
  adviceText: { flex: 1, fontFamily: fonts.banglaMedium, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  why: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSurfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reasonText: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  noReasons: { fontFamily: fonts.bangla, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  note: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  disclaimerText: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
