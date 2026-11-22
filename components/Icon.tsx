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
  construction: 0xea3c,
  cyclone: 0xebd5,
  directions_walk: 0xe536,
  eco: 0xea35,
  edit: 0xf097,
  elderly: 0xf21a,
  emergency: 0xe1eb,
  expand_more: 0xe5cf,
  favorite: 0xe87e,
  flash_off: 0xe3e6,
  flash_on: 0xe3e7,
  health_and_safety: 0xe1d5,
  help: 0xe8fd,
  history: 0xe8b3,
  home: 0xe9b2,
  info: 0xe88e,
  ios_share: 0xe6b8,
  lock: 0xe899,
  medication: 0xf033,
  menu_book: 0xea19,
  nightlight: 0xf03d,
  notifications: 0xe7f5,
  photo_camera: 0xe412,
  photo_library: 0xe413,
  pregnant_woman: 0xf5f1,
  quiz: 0xf04c,
  remove: 0xe15b,
  schedule: 0xefd6,
  send: 0xe163,
  show_chart: 0xe6e1,
  stethoscope: 0xf805,
  trending_down: 0xe8e3,
  vibration: 0xf2cb,
  visibility_off: 0xe8f5,
  volume_up: 0xe050,
  warning: 0xf083,
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
