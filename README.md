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
| Tool | Used for |
|---|---|
| _e.g. Gemini … / Claude … (model name)_ | Meal photo recognition in `api/scan.ts` |
| Claude Code / Claude Pro | Coding assistant |
| Cursor | Coding assistant |
| Google Stitch | UI design |
| _add every other tool here_ | |

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
