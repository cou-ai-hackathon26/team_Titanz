import { Text, StyleProp, TextStyle } from 'react-native';
import { colors, fonts } from '../theme/tokens';

// Each icon's character in the Material Symbols Rounded font (assets/fonts).
// To add an icon: add its name to the font subset and its code here.
const codes = {
  add: 0xe145,
  arrow_back: 0xe5c4,
  arrow_forward: 0xe5c8,
  auto_awesome: 0xe65f,
  bakery_dining: 0xea53,
  bloodtype: 0xefe4,
  call: 0xf0d4,
  cameraswitch: 0xefeb,
  check: 0xe668,
  close: 0xe5cd,
  directions_walk: 0xe536,
  eco: 0xea35,
  emergency: 0xe1eb,
  expand_more: 0xe5cf,
  flash_off: 0xe3e6,
  health_and_safety: 0xe1d5,
  help: 0xe8fd,
  history: 0xe8b3,
  home: 0xe9b2,
  info: 0xe88e,
  lock: 0xe899,
  menu_book: 0xea19,
  nightlight: 0xf03d,
  notifications: 0xe7f5,
  photo_camera: 0xe412,
  quiz: 0xf04c,
  remove: 0xe15b,
  schedule: 0xefd6,
  show_chart: 0xe6e1,
  stethoscope: 0xf805,
  trending_down: 0xe8e3,
  volume_up: 0xe050,
  water_drop: 0xe798,
  wb_twilight: 0xe1c6,
};

export type IconName = keyof typeof codes;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

// Draws one Material Symbols icon at the given size and color.
export default function Icon({ name, size = 22, color = colors.textPrimary, style }: Props) {
  return (
    <Text
      style={[{ fontFamily: fonts.icons, fontSize: size, lineHeight: size, color, width: size, height: size, textAlign: 'center' }, style]}
      allowFontScaling={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {String.fromCharCode(codes[name])}
    </Text>
  );
}
