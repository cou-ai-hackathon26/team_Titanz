import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import Icon from '../components/Icon';
import ReadingSheet from '../components/ReadingSheet';
import { loadProfile, Profile } from '../lib/storage';
import { adviceFor, HELPLINE, HYPO_BELOW, HYPER_ABOVE, ReadingAdvice } from '../lib/hypo';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// The 3 safety steps (IDF-DAR 2021; docs/LOGIC.md section 5). Shown every time, never hidden.
const STEPS = [
  { title: 'এখনই সুগার মাপুন', sub: 'Check your blood sugar now', subEnglish: true },
  { title: `${toBanglaDigits(HYPO_BELOW)} mmol/L (${toBanglaDigits(70)} mg/dL)-এর নিচে হলে রোজা ভাঙুন`, sub: 'মিষ্টি শরবত বা ৩টি খেজুর খান — গাইডলাইন অনুযায়ী', subEnglish: false },
  { title: '১৫ মিনিট পর আবার মাপুন', sub: 'এখনও কম বা খারাপ লাগলে চিকিৎসা নিন', subEnglish: false },
];

// What we say after the user types a reading. No medicine advice, only the safety steps.
const ADVICE: Record<ReadingAdvice, { color: string; soft: string; text: (v: string) => string }> = {
  'break-fast': {
    color: colors.riskHigh,
    soft: colors.riskHighSoft,
    text: (v) => `সুগার কম (${v})। এখনই রোজা ভাঙুন: মিষ্টি শরবত বা ৩টি খেজুর খান। ১৫ মিনিট পর আবার মাপুন।`,
  },
  recheck: {
    color: colors.riskModerate,
    soft: colors.riskModerateSoft,
    text: (v) => `সুগার ${v}। লক্ষণ থাকলে ১৫ মিনিট পর আবার মাপুন। ${toBanglaDigits(HYPO_BELOW)}-এর নিচে নামলে রোজা ভাঙুন।`,
  },
  ok: {
    color: colors.riskLow,
    soft: colors.riskLowSoft,
    text: (v) => `সুগার স্বাভাবিক (${v})। তবু খারাপ লাগলে চিকিৎসকের সাথে যোগাযোগ করুন।`,
  },
  high: {
    color: colors.riskModerate,
    soft: colors.riskModerateSoft,
    text: (v) => `সুগার বেশি (${v})। পানি পান করুন, কিছুক্ষণ পর আবার মাপুন। ${toBanglaDigits(HYPER_ABOVE)}-এর বেশি হলে রোজা ভাঙুন।`,
  },
  'very-high': {
    color: colors.riskHigh,
    soft: colors.riskHighSoft,
    text: (v) => `সুগার অনেক বেশি (${v})। এখনই রোজা ভাঙুন, পানি পান করুন এবং চিকিৎসকের সাথে যোগাযোগ করুন।`,
  },
};

// Screen 09 · Emergency Steps: what to do right now if sugar may be low, plus call helpline / alert family.
export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  // A reading passed from Home (e.g. 3.0) is shown straight away.
  const { reading } = useLocalSearchParams<{ reading?: string }>();
  const passed = reading !== undefined && Number.isFinite(Number(reading)) ? Number(reading) : null;
  const [result, setResult] = useState<{ advice: ReadingAdvice; value: number } | null>(
    passed !== null ? { advice: adviceFor(passed), value: passed } : null,
  );
  const [notice, setNotice] = useState(''); // shown if the phone cannot open the dialer / SMS app

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  // Opens the phone's dialer with the health helpline.
  async function callHelpline() {
    if (Platform.OS === 'web') {
      // A computer cannot place a phone call; on the phone app this opens the dialer.
      setNotice(`এখান থেকে কল করা যায় না। ফোন থেকে ${toBanglaDigits(HELPLINE)} নম্বরে কল করুন।`);
      return;
    }
    try {
      await Linking.openURL(`tel:${HELPLINE}`);
    } catch {
      setNotice(`এই ফোন থেকে কল খোলা যায়নি। নিজে ${toBanglaDigits(HELPLINE)} নম্বরে কল করুন।`);
    }
  }

  // Opens the SMS app with a short message to the family number. The user presses Send.
  async function alertFamily() {
    if (!profile?.familyPhone) {
      router.push('/iftar'); // no number yet: let them add one
      return;
    }
    const who = profile.name ? profile.name : 'আমি';
    const message = `${who}: আমার সুগার কমে যেতে পারে, এখনই আমার কাছে আসুন। (Roza-Safe)`;
    if (Platform.OS === 'web') {
      // A computer has no SMS app; on the phone app this opens Messages with the text ready.
      setNotice(`এখান থেকে মেসেজ পাঠানো যায় না। ফোন থেকে +৮৮০ ${toBanglaDigits(profile.familyPhone)} নম্বরে জানান।`);
      return;
    }
    const joiner = Platform.OS === 'ios' ? '&' : '?';
    try {
      await Linking.openURL(`sms:+880${profile.familyPhone}${joiner}body=${encodeURIComponent(message)}`);
    } catch {
      setNotice('এই ফোন থেকে মেসেজ খোলা যায়নি। পরিবারের কাউকে নিজে ফোন করুন।');
    }
  }

  // Shows what to do next after a reading was saved.
  function onReadingSaved(value: number) {
    setResult({ advice: adviceFor(value), value });
    setLogOpen(false);
  }

  const hasFamily = !!profile?.familyPhone;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/home')} accessibilityRole="button" accessibilityLabel="বন্ধ করুন (Close)" hitSlop={8} style={styles.roundButton}>
            <Icon name="close" size={22} />
          </Pressable>
          <View style={styles.urgentChip}>
            <View style={styles.dot} />
            <Text style={styles.urgentText}>জরুরি · Urgent</Text>
          </View>
          <View style={styles.topBarSpace} />
        </View>

        <View style={styles.heading}>
          <View style={styles.bigIcon}>
            <Icon name="emergency" size={34} color={colors.textOnBrand} />
          </View>
          <Text style={styles.title}>এখনই ব্যবস্থা নিন</Text>
          <Text style={styles.subtitle}>সুগার কমে যেতে পারে · Possible low blood sugar</Text>
        </View>

        {result ? (
          <View style={[styles.resultBox, { backgroundColor: ADVICE[result.advice].soft }]} accessibilityLiveRegion="polite">
            <Icon name={result.advice === 'ok' ? 'check' : 'warning'} size={22} color={ADVICE[result.advice].color} />
            <Text style={styles.resultText}>{ADVICE[result.advice].text(toBanglaDigits(result.value.toFixed(1)))}</Text>
          </View>
        ) : null}

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.step}>
                <View style={styles.stepNo}>
                  <Text style={styles.stepNoText}>{toBanglaDigits(i + 1)}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={step.subEnglish ? styles.stepSubEn : styles.stepSub}>{step.sub}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Button label="সুগারের মাপ লিখুন" sub="Log my reading" icon="edit" variant="Secondary" onPress={() => setLogOpen(true)} />

        <View style={styles.faithCard}>
          <Icon name="menu_book" size={22} />
          <Text style={styles.faithText}>অসুস্থতায় রোজা ভাঙার অনুমতি আছে — জীবন রক্ষা আগে।</Text>
        </View>

        <View style={styles.disclaimer}>
          <Icon name="info" size={14} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        {notice ? (
          <Text style={styles.notice} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}
        <Button label={`জরুরি কল · ${toBanglaDigits(HELPLINE)}`} sub="Call health helpline" icon="call" variant="Danger" onPress={callHelpline} />
        <Button
          label="পরিবারকে জানান"
          sub={hasFamily ? 'Alert my family' : 'নম্বর দেওয়া নেই — যোগ করুন'}
          icon="send"
          variant="Secondary"
          onPress={alertFamily}
        />
      </View>

      <ReadingSheet visible={logOpen} when="emergency" onClose={() => setLogOpen(false)} onSaved={onReadingSaved} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  urgentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.riskHighSoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.riskHigh },
  urgentText: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.riskHigh },
  heading: { gap: 10 },
  bigIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.riskHigh, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.banglaBold, fontSize: 32, lineHeight: 40, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.bangla, fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  resultBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.tile, padding: 16 },
  resultText: { flex: 1, fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  steps: { backgroundColor: colors.bgSurface, borderRadius: radius.card, paddingHorizontal: 20, paddingVertical: 8 },
  divider: { height: 1, backgroundColor: colors.borderDefault },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  stepNo: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.riskHigh, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontFamily: fonts.banglaBold, fontSize: 16, lineHeight: 22, color: colors.textOnBrand },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  stepSub: { fontFamily: fonts.bangla, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  stepSubEn: { fontFamily: fonts.english, fontSize: 14, lineHeight: 17, color: colors.textSecondary },
  faithCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgSurfaceMuted, borderRadius: radius.tile, padding: 16 },
  faithText: { flex: 1, fontFamily: fonts.bangla, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  notice: { fontFamily: fonts.banglaSemiBold, fontSize: 14, lineHeight: 20, color: colors.riskHigh },
  disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  disclaimerText: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  bottom: { gap: 10, paddingTop: 12, paddingHorizontal: 20, backgroundColor: colors.bgApp },
});
