import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Text from './Txt';
import Sheet from './Sheet';
import Input from './Input';
import Button from './Button';
import ChoiceChip from './ChoiceChip';
import { COLA_CARBS_PER_100, DRINK_ML_CHOICES, SUGAR_PER_TABLESPOON, drinkNumber, validDrink, drinkCarbs, type DrinkDetails } from '../lib/drinks';
import { toBanglaDigits as bn } from '../lib/bangla';
import { colors, fonts } from '../theme/tokens';

type Props = { name: string; initial?: DrinkDetails; onClose: () => void; onSave: (name: string, details: DrinkDetails) => Promise<void> };

// One drink form, reused for AI results, unknown foods and manual entry. All quantities are per serving.
export default function DrinkSheet({ name: initialName, initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName);
  const [kind, setKind] = useState<'beverage' | 'homemade' | null>(initial?.kind ?? null);
  const [ml, setMl] = useState(initial?.kind === 'beverage' ? String(initial.ml) : '250');
  const [basis, setBasis] = useState<'cola-estimate' | 'label' | null>(initial?.kind === 'beverage' ? initial.basis : null);
  const [labelCarbs, setLabelCarbs] = useState(initial?.kind === 'beverage' && initial.basis === 'label' ? String(initial.carbsPer100) : '');
  const [spoons, setSpoons] = useState<number | null>(initial?.kind === 'homemade' ? initial.tablespoons : null);
  const [base, setBase] = useState<'water' | 'other' | null>(initial?.kind === 'homemade' ? initial.base : null);
  const [otherCarbs, setOtherCarbs] = useState(initial?.kind === 'homemade' && initial.base === 'other' ? String(initial.otherCarbs) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const volume = drinkNumber(ml);
  const concentration = basis === 'cola-estimate' ? COLA_CARBS_PER_100 : drinkNumber(labelCarbs);
  const extra = base === 'water' ? 0 : drinkNumber(otherCarbs);
  let details: DrinkDetails | null = null;
  if (kind === 'beverage' && basis && volume !== null && concentration !== null)
    details = { kind, ml: volume, carbsPer100: concentration, basis };
  if (kind === 'homemade' && spoons !== null && base && extra !== null)
    details = { kind, tablespoons: spoons, base, otherCarbs: extra };
  const ready = details !== null && validDrink(details);

  // Waits for local storage before closing; a failed save keeps the drink available for retry.
  async function save() {
    if (!details || !ready || saving) return;
    setSaving(true);
    setError('');
    try { await onSave(name, details); }
    catch { setError('সংরক্ষণ হয়নি। আবার চেষ্টা করুন।'); setSaving(false); }
  }

  return (
    <Sheet visible onClose={() => !saving && onClose()} title="পানীয়ের পরিমাণ ও চিনি" maxHeight="90%">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text style={styles.help}>এক গ্লাস / এক পরিবেশনের হিসাব দিন। প্লেটে + / − দিয়ে গ্লাসের সংখ্যা বদলাতে পারবেন।</Text>
        <View style={styles.choices}>
          <ChoiceChip label="প্যাকেটের পানীয়" selected={kind === 'beverage'} onPress={() => setKind('beverage')} />
          <ChoiceChip label="ঘরে তৈরি" selected={kind === 'homemade'} onPress={() => setKind('homemade')} />
        </View>
        <Input label="পানীয়ের নাম (ইচ্ছামতো)" value={name} onChangeText={setName} maxLength={40} placeholder="যেমন: লেবুর শরবত" />
        {kind === 'beverage' ? <>
          <Text style={styles.label}>এক গ্লাসে কত মিলি? · Volume</Text>
          <View style={styles.choices}>{DRINK_ML_CHOICES.map((n) => <ChoiceChip key={n} label={`${bn(n)} ml`} selected={volume === n} onPress={() => setMl(String(n))} />)}</View>
          <Input label="অন্য পরিমাণ (ml)" value={ml} onChangeText={setMl} keyboardType="decimal-pad" digitsOnly maxLength={7} />
          <Text style={styles.label}>কোন তথ্য দিয়ে হিসাব করব?</Text>
          <View style={styles.choices}>
            <ChoiceChip label="সাধারণ কোলা (আনুমানিক)" selected={basis === 'cola-estimate'} onPress={() => setBasis('cola-estimate')} />
            <ChoiceChip label="লেবেল থেকে লিখব" selected={basis === 'label'} onPress={() => setBasis('label')} />
          </View>
          {basis === 'cola-estimate' ? <Text style={styles.help}>কোলার উদাহরণ ধরে প্রতি ১০০ ml-এ ১০.৬ g শর্করা। জুস, অন্য ব্র্যান্ড বা ডায়েট / জিরো পানীয়ের জন্য লেবেলের তথ্য লিখুন।</Text> : null}
          {basis === 'label' ? <Input label="লেবেলে Carbohydrate / 100 ml (গ্রাম)" value={labelCarbs} onChangeText={setLabelCarbs} keyboardType="decimal-pad" digitsOnly maxLength={6} placeholder="যেমন ১০.৬; লেবেলে ০ থাকলে ০" /> : null}
        </> : null}
        {kind === 'homemade' ? <>
          <Text style={styles.label}>এক গ্লাসে চিনি কত টেবিল চামচ?</Text>
          <View style={styles.choices}>{[0, 1, 2, 3, 4, 5, 6].map((n) => <ChoiceChip key={n} label={n === 0 ? '০ · চিনি নেই' : `${bn(n)} টেবিল চামচ`} selected={spoons === n} onPress={() => setSpoons(n)} />)}</View>
          <Text style={styles.help}>সমান করে ভরা মাপের টেবিল চামচ—চা চামচ নয়। ১ টেবিল চামচ ≈ {bn(SUGAR_PER_TABLESPOON)} g চিনি। পুরো জগের চিনি লিখবেন না।</Text>
          <Text style={styles.label}>চিনি ছাড়া কী আছে?</Text>
          <View style={styles.choices}>
            <ChoiceChip label="শুধু পানি" selected={base === 'water'} onPress={() => setBase('water')} />
            <ChoiceChip label="লেবু / দুধ / ফল / সিরাপ" selected={base === 'other'} onPress={() => setBase('other')} />
          </View>
          {base === 'other' ? <>
            <Input label="অন্য উপকরণের মোট শর্করা / গ্লাস (গ্রাম)" value={otherCarbs} onChangeText={setOtherCarbs} keyboardType="decimal-pad" digitsOnly maxLength={6} placeholder="রেসিপি / লেবেল দেখে লিখুন" />
            <Text style={styles.help}>দুধ, ফল বা সিরাপের শর্করাও যোগ হয়। এখানে ওপরের চিনি আবার যোগ করবেন না। পরিমাণ জানা না থাকলে পানীয়টি অমীমাংসিত রাখুন।</Text>
          </> : null}
        </> : null}
        {ready && details ? <Text style={styles.total}>এক গ্লাসে আনুমানিক শর্করা: {bn(Number(drinkCarbs(details).toFixed(1)))} g</Text> : <Text style={styles.help}>ধরন ও সব পরিমাণ বেছে নিন। মিলি ১–২০০০; মোট শর্করা সর্বোচ্চ ৩০০ g।</Text>}
        <Text style={styles.help}>এই তথ্য দিয়ে সুগারের আনুমানিক পূর্বাভাস বদলাবে। এটি মাপা রক্তের সুগার নয়।</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={saving ? 'সংরক্ষণ হচ্ছে…' : 'পানীয়ের হিসাব রাখুন'} sub="Use drink details" icon="check" onPress={save} disabled={!ready || saving} />
      </ScrollView>
    </Sheet>
  );
}
const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  help: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  label: { fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  total: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 26, color: colors.textBrand },
  error: { fontFamily: fonts.bangla, fontSize: 14, color: colors.riskHigh },
});
