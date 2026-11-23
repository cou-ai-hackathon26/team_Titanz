# Roza-Safe — রোজা-সেফ

Safer Ramadan fasting for people with type 2 diabetes in Bangladesh. Android app · CoU AI Hackathon 2026 · Team Titanz.

Check your fasting risk, snap your iftar (or sehri) plate, and see what it will do to your sugar **before** you eat.

> স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় — Screening support only. Not a doctor and not medical advice. The app never gives medicine or insulin dose advice.

## Download
- **APK:** [GitHub Releases → v1.0](https://github.com/nadim-titanz/roza-safe/releases/latest) (Android; allow "install unknown apps", Play Protect → "Install anyway")
- **Demo video:** _link_

## What it does
| | Feature |
|---|---|
| 1 | **Risk check (IDF-DAR 2021):** an 8-question quiz (+ pregnancy for women) → Low / Moderate / High score with reasons. High → "see a doctor before fasting". Share a report for the doctor. |
| 2 | **Plate scan (real AI):** camera or gallery → vision AI names the Bangladeshi foods and counts them → user fixes counts with − / +. Unsure foods are marked. No photo? **Add foods by hand.** |
| 3 | **Sugar forecast:** our own maths turns the plate into a 2-hour sugar curve with a safe zone, shown as a range (estimate). **What-ifs:** eat less of the biggest-sugar food, add chola, 15-minute walk — the curve changes instantly. |
| 4 | **Sehri or iftar:** each plate is marked sehri or iftar, picked automatically by the time and the district's sehri time (user can switch). |
| 5 | **Pre-iftar check + emergency steps:** symptom tiles → the 3 IDF-DAR steps, log a glucometer reading (below 3.9 or above 16.7 mmol/L → break the fast), call 16263, alert family (SMS, or opens Contacts if no number is saved). |
| 6 | **Home:** live sehri/iftar countdown for your district, last sugar reading, this week (tap a day to see it in History), pre-iftar card. |
| 7 | **History:** every saved plan and reading; tap a plan for its details (foods, sugar per food, curve, peak, that day's readings). |
| 8 | **Reminders (on the phone, offline):** 1 hour before iftar (opens the check) and, for tablet/insulin users, 30 minutes before sehri ends ("take your medicine as your doctor said" — never a dose). |
| 9 | **Settings:** edit profile, district and family number, redo the risk check, scan server test, share a full backup, delete all data. |

Bangla first, with short English sub-labels. Smooth, Apple-style motion (springs, swipe-down sheets) that turns off with the phone's "reduce motion" setting.

## How it works
```
Photo ─▶ scan server (Vercel) ─▶ vision AI: food ids + counts (JSON, ids limited to our table)
      ─▶ app: our food table (lib/foods.ts) ─▶ carbs + glycemic load (lib/meal.ts)
      ─▶ 2-hour curve + what-ifs (lib/forecast.ts) ─▶ Bangla advice
Risk quiz ─▶ IDF-DAR 2021 points (lib/dar.ts) ─▶ Low / Moderate / High
```
The AI only **reads the plate**. Everything else — the food table, glycemic load, the sugar curve, the IDF-DAR score and the safety rules — is our own code with sources (`docs/LOGIC.md`), covered by 41 unit tests (`npm test`).

**If the AI is busy or out of free quota:** the server tries the next Gemini key, then **Groq** (free), then Claude (if a key is set). If all are out, the app says so in Bangla and the user adds foods by hand — the forecast still works.

**Privacy:** no login, no account. Everything is stored only on the phone. The meal photo is sent to the scan server for reading and is not stored. AI keys live only in Vercel, never in the app or this repo.

## AI tools, models and APIs used
| Tool / model / API | Used for |
|---|---|
| Google Gemini API — `gemini-4-hydrogen` (free tier) | Reads the meal photo: which foods and how many (`api/api/scan.ts`, `api/providers/gemini.ts`) |
| Groq API — `qwen/qwen3.8-27b` (free plan) | Backup photo reader when Gemini's free quota is used up (`api/providers/groq.ts`) |
| Anthropic Claude API — `claude-opus-5-5` | Last backup photo reader, only if every Gemini key and Groq are out (`api/providers/claude.ts`) |
| Claude Code (Claude Opus 5.5) | Coding assistant: wrote most of the app code with the team, tests, docs |
| Figma + Figma MCP | UI design; Claude Code read the Figma screens to build matching layouts |
| Cursor | Coding assistant / editor |
| Google Stitch | UI design ideas |
| Google Gemini (image generation) | Onboarding guide pictures |

All sugar numbers come from our own maths (`lib/forecast.ts`, `lib/meal.ts`, `lib/dar.ts`), not from AI.

## Accuracy test
Tested on **10 real Bangladeshi iftar photos: 8/10 plates fully correct** (every food and count right). When the AI misses or miscounts, the user fixes it with − / + or adds the food by hand, and unsure foods are marked for checking.

## Run locally
```bash
npm install
npx expo start              # app in Expo Go
npm test                    # 41 unit tests (no internet needed)
cd api && npm run dev       # scan server on port 3001 (needs api/.env.local, see api/.env.example)
npx eas build -p android --profile preview   # APK
```

## Built with
Expo (React Native, TypeScript, Expo Router), react-native-svg, AsyncStorage, expo-camera / image-picker, expo-notifications, Vercel serverless function. Fonts: Hind Siliguri, Inter, Noto Sans Bengali (digits).

## Team
**Team Titanz:** Nadimul Islam (lead, app) · Md Lokman Hossen (AI + API) · Mahfiz Rahman (data, logic, docs)

## Sources
- IDF Diabetes Atlas — Bangladesh
- DAR-BAN study of Bangladeshi diabetic patients during Ramadan
- IDF-DAR Diabetes and Ramadan Practical Guidelines (2021) — risk score and "break the fast" rules
- Food composition and glycemic index sources are listed per food in `lib/foods.ts`
