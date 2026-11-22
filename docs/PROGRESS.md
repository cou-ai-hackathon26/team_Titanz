# Progress log

Claude Code: read this at the start of every session, and add a line at the end of every finished task.
Format: `- YYYY-MM-DD HH:MM · who · what changed · next step`

## Status board
| Feature | Status |
|---|---|
| M1 Onboarding | ✅ done (web preview tested; check on phone) |
| M2 Risk quiz | ⬜ todo |
| M3 Risk result | ⬜ todo |
| M4 Meal scan | ⬜ todo |
| M5 Sugar forecast | ⬜ todo |
| M6 Pre-iftar check | ⬜ todo |
| API /api/scan | ⬜ todo |
| foods.ts data | ⬜ todo |
| dar.ts scoring | ⬜ todo |
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
