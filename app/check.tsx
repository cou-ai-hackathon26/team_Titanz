import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import SymptomTile from '../components/SymptomTile';
import Icon, { IconName } from '../components/Icon';
import { goBack, goHomeFresh } from '../lib/nav';
import { loadProfile } from '../lib/storage';
import { findDistrict, fastTimes } from '../lib/places';
import { minutesToIftar } from '../lib/hypo';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// The four low-sugar warning signs from the Figma design.
const SYMPTOMS: { id: string; icon: IconName; label: string; sub: string }[] = [
  { id: 'dizzy', icon: 'cyclone', label: 'মাথা ঘোরা', sub: 'Dizzy' },
  { id: 'sweat', icon: 'water_drop', label: 'ঠান্ডা ঘাম', sub: 'Cold sweat' },
  { id: 'shaky', icon: 'vibration', label: 'শরীর কাঁপা', sub: 'Shaky' },
  { id: 'blurred', icon: 'visibility_off', label: 'চোখে ঝাপসা', sub: 'Blurred vision' },
];

// "ইফতারের বাকি ২ ঘণ্টা ১৮ মিনিট" (written out, never "2:18"), or null after iftar.
function countdownText(minutes: number): string | null {
  if (minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [h > 0 ? `${toBanglaDigits(h)} ঘণ্টা` : '', m > 0 ? `${toBanglaDigits(m)} মিনিট` : ''].filter(Boolean);
  return `ইফতারের বাকি ${parts.join(' ')}`;
}

// Screen 08 · Pre-Iftar Check: "Any of these right now?" Tap symptoms, then Yes (→ emergency steps) or No.
export default function PreIftarCheckScreen() {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [feelsNormal, setFeelsNormal] = useState(false);

  // Work out the time left to iftar from the user's district (refreshes every minute).
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let closed = false; // the screen was closed before the profile loaded
    loadProfile().then((p) => {
      const district = findDistrict(p.districtId);
      if (!district || closed) return;
      const update = () => setCountdown(countdownText(minutesToIftar(fastTimes(district).iftar)));
      update();
      timer = setInterval(update, 60_000);
    });
    return () => {
      closed = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  // Selects or unselects a symptom.
  function toggle(id: string) {
    setFeelsNormal(false);
    setPicked(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);
  }

  const hasSymptoms = picked.length > 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BackButton onPress={() => goBack('/home')} />
          {countdown ? (
            <View style={styles.timeChip}>
              <Icon name="schedule" size={16} />
              <Text style={styles.timeText}>{countdown}</Text>
            </View>
          ) : null}
          <View style={styles.topBarSpace} />
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>এখন কি এর কোনোটা হচ্ছে?</Text>
          <Text style={styles.subtitle}>Any of these right now? Tap all that apply.</Text>
        </View>

        <View style={styles.grid}>
          {SYMPTOMS.map((s) => (
            <View key={s.id} style={styles.cell}>
              <SymptomTile icon={s.icon} label={s.label} sub={s.sub} selected={picked.includes(s.id)} onPress={() => toggle(s.id)} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Icon name="bloodtype" size={22} color={colors.riskHigh} />
          <Text style={styles.cardText}>নিশ্চিত না হলে এখনই গ্লুকোমিটারে সুগার মাপুন।</Text>
        </View>

        {feelsNormal ? (
          <View style={[styles.card, styles.okCard]}>
            <Icon name="check" size={22} color={colors.riskLow} />
            <Text style={styles.cardText}>ভালো! ইফতার পর্যন্ত শরীরের দিকে খেয়াল রাখুন। মাথা ঘোরা, ঘাম বা কাঁপুনি হলে আবার এই চেক করুন।</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        <Button
          label="হ্যাঁ, লক্ষণ আছে"
          sub="Yes, I have symptoms"
          icon="warning"
          variant="Danger"
          onPress={() => router.push({ pathname: '/emergency', params: { symptoms: picked.join(',') } })}
        />
        {feelsNormal ? (
          <Button label="হোমে যান" sub="Go to home" variant="Secondary" onPress={() => goHomeFresh()} />
        ) : (
          // With a symptom ticked, "I feel normal" makes no sense, so it is turned off.
          <Button label="না, ভালো আছি" sub="I feel normal" variant="Secondary" onPress={() => setFeelsNormal(true)} disabled={hasSymptoms} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgSurface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  timeText: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  heading: { gap: 6 },
  title: { fontFamily: fonts.banglaBold, fontSize: 28, lineHeight: 38, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.english, fontSize: 15, lineHeight: 18, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgSurface, borderRadius: radius.tile, padding: 16 },
  okCard: { backgroundColor: colors.riskLowSoft },
  cardText: { flex: 1, fontFamily: fonts.bangla, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  bottom: { gap: 10, paddingTop: 12, paddingHorizontal: 20, backgroundColor: colors.bgApp },
});
