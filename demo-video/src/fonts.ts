// Loads the app's fonts (Hind Siliguri for Bangla, Inter for English) before rendering.
import { continueRender, delayRender, staticFile } from "remotion";

const files: [string, string, string][] = [
  ["Hind Siliguri", "HindSiliguri_500Medium.ttf", "500"],
  ["Hind Siliguri", "HindSiliguri_600SemiBold.ttf", "600"],
  ["Hind Siliguri", "HindSiliguri_700Bold.ttf", "700"],
  ["Inter", "Inter_500Medium.ttf", "500"],
  ["Inter", "Inter_700Bold.ttf", "700"],
  ["Inter", "Inter_800ExtraBold.ttf", "800"],
];

// Waits until every font file is loaded, so no frame renders with a fallback font.
const handle = delayRender("Loading fonts");
Promise.all(
  files.map(async ([family, file, weight]) => {
    const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight });
    await face.load();
    document.fonts.add(face);
  }),
).then(() => continueRender(handle));
