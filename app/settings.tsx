import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Share, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import Input from '../components/Input';
import Icon, { IconName } from '../components/Icon';
import { goBack } from '../lib/nav';
import {
  loadProfile, saveProfile, loadRisk, loadMealPlans, loadReadings, loadSettings, saveSettings, deleteAllData,
  Profile, RiskRecord,
} from '../lib/storage';
import { findDistrict } from '../lib/places';
import { isValidPhone, formatPhone, cleanPhoneInput } from '../lib/phone';
import { scanUrl, testScanServer, builtInScanUrl } from '../lib/scanApi';
import { backupText } from '../lib/backup';
import { toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

const typeBn = { type2: 'টাইপ ২', type1: 'টাইপ ১', unknown: 'ধরন জানা নেই' };
const bandBn = { low: 'কম ঝুঁকি', moderate: 'মাঝারি ঝুঁকি', high: 'উচ্চ ঝুঁকি' };

// Settings: profile, family number, risk check, AI scan server, backup, delete all data.
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [risk, setRisk] = useState<RiskRecord | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneMsg, setPhoneMsg] = useState('');
  const [server, setServer] = useState(''); // what the user typed (empty = built-in address)
  const [currentServer, setCurrentServer] = useState('');
  const [serverMsg, setServerMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load everything each time Settings is shown (e.g. after editing the profile).
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadProfile(), loadRisk(), loadSettings(), scanUrl()]).then(([p, r, s, url]) => {
        setProfile(p);
        setRisk(r);
        setPhone(p.familyPhone);
        setServer(s.scanUrl);
        setCurrentServer(url);
      });
    }, []),
  );

  if (!profile) return <View style={styles.screen} />;

  const phoneOk = phone === '' || isValidPhone(phone);
  const phoneChanged = phone !== profile.familyPhone;
  const district = findDistrict(profile.districtId);

  // Saves (or removes) the family number.
  async function savePhone() {
    if (!phoneOk) return;
    const p = await saveProfile({ familyPhone: phone });
    setProfile(p);
    setPhoneMsg(phone ? 'নম্বর সেভ হয়েছে।' : 'নম্বর মুছে ফেলা হয়েছে। "পরিবারকে জানান" এখন কন্টাক্টস খুলবে।');
  }

  // Checks whether the scan server answers, then saves the address if it works.
  async function testAndSaveServer() {
    const url = server.trim() || builtInScanUrl();
    if (!url) {
      setServerMsg({ text: 'কোনো ঠিকানা নেই। স্ক্যান সার্ভারের ঠিকানা লিখুন।', ok: false });
      return;
    }
    setTesting(true);
    const result = await testScanServer(url);
    setTesting(false);
    if (result === 'ok') {
      await saveSettings({ scanUrl: server.trim() });
      setCurrentServer(url);
      setServerMsg({ text: 'সার্ভার কাজ করছে, সেভ হয়েছে।', ok: true });
    } else {
      setServerMsg({
        text: result === 'no-answer' ? 'সার্ভার সাড়া দিচ্ছে না। ঠিকানা ও ইন্টারনেট দেখুন।' : 'এটি রোজা-সেফ স্ক্যান সার্ভার নয় বলে মনে হচ্ছে। ঠিকানা দেখুন।',
        ok: false,
      });
    }
  }

  // Opens the share menu with a full text backup.
  async function shareBackup() {
    const [r, plans, readings] = await Promise.all([loadRisk(), loadMealPlans(), loadReadings()]);
    const text = backupText({ profile: profile!, risk: r, plans, readings });
    try {
      await Share.share({ message: text, title: 'Roza-Safe backup' });
    } catch {
      setBackupMsg(Platform.OS === 'web' ? 'এখান থেকে শেয়ার করা যায় না। ফোন থেকে চেষ্টা করুন।' : 'শেয়ার করা যায়নি। আবার চেষ্টা করুন।');
    }
  }

  // Deletes everything and starts again from the Welcome screen.
  async function wipe() {
    await deleteAllData();
    router.replace('/');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <BackButton onPress={() => goBack('/home')} />
          <Text style={styles.topTitle}>সেটিংস</Text>
          <View style={styles.topBarSpace} />
        </View>

        {/* Profile */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name.trim().charAt(0) || '?'}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{profile.name || '—'}</Text>
              <Text style={styles.small}>
                {profile.age ? `${toBanglaDigits(profile.age)} বছর · ` : ''}
                {profile.diabetesType ? typeBn[profile.diabetesType] : ''}
                {district ? ` · ${district.name}` : ''}
              </Text>
            </View>
          </View>
          <LinkRow icon="edit" title="প্রোফাইল বদলান" sub="নাম, বয়স, ডায়াবেটিস, ওষুধ" onPress={() => router.push({ pathname: '/about-you', params: { edit: '1' } })} />
          <LinkRow icon="schedule" title="জেলা ও ইফতারের সময়" sub="মনে করিয়ে দেওয়া চালু/বন্ধ" onPress={() => router.push({ pathname: '/iftar', params: { edit: '1' } })} />
        </View>

        {/* Family number */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>জরুরি পরিবারের নম্বর</Text>
          <Input
            label="পরিবারের একজনের নম্বর (ঐচ্ছিক)"
            value={formatPhone(phone)}
            onChangeText={(t) => {
              setPhone(cleanPhoneInput(t));
              setPhoneMsg('');
            }}
            prefix="🇧🇩 +880"
            placeholder="১৮১৯ ২৩৪ ৫৬৭"
            keyboardType="phone-pad"
            maxLength={13}
            digitsOnly
          />
          {!phoneOk && phone.length === 10 ? <Text style={styles.error}>সঠিক মোবাইল নম্বর লিখুন (১০ সংখ্যা)।</Text> : null}
          <Text style={styles.small}>নম্বর না থাকলে "পরিবারকে জানান" ফোনের কন্টাক্টস খুলবে।</Text>
          {phoneMsg ? <Text style={styles.ok}>{phoneMsg}</Text> : null}
          {phoneChanged ? <Button label="নম্বর সেভ করুন" sub="Save number" onPress={savePhone} disabled={!phoneOk} /> : null}
        </View>

        {/* Risk check */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>রোজার ঝুঁকি যাচাই</Text>
          <Text style={styles.small}>
            {risk ? `শেষ ফলাফল: ${toBanglaDigits(risk.score)} · ${bandBn[risk.band]}` : 'এখনো যাচাই করা হয়নি।'}
          </Text>
          <Text style={styles.small}>প্রোফাইল বা ওষুধ বদলালে আবার যাচাই করুন।</Text>
          <LinkRow icon="quiz" title="আবার যাচাই করুন" sub="Redo risk check" onPress={() => router.push('/risk-quiz')} />
        </View>

        {/* AI scan server */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI স্ক্যান সার্ভার</Text>
          <Text style={styles.small}>
            নিরাপত্তার জন্য AI key অ্যাপে রাখা হয় না, স্ক্যান সার্ভারে থাকে। ফ্রি সীমা শেষ হলে সার্ভারে আরেকটি key যোগ করুন
            (GEMINI_API_KEY_2) — সার্ভার নিজেই পরেরটি ব্যবহার করবে।
          </Text>
          <Input
            label="সার্ভারের ঠিকানা (খালি = অ্যাপের নিজস্ব)"
            value={server}
            onChangeText={(t) => {
              setServer(t.trim());
              setServerMsg(null);
            }}
            placeholder={builtInScanUrl()}
            keyboardType="url"
          />
          <Text style={styles.small} numberOfLines={2}>
            এখন ব্যবহার হচ্ছে: {currentServer || 'কোনোটি নয়'}
          </Text>
          {serverMsg ? <Text style={serverMsg.ok ? styles.ok : styles.error}>{serverMsg.text}</Text> : null}
          <Button label={testing ? 'পরীক্ষা চলছে…' : 'পরীক্ষা ও সেভ'} sub="Test and save" variant="Secondary" onPress={testAndSaveServer} disabled={testing} />
        </View>

        {/* Backup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ব্যাকআপ</Text>
          <Text style={styles.small}>সব পরিকল্পনা, সুগারের মাপ ও ঝুঁকির ফলাফল একটি লেখা হিসেবে WhatsApp, ইমেইল বা Drive-এ রাখুন।</Text>
          {backupMsg ? <Text style={styles.error}>{backupMsg}</Text> : null}
          <Button label="ব্যাকআপ শেয়ার করুন" sub="Share backup" icon="ios_share" variant="Secondary" onPress={shareBackup} />
        </View>

        {/* Delete all */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>সব ডেটা মুছুন</Text>
          {confirmDelete ? (
            <>
              <Text style={styles.error}>নিশ্চিত? প্রোফাইল, পরিকল্পনা ও সব মাপ এই ফোন থেকে চিরতরে মুছে যাবে। আগে ব্যাকআপ নিন।</Text>
              <Button label="হ্যাঁ, সব মুছুন" sub="Yes, delete everything" variant="Danger" onPress={wipe} />
              <Button label="না, থাক" sub="Cancel" variant="Secondary" onPress={() => setConfirmDelete(false)} />
            </>
          ) : (
            <Button label="সব ডেটা মুছুন" sub="Delete all data" variant="Secondary" onPress={() => setConfirmDelete(true)} />
          )}
        </View>

        <View style={styles.about}>
          <Text style={styles.small}>রোজা-সেফ · সংস্করণ {toBanglaDigits(Constants.expoConfig?.version ?? '1.0.0')} · Team Titanz</Text>
          <Text style={styles.small}>সব তথ্য শুধু এই ফোনে থাকে। স্ক্যানের ছবি শুধু বিশ্লেষণে পাঠানো হয়, কোথাও সংরক্ষণ হয় না।</Text>
          <Text style={styles.small}>স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// A tappable row with an icon, title, small text and an arrow.
function LinkRow({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.linkRow, pressed ? styles.pressed : null]}>
      <View style={styles.linkIcon}>
        <Icon name={icon} size={20} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.small}>{sub}</Text>
      </View>
      <Icon name="arrow_forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { paddingHorizontal: 20, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarSpace: { width: 44, height: 44 },
  topTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  card: { backgroundColor: colors.bgSurface, borderRadius: radius.card, padding: 18, gap: 10 },
  cardTitle: { fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgBrandStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.banglaBold, fontSize: 22, lineHeight: 28, color: colors.textOnBrand },
  name: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  flex: { flex: 1 },
  small: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  ok: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 19, color: colors.riskLow },
  error: { fontFamily: fonts.banglaSemiBold, fontSize: 13, lineHeight: 19, color: colors.riskHigh },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderRadius: radius.input },
  pressed: { backgroundColor: colors.bgSurfaceMuted },
  linkIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSurfaceMuted, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontFamily: fonts.banglaSemiBold, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  about: { gap: 4, paddingHorizontal: 4 },
});
