// Registers the demo video: 1080×1920 (vertical), 30 fps, 41 seconds.
import React from "react";
import { Composition } from "remotion";
import { Main, TOTAL } from "./Main";

export const Root: React.FC = () => (
  <Composition id="RozaSafeDemo" component={Main} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
);
