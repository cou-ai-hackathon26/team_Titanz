import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import PressScale from './PressScale';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Icon, { IconName } from './Icon';
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  icon: IconName;
  label: string; // Bangla
  sub: string; // English
  selected: boolean;
  onPress: () => void;
};

// Figma "Symptom tile": big card with an icon. Tap to select (lime fill + green border, tick fades in, 200 ms).
export default function SymptomTile({ icon, label, sub, selected, onPress }: Props) {
  const tick = useRef(new Animated.Value(selected ? 1 : 0)).current;

  // Fade the tick in or out when the tile is selected or unselected.
  useEffect(() => {
    Animated.timing(tick, { toValue: selected ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [selected, tick]);

  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={`${label}, ${sub}`}
      accessibilityState={{ checked: selected }}
      style={(pressed) => [styles.tile, selected ? styles.selected : null, pressed && !selected ? styles.pressed : null]}
    >
      <View style={styles.top}>
        <View style={[styles.iconBg, selected ? styles.iconBgSelected : null]}>
          <Icon name={icon} size={22} />
        </View>
        <Animated.View style={[styles.check, { opacity: tick }]}>
          <Icon name="check" size={16} color={colors.textOnBrand} />
        </Animated.View>
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent', // keeps the size the same when selected
  },
  selected: { backgroundColor: colors.bgPage, borderColor: colors.borderBrand },
  pressed: { backgroundColor: colors.bgSurfaceMuted },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSurfaceMuted, alignItems: 'center', justifyContent: 'center' },
  iconBgSelected: { backgroundColor: colors.bgSurface },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.bgBrandStrong, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.banglaBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  sub: { fontFamily: fonts.english, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
});
