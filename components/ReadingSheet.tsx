import { useState } from 'react';
import { Modal, Pressable, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Input from './Input';
import Button from './Button';
import { parseReading } from '../lib/hypo';
import { saveReading, Reading } from '../lib/storage';
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  visible: boolean;
  when: Reading['when']; // where the reading was taken from (for History)
  onClose: () => void;
  onSaved: (value: number) => void;
};

// A sheet that slides up to type a glucometer reading (mmol/L). Saves it on the phone.
export default function ReadingSheet({ visible, when, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [typed, setTyped] = useState('');
  const value = parseReading(typed);

  // Saves the reading, clears the box and tells the screen.
  async function save() {
    if (value === null) return;
    await saveReading({ value, date: new Date().toISOString(), when });
    setTyped('');
    onSaved(value);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="বন্ধ করুন (Close)" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>গ্লুকোমিটারের মাপ</Text>
        <Input label="সুগার (mmol/L)" value={typed} onChangeText={setTyped} placeholder="যেমন ৫.৪" keyboardType="decimal-pad" maxLength={5} digitsOnly />
        {typed !== '' && value === null ? (
          <Text style={styles.error}>১ থেকে ৩৩ এর মধ্যে mmol/L লিখুন (যেমন ৫.৪)। mg/dL হলে ১৮ দিয়ে ভাগ করুন।</Text>
        ) : null}
        <Button label="সেভ করুন" sub="Save" onPress={save} disabled={value === null} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,35,26,0.4)' },
  sheet: { backgroundColor: colors.bgSurface, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, padding: 20, gap: 14 },
  title: { fontFamily: fonts.banglaBold, fontSize: 20, lineHeight: 28, color: colors.textPrimary },
  error: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.riskHigh },
});
