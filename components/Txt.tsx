import { ReactNode } from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { fonts } from '../theme/tokens';

// Hind Siliguri draws the Bangla "১" in an old style that is hard to read.
// So every Bangla digit (০–৯) is drawn with Noto Sans Bengali instead, in the same weight.
const digitFontFor: Record<string, string> = {
  [fonts.bangla]: fonts.digits,
  [fonts.banglaMedium]: fonts.digitsMedium,
  [fonts.banglaSemiBold]: fonts.digitsSemiBold,
  [fonts.banglaBold]: fonts.digitsBold,
};

// Splits text into pieces and wraps each run of Bangla digits in the digit font.
function withDigitFont(node: ReactNode, digitFont: string): ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    const parts = String(node).split(/([০-৯]+)/);
    if (parts.length === 1) return node;
    return parts.map((part, i) =>
      /^[০-৯]+$/.test(part) ? (
        <Text key={i} style={{ fontFamily: digitFont }}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  }
  if (Array.isArray(node)) return node.map((child) => withDigitFont(child, digitFont));
  return node; // other elements (e.g. nested <Txt>) handle themselves
}

// Android measures Bangla text a few pixels too narrow, so the last letter (or word) got cut off
// ("হোম" showed as "হো", "চট্টগ্রাম" as "চট্টগ্রা"). A plain space at the end is counted when the
// text is measured but may hang past the edge when it is drawn, so the last letter gets room. It is invisible.
const ROOM = Platform.OS === 'android' ? ' ' : '';

// Use this instead of <Text> for any Bangla text. Works exactly like <Text>.
export default function Txt({ style, children, ...rest }: TextProps) {
  const family = StyleSheet.flatten(style)?.fontFamily;
  const digitFont = family ? digitFontFor[family] : undefined;
  return (
    // key={family}: when the font changes (e.g. a chip turns bold when picked), draw it fresh so it is re-measured
    <Text key={family} style={style} {...rest}>
      {digitFont ? withDigitFont(children, digitFont) : children}
      {ROOM}
    </Text>
  );
}
