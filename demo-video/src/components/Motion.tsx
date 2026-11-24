// Small reusable motion pieces: pop-in, word slam, counter, scene whip, pill, caption.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Pops a child in with fade + rise + scale together (never a plain fade).
export const Pop: React.FC<{ delay?: number; from?: "up" | "down" | "left" | "right" | "zoom"; dist?: number;
  cfg?: keyof typeof theme.spring; style?: React.CSSProperties; children: React.ReactNode }> = ({
  delay = 0, from = "up", dist = 60, cfg = "snappy", style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring[cfg] });
  const off = interpolate(p, [0, 1], [dist, 0]);
  const tr = from === "up" ? `translateY(${off}px)` : from === "down" ? `translateY(${-off}px)`
    : from === "left" ? `translateX(${-off}px)` : from === "right" ? `translateX(${off}px)` : "";
  const sc = interpolate(p, [0, 1], [from === "zoom" ? 0.4 : 0.9, 1]);
  return (
    <div style={{ opacity: interpolate(p, [0, 0.4], [0, 1], clamp), transform: `${tr} scale(${sc})`, ...style }}>
      {children}
    </div>
  );
};

// Slams words in one by one, big and bold, with a small overshoot.
export const WordSlam: React.FC<{ text: string; delay?: number; per?: number; size?: number; color?: string;
  font?: string; weight?: number; align?: "center" | "left"; highlight?: number[]; hiColor?: string }> = ({
  text, delay = 0, per = 4, size = 140, color = theme.colors.ink, font = theme.fonts.bn, weight = 700,
  align = "center", highlight = [], hiColor = theme.colors.green }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start",
      columnGap: size * 0.28, rowGap: 0, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.15,
      color, letterSpacing: font === theme.fonts.en ? "-0.03em" : 0 }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.punch });
        return (
          <span key={i} style={{ display: "inline-block", opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
            transform: `translateY(${interpolate(p, [0, 1], [size * 0.6, 0])}px) scale(${interpolate(p, [0, 1], [1.4, 1])})`,
            color: highlight.includes(i) ? hiColor : undefined }}>{w}</span>
        );
      })}
    </div>
  );
};

// Counts a number up with a spring; shows it in Bangla digits if asked.
export const useCount = (target: number, delay: number, decimals = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 70 } });
  return (p * target).toFixed(decimals);
};

// Shows a counting number in a box sized for its FINAL value, so nothing around it
// jumps while the digits change (Bangla digits are not all the same width).
export const SteadyNum: React.FC<{ value: string; final: string; align?: "left" | "center" }> = ({ value, final, align = "left" }) => (
  <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
    <span style={{ visibility: "hidden" }}>{final}</span>
    <span style={{ position: "absolute", top: 0, left: 0, right: 0, textAlign: align }}>{value}</span>
  </span>
);

// Whip-pan wrapper: the scene flies in from the right and out to the left with blur.
export const Whip: React.FC<{ dur: number; children: React.ReactNode; noIn?: boolean; noOut?: boolean }> = ({
  dur, children, noIn, noOut }) => {
  const frame = useCurrentFrame();
  const inP = noIn ? 1 : interpolate(frame, [0, 9], [0, 1], { ...clamp, easing: theme.ease.out });
  const outP = noOut ? 0 : interpolate(frame, [dur - 8, dur], [0, 1], { ...clamp, easing: theme.ease.in });
  const x = (1 - inP) * 1100 - outP * 1100;
  const blur = (1 - inP) * 18 + outP * 18;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${x}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
};

// A rounded pill label (Bangla line + small English line), like the app's chips.
export const Pill: React.FC<{ bnText: string; en?: string; bg?: string; color?: string; size?: number;
  icon?: React.ReactNode; style?: React.CSSProperties }> = ({ bnText, en, bg = theme.colors.surface,
  color = theme.colors.ink, size = 44, icon, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 18, background: bg, color, borderRadius: 999,
    padding: `${size * 0.36}px ${size * 0.7}px`, boxShadow: theme.shadow, ...style }}>
    {icon}
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
      <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: size }}>{bnText}</span>
      {en ? <span style={{ fontFamily: theme.fonts.en, fontWeight: 500, fontSize: size * 0.5, opacity: 0.7 }}>{en}</span> : null}
    </div>
  </div>
);

// Section title: small numbered chip + big Bangla heading + English sub line.
export const StepTitle: React.FC<{ n: string; bnText: string; en: string; delay?: number }> = ({ n, bnText, en, delay = 0 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: 940, textAlign: "center" }}>
    <Pop delay={delay} from="zoom" cfg="bouncy">
      <div style={{ background: theme.colors.green, color: theme.colors.lime, fontFamily: theme.fonts.en, fontWeight: 800,
        fontSize: 34, borderRadius: 999, padding: "8px 26px" }}>{n}</div>
    </Pop>
    <WordSlam text={bnText} delay={delay + 3} size={86} per={3} />
    <Pop delay={delay + 10}>
      <div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 36, color: theme.colors.inkDim, letterSpacing: "-0.01em" }}>{en}</div>
    </Pop>
  </div>
);

// Gentle sine float for anything that stays on screen.
export const useFloat = (speed = 28, amp = 8, phase = 0) => {
  const frame = useCurrentFrame();
  return Math.sin(frame / speed + phase) * amp;
};
