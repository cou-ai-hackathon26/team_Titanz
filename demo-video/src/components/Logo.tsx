// The Roza-Safe mark: a dark green tile with a lime crescent and a small shield tick.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// Draws the mark and spins/pops it in after `delay` frames.
export const LogoMark: React.FC<{ size?: number; delay?: number; onDark?: boolean }> = ({ size = 220, delay = 0, onDark }) => {
  // On a dark green background the colours swap so the tile stays visible.
  const tile = onDark ? theme.colors.lime : theme.colors.green;
  const fg = onDark ? theme.colors.green : theme.colors.lime;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  const r = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  const tick = spring({ frame: frame - delay - 8, fps, config: theme.spring.snappy });
  return (
    <div style={{ width: size, height: size, transform: `scale(${p}) rotate(${interpolate(r, [0, 1], [-90, 0])}deg)`,
      filter: `drop-shadow(0 ${size * 0.12}px ${size * 0.2}px rgba(11,74,51,0.35))` }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <rect x="0" y="0" width="100" height="100" rx="28" fill={tile} />
        <path d="M58 20a30 30 0 1 0 22 46a24 24 0 1 1-22-46z" fill={fg} />
        <g transform={`translate(62 56) scale(${tick})`}>
          <path d="M0 -14 L13 -9 V2 C13 10 7 15 0 18 C-7 15 -13 10 -13 2 V-9 Z" fill={fg} stroke={tile} strokeWidth="3" />
          <path d="M-6 2 L-1.5 6.5 L6.5 -2.5" fill="none" stroke={tile} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};
