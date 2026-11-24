// STEP 4 — PRE-IFTAR CHECK (8s): symptom tiles tick in, then the real emergency steps screen.
// Step text is copied from app/emergency.tsx.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Beat } from "../components/Beat";
import { Phone } from "../components/Phone";
import { Pill, Pop, StepTitle, useFloat } from "../components/Motion";

// A symptom tile that turns lime with a tick shortly after it lands.
const Tile: React.FC<{ bnText: string; en: string; delay: number }> = ({ bnText, en, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sel = spring({ frame: frame - delay - 12, fps, config: theme.spring.snappy });
  return (
    <Pop delay={delay} from="zoom" cfg="bouncy">
      <div style={{ width: 300, height: 190, borderRadius: 36, background: sel > 0.5 ? theme.colors.lime : theme.colors.surface,
        border: `4px solid ${sel > 0.5 ? theme.colors.brandText : theme.colors.border}`, boxShadow: theme.shadow, padding: 26,
        display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, right: 20, width: 50, height: 50, borderRadius: 99, background: theme.colors.green,
          transform: `scale(${sel})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={theme.colors.lime} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 46, color: theme.colors.ink, lineHeight: 1.1 }}>{bnText}</div>
        <div style={{ fontFamily: theme.fonts.en, fontWeight: 500, fontSize: 24, color: theme.colors.inkDim }}>{en}</div>
      </div>
    </Pop>
  );
};

// One numbered emergency step row.
const StepRow: React.FC<{ n: string; text: string; delay: number }> = ({ n, text, delay }) => (
  <Pop delay={delay} from="right" dist={240}>
    <div style={{ width: 560, display: "flex", alignItems: "center", gap: 20, background: theme.colors.surface, borderRadius: 30,
      padding: "20px 24px", boxShadow: theme.shadow }}>
      <div style={{ width: 60, height: 60, borderRadius: 99, background: theme.colors.highSoft, color: theme.colors.high, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 36 }}>{n}</div>
      <div style={{ flex: 1, fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 36, color: theme.colors.ink, lineHeight: 1.2 }}>{text}</div>
    </div>
  </Pop>
);

// Step 4 scene: tiles + real check footage, then a red alert flash and the 3 safety steps.
export const Check: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = useFloat(22, 8);
  const flash = interpolate(frame, [102, 106, 118], [0, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Beat from={0} dur={105}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
          <StepTitle n="০৪" bnText="ইফতারের আগে শরীর কেমন?" en="Pre-iftar safety check" />
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 60, paddingTop: 380, transform: `translateY(${fl}px)` }}>
          <div style={{ display: "grid", gridTemplateColumns: "300px 300px", gap: 24 }}>
            <Tile bnText="মাথা ঘোরা" en="Dizzy" delay={14} />
            <Tile bnText="ঠান্ডা ঘাম" en="Cold sweat" delay={28} />
            <Tile bnText="শরীর কাঁপা" en="Shaky" delay={42} />
            <Tile bnText="চোখে ঝাপসা" en="Blurred vision" delay={56} />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 50, paddingTop: 380 }}>
          <Phone at={68} rate={0.9} width={360} tilt={-14} delay={2} />
        </AbsoluteFill>
      </Beat>
      <Beat from={105} dur={135}>
        <AbsoluteFill style={{ background: theme.colors.highSoft, opacity: interpolate(frame, [105, 111], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
          <Pop delay={0} from="zoom" cfg="punch">
            <Pill bnText="এখনই ব্যবস্থা নিন" en="Possible low blood sugar" bg={theme.colors.high} color="#fff" size={66} />
          </Pop>
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 50, paddingTop: 300 }}>
          <Sequence layout="none"><Phone at={71} rate={0.4} width={400} tilt={12} /></Sequence>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 40, paddingTop: 300, gap: 20 }}>
          <StepRow n="১" text="এখনই সুগার মাপুন" delay={14} />
          <StepRow n="২" text="কম হলে রোজা ভাঙুন" delay={32} />
          <StepRow n="৩" text="১৫ মিনিট পর আবার মাপুন" delay={50} />
          <Pop delay={72} from="zoom" cfg="bouncy">
            <Pill bnText="জরুরি কল · ১৬২৬৩" en="Call health helpline" bg={theme.colors.high} color="#fff" size={44} />
          </Pop>
          <Pop delay={88} from="zoom" cfg="bouncy">
            <Pill bnText="পরিবারকে জানান" en="Alert my family" size={44} />
          </Pop>
        </AbsoluteFill>
      </Beat>
      <AbsoluteFill style={{ background: theme.colors.high, opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
