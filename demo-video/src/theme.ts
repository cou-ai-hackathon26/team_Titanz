// theme.ts — every color, easing, spring and font for the video lives here.
// Colors are the app's own design tokens from docs/PRODUCT.md.
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#F7F7F4", // bg/app
    surface: "#FFFFFF",
    muted: "#F2F2EE",
    green: "#0B4A33", // bg/brand-strong
    greenMid: "#205C42", // bg/brand
    lime: "#E2F28F", // bg/page — the one highlight
    limeSoft: "#F4FBD1",
    accent: "#DAE386",
    ink: "#10231A", // text/primary
    inkDim: "#6B726C", // text/secondary
    brandText: "#046C4B",
    border: "#DEDEDC",
    low: "#258267",
    lowSoft: "#E3F2E6",
    mid: "#E3A33A",
    midSoft: "#FBEFD6",
    high: "#D95040",
    highSoft: "#FBE3DF",
  },
  fonts: {
    bn: "Hind Siliguri",
    en: "Inter",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    punch: { damping: 9, stiffness: 220, mass: 0.6 },
  },
  shadow: "0 30px 70px -20px rgba(16,35,26,0.28), 0 8px 20px -8px rgba(16,35,26,0.12)",
  // 90 BPM at 30 fps → one beat every 20 frames. Scenes cut on beats.
  beat: 20,
} as const;

// Turns English digits into Bangla digits (২, ৫.৪ …) like the app does.
export const bn = (s: string | number) =>
  String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
