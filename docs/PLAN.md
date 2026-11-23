# Plan

Today's date matters: code only from **21 Nov**. Final is **24 Nov** (5 hrs on-site).

## Roles
| Who | Owns |
|---|---|
| Nadimul Islam (lead) | Expo app, all screens (match Figma "My choice" page), navigation, UI polish, APK build, pitch |
| Md Lokman Hossen | `api/scan.ts`, vision prompt + JSON schema, testing on 15+ real iftar photos, accuracy note |
| Mahfiz Rahman | `lib/foods.ts` data, `lib/dar.ts`, `lib/forecast.ts`, README, demo video, Q&A cheat sheet |

Everyone must be able to explain the whole flow.

## Day 1 — Sat 21 Nov
- [x] Create **public** GitHub repo (today or later, not before). Add these docs. First commit.
- [x] `create-expo-app` (TypeScript) + Expo Router + fonts + `theme/tokens.ts`
- [x] Static UI for M1–M6 (no logic yet), matching the Figma "My choice" page
- [x] `api/scan.ts` deployed on Vercel, returns JSON for one test photo
- [x] `lib/dar.ts` with real IDF-DAR points + test cases
- [x] Risk quiz → result working end to end (M2, M3)

## Day 2 — Sun 22 Nov
- [x] `lib/foods.ts` filled (30 foods, with sources)
- [x] Scan flow: photo → API → foods list → +/− edit → total carbs (M4)
- [x] `lib/forecast.ts` + `CurveChart` + what-if controls (M5)
- [x] Pre-iftar check + emergency steps (M6)
- [x] Test scan on real photos: **8/10 correct** (in README)

## Day 3 — Mon 23 Nov
- [x] First APK via EAS (`preview` profile). Install on 2–3 phones.
- [x] Fix bugs found on real phones (fonts, camera permission, small screens)
- [ ] README: what it is, how to run, **every AI tool/model/API used**, APK link, accuracy test
- [ ] Record ≤3-min demo video (offline copy too)
- [ ] **Pay Tk 1,350 by 11:59 PM** (only to official number)
- [x] NICE features only if all MUST work: N1 home, N2 notification

## Final — Tue 24 Nov (5 hours)
- Hour 1: pull latest, check APK + API alive, commit
- Hours 2–3: fix issues, small polish, maybe one NICE feature. Commit every hour.
- Hour 4: freeze features. Final APK + release. Commit.
- Hour 5: rehearse demo + Q&A twice. Final commit.

## Status 23 Nov
APK v1.0 is in GitHub Releases. Still open: demo video, pay the fee.

## Judge Q&A (memorise)
- **Where is the AI?** Reading a home-cooked plate. No barcode exists for iftar.
- **Isn't this a wrapper?** AI returns foods only. Food table, glycemic load, curve model and IDF-DAR scoring are our code.
- **How accurate?** Our test: 8 of 10 real iftar photos fully correct. Users can fix counts or add foods by hand.
- **Why this model?** It scored best on our Bangladeshi food photos.
- **If the API fails?** Server tries more Gemini keys, then Groq (free), then Claude. If all are out: a clear Bangla message and the user adds foods by hand — the forecast is our maths, so it still works.
- **Is it safe?** Screening only, estimates not exact values, no dose advice, High risk → doctor.

## Backups
| Risk | Backup |
|---|---|
| Venue internet dies | Phone hotspot; demo video |
| AI misreads plate | Pre-tested photos; +/− edit; manual picker |
| APK build fails late | Build on Day 3; Expo Go fallback |
| Out of time | Drop NICE features first |
| API free quota runs out (Gemini = 20 scans/day per Google project) | Extra keys from teammates' Google accounts (`GEMINI_API_KEY_2…5`), Groq free backup, manual food entry |
