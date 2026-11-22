import { Pressable, View, StyleSheet } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon from './Icon';
import { colors, fonts, radius } from '../theme/tokens';
import { toBanglaDigits } from '../lib/bangla';

export const STEPPER_MAX = 3; // Figma "Stepper": count 0–3

type Props = {
  value: number;
  onChange: (next: number) => void;
  label: string; // food name, read out by screen readers
  max?: number;
};

// Figma "Stepper": − count +. The minus turns grey at 0, the plus turns grey at the maximum.
export default function Stepper({ value, onChange, label, max = STEPPER_MAX }: Props) {
  const canMinus = value > 0;
  const canPlus = value < max;
  return (
    <View style={styles.box}>
      <Pressable
        onPress={() => canMinus && onChange(value - 1)}
        disabled={!canMinus}
        accessibilityRole="button"
        accessibilityLabel={`${label} কমান`}
        hitSlop={4}
        style={({ pressed }) => [styles.button, styles.minus, pressed ? styles.pressed : null]}
      >
        <Icon name="remove" size={20} color={canMinus ? colors.textPrimary : colors.textSecondary} />
      </Pressable>
      <Text style={styles.count} accessibilityLabel={`${label}: ${value}`}>
        {toBanglaDigits(value)}
      </Text>
      <Pressable
        onPress={() => canPlus && onChange(value + 1)}
        disabled={!canPlus}
        accessibilityRole="button"
        accessibilityLabel={`${label} বাড়ান`}
        hitSlop={4}
        style={({ pressed }) => [styles.button, canPlus ? styles.plus : styles.plusOff, pressed ? styles.pressed : null]}
      >
        <Icon name="add" size={20} color={canPlus ? colors.textOnBrand : colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: colors.bgSurface },
  button: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: colors.bgSurfaceMuted },
  plus: { backgroundColor: colors.bgBrandStrong },
  plusOff: { backgroundColor: colors.bgSurfaceMuted },
  pressed: { opacity: 0.8 },
  count: { width: 24, textAlign: 'center', fontFamily: fonts.banglaBold, fontSize: 17, lineHeight: 23, color: colors.textPrimary },
});
