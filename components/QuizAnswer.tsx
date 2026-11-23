import { View, StyleSheet } from 'react-native';
import PressScale from './PressScale';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon from './Icon';
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  label: string; // Bangla answer
  sub: string; // short English line
  selected: boolean;
  onPress: () => void;
};

// Figma "Quiz answer": a big white card. Selected = lime fill, green border, dark tick circle.
export default function QuizAnswer({ label, sub, selected, onPress }: Props) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${sub}`}
      accessibilityState={{ selected }}
      style={(pressed) => [styles.card, selected ? styles.selected : null, pressed && !selected ? styles.pressed : null]}
    >
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      {selected ? (
        <View style={[styles.indicator, styles.indicatorOn]}>
          <Icon name="check" size={18} color={colors.textOnBrand} />
        </View>
      ) : (
        <View style={[styles.indicator, styles.indicatorOff]} />
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.tile,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent', // keeps the size the same when selected
  },
  selected: { backgroundColor: colors.bgPage, borderColor: colors.borderBrand },
  pressed: { backgroundColor: colors.bgSurfaceMuted },
  text: { flex: 1 },
  label: { fontFamily: fonts.banglaSemiBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  sub: { fontFamily: fonts.english, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  indicator: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  indicatorOn: { backgroundColor: colors.bgBrandStrong },
  indicatorOff: { borderWidth: 2, borderColor: colors.borderDefault },
});
