// STEP 2 — SNAP THE PLATE (10s): real iftar photo gets scanned, AI finds the foods,
// carbs count up to the real result (186 g, from the app's real AI scan), then real footage of fixing counts.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, bn } from "../theme";
import { Beat } from "../components/Beat";
import { Phone } from "../components/Phone";
import { Pill, Pop, StepTitle, SteadyNum, useCount, useFloat } from "../components/Motion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The plate photo in a rounded card with a slow Ken Burns zoom and camera corner marks.
const PlateCard: React.FC<{ scanning: boolean }> = ({ scanning }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 90], [1.02, 1.14], { ...clamp, easing: theme.ease.inOut });
  const line = (frame % 40) / 40;
  const corner = (pos: React.CSSProperties, rot: number) => (
    <div style={{ position: "absolute", width: 70, height: 70, ...pos, borderTop: `9px solid ${theme.colors.lime}`,
      borderLeft: `9px solid ${theme.colors.lime}`, borderTopLeftRadius: 26, transform: `rotate(${rot}deg)` }} />
  );
  return (
    <div style={{ width: 940, height: 600, borderRadius: 48, overflow: "hidden", position: "relative", boxShadow: theme.shadow }}>
      <Img src={staticFile("img/plate.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      {scanning ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: `${line * 100}%`, height: 6, background: theme.colors.lime,
            boxShadow: `0 0 40px 14px ${theme.colors.lime}aa` }} />
          {corner({ left: 30, top: 30 }, 0)}
          {corner({ right: 30, top: 30 }, 90)}
          {corner({ right: 30, bottom: 30 }, 180)}
          {corner({ left: 30, bottom: 30 }, 270)}
        </>
      ) : null}
    </div>
  );
};

// A food chip like the app's list row: coloured dot, Bangla name, English name, count.
const FoodChip: React.FC<{ name: string; en: string; count?: string; dot: string }> = ({ name, en, count, dot }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, background: theme.colors.surface, borderRadius: 30,
    padding: "18px 26px", boxShadow: theme.shadow }}>
    <div style={{ width: 22, height: 22, borderRadius: 99, background: dot }} />
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
      <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 44, color: theme.colors.ink }}>{name}</span>
      <span style={{ fontFamily: theme.fonts.en, fontWeight: 500, fontSize: 24, color: theme.colors.inkDim }}>{en}</span>
    </div>
    {count ? <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 44, color: theme.colors.green, background: theme.colors.limeSoft,
      borderRadius: 99, padding: "2px 20px", marginLeft: 6 }}>×{count}</span> : null}
  </div>
);

// The carb result card: big counter, glycemic load, and a risk bar that fills into red.
const CarbCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const carbs = useCount(186, 2);
  const gl = useCount(96, 6);
  const bar = spring({ frame: frame - 12, fps, config: { damping: 20, stiffness: 70 } });
  return (
    <div style={{ width: 940, background: theme.colors.surface, borderRadius: 48, padding: 50, boxShadow: theme.shadow }}>
      <div style={{ display: "flex", gap: 30 }}>
        <div style={{ flex: 1, background: theme.colors.muted, borderRadius: 32, padding: "26px 34px" }}>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 600, fontSize: 32, color: theme.colors.inkDim }}>● মোট শর্করা</div>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 130, lineHeight: 1.05, color: theme.colors.ink, whiteSpace: "nowrap" }}><SteadyNum value={bn(carbs)} final={bn(186)} /><span style={{ fontSize: 50 }}> g</span></div>
        </div>
        <div style={{ flex: 1, background: theme.colors.muted, borderRadius: 32, padding: "26px 34px" }}>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 600, fontSize: 32, color: theme.colors.inkDim }}>গ্লাইসেমিক লোড</div>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 130, lineHeight: 1.05, color: theme.colors.ink, whiteSpace: "nowrap" }}><SteadyNum value={bn(gl)} final={bn(96)} /></div>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 600, fontSize: 32, color: theme.colors.inkDim }}>আনুমানিক</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 }}>
        <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 44, color: theme.colors.ink }}>শর্করার মাত্রা</span>
        <Pop delay={34} from="zoom" cfg="punch">
          <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 38, color: theme.colors.high, background: theme.colors.highSoft,
            borderRadius: 99, padding: "6px 26px" }}>বেশি · High</span>
        </Pop>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20, height: 30 }}>
        {[theme.colors.lowSoft, theme.colors.midSoft, theme.colors.highSoft].map((c, i) => (
          <div key={i} style={{ flex: 1, background: c, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${interpolate(bar, [i / 3, (i + 1) / 3], [0, 100], clamp)}%`,
              background: [theme.colors.low, theme.colors.mid, theme.colors.high][i] }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Step 2 scene: title + scanning, foods pop out, carb card, then real footage of the result screen.
export const Scan: React.FC = () => {
  const fl = useFloat(20, 10);
  const fl2 = useFloat(26, 10, 1.5);
  return (
    <AbsoluteFill>
      <Beat from={0} dur={75}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
          <StepTitle n="০২" bnText="প্লেটের ছবি তুলুন" en="Snap your iftar plate" />
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 380 }}>
          <Pop delay={4} from="up" dist={300} cfg="smooth"><PlateCard scanning /></Pop>
          <div style={{ marginTop: -40 }}>
            <Pop delay={20} from="zoom" cfg="bouncy">
              <Pill bnText="AI খাবার খুঁজছে…" en="Real AI is reading your plate" bg={theme.colors.green} color={theme.colors.lime} size={42} />
            </Pop>
          </div>
        </AbsoluteFill>
      </Beat>
      <Beat from={75} dur={90}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: "scale(0.9)" }}><PlateCard scanning={false} /></div>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 280 }}>
          <Pop delay={0} from="zoom" cfg="bouncy">
            <Pill bnText="AI · ৫টি খাবার পেয়েছে" en="5 foods found" bg={theme.colors.lime} size={52} />
          </Pop>
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 60, top: 1290 + fl }}><Pop delay={12} from="left" dist={220}><FoodChip name="পাকোড়া" en="Pakora" count="৬" dot={theme.colors.low} /></Pop></div>
        <div style={{ position: "absolute", right: 60, top: 1290 + fl2 }}><Pop delay={24} from="right" dist={220}><FoodChip name="বেগুনি" en="Beguni" count="৪" dot={theme.colors.low} /></Pop></div>
        <div style={{ position: "absolute", left: 140, top: 1470 + fl2 }}><Pop delay={36} from="left" dist={220}><FoodChip name="ছোলা ভুনা" en="Chola bhuna" count="১" dot={theme.colors.mid} /></Pop></div>
        <div style={{ position: "absolute", right: 120, top: 1470 + fl }}><Pop delay={48} from="right" dist={220}><FoodChip name="+২টি আরও" en="and 2 more" dot={theme.colors.high} /></Pop></div>
      </Beat>
      <Beat from={165} dur={80}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Pop delay={0} from="up" dist={200} cfg="smooth"><CarbCard /></Pop>
          <Pop delay={40}><div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 56, color: theme.colors.high, textAlign: "center" }}>এই প্লেটে সুগার অনেক বাড়তে পারে</div></Pop>
        </AbsoluteFill>
      </Beat>
      <Beat from={245} dur={55}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
          <Pop delay={0} from="zoom" cfg="bouncy"><Pill bnText="পরিমাণ নিজে ঠিক করুন" en="Fix any count with + / −" bg={theme.colors.lime} size={46} /></Pop>
          <Sequence from={0} layout="none"><Phone at={90.5} rate={1.2} width={560} tilt={-8} /></Sequence>
        </AbsoluteFill>
      </Beat>
    </AbsoluteFill>
  );
};
