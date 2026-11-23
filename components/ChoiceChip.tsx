import { StyleSheet } from 'react-native';
import PressScale from './PressScale';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon from './Icon';
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// Figma "Choice chip": one option (gender, diabetes type, treatment). Selected = lime fill + check.
export default function ChoiceChip({ label, selected, onPress }: Props) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={(pressed) => [styles.chip, selected ? styles.selected : styles.normal, pressed && !selected ? styles.pressed : null]}
    >
      {selected ? <Icon name="check" size={18} color={colors.textBrand} /> : null}
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  normal: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.borderDefault },
  selected: { backgroundColor: colors.bgPage, borderWidth: 1.5, borderColor: colors.borderBrand },
  pressed: { backgroundColor: colors.bgSurfaceMuted },
  label: { fontFamily: fonts.banglaMedium, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  labelSelected: { fontFamily: fonts.banglaSemiBold },
});
