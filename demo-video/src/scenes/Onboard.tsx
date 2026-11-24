// ONBOARDING (4s): cuts of the real setup screens, with two floating promise pills.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "../theme";
import { Phone } from "../components/Phone";
import { Pill, Pop, WordSlam, useFloat } from "../components/Motion";

// One phone; the screen inside cuts every second to a new setup step.
export const Onboard: React.FC = () => {
  const f1 = useFloat(20, 10);
  const f2 = useFloat(24, 10, 2);
  const cuts = [{ at: 2.5, rate: 1 }, { at: 5, rate: 1.5 }, { at: 15, rate: 2 }, { at: 26, rate: 2 }];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
        <WordSlam text="১ মিনিটেই শুরু" size={120} per={4} />
        <Pop delay={10}><div style={{ fontFamily: theme.fonts.en, fontWeight: 700, fontSize: 40, color: theme.colors.inkDim }}>Set up in a minute</div></Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 330 }}>
        <div style={{ position: "relative" }}>
          {cuts.map((c, i) => (
            <Sequence key={i} from={i * 30} durationInFrames={30} layout="none">
              <Phone at={c.at} rate={c.rate} width={500} delay={i === 0 ? 0 : -30} tilt={-6} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 50, top: 820 + f1 }}>
          <Pop delay={14} from="left" dist={200}><Pill bnText="লগইন ছাড়াই" en="No sign-in" bg={theme.colors.lime} /></Pop>
        </div>
        <div style={{ position: "absolute", right: 50, top: 1240 + f2 }}>
          <Pop delay={40} from="right" dist={200}><Pill bnText="পুরোটা বাংলায়" en="All in Bangla" /></Pop>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
