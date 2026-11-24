// LOGO (3s): a lime circle wipes the screen, the mark spins in, the name slams after it.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { LogoMark } from "../components/Logo";
import { Pop, WordSlam } from "../components/Motion";

// Lime circle wipe, then the mark, wordmark and tagline one after another.
export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const r = interpolate(frame, [0, 10], [150, 1400], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.out });
  const drift = interpolate(frame, [0, 90], [1, 1.08], { extrapolateRight: "clamp", easing: theme.ease.inOut });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.lime, clipPath: `circle(${r}px at 50% 50%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26, transform: `scale(${drift})` }}>
        <LogoMark size={260} delay={4} />
        <WordSlam text="রোজা-সেফ" size={170} delay={12} color={theme.colors.green} />
        <Pop delay={18}>
          <div style={{ fontFamily: theme.fonts.en, fontWeight: 800, fontSize: 64, color: theme.colors.green, letterSpacing: "-0.03em" }}>Roza-Safe</div>
        </Pop>
        <Pop delay={28} from="zoom" cfg="bouncy">
          <div style={{ fontFamily: theme.fonts.bn, fontWeight: 600, fontSize: 48, color: theme.colors.lime, background: theme.colors.green,
            borderRadius: 999, padding: "14px 40px" }}>ইফতারের আগেই সুগার জানুন</div>
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
