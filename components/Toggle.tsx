import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string; // read out by screen readers
};

// Figma "Toggle": on = dark green track + lime knob on the right. Tap slides the knob (220 ms).
export default function Toggle({ value, onChange, label }: Props) {
  const move = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Slide the knob whenever the value changes.
  useEffect(() => {
    Animated.timing(move, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // we also animate colors, which needs the JS driver
    }).start();
  }, [value, move]);

  const knobX = move.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  const trackColor = move.interpolate({ inputRange: [0, 1], outputRange: [colors.borderDefault, colors.bgBrandStrong] });
  const knobColor = move.interpolate({ inputRange: [0, 1], outputRange: [colors.bgSurface, colors.bgPage] });

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.knob, { backgroundColor: knobColor, transform: [{ translateX: knobX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 32, borderRadius: 16, justifyContent: 'center' },
  knob: { width: 26, height: 26, borderRadius: 13 },
});
