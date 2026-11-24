// STEP 3 — SUGAR FORECAST (11s), the wow moment: the red curve spikes above the safe zone,
// two changes (fewer jilapi, a 15-minute walk) pull the green curve back into it.
// Numbers are the app's own result for this plate (screenshot 07): 12.0–14.3 → 8.7–9.9 mmol/L.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, bn } from "../theme";
import { Beat } from "../components/Beat";
import { Pill, Pop, StepTitle } from "../components/Motion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = 860; const H = 520; // plot size in px
const yMin = 4; const yMax = 16;

// The sugar curve shape: starts at 5.5, rises to a peak at `tp` minutes, then eases down.
const sugarAt = (t: number, A: number, tp: number) => 5.5 + A * (t / tp) * Math.exp(1 - t / tp);
const toX = (t: number) => (t / 120) * W;
const toY = (v: number) => H - ((v - yMin) / (yMax - yMin)) * H;
const pathFor = (A: number, tp: number) =>
  Array.from({ length: 61 }, (_, i) => i * 2).map((t, i) => `${i === 0 ? "M" : "L"}${toX(t).toFixed(1)} ${toY(sugarAt(t, A, tp)).toFixed(1)}`).join(" ");

// The chart: lime safe band, red "now" curve, green "with changes" curve that morphs.
const Chart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const redDraw = interpolate(frame, [16, 60], [0, 1], { ...clamp, easing: theme.ease.out });
  const greenShow = interpolate(frame, [132, 142], [0, 1], clamp);
  const m1 = spring({ frame: frame - 134, fps, config: theme.spring.smooth });
  const m2 = spring({ frame: frame - 190, fps, config: theme.spring.smooth });
  const A = 7.7 - 2.3 * m1 - 1.6 * m2; // 7.7 (now) → 5.4 (fewer jilapi) → 3.8 (plus walk)
  const tp = 75 - 5 * m2;
  const peakT = 75;
  const dot = spring({ frame: frame - 60, fps, config: theme.spring.punch });
  const pulse = 1 + Math.sin(frame / 4) * 0.12;
  return (
    <div style={{ background: theme.colors.surface, borderRadius: 48, padding: "44px 40px 30px 70px", boxShadow: theme.shadow }}>
      <svg width={W + 20} height={H + 60} viewBox={`-10 -10 ${W + 20} ${H + 60}`} style={{ overflow: "visible" }}>
        <defs><clipPath id="reveal"><rect x={-20} y={-40} width={(W + 40) * redDraw} height={H + 80} /></clipPath></defs>
        {[4, 8, 12, 16].map((v) => (
          <g key={v}>
            <line x1={0} x2={W} y1={toY(v)} y2={toY(v)} stroke={theme.colors.border} strokeWidth={2} />
            <text x={-20} y={toY(v) + 10} textAnchor="end" fontFamily={theme.fonts.bn} fontSize={30} fill={theme.colors.inkDim}>{bn(v)}</text>
          </g>
        ))}
        <rect x={0} y={toY(10)} width={W} height={toY(4) - toY(10)} fill={theme.colors.lime} opacity={0.75} rx={10} />
        <text x={W - 16} y={toY(4.6)} textAnchor="end" fontFamily={theme.fonts.bn} fontWeight={700} fontSize={34} fill={theme.colors.green}
          opacity={interpolate(frame, [236, 242], [1, 0], clamp)}>নিরাপদ সীমা ৪–১০</text>
        {[0, 30, 60, 90, 120].map((t) => (
          <text key={t} x={toX(t)} y={H + 46} textAnchor="middle" fontFamily={theme.fonts.bn} fontSize={30} fill={theme.colors.inkDim}>{bn(t)}{t === 120 ? " মি." : ""}</text>
        ))}
        <g clipPath="url(#reveal)">
          <path d={pathFor(7.7, 75)} fill="none" stroke={theme.colors.high} strokeWidth={9} strokeDasharray="22 16" strokeLinecap="round" />
        </g>
        <circle cx={toX(peakT)} cy={toY(sugarAt(peakT, 7.7, 75))} r={18 * dot * pulse} fill={theme.colors.high} />
        <g opacity={greenShow}>
          <path d={pathFor(A, tp)} fill="none" stroke={theme.colors.green} strokeWidth={11} strokeLinecap="round" />
          <circle cx={toX(tp)} cy={toY(sugarAt(tp, A, tp))} r={17} fill={theme.colors.green} stroke="#fff" strokeWidth={5} />
        </g>
      </svg>
    </div>
  );
};

// A small range card ("now" or "with changes") like the app's two tiles.
const RangeCard: React.FC<{ label: string; value: string; color: string; dim?: boolean }> = ({ label, value, color, dim }) => (
  <div style={{ width: 430, background: dim ? theme.colors.muted : theme.colors.surface, borderRadius: 36, padding: "24px 32px", boxShadow: dim ? "none" : theme.shadow }}>
    <div style={{ fontFamily: theme.fonts.bn, fontWeight: 600, fontSize: 32, color: theme.colors.inkDim }}>
      <span style={{ color }}>● </span>{label}
    </div>
    <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 70, lineHeight: 1.15, whiteSpace: "nowrap", color: dim ? theme.colors.border : color }}>{value}</div>
    <div style={{ fontFamily: theme.fonts.en, fontWeight: 500, fontSize: 26, color: theme.colors.inkDim }}>mmol/L · estimate</div>
  </div>
);

// A what-if control row: icon circle, Bangla label, English sub, and a stepper or toggle.
const Control: React.FC<{ title: string; sub: string; kind: "stepper" | "toggle"; act: number }> = ({ title, sub, kind, act }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = frame < act ? 4 : frame < act + 10 ? 3 : frame < act + 20 ? 2 : 1;
  const tap = (k: number) => spring({ frame: frame - act - k * 10, fps, config: theme.spring.punch });
  const on = spring({ frame: frame - act, fps, config: theme.spring.snappy });
  return (
    <div style={{ width: 940, display: "flex", alignItems: "center", gap: 26, background: theme.colors.surface, borderRadius: 36,
      padding: "24px 32px", boxShadow: theme.shadow }}>
      <div style={{ width: 84, height: 84, borderRadius: 99, background: theme.colors.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {kind === "stepper" ? (
          <svg width="46" height="46" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke={theme.colors.ink} strokeWidth="2.4" /><circle cx="12" cy="12" r="3" fill="none" stroke={theme.colors.ink} strokeWidth="2.4" /></svg>
        ) : (
          <svg width="46" height="46" viewBox="0 0 24 24"><circle cx="13" cy="4" r="2" fill={theme.colors.ink} /><path d="M10 9l3-1 2 4 3 1M12 8l-2 6 3 2v5M10 14l-3 6" fill="none" stroke={theme.colors.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 50, color: theme.colors.ink, lineHeight: 1.15 }}>{title}</div>
        <div style={{ fontFamily: theme.fonts.bn, fontWeight: 500, fontSize: 30, color: theme.colors.brandText }}>{sub}</div>
      </div>
      {kind === "stepper" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 78, height: 78, borderRadius: 99, background: theme.colors.muted, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 50, color: theme.colors.ink,
            transform: `scale(${1 - 0.18 * Math.max(tap(0) * (1 - tap(0.8)), tap(1) * (1 - tap(1.8)), tap(2) * (1 - tap(2.8)))})` }}>−</div>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 58, width: 40, textAlign: "center", color: theme.colors.ink }}>{bn(count)}</div>
          <div style={{ width: 78, height: 78, borderRadius: 99, background: theme.colors.green, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 50, color: "#fff" }}>+</div>
        </div>
      ) : (
        <div style={{ width: 150, height: 84, borderRadius: 99, background: interpolate(on, [0, 1], [0, 1]) > 0.5 ? theme.colors.green : theme.colors.border, padding: 8 }}>
          <div style={{ width: 68, height: 68, borderRadius: 99, background: on > 0.5 ? theme.colors.lime : "#fff",
            transform: `translateX(${interpolate(on, [0, 1], [0, 66])}px)` }} />
        </div>
      )}
    </div>
  );
};

// Step 3 scene timeline (330 frames): title → curve spikes → jilapi 4→1 → walk on → safe zone → save.
export const Forecast: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: frame - 228, fps, config: theme.spring.punch });
  const zoom = 1 + Math.sin(Math.min(punch, 1) * Math.PI) * 0.035 + interpolate(frame, [0, 330], [0, 0.04], { ...clamp, easing: theme.ease.inOut });
  const press = spring({ frame: frame - 305, fps, config: theme.spring.punch });
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <Beat from={0} dur={60}>
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 130 }}>
          <StepTitle n="০৩" bnText="খাওয়ার আগেই সুগার দেখুন" en="See your sugar before you eat" />
        </AbsoluteFill>
      </Beat>
      <Beat from={60} dur={270} keep>
        <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", flexDirection: "row", gap: 40, paddingTop: 170 }}>
          <Pop delay={0} from="left" dist={300}><RangeCard label="এখনকার প্লেট" value="১২.০–১৪.৩" color={theme.colors.high} /></Pop>
          <div style={{ position: "relative" }}>
            {frame < 228 ? (
              <Pop delay={4} from="right" dist={300}><RangeCard label="পরিবর্তনের পর" value="—" color={theme.colors.green} dim /></Pop>
            ) : (
              <Sequenced at={168}><RangeCard label="পরিবর্তনের পর" value="৮.৭–৯.৯" color={theme.colors.green} /></Sequenced>
            )}
          </div>
        </AbsoluteFill>
      </Beat>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 470 }}>
        <Pop delay={10} from="up" dist={260} cfg="smooth"><Chart /></Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1150, gap: 24 }}>
        <Pop delay={112} from="up" dist={260}><Control title="জিলাপি কমান" sub="৪টি → ১টি" kind="stepper" act={132} /></Pop>
        <Pop delay={170} from="up" dist={260}><Control title="১৫ মিনিট হাঁটা" sub="ইফতারের পর" kind="toggle" act={188} /></Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1000 }}>
        <Pop delay={240} from="zoom" cfg="punch">
          <Pill bnText="✓ নিরাপদ সীমার মধ্যে" en="Back in the safe zone" bg={theme.colors.green} color={theme.colors.lime} size={56}
            style={{ boxShadow: `0 0 60px ${theme.colors.lime}aa, ${theme.shadow}` }} />
        </Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1560 }}>
        <Pop delay={280} from="up" dist={200}>
          <div style={{ transform: `scale(${1 - Math.sin(Math.min(press, 1) * Math.PI) * 0.08})`, width: 940, height: 130, borderRadius: 99,
            background: theme.colors.green, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 48, color: "#fff", lineHeight: 1.1 }}>✓ এই পরিকল্পনা রাখুন</span>
            <span style={{ fontFamily: theme.fonts.en, fontWeight: 500, fontSize: 26, color: "#ffffffbb" }}>Save this plan</span>
          </div>
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Pops its child in when the scene reaches frame `at` (used to swap the "after" card).
const Sequenced: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.punch });
  return <div style={{ transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>{children}</div>;
};
