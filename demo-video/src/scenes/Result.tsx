// END RESULT (7.5s): the daily Home screen in the middle, every feature popping around it,
// and the screen cutting between Home, History and a saved plan.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Phone } from "../components/Phone";
import { Pill, Pop, WordSlam, useFloat } from "../components/Motion";

const features: { bn: string; en: string; x: number; y: number; d: number; side: "left" | "right"; lime?: boolean }[] = [
  { bn: "ঝুঁকি যাচাই", en: "Risk check", x: 40, y: 560, d: 16, side: "left" },
  { bn: "AI প্লেট স্ক্যান", en: "AI plate scan", x: 40, y: 1500, d: 34, side: "left", lime: true },
  { bn: "সুগার পূর্বাভাস", en: "Sugar forecast", x: 40, y: 760, d: 52, side: "right" },
  { bn: "ইফতারের আগে চেক", en: "Pre-iftar check", x: 40, y: 1300, d: 70, side: "right" },
  { bn: "ইফতারের ১ ঘণ্টা আগে রিমাইন্ডার", en: "Reminder 1 hour before iftar", x: 40, y: 1020, d: 110, side: "left" },
  { bn: "সপ্তাহের ইতিহাস", en: "Weekly history", x: 40, y: 1720, d: 140, side: "right" },
];

// The result scene: headline, phone with 4 quick screen cuts, and floating feature pills.
export const Result: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = interpolate(frame, [0, 225], [-10, 8], { extrapolateRight: "clamp", easing: theme.ease.inOut });
  // Home → saved plan → history → forecast → home, 1.5 seconds each.
  const cuts = [{ at: 63.5, d: 45 }, { at: 106.5, d: 45 }, { at: 105, d: 45 }, { at: 101, d: 45 }, { at: 103.5, d: 45 }];
  let start = 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
        <WordSlam text="সব এক অ্যাপে" size={130} per={4} highlight={[0]} />
        <Pop delay={12}><div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 42, color: theme.colors.inkDim }}>Everything for a safe roza, in one app</div></Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 280 }}>
        {cuts.map((c, i) => {
          const s = start; start += c.d;
          return (
            <Sequence key={i} from={s} durationInFrames={c.d} layout="none">
              <Phone at={c.at} width={500} tilt={spin} delay={i === 0 ? 0 : -30} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {features.map((f, i) => (
        <Floater key={i} f={f} i={i} />
      ))}
    </AbsoluteFill>
  );
};

// One floating feature pill on the left or right edge.
const Floater: React.FC<{ f: (typeof features)[number]; i: number }> = ({ f, i }) => {
  const fl = useFloat(20 + i * 3, 10, i);
  return (
    <div style={{ position: "absolute", top: f.y + fl, [f.side]: f.x }}>
      <Pop delay={f.d} from={f.side} dist={260} cfg="bouncy">
        <Pill bnText={f.bn} en={f.en} size={40} bg={f.lime ? theme.colors.lime : theme.colors.surface} />
      </Pop>
    </div>
  );
};
