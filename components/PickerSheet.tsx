import { Modal, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
export default function PickerSheet({ visible, title, options, selectedId, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="বন্ধ করুন (Close)" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.title}>{title}</Text>
        <ScrollView>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,35,26,0.4)' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  title: { fontFamily: fonts.banglaBold, fontSize: 20, lineHeight: 28, color: colors.textPrimary, paddingHorizontal: 8, marginBottom: 8 },
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
