// STEP 1 — RISK CHECK (7s): quiz footage + answers ticking in, then the gauge sweeps to High.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, bn } from "../theme";
import { Beat } from "../components/Beat";
import { Phone } from "../components/Phone";
import { Pill, Pop, StepTitle, SteadyNum, useCount, useFloat } from "../components/Motion";

// A quiz answer card in its selected state (lime fill, green border, tick).
const Answer: React.FC<{ q: string; a: string; delay: number }> = ({ q, a, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sel = spring({ frame: frame - delay - 12, fps, config: theme.spring.snappy });
  return (
    <Pop delay={delay} from="right" dist={240}>
      <div style={{ width: 470, background: sel > 0.5 ? theme.colors.lime : theme.colors.surface, borderRadius: 28,
        border: `4px solid ${sel > 0.5 ? theme.colors.brandText : theme.colors.border}`, padding: "20px 26px", boxShadow: theme.shadow,
        display: "flex", alignItems: "center", gap: 18, transform: `scale(${1 + Math.sin(sel * Math.PI) * 0.06})` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 500, fontSize: 26, color: theme.colors.inkDim }}>{q}</div>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 36, color: theme.colors.ink, lineHeight: 1.2 }}>{a}</div>
        </div>
        <div style={{ width: 54, height: 54, borderRadius: 99, background: theme.colors.green, display: "flex", alignItems: "center",
          justifyContent: "center", transform: `scale(${sel})` }}>
          <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={theme.colors.lime} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </Pop>
  );
};

// The risk gauge: a half circle (green → amber → red) whose fill sweeps to the score.
const Gauge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sweep = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 60 } });
  const score = useCount(15, 4);
  const R = 300; const C = Math.PI * R;
  const shake = frame > 18 && frame < 30 ? Math.sin(frame * 2.5) * (30 - frame) * 0.8 : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 }}>
      <Pop delay={0} from="zoom" cfg="smooth">
        <div style={{ background: theme.colors.surface, borderRadius: 60, padding: "60px 70px 50px", boxShadow: theme.shadow,
          display: "flex", flexDirection: "column", alignItems: "center", transform: `translateX(${shake}px)` }}>
          <div style={{ position: "relative", width: 2 * R + 60, height: R + 60 }}>
            <svg width={2 * R + 60} height={R + 60} viewBox={`-30 -30 ${2 * R + 60} ${R + 60}`}>
              <path d={`M0 ${R} A${R} ${R} 0 0 1 ${2 * R} ${R}`} fill="none" stroke={theme.colors.muted} strokeWidth="56" strokeLinecap="round" />
              <path d={`M0 ${R} A${R} ${R} 0 0 1 ${2 * R} ${R}`} fill="none" stroke={theme.colors.high} strokeWidth="56" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - 0.86 * sweep)} />
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, textAlign: "center" }}>
              <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 230, lineHeight: 1, color: theme.colors.ink }}><SteadyNum value={bn(score)} final={bn(15)} align="center" /></div>
              <div style={{ fontFamily: theme.fonts.bn, fontWeight: 600, fontSize: 40, color: theme.colors.inkDim }}>ঝুঁকির স্কোর</div>
            </div>
          </div>
        </div>
      </Pop>
      <Pop delay={26} from="zoom" cfg="punch">
        <Pill bnText="উচ্চ ঝুঁকি" en="High risk" bg={theme.colors.highSoft} color={theme.colors.high} size={64} />
      </Pop>
      <Pop delay={44}>
        <Pill bnText="ডাক্তারকে দেখানোর রিপোর্ট" en="Share report with doctor" size={40} />
      </Pop>
    </AbsoluteFill>
  );
};

// Step 1 scene: title, phone with real quiz, answers ticking in; then the gauge.
export const Risk: React.FC = () => {
  const fl = useFloat(22, 8);
  return (
    <AbsoluteFill>
      <Beat from={0} dur={120}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
          <StepTitle n="০১" bnText="রোজার ঝুঁকি যাচাই" en="Check your fasting risk" />
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 60, paddingTop: 420 }}>
          <Sequence from={0} durationInFrames={60} layout="none"><Phone at={33} rate={2} width={430} tilt={14} /></Sequence>
          <Sequence from={60} durationInFrames={60} layout="none"><Phone at={43.2} rate={2} width={430} tilt={14} delay={-30} /></Sequence>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 50, paddingTop: 420, gap: 26, transform: `translateY(${fl}px)` }}>
          <Answer q="সুগার কি খুব কমে যায়?" a="সম্প্রতি খুব কমেছিল" delay={16} />
          <Answer q="গত ৩ মাসে HbA1c?" a="৯%-এর বেশি" delay={42} />
          <Answer q="হার্টের রোগ বা স্ট্রোক?" a="আছে, সম্প্রতি সমস্যা" delay={68} />
        </AbsoluteFill>
      </Beat>
      <Beat from={120} dur={90}><Gauge /></Beat>
    </AbsoluteFill>
  );
};
