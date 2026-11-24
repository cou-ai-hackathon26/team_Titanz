// CTA (7s): green screen, the mark, the promise, the download button, team line and safety note.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { LogoMark } from "../components/Logo";
import { Pop, WordSlam } from "../components/Motion";

// The closing call to action, with a glowing lime download button that gets "tapped".
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipe = interpolate(frame, [0, 8], [120, 1500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.out });
  const tap = spring({ frame: frame - 130, fps, config: theme.spring.punch });
  const breathe = 1 + Math.sin(frame / 10) * 0.025;
  const glow = 40 + Math.sin(frame / 8) * 20;
  const ring = interpolate(frame, [130, 155], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.out });
  const fadeOut = interpolate(frame, [195, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.green, clipPath: `circle(${wipe}px at 50% 100%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30, padding: 70 }}>
        <LogoMark size={200} delay={4} onDark />
        <WordSlam text="রোজা রাখুন নিরাপদে" size={140} per={4} delay={14} color="#fff" highlight={[2]} hiColor={theme.colors.lime} />
        <Pop delay={30}><div style={{ fontFamily: theme.fonts.en, fontWeight: 800, fontSize: 52, color: theme.colors.lime, letterSpacing: "-0.02em" }}>Fast safely this Ramadan</div></Pop>
        <div style={{ height: 40 }} />
        <Pop delay={50} from="up" dist={200} cfg="bouncy">
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -30 * ring, borderRadius: 999, border: `6px solid ${theme.colors.lime}`, opacity: 1 - ring }} />
            <div style={{ width: 820, height: 170, borderRadius: 999, background: theme.colors.lime, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${glow}px ${theme.colors.lime}99`,
              transform: `scale(${breathe * (1 - Math.sin(Math.min(tap, 1) * Math.PI) * 0.08)})` }}>
              <span style={{ fontFamily: theme.fonts.bn, fontWeight: 700, fontSize: 64, color: theme.colors.green, lineHeight: 1.1 }}>অ্যাপটি ডাউনলোড করুন</span>
              <span style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 32, color: theme.colors.green, opacity: 0.75 }}>Get the Roza-Safe APK</span>
            </div>
          </div>
        </Pop>
        <div style={{ height: 30 }} />
        <Pop delay={75}>
          <div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 38, color: "#fff", textAlign: "center" }}>Team Titanz · CoU AI Hackathon 2026</div>
        </Pop>
        <Pop delay={90}>
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 500, fontSize: 32, color: "#ffffffaa", textAlign: "center" }}>
            স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only
          </div>
        </Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.green, opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
