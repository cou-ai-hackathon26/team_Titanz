// HOOK (0–9.5s): the question, the two DAR-BAN numbers, then "so what now?".
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, bn } from "../theme";
import { Beat, Center } from "../components/Beat";
import { Pop, SteadyNum, WordSlam, useCount } from "../components/Motion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Big "Will you fast?" question that slams in word by word.
const Question: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 75], [1, 1.08], { ...clamp, easing: theme.ease.inOut });
  return (
    <Center style={{ transform: `scale(${zoom})` }}>
      <Pop delay={0} from="zoom" cfg="bouncy">
        <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 46, background: theme.colors.green,
          color: theme.colors.lime, padding: "12px 34px", borderRadius: 999 }}>রমজান ২০২৭</div>
      </Pop>
      <WordSlam text="ডায়াবেটিস নিয়ে রোজা রাখবেন?" size={150} per={4} delay={3} highlight={[2, 3]} />
      <Pop delay={20}>
        <div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 44, color: theme.colors.inkDim }}>
          Fasting this Ramadan with diabetes?
        </div>
      </Pop>
    </Center>
  );
};

// A giant counter with a label and a bar that fills to the number.
const Stat: React.FC<{ value: number; label: string; en: string; color: string; barFrom?: number }> = ({ value, label, en, color, barFrom = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = useCount(value, 2);
  const bar = spring({ frame: frame - 4, fps, config: { damping: 22, stiffness: 80 } });
  const w = interpolate(bar, [0, 1], [barFrom, value]);
  const drift = interpolate(frame, [0, 75], [1, 1.06], { ...clamp, easing: theme.ease.inOut });
  const shake = frame < 14 ? Math.sin(frame * 2.2) * (14 - frame) * 0.6 : 0;
  return (
    <Center gap={24} style={{ transform: `scale(${drift})` }}>
      <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 330, lineHeight: 1, color,
        transform: `translateX(${shake}px)`, whiteSpace: "nowrap" }}><SteadyNum value={bn(n)} final={bn(value)} align="center" />%</div>
      <div style={{ width: 860, height: 40, borderRadius: 999, background: theme.colors.highSoft, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
      <WordSlam text={label} size={72} per={3} delay={6} />
      <Pop delay={18}>
        <div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 40, color: theme.colors.inkDim }}>{en}</div>
      </Pop>
    </Center>
  );
};

// The hook scene: four beats of about 2–2.5 seconds, long enough to read.
export const Hook: React.FC = () => (
  <AbsoluteFill>
    <Beat from={0} dur={75}><Question /></Beat>
    <Beat from={75} dur={75}>
      <Stat value={95} label="রোগী রোজা রাখতে চান" en="of people with diabetes plan to fast" color={theme.colors.green} />
    </Beat>
    <Beat from={150} dur={75}>
      <Stat value={44} barFrom={95} label="মাত্র এতজন কম ঝুঁকিতে" en="only 44% are actually low-risk" color={theme.colors.high} />
    </Beat>
    <Beat from={225} dur={60}>
      <Center gap={16}>
        <WordSlam text="ইফতারের প্লেটেই বিপদ লুকিয়ে" size={124} per={3} highlight={[1]} hiColor={theme.colors.high} />
        <Pop delay={14}>
          <div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 42, color: theme.colors.inkDim }}>The danger hides in the iftar plate</div>
        </Pop>
      </Center>
    </Beat>
    {/* Source line stays at the bottom through the numbers */}
    <Beat from={75} dur={150}>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 250 }}>
        <Pop delay={10}>
          <div style={{ fontFamily: theme.fonts.en, fontWeight: 500, fontSize: 28, color: theme.colors.inkDim }}>
            Source: DAR-BAN study, Bangladesh (n = 1,328)
          </div>
        </Pop>
      </AbsoluteFill>
    </Beat>
  </AbsoluteFill>
);
