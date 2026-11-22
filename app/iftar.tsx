import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import { router } from 'expo-router';
import SetupLayout from '../components/SetupLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Toggle from '../components/Toggle';
import Icon, { IconName } from '../components/Icon';
import PickerSheet from '../components/PickerSheet';
import { loadProfile, saveProfile } from '../lib/storage';
import { districts, findDistrict, fastTimes, formatClock } from '../lib/places';
import { onlyDigits, toBanglaDigits } from '../lib/bangla';
import { colors, fonts, radius } from '../theme/tokens';

// Checks a Bangladeshi mobile number typed after +880 (10 digits, starts with 13–19).
function isValidPhone(digits: string): boolean {
  return /^1[3-9][0-9]{8}$/.test(digits);
}

// Shows "1819234567" as "১৮১৯ ২৩৪ ৫৬৭" (Bangla digits, grouped like the Figma design).
function formatPhone(digits: string): string {
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10)].filter(Boolean);
  return toBanglaDigits(parts.join(' '));
}

// Screen 00h · Iftar & contact (setup step 2 of 2): district (for sehri/iftar times),
// optional family number for emergencies, and the pre-iftar reminder switch.
export default function IftarScreen() {
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [phone, setPhone] = useState(''); // 10 digits after +880
  const [reminder, setReminder] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false); // true after the user leaves the number field

  // Fill in anything the user already saved.
  useEffect(() => {
    loadProfile().then((p) => {
      setDistrictId(p.districtId);
      setPhone(p.familyPhone);
      setReminder(p.reminder);
    });
  }, []);

  const district = findDistrict(districtId);
  const times = district ? fastTimes(district) : null;
  const phoneOk = phone === '' || isValidPhone(phone); // the number is optional
  const showPhoneError = !phoneOk && (phoneTouched || phone.length === 10); // don't nag while still typing
  const canContinue = !!district && phoneOk;

  // Reads the typed number. Also accepts it written with the leading 0 (01819…).
  function onPhoneChange(text: string) {
    let digits = onlyDigits(text);
    if (digits.startsWith('0')) digits = digits.slice(1);
    setPhone(digits.slice(0, 10));
  }

  // Save everything, mark setup as done, and start the risk check.
  async function finish() {
    await saveProfile({ districtId, familyPhone: phone, reminder, onboarded: true });
    router.push('/risk-quiz');
  }

  return (
    <SetupLayout
      backTo="/about-you"
      step={2}
      totalSteps={2}
      title="ইফতারের সময় ও জরুরি যোগাযোগ"
      subtitle="আপনার এলাকার সময় অনুযায়ী মনে করিয়ে দেব"
      bottom={<Button label="ঝুঁকি যাচাই শুরু করুন" sub="Start risk check" onPress={finish} disabled={!canContinue} />}
    >
      <Input
        label="আপনার জেলা"
        value={district ? district.name : ''}
        placeholder="জেলা বেছে নিন"
        suffixIcon="expand_more"
        onPress={() => setPickerOpen(true)}
      />

      {times ? (
        <View style={styles.timesCard}>
          <TimeItem icon="wb_twilight" label="সেহরি শেষ" time={formatClock(times.sehriEnd)} />
          <TimeItem icon="nightlight" label="ইফতার" time={formatClock(times.iftar)} />
        </View>
      ) : null}

      <View style={styles.phoneBlock}>
        <Input
          label="পরিবারের একজনের নম্বর (ঐচ্ছিক)"
          value={formatPhone(phone)}
          onChangeText={onPhoneChange}
          prefix="🇧🇩 +880"
          placeholder="১৮১৯ ২৩৪ ৫৬৭"
          keyboardType="phone-pad"
          digitsOnly
          maxLength={13}
          onBlur={() => setPhoneTouched(true)}
        />
        {!showPhoneError ? (
          <Text style={styles.help}>জরুরি অবস্থায় এক চাপে তাঁকে জানানো যাবে</Text>
        ) : (
          <Text style={[styles.help, styles.error]}>সঠিক মোবাইল নম্বর লিখুন (১০ সংখ্যা, যেমন ১৮১৯ ২৩৪ ৫৬৭)</Text>
        )}
      </View>

      <View style={styles.reminder}>
        <Icon name="notifications" size={22} />
        <Text style={styles.reminderText}>ইফতারের ১ ঘণ্টা আগে শরীর চেক করার কথা মনে করিয়ে দিন</Text>
        <Toggle value={reminder} onChange={setReminder} label="ইফতারের আগে মনে করিয়ে দিন" />
      </View>

      <PickerSheet
        visible={pickerOpen}
        title="আপনার জেলা"
        options={districts.map((d) => ({ id: d.id, label: d.name }))}
        selectedId={districtId}
        onPick={(id) => {
          setDistrictId(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SetupLayout>
  );
}

// One half of the "today's times" card: lime icon circle, small label, big time.
function TimeItem({ icon, label, time }: { icon: IconName; label: string; time: string }) {
  return (
    <View style={styles.timeItem}>
      <View style={styles.timeIcon}>
        <Icon name={icon} size={20} />
      </View>
      <View>
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={styles.timeValue}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timesCard: { backgroundColor: colors.bgSurface, borderRadius: radius.tile, padding: 16, flexDirection: 'row', gap: 12 },
  timeItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' },
  timeLabel: { fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  timeValue: { fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
  phoneBlock: { gap: 18 },
  help: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  error: { color: colors.riskHigh },
  reminder: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.tile,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderText: { flex: 1, fontFamily: fonts.banglaMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
});
