import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import { colors, fonts } from '../theme/tokens';
import { toBanglaDigits } from '../lib/bangla';

type Props = {
  score: number; // IDF-DAR score
  color: string; // band color (green / amber / red)
};

const SCALE_MAX = 10; // the arc is full at 10 points (scores above 10 just show a full arc)
const CX = 130; // centre of the half circle, as in Figma (260×140 box, radius 110)
const CY = 130;
const R = 110;

// Point on the half circle. t = 0 is the far left, t = 1 is the far right, going over the top.
function pointAt(t: number) {
  const angle = Math.PI * t;
  return { x: CX - R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

// Figma gauge: grey half-circle track, coloured part filled up to the score, big score in the middle.
export default function RiskGauge({ score, color }: Props) {
  const fill = Math.min(Math.max(score / SCALE_MAX, 0), 1);
  const start = pointAt(0);
  const end = pointAt(fill);
  const full = pointAt(1);
  const track = `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${full.x} ${full.y}`;
  const value = `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;
  const scoreText = toBanglaDigits(Number.isInteger(score) ? score : score.toFixed(1));

  return (
    <View style={styles.box} accessibilityLabel={`ঝুঁকির স্কোর ${scoreText}`}>
      <Svg width={260} height={140} viewBox="0 0 260 140">
        <Path d={track} stroke={colors.bgSurfaceMuted} strokeWidth={22} strokeLinecap="round" fill="none" />
        {fill > 0 ? <Path d={value} stroke={color} strokeWidth={22} strokeLinecap="round" fill="none" /> : null}
      </Svg>
      <View style={styles.center}>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{scoreText}</Text>
          {score <= SCALE_MAX ? <Text style={styles.outOf}>/ {toBanglaDigits(SCALE_MAX)}</Text> : null}
        </View>
        <Text style={styles.caption}>ঝুঁকির স্কোর</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 260, height: 150, alignSelf: 'center' },
  center: { position: 'absolute', left: 0, right: 0, top: 64, alignItems: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  score: { fontFamily: fonts.banglaBold, fontSize: 52, lineHeight: 56, color: colors.textPrimary },
  outOf: { fontFamily: fonts.banglaMedium, fontSize: 18, lineHeight: 24, color: colors.textSecondary },
  caption: { fontFamily: fonts.bangla, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
