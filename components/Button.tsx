import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import PressScale from './PressScale';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon, { IconName } from './Icon';
import { colors, fonts, radius } from '../theme/tokens';

// Figma "Button": Primary (dark green), Secondary (white, outline), Danger (red, emergency only),
// Light (lime, used on top of photos).
type ButtonStyle = 'Primary' | 'Secondary' | 'Danger' | 'Light';

type Props = {
  label: string; // Bangla text
  sub?: string; // short English line under the label
  icon?: IconName; // optional icon before the label
  variant?: ButtonStyle;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Background and text color for each button style.
const looks: Record<ButtonStyle, { bg: string; text: string; border?: string }> = {
  Primary: { bg: colors.bgBrandStrong, text: colors.textOnBrand },
  Secondary: { bg: colors.bgSurface, text: colors.textPrimary, border: colors.borderDefault },
  Danger: { bg: colors.riskHigh, text: colors.textOnBrand },
  Light: { bg: colors.bgPage, text: colors.textPrimary },
};

// A full pill button, 60 high. Shrinks a little while held (PressScale) and darkens slightly.
export default function Button({ label, sub, icon, variant = 'Primary', onPress, disabled, style }: Props) {
  const look = looks[variant];
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      accessibilityState={{ disabled: !!disabled }}
      style={(pressed) => [
        styles.button,
        { backgroundColor: look.bg },
        look.border ? { borderWidth: 1, borderColor: look.border } : null,
        pressed && variant === 'Secondary' ? { backgroundColor: colors.bgSurfaceMuted } : null,
        pressed && variant !== 'Secondary' ? { opacity: 0.8 } : null,
        disabled ? { opacity: 0.45 } : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={22} color={look.text} /> : null}
      <View style={styles.textBox}>
        <Text style={[styles.label, { color: look.text }]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.sub, { color: look.text }]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  textBox: { alignItems: 'center' },
  label: { fontFamily: fonts.banglaSemiBold, fontSize: 17, lineHeight: 23 },
  sub: { fontFamily: fonts.englishMedium, fontSize: 12, lineHeight: 14, opacity: 0.7 },
});
