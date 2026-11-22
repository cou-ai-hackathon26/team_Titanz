# Progress log

Claude Code: read this at the start of every session, and add a line at the end of every finished task.
Format: `- YYYY-MM-DD HH:MM · who · what changed · next step`

## Status board
| Feature | Status |
|---|---|
| M1 Onboarding | ✅ done (web preview tested; check on phone) |
| M2 Risk quiz | ✅ done (web preview tested; check on phone) |
| M3 Risk result | ✅ done (web preview tested; check on phone) |
| M4 Meal scan | 🟨 built; real AI not tested yet (Nadim to add Gemini key) |
| M5 Sugar forecast | ⬜ todo |
| M6 Pre-iftar check | ⬜ todo |
| API /api/scan | 🟨 built + tested without key; not deployed |
| foods.ts data | ✅ 34 foods from build report (portion weights still estimates) |
| dar.ts scoring | ✅ done (official IDF-DAR 2021 Table 2, 7 tests pass: `npm test`) |
| APK build | ⬜ todo |
| README + demo video | ⬜ todo |

(⬜ todo · 🟨 in progress · ✅ done · ❌ blocked)

## Log
- 2026-11-21 · Nadim · Project docs added (CLAUDE.md, docs/) · Next: create Expo app + repo
- 2026-11-21 · Claude · Saved green/lime colour variables in Figma; pulled all 8 Stitch screens into design/ (HTML + screenshots) and rebuilt them in Figma (page "Stitch Screens") with the new colours · Next: review in Figma, decide whether to update docs/PRODUCT.md tokens
- 2026-11-21 · Claude · Minimal redesign v2 in Figma (page "Redesign v2 — Minimal"): 10 screens incl. new Scan Camera + Emergency Steps; dose text removed; risk tokens added · Next: approve design, then update PRODUCT.md tokens/screen list
- 2026-11-21 · Claude · Docs now point to Figma redesign v2: PRODUCT.md screen list (10 screens) + new tokens + look & feel; CLAUDE.md, PLAN.md, STACK.md, LOGIC.md updated · Next: create Expo app, put tokens in theme/tokens.ts
- 2026-11-21 · Claude · Simplified redesign v3 in Figma (page "Redesign v3 — Simple", Lean/NOOT style): white screens, grey tiles, 3-item nav; PRODUCT.md, CLAUDE.md, PLAN.md now point to v3 · Next: create Expo app, put tokens in theme/tokens.ts
- 2026-11-21 · Claude · Minimal redesign v4 in Figma (page "Redesign v4 — Minimal"), closely following Lean/NOOT refs: Inter numbers, black pills, mini rings, no English sub-labels; docs point to v4 · Next: approve, then build theme/tokens.ts
- 2026-11-21 · Claude · Fixed Nadim's 7 Figma comments on his redesign (page 30:509): Home name/timer/PM/normal chip/removed risk tile; Risk Result plain words; Scan Result add-food row + unsure food in list · Next: point docs at Nadim's page
- 2026-11-21 · Claude · Clickable Figma prototype on "My choice" (29 links, 2 flows, fixed nav); docs now point to "My choice" + prototype link · Next: share prototype with team, then build theme/tokens.ts
- 2026-11-21 · Claude · Prototype fix: Home nav highlighted Forecast; now Home/Forecast/History each highlight their own tab (dark label + dot, others lighter)
- 2026-11-21 · Claude · Figma components with states (Button, Toggle, Stepper, Quiz answer, Symptom tile, Bottom nav) swapped into all 10 "My choice" screens; prototype now has pressed/selected states, sliding toggles, steppers and screen transitions; PRODUCT.md has a Components section · Next: share prototype, build matching RN components
- 2026-11-21 · Claude · Prototype fix: tall screens (03, 06, 07, 09, 10) now 844 high and scroll; bottom nav/actions pinned on screen; back arrow added to History
- 2026-11-21 · Claude · Mobile prototype link now fits the screen (scale-down, Figma UI hidden) so bottom buttons are reachable
- 2026-11-21 · Claude · Onboarding v2 in Figma ("My choice" page): Welcome, 3 guides, phone/Google sign-in, code check, About you, Iftar & contact → quiz; new Input + Choice chip components, Light button; prototype starts at Welcome · Open: sign-in conflicts with RULES.md (no login)
- 2026-11-21 · Claude · Guide screens 00b–00d redesigned (Nook + ref style): back + 3-step progress bar, tinted circle with mini-feature illustration, centred text, pill button; links rewired
- 2026-11-21 · Claude · Wrote AI image prompts for Welcome + 3 guides (famous BD mosques, calm daylight, brand greens) in design/illustration-prompts.md · Next: Nadim generates images, Claude places them in Figma
- 2026-11-21 · Claude · Guide 3 image prompt reworked: balance scale (mizan) instead of a chart; backup iftar-table prompt added
- 2026-11-22 09:10 · Claude · Decided no sign-in (00e/00f not built, PRODUCT.md updated). Expo app created (TypeScript, Expo Router, Hind Siliguri + Inter fonts), theme/tokens.ts from Figma, temporary start screen; tsc + Android bundle pass · Next: git init + first commit, then lib/dar.ts + Risk quiz (M2) + Risk result (M3)
- 2026-11-22 · Claude · M1 Onboarding built from Figma: Welcome, Guide 1–3, About you, Iftar & contact (district picker, real sehri/iftar times from sun maths, +880 number check, reminder toggle). Components: Button, Input, ChoiceChip, Toggle, BackButton, StepBar, PickerSheet, Icon. Profile saved on phone only. Risk quiz is a placeholder · Next: lib/dar.ts + Risk quiz (M2) + Risk result (M3)
- 2026-11-22 · Claude · Fixes: Bangla digits now drawn with Noto Sans Bengali (Hind Siliguri "১" was unreadable) via components/Txt.tsx; back arrows never dead-end (lib/nav.ts goBack with fallback). Welcome = Figma 74:616 minus "সাহায্য" (no help screen yet) · Next: risk quiz (M2)
- 2026-11-22 · Claude · M2 Risk quiz + M3 Risk result: lib/dar.ts (all 14 IDF-DAR elements, exact points, Bangla wording), quick quiz of 8 (+pregnancy for women; treatment options filtered by About-you answer), gauge drawn from score, band advice, reasons, share report, disclaimer. Our additions marked in code: 'don't know' HbA1c/tablet/insulin = highest points in that group. Home is a placeholder · Next: lib/foods.ts + scan API (M4)
- 2026-11-22 · Claude · Quiz fixes from Nadim's test: answers now least→most risk (unaware hypo was listed first and misread), clearer wording; kidney asks 'has a doctor said…' with 'don't know' (0 pts + 'get tested' chip); 70+ option hidden if age < 70; 9 tests pass · Next: food table + scan (M4)
- 2026-11-22 · Claude · Medicine question worded per About-you answer ('which tablet?' / 'which insulin?' + hints for several pills or pills+insulin); 'other' answer now 'মেটফরমিন বা অন্য ট্যাবলেট'. Checked: tablets → 4 tablet answers; diet only → question skipped (7 questions)
- 2026-11-22 · Claude · M4 Meal scan: lib/foods.ts (34 foods), lib/meal.ts (carbs, GL, bands), api/api/scan.ts (Claude vision, JSON schema with food-id enum, answer cleaning, fallback, errors), local dev server, camera screen (live camera, flash, flip, gallery, permission screen), result screen (AI foods, unsure '?', −/+ 0–3, add/replace by hand, totals, carb bar). 17 tests pass. Tested in web preview with no key: error path + manual add + totals + forecast hand-off. Forecast is a placeholder · Next: Nadim adds API key and tests 15 real photos; then M5 forecast
- 2026-11-22 · Claude · Scan AI switched to Gemini (free key, gemini-4-hydrogen, REST + JSON schema); Claude kept behind SCAN_PROVIDER=claude. Code split into api/providers/. 19 tests pass (fake Gemini replies). Key NOT stored by Claude: Nadim pastes it into api/.env.local · Next: real scan test, then M5 forecast
