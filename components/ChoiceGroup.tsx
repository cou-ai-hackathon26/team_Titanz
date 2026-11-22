import { View, StyleSheet } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import ChoiceChip from './ChoiceChip';
import { colors, fonts } from '../theme/tokens';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string; // the question, e.g. "লিঙ্গ"
  options: Option<T>[];
  value: T | null; // the picked option (or null)
  onChange: (value: T) => void;
};

// A question with a row of Choice chips. Only one can be picked at a time.
export default function ChoiceGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => (
          <ChoiceChip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  label: { fontFamily: fonts.banglaMedium, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
