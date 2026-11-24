// A Beat is one short moment inside a scene: it starts at `from`, lasts `dur` frames,
// and leaves with a quick zoom-blur so the next beat can punch in.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const Exit: React.FC<{ dur: number; keep?: boolean; children: React.ReactNode }> = ({ dur, keep, children }) => {
  const frame = useCurrentFrame();
  const p = keep ? 0 : interpolate(frame, [dur - 6, dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  return (
    <AbsoluteFill style={{ opacity: 1 - p, transform: `scale(${1 + p * 0.25})`, filter: p > 0.02 ? `blur(${p * 14}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

// Shows children for `dur` frames starting at `from`, with a fast exit at the end.
export const Beat: React.FC<{ from: number; dur: number; keep?: boolean; children: React.ReactNode }> = ({ from, dur, keep, children }) => (
  <Sequence from={from} durationInFrames={dur} layout="none">
    <Exit dur={dur} keep={keep}>{children}</Exit>
  </Sequence>
);

// Centres content in the frame with a column layout.
export const Center: React.FC<{ children: React.ReactNode; gap?: number; style?: React.CSSProperties }> = ({ children, gap = 30, style }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap, padding: 80, ...style }}>
    {children}
  </AbsoluteFill>
);
