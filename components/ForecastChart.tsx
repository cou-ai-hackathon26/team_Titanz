import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import Text from './Txt'; // <Text> that draws Bangla digits clearly
import { colors, fonts } from '../theme/tokens';
import { toBanglaDigits } from '../lib/bangla';
import { FORECAST, Forecast } from '../lib/forecast';

type Props = {
  now: Forecast; // the plate as scanned (red dashed)
  after: Forecast; // the plate with the user's changes (green)
};

const HEIGHT = 180; // drawing area height (Figma)
const LEFT = 34; // room for the mmol/L numbers on the left
const RIGHT = 4;
const TOP = 12;
const BOTTOM = 10;
const Y_MIN = 2; // mmol/L at the bottom edge

// Figma "Forecast chart": 2-hour sugar curves over the green safe band (4–10 mmol/L).
export default function ForecastChart({ now, after }: Props) {
  const [width, setWidth] = useState(0);

  // The top of the chart grows in steps of 4 so very high plates still fit.
  const highest = Math.max(...now.points.map((p) => p.glucose), ...after.points.map((p) => p.glucose), 16);
  const yMax = Math.ceil(highest / 4) * 4;
  const ticks = [];
  for (let v = 4; v <= yMax; v += 4) ticks.push(v);

  const plotW = Math.max(width - LEFT - RIGHT, 1);
  const x = (t: number) => LEFT + (t / FORECAST.HORIZON_MIN) * plotW;
  const y = (g: number) => TOP + (1 - (g - Y_MIN) / (yMax - Y_MIN)) * (HEIGHT - TOP - BOTTOM);

  // Turns curve points into an SVG line.
  const path = (f: Forecast) => f.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t).toFixed(1)} ${y(p.glucose).toFixed(1)}`).join(' ');
  const peakX = x(FORECAST.T_PEAK_MIN);

  return (
    <View
      style={styles.box}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`সুগারের গ্রাফ: এখনকার প্লেটে সর্বোচ্চ প্রায় ${now.peak.toFixed(1)}, পরিবর্তনের পর প্রায় ${after.peak.toFixed(1)} mmol/L`}
    >
      {width > 0 ? (
        <>
          <Svg width={width} height={HEIGHT}>
            {/* Safe band 4–10 */}
            <Rect
              x={LEFT}
              y={y(FORECAST.SAFE_HIGH)}
              width={plotW}
              height={y(FORECAST.SAFE_LOW) - y(FORECAST.SAFE_HIGH)}
              fill={colors.bgPage}
              opacity={0.55}
              rx={4}
            />
            {ticks.map((v) => (
              <Line key={v} x1={LEFT} x2={LEFT + plotW} y1={y(v)} y2={y(v)} stroke={colors.borderDefault} strokeWidth={1} />
            ))}
            {/* Now: red dashed. After: dark green solid, drawn on top. */}
            <Path d={path(now)} stroke={colors.riskHigh} strokeWidth={2.5} strokeDasharray="6 5" fill="none" opacity={0.85} />
            <Path d={path(after)} stroke={colors.bgBrandStrong} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Circle cx={peakX} cy={y(now.peak)} r={5} fill={colors.riskHigh} />
            <Circle cx={peakX} cy={y(after.peak)} r={6} fill={colors.bgBrandStrong} stroke={colors.bgSurface} strokeWidth={2} />
          </Svg>

          {/* Labels as normal text (so Bangla digits use the clear digit font) */}
          {ticks.map((v) => (
            <Text key={v} style={[styles.yLabel, { top: y(v) - 8 }]}>
              {toBanglaDigits(v)}
            </Text>
          ))}
          <Text style={[styles.bandLabel, { top: y(FORECAST.SAFE_LOW) - 20 }]}>
            নিরাপদ সীমা {toBanglaDigits(FORECAST.SAFE_LOW)}–{toBanglaDigits(FORECAST.SAFE_HIGH)}
          </Text>
          <View style={styles.xLabels}>
            {[0, 30, 60, 90, 120].map((t) => (
              <Text key={t} style={[styles.xLabel, { left: x(t) - (t === 120 ? 34 : 6) }]}>
                {toBanglaDigits(t)}
                {t === 120 ? ' মি.' : ''}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: HEIGHT + 20, alignSelf: 'stretch' },
  yLabel: { position: 'absolute', left: 4, fontFamily: fonts.bangla, fontSize: 11, lineHeight: 15, color: colors.textSecondary },
  bandLabel: { position: 'absolute', right: 8, fontFamily: fonts.banglaSemiBold, fontSize: 11, lineHeight: 15, color: colors.textBrand },
  xLabels: { position: 'absolute', top: HEIGHT + 2, left: 0, right: 0, height: 16 },
  xLabel: { position: 'absolute', fontFamily: fonts.bangla, fontSize: 11, lineHeight: 15, color: colors.textSecondary },
});
