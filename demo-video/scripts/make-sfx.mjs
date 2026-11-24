// Makes the music bed and the soft sound effects as WAV files, so we need no downloads.
// Run: node scripts/make-sfx.mjs  → writes into public/sfx/
import { writeFileSync, mkdirSync } from "node:fs";

const RATE = 44100;
const OUT = new URL("../public/sfx/", import.meta.url);
mkdirSync(OUT, { recursive: true });

// Saves an array of samples (-1..1) as a 16-bit mono WAV file.
function saveWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write("RIFF", 0); head.writeUInt32LE(36 + data.length, 4); head.write("WAVE", 8);
  head.write("fmt ", 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
  head.writeUInt32LE(RATE, 24); head.writeUInt32LE(RATE * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
  head.write("data", 36); head.writeUInt32LE(data.length, 40);
  writeFileSync(new URL(name, OUT), Buffer.concat([head, data]));
}

// Repeatable random numbers, so every run gives the same sound.
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Adds a sound into a track at time `at` (seconds).
function mix(track, sound, at, vol = 1) {
  const s = Math.floor(at * RATE);
  for (let i = 0; i < sound.length && s + i < track.length; i++) if (s + i >= 0) track[s + i] += sound[i] * vol;
}
// Softens a sound by cutting high frequencies (simple one-pole low-pass).
function lowpass(x, amount) {
  let y = 0; const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { y += (x[i] - y) * amount; out[i] = y; }
  return out;
}
// Echo: repeats the sound every `time` seconds, each repeat quieter (gives space).
function echo(x, time, feedback, wet) {
  const d = Math.floor(time * RATE); const out = new Float32Array(x.length); const buf = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { const fb = i >= d ? buf[i - d] : 0; buf[i] = x[i] + fb * feedback; out[i] = x[i] + fb * wet; }
  return out;
}

// Electric-piano note: a soft bell-like sine with a gentle fading shimmer.
function epNote(f, len) {
  const n = Math.floor(RATE * len); const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE;
    const env = Math.min(1, t * 120) * Math.exp(-t * 1.6);
    const mod = Math.sin(2 * Math.PI * f * 2 * t) * 1.1 * Math.exp(-t * 4);
    o[i] = (Math.sin(2 * Math.PI * f * t + mod) * 0.8 + Math.sin(2 * Math.PI * f * 2 * t) * 0.08) * env; }
  return o;
}
// Pluck for the melody: round tone that dies quickly.
function pluck(f, len = 0.6) {
  const n = Math.floor(RATE * len); const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; const env = Math.min(1, t * 300) * Math.exp(-t * 6);
    o[i] = (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 3 * t) * 0.12 * Math.exp(-t * 12)) * env; }
  return o;
}
// Soft kick: low sine thump, no click.
function softKick() {
  const n = Math.floor(RATE * 0.45); const o = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / RATE; const f = 48 + 60 * Math.exp(-t * 22); ph += (2 * Math.PI * f) / RATE;
    o[i] = Math.sin(ph) * Math.min(1, t * 400) * Math.exp(-t * 7); }
  return o;
}
// Shaker: quiet, bright little noise tick.
function shaker() {
  const n = Math.floor(RATE * 0.07); const o = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) { const t = i / RATE; const r = rand(); const hp = r - prev; prev = r;
    o[i] = hp * Math.min(1, t * 200) * Math.exp(-t * 55) * 0.5; }
  return o;
}
// Soft snap on beats 2 and 4: short filtered noise with a little body.
function snap() {
  const n = Math.floor(RATE * 0.18); const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; raw[i] = (rand() * 0.7 + Math.sin(2 * Math.PI * 220 * t) * 0.3) * Math.exp(-t * 30); }
  return lowpass(raw, 0.35);
}

// ---- Music: 90 BPM, warm and hopeful, 70 seconds ----
const BPM = 90; const beat = 60 / BPM; const bar = beat * 4; const LEN = 70;
const keys = new Float32Array(RATE * LEN);
const bass = new Float32Array(RATE * LEN);
const drums = new Float32Array(RATE * LEN);
const lead = new Float32Array(RATE * LEN);
// Chords (MIDI notes): Dm9 → Bbmaj7 → F/A → C(add9). Bass roots below.
const chords = [[62, 65, 69, 72, 76], [58, 62, 65, 69, 74], [57, 60, 65, 69, 72], [55, 60, 64, 67, 74]];
const roots = [38, 34, 33, 36];
const bars = Math.ceil(LEN / bar);
for (let b = 0; b < bars; b++) {
  const t0 = b * bar; const ch = chords[b % 4];
  // Piano: full chord on beat 1, softer re-hit on the "and" of beat 2.
  ch.forEach((n, k) => mix(keys, epNote(midi(n), bar * 1.1), t0 + k * 0.012, 0.16));
  ch.slice(1, 4).forEach((n) => mix(keys, epNote(midi(n), bar * 0.6), t0 + beat * 1.5, 0.07));
  // Bass: warm sine, a long note then a short pickup.
  for (const [st, len, v] of [[0, beat * 2.6, 1], [beat * 3, beat * 0.9, 0.7]]) {
    const f = midi(roots[b % 4]); const s0 = Math.floor((t0 + st) * RATE); const n = Math.floor(len * RATE);
    for (let i = 0; i < n && s0 + i < bass.length; i++) { const t = i / RATE;
      const env = Math.min(1, t * 60) * Math.min(1, (n - i) / (RATE * 0.05));
      bass[s0 + i] += (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 2 * t) * 0.15) * env * 0.35 * v; }
  }
  // Drums start on bar 2: kick on 1 and 3, snap on 2 and 4, shaker on eighths.
  if (b >= 2) {
    mix(drums, softKick(), t0, 0.8); mix(drums, softKick(), t0 + beat * 2, 0.65);
    if (b % 2 === 1) mix(drums, softKick(), t0 + beat * 2.5, 0.4);
    mix(drums, snap(), t0 + beat, 0.22); mix(drums, snap(), t0 + beat * 3, 0.22);
    for (let e = 0; e < 8; e++) mix(drums, shaker(), t0 + e * beat / 2, e % 2 ? 0.28 : 0.14);
  }
}
// Melody: a simple D-minor pentatonic motif, starting bar 4, two-bar phrases with small changes.
const motifA = [[0, 74, 1], [1, 72, 0.5], [1.5, 69, 0.5], [2, 72, 1], [3, 74, 1], [4.5, 77, 0.5], [5, 76, 1], [6, 74, 2]];
const motifB = [[0, 69, 1], [1, 72, 0.5], [1.5, 74, 0.5], [2, 77, 1], [3, 76, 0.5], [3.5, 74, 0.5], [4, 72, 2], [6.5, 69, 1]];
for (let p = 0; p * 2 * bar + 4 * bar < LEN - bar; p++) {
  const motif = p % 2 === 0 ? motifA : motifB; const start = 4 * bar + p * 2 * bar;
  for (const [bt, n] of motif) mix(lead, pluck(midi(n)), start + bt * beat, 0.12);
}

// Put it together: piano and melody get echo, everything a little softened.
const keysWet = echo(lowpass(keys, 0.5), beat * 0.75, 0.35, 0.3);
const leadWet = echo(lowpass(lead, 0.45), beat * 0.75, 0.45, 0.45);
const music = new Float32Array(RATE * LEN);
for (let i = 0; i < music.length; i++) music[i] = keysWet[i] + leadWet[i] + bass[i] + drums[i] * 0.9;
// Fade in the first 1.5 s and out the last 3 s, then normalise.
for (let i = 0; i < RATE * 1.5; i++) music[i] *= i / (RATE * 1.5);
for (let i = 0; i < RATE * 3; i++) music[music.length - 1 - i] *= i / (RATE * 3);
let peak = 0; for (const v of music) peak = Math.max(peak, Math.abs(v));
saveWav("music.wav", music.map((v) => (v / peak) * 0.9));

// ---- Soft sound effects (no whoosh) ----
// Pop: a soft round "bloop" for cards appearing.
{ const n = Math.floor(RATE * 0.14); const o = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / RATE; ph += (2 * Math.PI * (520 * Math.exp(-t * 18) + 260)) / RATE;
    o[i] = Math.sin(ph) * Math.min(1, t * 500) * Math.exp(-t * 28) * 0.7; }
  saveWav("pop.wav", o); }
// Tick: a gentle wooden tap for counters and ticks.
{ const n = Math.floor(RATE * 0.05); const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / RATE; o[i] = (Math.sin(2 * Math.PI * 1300 * t) * 0.6 + Math.sin(2 * Math.PI * 650 * t) * 0.4) * Math.exp(-t * 110) * 0.6; }
  saveWav("tick.wav", o); }
// Thump: a soft low hit for big moments (no noise).
{ const n = Math.floor(RATE * 0.6); const o = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / RATE; ph += (2 * Math.PI * (55 + 50 * Math.exp(-t * 18))) / RATE;
    o[i] = Math.sin(ph) * Math.min(1, t * 300) * Math.exp(-t * 6) * 0.9; }
  saveWav("impact.wav", o); }
// Shimmer: a soft bell sparkle for the AI and success moments.
{ const n = Math.floor(RATE * 1.2); const o = new Float32Array(n);
  [88, 93, 95, 100].forEach((m, k) => { const f = midi(m); const st = Math.floor(k * 0.07 * RATE);
    for (let i = 0; st + i < n; i++) { const t = i / RATE; o[st + i] += Math.sin(2 * Math.PI * f * t) * Math.min(1, t * 400) * Math.exp(-t * 4) * 0.16; } });
  saveWav("shimmer.wav", o); }
// Warn: two gentle falling tones for risk/emergency (not a harsh beep).
{ const n = Math.floor(RATE * 0.7); const o = new Float32Array(n);
  [[0, 76], [0.18, 72]].forEach(([at, m]) => { const f = midi(m); const st = Math.floor(at * RATE);
    for (let i = 0; st + i < n; i++) { const t = i / RATE; o[st + i] += (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 2 * t) * 0.2) * Math.min(1, t * 300) * Math.exp(-t * 5) * 0.4; } });
  saveWav("alert.wav", o); }
console.log("music + sfx written");
