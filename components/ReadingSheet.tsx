import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Sheet from './Sheet';
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
    <Sheet visible={visible} onClose={onClose} title="গ্লুকোমিটারের মাপ">
      <View style={styles.body}>
        <Input label="সুগার (mmol/L)" value={typed} onChangeText={setTyped} placeholder="যেমন ৫.৪" keyboardType="decimal-pad" maxLength={5} digitsOnly />
        {typed !== '' && value === null ? (
          <Text style={styles.error}>১ থেকে ৩৩ এর মধ্যে mmol/L লিখুন (যেমন ৫.৪)। mg/dL হলে ১৮ দিয়ে ভাগ করুন।</Text>
        ) : null}
        <Button label="সেভ করুন" sub="Save" onPress={save} disabled={value === null} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 14 },
  error: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.riskHigh },
});
