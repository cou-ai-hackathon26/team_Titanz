import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NATIVE, useReduceMotion } from '../lib/motion';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import { colors, fonts, radius } from '../theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string; // shown at the top, inside the area you can pull down
  children: ReactNode;
  maxHeight?: `${number}%`; // e.g. '70%'
};

const SCREEN_H = Dimensions.get('window').height;
const CLOSE_DISTANCE = 110; // drag down this far (px) to close
const CLOSE_SPEED = 1.1; // or flick down this fast
// iPhone sheets rise with a soft spring and settle with the smallest bounce.
const RISE = { stiffness: 260, damping: 26, mass: 1 };

// An iPhone-style bottom sheet: rounded top corners and a grab handle. It springs up, and you can
// swipe it down (from the handle or title area) or tap the dark area above it to close it.
export default function Sheet({ visible, onClose, title, children, maxHeight = '75%' }: Props) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [shown, setShown] = useState(visible); // stays true while the closing animation plays
  const y = useRef(new Animated.Value(SCREEN_H)).current; // how far the sheet is pushed down
  const fade = useRef(new Animated.Value(0)).current; // dark backdrop

  // Opens or closes with animation whenever `visible` changes.
  useEffect(() => {
    if (visible) {
      setShown(true);
      y.setValue(reduce ? 0 : SCREEN_H);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: NATIVE }),
        reduce ? Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: NATIVE }) : Animated.spring(y, { toValue: 0, ...RISE, useNativeDriver: NATIVE }),
      ]).start();
    } else if (shown) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: NATIVE }),
        Animated.timing(y, { toValue: reduce ? 0 : SCREEN_H, duration: reduce ? 0 : 240, useNativeDriver: NATIVE }),
      ]).start(() => setShown(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Dragging the top of the sheet: it follows the finger downwards; let go far or fast enough to close.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true, // the top area belongs to the drag (it has no buttons)
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => y.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_SPEED) onClose();
        else Animated.spring(y, { toValue: 0, ...RISE, useNativeDriver: NATIVE }).start();
      },
      onPanResponderTerminate: () => Animated.spring(y, { toValue: 0, ...RISE, useNativeDriver: NATIVE }).start(),
    }),
  ).current;

  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fade }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="বন্ধ করুন (Close)" />
        </Animated.View>
        <View style={styles.fill} pointerEvents="box-none" />
        <Animated.View style={[styles.sheet, { maxHeight, paddingBottom: insets.bottom + 12, transform: [{ translateY: y }] }]}>
          <View {...pan.panHandlers} style={styles.dragZone} accessibilityHint="নিচে টেনে বন্ধ করুন (Swipe down to close)">
            <View style={styles.handle} />
            {title ? <Text style={styles.title}>{title}</Text> : null}
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(16,35,26,0.4)' },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.card + 8,
    borderTopRightRadius: radius.card + 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  dragZone: { paddingTop: 10, paddingBottom: 12, paddingHorizontal: 24, userSelect: 'none' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderDefault, marginBottom: 12 },
  title: { fontFamily: fonts.banglaBold, fontSize: 20, lineHeight: 28, color: colors.textPrimary },
});
