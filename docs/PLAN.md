# Plan

Today's date matters: code only from **21 Nov**. Final is **24 Nov** (5 hrs on-site).

## Roles
| Who | Owns |
|---|---|
| Nadim (lead) | Expo app, all screens (match Figma "My choice" page), navigation, UI polish, APK build, pitch |
| Teammate 2 | `api/scan.ts`, vision prompt + JSON schema, testing on 15+ real iftar photos, accuracy note |
| Teammate 3 | `lib/foods.ts` data, `lib/dar.ts`, `lib/forecast.ts`, README, demo video, Q&A cheat sheet |

Everyone must be able to explain the whole flow.

## Day 1 — Sat 21 Nov
- [ ] Create **public** GitHub repo (today or later, not before). Add these docs. First commit.
- [ ] `create-expo-app` (TypeScript) + Expo Router + fonts + `theme/tokens.ts`
- [ ] Static UI for M1–M6 (no logic yet), matching the Figma "My choice" page
- [ ] `api/scan.ts` deployed on Vercel, returns JSON for one test photo
- [ ] `lib/dar.ts` with real IDF-DAR points + test cases
- [ ] Risk quiz → result working end to end (M2, M3)

## Day 2 — Sun 22 Nov
- [ ] `lib/foods.ts` filled (30 foods, with sources)
- [ ] Scan flow: photo → API → foods list → +/− edit → total carbs (M4)
- [ ] `lib/forecast.ts` + `CurveChart` + what-if controls (M5)
- [ ] Pre-iftar check + emergency steps (M6)
- [ ] Test scan on 15 photos; write results in README ("X/15 correct")

## Day 3 — Mon 23 Nov
- [ ] First APK via EAS (`preview` profile). Install on 2–3 phones.
- [ ] Fix bugs found on real phones (fonts, camera permission, small screens)
- [ ] README: what it is, how to run, **every AI tool/model/API used**, APK link, accuracy test
- [ ] Record ≤3-min demo video (offline copy too)
- [ ] **Pay Tk 1,350 by 11:59 PM** (only to official number)
- [ ] NICE features only if all MUST work: N1 home, N2 notification

## Final — Tue 24 Nov (5 hours)
- Hour 1: pull latest, check APK + API alive, commit
- Hours 2–3: fix issues, small polish, maybe one NICE feature. Commit every hour.
- Hour 4: freeze features. Final APK + release. Commit.
- Hour 5: rehearse demo + Q&A twice. Final commit.

## Judge Q&A (memorise)
- **Where is the AI?** Reading a home-cooked plate. No barcode exists for iftar.
- **Isn't this a wrapper?** AI returns foods only. Food table, glycemic load, curve model and IDF-DAR scoring are our code.
- **How accurate?** Our test: X of 15 photos correct. Users can fix counts.
- **Why this model?** It scored best on our Bangladeshi food photos.
- **If the API fails?** Error message + manual food picker.
- **Is it safe?** Screening only, estimates not exact values, no dose advice, High risk → doctor.

## Backups
| Risk | Backup |
|---|---|
| Venue internet dies | Phone hotspot; demo video |
| AI misreads plate | Pre-tested photos; +/− edit; manual picker |
| APK build fails late | Build on Day 3; Expo Go fallback |
| Out of time | Drop NICE features first |
| API credits run out | Top up before 24 Nov; spare key |
