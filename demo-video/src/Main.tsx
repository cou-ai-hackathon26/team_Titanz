// The full demo (about 67 s): Hook → Logo → Demo (setup, 4 steps) → End result → CTA.
// Each text moment stays up 2–3 seconds so it can be read; the camera keeps drifting meanwhile.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import "./fonts";
import voLen from "./vo.json";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { Whip } from "./components/Motion";
import { Hook } from "./scenes/Hook";
import { LogoReveal } from "./scenes/LogoReveal";
import { Onboard } from "./scenes/Onboard";
import { Risk } from "./scenes/Risk";
import { Scan } from "./scenes/Scan";
import { Forecast } from "./scenes/Forecast";
import { Check } from "./scenes/Check";
import { Result } from "./scenes/Result";
import { Cta } from "./scenes/Cta";

// A sound cue inside a scene: [sound file, frame inside the scene, volume].
type Cue = [string, number, number];
type SceneDef = { C: React.FC; dur: number; noIn?: boolean; noOut?: boolean; cues: Cue[] };

// Scenes in order. Sound cues land 2 frames before the thing they go with. No whoosh sounds.
const scenes: SceneDef[] = [
  { C: Hook, dur: 285, noIn: true, cues: [
    ["impact", 0, 0.5], ["pop", 2, 0.35],
    ["impact", 75, 0.45], ["tick", 80, 0.3], ["tick", 88, 0.3], ["tick", 96, 0.3],
    ["impact", 150, 0.45], ["alert", 160, 0.35],
    ["impact", 225, 0.5] ] },
  { C: LogoReveal, dur: 90, noIn: true, cues: [["shimmer", 2, 0.5], ["pop", 10, 0.4]] },
  { C: Onboard, dur: 120, cues: [["pop", 12, 0.35], ["tick", 30, 0.25], ["pop", 38, 0.35], ["tick", 60, 0.25], ["tick", 90, 0.25]] },
  { C: Risk, dur: 210, cues: [
    ["pop", 14, 0.35], ["tick", 26, 0.35], ["pop", 40, 0.35], ["tick", 52, 0.35], ["pop", 66, 0.35], ["tick", 78, 0.35],
    ["impact", 120, 0.45], ["alert", 144, 0.35], ["pop", 162, 0.35] ] },
  { C: Scan, dur: 300, cues: [
    ["pop", 2, 0.3], ["shimmer", 18, 0.45],
    ["shimmer", 75, 0.35], ["pop", 85, 0.35], ["pop", 97, 0.35], ["pop", 109, 0.35], ["pop", 121, 0.35],
    ["impact", 165, 0.45], ["tick", 172, 0.25], ["tick", 180, 0.25], ["tick", 188, 0.25], ["alert", 197, 0.3],
    ["pop", 245, 0.35] ] },
  { C: Forecast, dur: 330, cues: [
    ["pop", 8, 0.3], ["alert", 58, 0.3], ["pop", 60, 0.35],
    ["pop", 110, 0.35], ["tick", 132, 0.4], ["tick", 142, 0.4], ["tick", 152, 0.4],
    ["pop", 168, 0.35], ["tick", 186, 0.4],
    ["impact", 226, 0.5], ["shimmer", 238, 0.5], ["pop", 278, 0.35], ["tick", 303, 0.4] ] },
  { C: Check, dur: 240, cues: [
    ["pop", 12, 0.35], ["pop", 26, 0.35], ["pop", 40, 0.35], ["pop", 54, 0.35],
    ["impact", 103, 0.45], ["alert", 105, 0.35], ["pop", 117, 0.3], ["pop", 135, 0.3], ["pop", 153, 0.3], ["pop", 175, 0.35], ["pop", 191, 0.35] ] },
  { C: Result, dur: 225, cues: [
    ["pop", 14, 0.35], ["pop", 32, 0.35], ["pop", 50, 0.35], ["pop", 68, 0.35], ["pop", 108, 0.35], ["pop", 138, 0.35] ] },
  { C: Cta, dur: 210, noIn: true, noOut: true, cues: [["impact", 2, 0.5], ["pop", 12, 0.35], ["shimmer", 48, 0.45], ["pop", 128, 0.4]] },
];

// Work out where each scene starts (one after another).
const starts = scenes.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + scenes[i - 1].dur], []);
export const TOTAL = starts[starts.length - 1] + scenes[scenes.length - 1].dur;
const sceneStart = (C: React.FC) => starts[scenes.findIndex((s) => s.C === C)];

// Voice is OFF until the ElevenLabs recordings arrive (see VOICE-SCRIPT.md).
const VOICE_ON = false;

// Voice-over lines: [file in public/vo, start frame]. Each starts on its visual.
const voiceLines: [keyof typeof voLen, number][] = [
  ["hook1", 6], ["hook2", 81], ["hook3", 156], ["hook4", 230],
  ["fc1", sceneStart(Forecast) + 14], ["fc2", sceneStart(Forecast) + 130],
  ["fc3", sceneStart(Forecast) + 186], ["fc4", sceneStart(Forecast) + 240],
  ["cta1", sceneStart(Cta) + 16], ["cta2", sceneStart(Cta) + 60],
];
const voice = VOICE_ON ? voiceLines : [];

// Music volume: normal, but dips to 40% while the voice speaks (smooth 8-frame ramps).
const musicVolume = (f: number) => {
  let duck = 1;
  for (const [id, at] of voice) {
    const end = at + voLen[id];
    const d = interpolate(f, [at - 8, at, end, end + 8], [1, 0.4, 0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    duck = Math.min(duck, d);
  }
  const fadeOut = interpolate(f, [TOTAL - 60, TOTAL], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return 0.75 * duck * fadeOut;
};

// Puts every scene, the look layers, the music and the sound effects together.
export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: "#F7F7F4" }}>
    <BgMesh />
    {scenes.map(({ C, dur, noIn, noOut }, i) => (
      <Sequence key={i} from={starts[i]} durationInFrames={dur}>
        <Whip dur={dur} noIn={noIn} noOut={noOut}><C /></Whip>
      </Sequence>
    ))}
    <Grade />
    <Grain />
    <Vignette />
    <Audio src={staticFile("sfx/music.wav")} volume={musicVolume} />
    {voice.map(([id, at]) => (
      <Sequence key={id} from={at} durationInFrames={voLen[id] + 10}>
        <Audio src={staticFile(`vo/${id}.wav`)} volume={1} />
      </Sequence>
    ))}
    {scenes.flatMap(({ cues }, i) => cues.map(([name, f, v], k) => (
      <Sequence key={`s${i}-${k}`} from={Math.max(0, starts[i] + f - 2)} durationInFrames={45}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={v} />
      </Sequence>
    )))}
  </AbsoluteFill>
);
