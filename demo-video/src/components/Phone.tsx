// A phone frame that plays a piece of the real screen recording (or shows a still image).
import React from "react";
import { Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// Recording is 720×1522 after cropping the status bar.
export const PHONE_RATIO = 1522 / 720;

// Shows the phone; `at` = second in the recording to start from, `rate` = playback speed.
export const Phone: React.FC<{ at?: number; rate?: number; img?: string; width?: number; tilt?: number;
  delay?: number; style?: React.CSSProperties; zoom?: number; zoomY?: number }> = ({
  at, rate = 1, img, width = 560, tilt = 0, delay = 0, style, zoom = 1, zoomY = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  const h = width * PHONE_RATIO;
  const bez = width * 0.03;
  const float = Math.sin(frame / 30) * 6;
  return (
    <div style={{ width, height: h, borderRadius: width * 0.12, background: theme.colors.ink, padding: bez,
      boxShadow: "0 60px 120px -30px rgba(16,35,26,0.45), 0 20px 40px -20px rgba(16,35,26,0.3)",
      opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      transform: `perspective(2400px) translateY(${interpolate(p, [0, 1], [260, 0]) + float}px) rotateY(${tilt}deg) rotateX(${interpolate(p, [0, 1], [18, 0])}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
      ...style }}>
      <div style={{ width: "100%", height: "100%", borderRadius: width * 0.1, overflow: "hidden", background: "#fff", position: "relative" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${zoom}) translateY(${zoomY}px)`, transformOrigin: "50% 0%" }}>
          {img ? (
            <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          ) : (
            <OffthreadVideo src={staticFile("rec.mp4")} startFrom={Math.round((at ?? 0) * 30)} playbackRate={rate} muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
      </div>
    </div>
  );
};
