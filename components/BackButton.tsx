import { Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors } from '../theme/tokens';

type Props = {
  onPress: () => void;
  size?: 40 | 44; // guides use 40, form screens use 44
};

// Round white back-arrow button used at the top of screens.
export default function BackButton({ onPress, size = 44 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="পেছনে যান (Back)"
      hitSlop={8}
      style={({ pressed }) => [styles.button, { width: size, height: size, borderRadius: size / 2 }, pressed ? styles.pressed : null]}
    >
      <Icon name="arrow_back" size={size === 40 ? 20 : 22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.bgSurfaceMuted },
});
