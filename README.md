# Roza-Safe — রোজা-সেফ

Safer Ramadan fasting for people with diabetes. Android app · CoU AI Hackathon 2026 · Team Titanz.

Check your fasting risk, snap your iftar plate, and see what it will do to your sugar before you eat.

> Screening support only. Not a doctor and not medical advice.

## Download
- APK: _GitHub Releases link_
- Demo video: _link_

## How it works
Photo → vision AI (foods + counts as JSON) → our food table → glycemic load → 2-hour sugar curve → what-if swaps → Bangla tips.
Risk check uses the IDF-DAR (2021) Ramadan risk score.

## AI tools, models and APIs used
| Tool / model / API | Used for |
|---|---|
| Google Gemini API — `gemini-4-hydrogen` (free tier) | Reads the iftar photo: which foods and how many (`api/api/scan.ts`, `api/providers/gemini.ts`) |
| Anthropic Claude API — `claude-opus-5-5` | Backup photo reader, only if every Gemini key is out of quota (`api/providers/claude.ts`) |
| Claude Code (Claude Opus 5.5) | Coding assistant: wrote most of the app code with the team, tests, docs |
| Figma + Figma MCP | UI design; Claude Code read the Figma screens to build matching layouts |
| Cursor | Coding assistant / editor |
| Google Stitch | UI design ideas |
| _image AI used for the guide pictures — fill in_ | Onboarding guide images |

All sugar numbers come from our own maths (`lib/forecast.ts`, `lib/meal.ts`, `lib/dar.ts`), not from AI.

## Accuracy test
Tested on _N_ real Bangladeshi iftar photos: _X/N_ plates fully correct, _Y/N_ with one wrong item. Notes: _…_

## Run locally
```bash
npm install
npx expo start
cd api && vercel dev
```

## Team
Nadim (lead, app) · _Teammate 2_ (AI + API) · _Teammate 3_ (data, logic, docs)

## Sources
- IDF Diabetes Atlas — Bangladesh
- DAR-BAN study of Bangladeshi diabetic patients during Ramadan
- IDF-DAR Diabetes and Ramadan Practical Guidelines (2021)
