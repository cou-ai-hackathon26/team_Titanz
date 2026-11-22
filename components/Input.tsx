import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, KeyboardTypeOptions } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon, { IconName } from './Icon';
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  prefix?: string; // e.g. "🇧🇩 +880"
  suffixText?: string; // e.g. "বছর" after the age
  suffixIcon?: IconName; // e.g. expand_more for a dropdown
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  onPress?: () => void; // if set, the field is a dropdown: tapping opens a list instead of typing
  onBlur?: () => void; // called when the user leaves the field
  digitsOnly?: boolean; // number fields (age, phone): draw digits with the clear digit font
};

// Figma "Input": label on top, white field below. Green 2px border while typing (focused).
export default function Input(props: Props) {
  const { label, value, placeholder, onChangeText, prefix, suffixText, suffixIcon, keyboardType, maxLength, onPress, onBlur, digitsOnly } = props;
  const [focused, setFocused] = useState(false);

  // The inside of the field: prefix, the text (or text box), then the suffix.
  const inside = (
    <>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      {onPress ? (
        <Text style={[styles.value, !value ? styles.placeholder : null]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          style={[styles.input, digitsOnly ? { fontFamily: fonts.digitsMedium } : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          accessibilityLabel={label}
        />
      )}
      {suffixText && value ? <Text style={styles.suffixText}>{suffixText}</Text> : null}
      {suffixIcon ? <Icon name={suffixIcon} size={22} color={colors.textSecondary} /> : null}
    </>
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={[styles.field, styles.fieldNormal]}>
          {inside}
        </Pressable>
      ) : (
        <View style={[styles.field, focused ? styles.fieldFocused : styles.fieldNormal]}>{inside}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, alignSelf: 'stretch' },
  label: { fontFamily: fonts.banglaMedium, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  field: {
    height: 56,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldNormal: { borderWidth: 1, borderColor: colors.borderDefault },
  // 2px border; padding drops by 1 so the text does not jump when focusing.
  fieldFocused: { borderWidth: 2, borderColor: colors.borderBrand, paddingHorizontal: 15 },
  prefix: { fontFamily: fonts.englishMedium, fontSize: 16, color: colors.textPrimary },
  // outlineWidth 0 hides the browser's own focus box in the web preview (we draw our own green border).
  input: { flex: 1, fontFamily: fonts.banglaMedium, fontSize: 17, color: colors.textPrimary, paddingVertical: 0, height: '100%', outlineWidth: 0 },
  value: { flex: 1, fontFamily: fonts.banglaMedium, fontSize: 17, lineHeight: 24, color: colors.textPrimary },
  placeholder: { color: colors.textSecondary },
  suffixText: { fontFamily: fonts.banglaMedium, fontSize: 17, color: colors.textPrimary },
});
