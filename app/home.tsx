import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Icon from '../components/Icon';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import ReadingSheet from '../components/ReadingSheet';
import { loadProfile, loadReadings, loadMealPlans, Profile, Reading, MealPlan } from '../lib/storage';
import { findDistrict, fastTimes, formatClock, District } from '../lib/places';
import { adviceFor } from '../lib/hypo';
import { FORECAST } from '../lib/forecast';
import { dayPart, hoursAndMinutes, minutesOfDay, sameDay, shortDate, WEEKDAYS_BN } from '../lib/time';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// What the big lime card shows: time left to iftar during the fast, or to sehri after iftar.
function fastStatus(district: District, now: Date) {
  const nowMin = minutesOfDay(now);
  const today = fastTimes(district, now);
  if (nowMin < today.iftar) {
    // Fasting part of the day: count down to iftar; the ring fills from sehri end to iftar.
    const progress = Math.min(1, Math.max(0, (nowMin - today.sehriEnd) / (today.iftar - today.sehriEnd)));
    return { mode: 'iftar' as const, left: today.iftar - nowMin, at: today.iftar, progress };
  }
  // After iftar: count down to tomorrow's sehri end.
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sehri = fastTimes(district, tomorrow).sehriEnd;
  return { mode: 'sehri' as const, left: sehri + 24 * 60 - nowMin, at: sehri, progress: 0 };
}

// Status chip for a sugar reading: কম (low), স্বাভাবিক (normal) or বেশি (high).
function readingStatus(value: number) {
  const advice = adviceFor(value);
  if (advice === 'break-fast') return { text: 'কম', color: colors.riskHigh, soft: colors.riskHighSoft };
  if (advice === 'high' || advice === 'very-high') return { text: 'বেশি', color: colors.riskModerate, soft: colors.riskModerateSoft };
  return { text: 'স্বাভাবিক', color: colors.riskLow, soft: colors.riskLowSoft };
}

// The 7 days ending today, each with the result of that day's saved iftar plan (if any).
function weekDays(plans: MealPlan[], now: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const plan = plans.find((p) => sameDay(new Date(p.date), day)); // newest first, so this is the latest that day
    const status = !plan ? 'none' : plan.peakAfter > FORECAST.SAFE_HIGH ? 'high' : 'safe';
    return { day, status, isToday: i === 6 };
  });
}

// Screen 04 · Home: greeting, iftar countdown, last sugar, this week, pre-iftar check, bottom nav.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [now, setNow] = useState(new Date());
  const [logOpen, setLogOpen] = useState(false);

  // Reload saved data every time Home is shown (e.g. after saving a plan or a reading).
  const reload = useCallback(() => {
    Promise.all([loadProfile(), loadReadings(), loadMealPlans()]).then(([p, r, m]) => {
      setProfile(p);
      setReadings(r);
      setPlans(m);
    });
  }, []);
  useFocusEffect(reload);

  // Tick the clock once a minute so the countdown stays right.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // After a reading: if it is dangerous, go straight to the emergency steps.
  function onReadingSaved(value: number) {
    setLogOpen(false);
    reload();
    const advice = adviceFor(value);
    if (advice === 'break-fast' || advice === 'very-high') router.push({ pathname: '/emergency', params: { reading: String(value) } });
  }

  if (!profile) return <View style={styles.screen} />;

  const district = findDistrict(profile.districtId);
  const fast = district ? fastStatus(district, now) : null;
  const left = fast ? hoursAndMinutes(fast.left) : null;
  const last = readings[0];
  const lastDate = last ? new Date(last.date) : null;
  const status = last ? readingStatus(last.value) : null;
  const week = weekDays(plans, now);
  const daysWithPlan = week.filter((d) => d.status !== 'none').length;
  const safeDays = week.filter((d) => d.status === 'safe').length;
  const initial = profile.name.trim().charAt(0) || '?';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: NAV_HEIGHT + insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.hello}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="প্রোফাইল ও সেটিংস (Profile and settings)"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.salam}>আসসালামু আলাইকুম</Text>
              <Text style={styles.name}>{profile.name || 'বন্ধু'}</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/iftar', params: { edit: '1' } })}
            accessibilityRole="button"
            accessibilityLabel="মনে করিয়ে দেওয়ার সেটিং (Reminder settings)"
            style={styles.roundButton}
            hitSlop={8}
          >
            <Icon name="notifications" size={22} />
          </Pressable>
        </View>

        {/* Big lime card: iftar (or sehri) countdown */}
        {fast && left ? (
          <View style={styles.countdown} accessible accessibilityLabel={`${fast.mode === 'iftar' ? 'ইফতারের' : 'সেহরির'} বাকি ${left.h} ঘণ্টা ${left.m} মিনিট`}>
            <View style={styles.countdownText}>
              <View style={styles.whiteChip}>
                <Icon name="schedule" size={16} />
                <Text style={styles.whiteChipText}>{fast.mode === 'iftar' ? 'ইফতারের সময়' : 'সেহরির সময়'}</Text>
              </View>
              <View style={styles.bigRow}>
                {left.h > 0 ? (
                  <>
                    <Text style={styles.bigNumber}>{toBanglaDigits(left.h)}</Text>
                    <Text style={styles.bigUnit}>ঘণ্টা</Text>
                  </>
                ) : null}
                <Text style={styles.bigNumber}>{toBanglaDigits(left.m)}</Text>
                <Text style={styles.bigUnit}>মিনিট বাকি</Text>
              </View>
              <Text style={styles.atText}>
                {fast.mode === 'iftar' ? 'ইফতার' : 'সেহরি শেষ'} {dayPart(fast.at)} {formatClock(fast.at)}
              </Text>
            </View>
            <DayRing progress={fast.progress} />
          </View>
        ) : (
          <Pressable style={styles.countdown} onPress={() => router.push({ pathname: '/iftar', params: { edit: '1' } })} accessibilityRole="button">
            <Text style={styles.atText}>সেহরি ও ইফতারের সময় দেখতে আপনার জেলা বেছে নিন</Text>
            <Icon name="arrow_forward" size={22} />
          </Pressable>
        )}

        {/* Last sugar reading (tap to add a new one) */}
        <Pressable
          style={styles.card}
          onPress={() => setLogOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={last ? `শেষ সুগার ${last.value}, ${status?.text}. নতুন মাপ লিখতে চাপুন` : 'সুগারের মাপ লিখুন'}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardLabel}>
              {last && lastDate
                ? `শেষ সুগার · ${sameDay(lastDate, now) ? '' : `${shortDate(lastDate)} `}${dayPart(minutesOfDay(lastDate))} ${formatClock(minutesOfDay(lastDate))}`
                : 'শেষ সুগার'}
            </Text>
            <View style={styles.smallIcon}>
              <Icon name="water_drop" size={18} />
            </View>
          </View>
          {last && status ? (
            <View style={styles.readingRow}>
              <Text style={styles.readingValue}>{toBanglaDigits(last.value.toFixed(1))}</Text>
              <Text style={styles.readingUnit}>mmol/L</Text>
              <View style={[styles.statusChip, { backgroundColor: status.soft }]}>
                <View style={[styles.dot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>এখনো কোনো মাপ নেই — এখানে চেপে লিখুন</Text>
          )}
        </Pressable>

        {/* This week: one dot per day with a saved iftar plan */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.weekTitle}>এই সপ্তাহ</Text>
            {daysWithPlan > 0 ? (
              <View style={styles.limeChip}>
                <Text style={styles.limeChipText}>
                  {toBanglaDigits(safeDays)}/{toBanglaDigits(daysWithPlan)} নিরাপদ
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.week}>
            {week.map((d) => (
              <View key={d.day.toISOString()} style={[styles.day, d.isToday ? styles.today : null]}>
                <Text style={styles.dayName}>{WEEKDAYS_BN[d.day.getDay()]}</Text>
                <Text style={[styles.dayNumber, d.isToday ? styles.dayNumberToday : null]}>{toBanglaDigits(d.day.getDate())}</Text>
                <View
                  style={[
                    styles.dayDot,
                    { backgroundColor: d.status === 'safe' ? colors.riskLow : d.status === 'high' ? colors.riskHigh : colors.borderDefault },
                  ]}
                />
              </View>
            ))}
          </View>
          {daysWithPlan === 0 ? <Text style={styles.weekHint}>ইফতারের প্লেট স্ক্যান করে পরিকল্পনা রাখলে এখানে দেখা যাবে।</Text> : null}
        </View>

        {/* Dark green card: pre-iftar check */}
        <Pressable style={styles.checkCard} onPress={() => router.push('/check')} accessibilityRole="button" accessibilityLabel="ইফতারের আগে শরীর চেক (Pre-iftar check)">
          <View style={styles.checkIcon}>
            <Icon name="health_and_safety" size={22} />
          </View>
          <View style={styles.checkText}>
            <Text style={styles.checkTitle}>ইফতারের আগে শরীর কেমন?</Text>
            <Text style={styles.checkSub}>মাথা ঘোরা বা ঘাম হলে এখনই চেক করুন</Text>
          </View>
          <Icon name="arrow_forward" size={24} color={colors.textOnBrand} />
        </Pressable>
      </ScrollView>

      <BottomNav active="home" />
      <ReadingSheet visible={logOpen} when="other" onClose={() => setLogOpen(false)} onSaved={onReadingSaved} />
    </View>
  );
}

// The ring on the lime card: fills as the fasting day passes, with a moon in the middle.
function DayRing({ progress }: { progress: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  return (
    <View style={styles.ring}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.bgSurface} strokeOpacity={0.6} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.bgBrandStrong}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length * progress} ${length}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} // start the fill at the top
        />
      </Svg>
      <View style={styles.ringIcon}>
        <Icon name="nightlight" size={26} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgBrandStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.banglaBold, fontSize: 20, lineHeight: 26, color: colors.textOnBrand },
  salam: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  name: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  countdown: { backgroundColor: colors.bgPage, borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  countdownText: { flex: 1, gap: 4, alignItems: 'flex-start' },
  whiteChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgSurface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  whiteChipText: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' },
  bigNumber: { fontFamily: fonts.banglaBold, fontSize: 40, lineHeight: 56, color: colors.textPrimary },
  bigUnit: { fontFamily: fonts.banglaMedium, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  atText: { flexShrink: 1, fontFamily: fonts.bangla, fontSize: 14, lineHeight: 19, color: colors.textPrimary, opacity: 0.7 },
  ring: { width: 96, height: 96 },
  ringIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 18, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { flex: 1, fontFamily: fonts.bangla, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  smallIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSurfaceMuted, alignItems: 'center', justifyContent: 'center' },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readingValue: { fontFamily: fonts.banglaBold, fontSize: 32, lineHeight: 38, color: colors.textPrimary },
  readingUnit: { fontFamily: fonts.english, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: fonts.banglaMedium, fontSize: 13, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { fontFamily: fonts.banglaMedium, fontSize: 15, lineHeight: 21, color: colors.textBrand },
  weekTitle: { fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  limeChip: { backgroundColor: colors.bgPage, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  limeChipText: { fontFamily: fonts.banglaMedium, fontSize: 12, lineHeight: 16, color: colors.textPrimary },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 20 },
  today: { backgroundColor: colors.bgPage },
  dayName: { fontFamily: fonts.bangla, fontSize: 11, lineHeight: 15, color: colors.textSecondary },
  dayNumber: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  dayNumberToday: { fontFamily: fonts.banglaBold },
  dayDot: { width: 6, height: 6, borderRadius: 3 },
  weekHint: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  checkCard: { backgroundColor: colors.bgBrandStrong, borderRadius: radius.card, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, gap: 2 },
  checkTitle: { fontFamily: fonts.banglaBold, fontSize: 16, lineHeight: 22, color: colors.textOnBrand },
  checkSub: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textOnBrand, opacity: 0.7 },
});
