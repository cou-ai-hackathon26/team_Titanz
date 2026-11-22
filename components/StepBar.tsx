import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

type Props = {
  total: number; // how many steps
  done: number; // how many are filled in
  height?: 4 | 6; // guides use 4, form screens use 6
  doneColor?: string;
};

// A row of equal bars showing progress through steps (e.g. guide 2 of 3).
export default function StepBar({ total, done, height = 4, doneColor = colors.textPrimary }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: done }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.bar, { height, borderRadius: height / 2, backgroundColor: i < done ? doneColor : colors.borderDefault }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', gap: 6 },
  bar: { flex: 1 },
});
