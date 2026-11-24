# Makes the Bangla voice-over lines with Microsoft's free neural voice (edge-tts),
# saves them in public/vo/, and writes src/vo.json with each line's length in frames.
# Run: .venv/bin/python scripts/make-voice.py
import asyncio, json, subprocess, pathlib

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo"
OUT.mkdir(parents=True, exist_ok=True)
VOICE = "bn-BD-PradeepNeural"  # male Bangladeshi voice

# id → (text, speaking rate). Only hook, forecast (wow moment) and CTA have voice.
LINES = {
    "hook1": ("ডায়াবেটিস নিয়ে রোজা রাখবেন?", "+0%"),
    "hook2": ("প্রায় সবাই রাখতে চান।", "+0%"),
    "hook3": ("কিন্তু নিরাপদ, অর্ধেকেরও কম।", "+0%"),
    "hook4": ("আর বিপদ লুকিয়ে থাকে ইফতারের প্লেটেই।", "+5%"),
    "fc1": ("খাওয়ার আগেই দেখুন, সুগার কোথায় উঠবে।", "+0%"),
    "fc2": ("একটা জিলাপি কম।", "+0%"),
    "fc3": ("ইফতারের পর পনেরো মিনিট হাঁটা।", "+0%"),
    "fc4": ("ব্যস, সুগার ফিরে এল নিরাপদ সীমায়।", "+0%"),
    "cta1": ("রোজা রাখুন নিরাপদে।", "-5%"),
    "cta2": ("রোজা-সেফ।", "-5%"),
}


# Asks edge-tts for one line and saves it as an mp3.
async def make(name, text, rate):
    await edge_tts.Communicate(text, VOICE, rate=rate).save(str(OUT / f"{name}.mp3"))


# Reads how long an audio file is, in seconds (uses ffprobe).
def seconds(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True).stdout
    return float(out.strip())


# Cuts the silence edge-tts leaves at the start and end, and saves a .wav.
def trim(name):
    src, dst = OUT / f"{name}.mp3", OUT / f"{name}.wav"
    cut = "silenceremove=start_periods=1:start_threshold=-45dB"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f"{cut},areverse,{cut},areverse", "-ar", "44100", str(dst)], check=True)
    src.unlink()


async def main():
    await asyncio.gather(*(make(n, t, r) for n, (t, r) in LINES.items()))
    for n in LINES:
        trim(n)
    lengths = {n: round(seconds(OUT / f"{n}.wav") * 30) for n in LINES}
    (ROOT / "src" / "vo.json").write_text(json.dumps(lengths, indent=2))
    for n, f in lengths.items():
        print(f"{n:6s} {f:4d} frames  {f / 30:.2f}s  {LINES[n][0]}")


asyncio.run(main())
