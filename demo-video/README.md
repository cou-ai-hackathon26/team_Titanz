# Roza-Safe demo video

A 67-second vertical demo (1080×1920, 30 fps) made with Remotion. It is separate from the app and has its own packages.

Structure: Hook → Logo → Demo (setup, risk check, plate scan, sugar forecast, pre-iftar check) → End result → CTA.

## Make it again
```bash
cd demo-video
npm install
npm run sfx        # builds music + sound effects into public/sfx
python3 -m venv .venv && .venv/bin/pip install edge-tts
.venv/bin/python scripts/make-voice.py   # Bangla AI voice (bn-BD-PradeepNeural) into public/vo + src/vo.json
```
Put the screen recording at `public/rec.mp4` (status bar cropped, 30 fps):
```bash
ffmpeg -i screen-record.mp4 -vf "crop=720:1522:0:72,fps=30" -an -c:v libx264 -crf 18 -g 15 -pix_fmt yuv420p public/rec.mp4
```
Render:
```bash
npm run render -- --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```
Preview and edit live: `npm run studio`.

## Where things are
- `src/Main.tsx` scene order, timing and sound cues (scene order, lengths and sound cues per scene)
- `src/scenes/` one file per scene
- `src/theme.ts` colours (the app's tokens), easings, springs
- Plate photo, scan numbers and forecast numbers come from real app screens. No AI output is invented.
