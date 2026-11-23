import { Pressable, ScrollView, StyleSheet } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import Sheet from './Sheet';
import Icon from './Icon';
import { colors, fonts, radius } from '../theme/tokens';

type Option = { id: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selectedId: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
};

// A list that slides up from the bottom so the user can pick one item (e.g. their district).
// Swipe it down or tap outside to close.
export default function PickerSheet({ visible, title, options, selectedId, onPick, onClose }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} maxHeight="72%">
        <ScrollView contentContainerStyle={styles.list}>
          {options.map((o) => {
            const selected = o.id === selectedId;
            return (
              <Pressable
                key={o.id}
                onPress={() => onPick(o.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, selected ? styles.rowSelected : null, pressed ? styles.rowPressed : null]}
              >
                <Text style={[styles.rowText, selected ? styles.rowTextSelected : null]}>{o.label}</Text>
                {selected ? <Icon name="check" size={20} color={colors.textBrand} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16 },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowSelected: { backgroundColor: colors.bgPage },
  rowPressed: { backgroundColor: colors.bgSurfaceMuted },
  rowText: { fontFamily: fonts.banglaMedium, fontSize: 17, lineHeight: 24, color: colors.textPrimary },
  rowTextSelected: { fontFamily: fonts.banglaSemiBold },
});
