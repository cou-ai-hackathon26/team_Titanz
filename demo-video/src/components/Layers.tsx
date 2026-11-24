// The look layers every scene sits on: moving background, colour grade, grain and vignette.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Soft moving blobs of lime and green so the background is never flat.
export const BgMesh: React.FC<{ tint?: string }> = ({ tint = theme.colors.lime }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 40) * 60;
  const d2 = Math.cos(frame / 52) * 50;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div style={{ position: "absolute", width: 1300, height: 1300, borderRadius: "50%", top: -520, left: -380 + d1,
        filter: "blur(40px)", background: `radial-gradient(circle, ${tint}cc, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -480, right: -360 - d2,
        filter: "blur(60px)", background: `radial-gradient(circle, ${theme.colors.accent}88, transparent 65%)` }} />
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", top: 700 + d2, left: 600 + d1,
        filter: "blur(80px)", background: `radial-gradient(circle, ${theme.colors.lowSoft}, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

// A light grade on top of everything to tie footage and graphics together.
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.green, mixBlendMode: "soft-light", opacity: 0.12 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05), transparent 25%, transparent 75%, rgba(0,0,0,0.08))" }} />
  </AbsoluteFill>
);

// Moving film grain made from an SVG noise pattern (no image file needed).
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px",
      backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.05, mixBlendMode: "multiply" }} />
  );
};

// Darkens the corners a little so the eye goes to the middle.
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 58%, rgba(16,35,26,0.18) 100%)" }} />
);
