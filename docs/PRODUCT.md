# Product spec

## One line
A Cal AI–style Android app that helps people with diabetes fast safely in Ramadan: check your risk, snap your iftar plate, see what it will do to your sugar before you eat.

## User
A 55-year-old with type 2 diabetes in Cumilla who fasts every Ramadan, takes tablets, sometimes checks sugar with a glucometer, reads Bangla on a cheap Android phone. Plus the son or daughter who worries about them.

## Why it matters (for pitch + README)
- ~13.9M adults in Bangladesh have diabetes (IDF).
- DAR-BAN study (n = 1,328): 95.5% planned to fast, only 44.2% were low-risk.
- 57.9% of high-risk patients who fasted had hypoglycemia.

## Features

### MUST (demo depends on these)
| # | Screen | What it does | Done when |
|---|---|---|---|
| M1 | Onboarding | Intro + 3 feature cards + "Check my fasting risk" button | Button opens the quiz |
| M2 | Risk quiz | IDF-DAR questions, one per screen, progress bar, big answer buttons | All answers saved, score computed by `lib/dar.ts` |
| M3 | Risk result | Gauge (Low / Moderate / High), score, explanation, doctor card if High | Correct band for test cases in `docs/LOGIC.md` |
| M4 | Meal scan | Camera or gallery → `/api/scan` → list of foods with +/− counts → total carbs + risk bar; low-confidence foods ask the user to confirm | Real photo returns real foods; user can edit counts |
| M5 | Sugar forecast | 2-hour curve vs safe zone; "now" vs "with swaps"; what-if controls (jilapi count, add chola, 15-min walk) | Moving a control redraws the curve instantly |
| M6 | Pre-iftar check | Symptom tiles (dizzy, cold sweat, shaky, blurred vision) → "I feel normal" / "Yes, low sugar" → Emergency Steps screen (3 steps, call 16263, alert family) | "Yes" shows the emergency steps screen |

### NICE (only after all MUST work)
| # | Feature |
|---|---|
| N1 | Home / today: sehri + iftar countdown, glucose log, water tracker, big scan button |
| N2 | Local notification ~1 hour before iftar → opens pre-iftar check |
| N3 | Personal tuning from 3–5 finger-prick readings |
| N4 | History screen (week of fasts, meals, readings) |
| N5 | Bangla read-aloud of tips (expo-speech) |

## Screens source
**Source of truth: Figma, page "My choice"** (Nadim's final pick, 21 Nov 2026).
Pages "Redesign v2/v3/v4" and "Stitch Screens" are earlier explorations: reference only.
Match "My choice"; don't invent new layouts or colors.

**Clickable prototype** (share with the team; set "Anyone with the link can view" in Figma → Share):
https://www.figma.com/proto/SKMgumLw9soFazNfYHzJQ1/Untitled?node-id=52-190&starting-point-node-id=52%3A190&scaling=scale-down&content-scaling=fixed&hide-ui=1
On phones: open this link (it fits the whole screen and hides Figma's toolbar), or open it in the Figma mobile app. In Figma → Prototype settings, set Device = iPhone 14 (390×844).
Flows: "Roza-Safe · full demo" (starts at Welcome) and "Home (daily use)".

| # | Screen | Feature |
|---|---|---|
| 00a | Welcome | M1 — full photo, "শুরু করুন" / "আমার অ্যাকাউন্ট আছে" |
| 00b–d | Guide 1–3 | M1 — risk check, plate scan, sugar forecast; page dots, "এড়িয়ে যান" |
| 00e | Sign in | Phone number (+880) or Google; "অ্যাকাউন্ট ছাড়াই চালিয়ে যান" always available |
| 00f | Code check | 6-digit SMS code, resend timer |
| 00g | About you | Name, age, gender, diabetes type, treatment (feeds the risk quiz) |
| 00h | Iftar & contact | District (for sehri/iftar times), optional family number for emergency alert, pre-iftar reminder toggle (N2) |
| 01 | Onboarding (old) | Replaced by 00a–00d; kept for reference |
| 02 | Risk Quiz | M2 |
| 03 | Risk Result | M3 |
| 04 | Home | N1 |
| 05 | Scan Camera | M4 (camera / gallery step) |
| 06 | Scan Result | M4 (foods with +/−, carb load; unsure food shown in the list with an amber dot "AI নিশ্চিত নয়"; "+ আরও খাবার যোগ করুন" to add foods by hand) |
| 07 | Sugar Forecast | M5 |
| 08 | Pre-Iftar Check | M6 (symptom tiles) |
| 09 | Emergency Steps | M6 ("Yes" → 3 safety steps, call 16263, alert family) |
| 10 | History | N4 |

Bottom nav (on 04, 07, 10): হোম · পূর্বাভাস · [lime scan button, opens 05] · ইতিহাস · চেক. It stays fixed while the screen scrolls.
Flow: 00a → 00b → 00c → 00d → 00g → 00h → 02 → 03 → 04 (no sign-in). From Home: scan → 05 → 06 → 07; check row → 08 → "Yes" → 09.

**Decided 22 Nov 2026 — no sign-in.** Screens 00e (Sign in) and 00f (Code check) are NOT built, and the Welcome "আমার অ্যাকাউন্ট আছে" link is dropped. Flow in the app: 00a → 00b → 00c → 00d → 00g → 00h → 02. The profile is saved only on the phone (AsyncStorage), matching `docs/RULES.md` ("No login").
Other screens are focus screens with no bottom nav.

Home details (from review comments):
- Header shows the user's name (not the date) under "আসসালামু আলাইকুম".
- Iftar countdown is written out: "২ ঘণ্টা ১৮ মিনিট বাকি" (never "2:18"), with the time "সন্ধ্যা ৬:১২ PM".
- Times always show AM/PM.
- Last sugar tile shows a status chip: স্বাভাবিক (green) / বেশি (amber) / কম (red), plus the reading time.
- No separate risk-level tile on Home.

The old Google Stitch designs (project "Roza-Safe Diabetes Fasting Copilot") are kept for reference only: HTML + screenshots in `design/`, and the Figma page "Stitch Screens". Do not build from them. They contain dose text that breaks `docs/RULES.md`.

## Look and feel
- Light grey app background (`bg/app`), white cards (radius 24), soft shadow, big bold numbers.
- One highlight colour: lime (`bg/page`) for the iftar card, the selected answer and the scan button.
- One action colour: dark green (`bg/brand-strong`) for main buttons and dark cards.
- Red / amber / green only show risk level, never decoration.
- Bangla digits in the UI (২, ৫.৪, ১১৩). Hind Siliguri for Bangla, Inter for English.
- Main buttons are full-width pills, 60 high, with a short English line under the Bangla label.
- Plain words an older person understands: no "IDF-DAR", "হাইপো", "GL" etc. in the UI (e.g. "সম্প্রতি সুগার খুব কমে গিয়েছিল", "ঝুঁকির স্কোর").
- Speaker (read-aloud) buttons are in the design; build them only when N5 is done.

## Components (Figma section "Components" on the "My choice" page)
Build one React Native component for each. Same names, same states.

| Component | Variants / props | Behaviour in the prototype (match it in the app) |
|---|---|---|
| `Button` | Style = Primary / Secondary / Danger / Light (lime, for photo backgrounds) · State = Default / Pressed · Label, Sub, Icon, Show sub, Show icon | Pressed while held: fades to 80% (Secondary turns grey), 120 ms |
| `Toggle` | State = On / Off | Tap: knob slides, track turns dark green, 220 ms ease-out |
| `Stepper` | Count = 0–3 | − / + change the count, 150 ms; − is grey at 0, + is grey at 3 |
| `Quiz answer` | State = Default / Selected · Label, Sub | Tap: lime fill + green border + check, 200 ms |
| `Symptom tile` | State = Default / Selected · Label, Sub, Icon | Tap: lime fill, check fades in, 200 ms |
| `Input` | State = Empty / Focused / Filled · Label, Value, Prefix (+880), Suffix icon | Tap: green border (focus), 150 ms |
| `Choice chip` | State = Default / Selected · Label | Tap: lime fill + check, 180 ms |
| `Bottom nav` | Active = Home / Forecast / History | Active tab: dark icon + bold label + dot; others grey. Tabs fade between screens; the lime scan button slides the camera up |

Screen transitions: forward steps push in from the right (~320 ms); camera and emergency screens slide up from the bottom; going back to Home fades; back arrows reverse the last transition.

## Design tokens
Names match the Figma variables (collections "Color" and "Primitives").

| Token | Use | Value |
|---|---|---|
| `bg/app` | App background | `#F7F7F4` |
| `bg/surface` | Cards, sheets, nav bar | `#FFFFFF` |
| `bg/surface-muted` | Grey tiles, icon circles, steppers | `#F2F2EE` |
| `bg/brand-strong` | Main buttons, dark cards | dark green `#0B4A33` |
| `bg/brand` | Dark hero areas | `#205C42` |
| `bg/page` | Lime iftar card, selected answer, scan button | lime `#E2F28F` |
| `bg/accent` / `icon/accent` | Lime chart bars, small lime accents | `#DAE386` / `#E3E86A` |
| `bg/accent-soft` | Very light lime fills | `#F4FBD1` |
| `text/primary` | Main text | `#10231A` |
| `text/secondary` | Sub-labels, English lines | `#6B726C` |
| `text/brand` | Green text, links | `#046C4B` |
| `text/on-brand` | Text on dark green | `#FFFFFF` |
| `border/default` | Card and button borders | `#DEDEDC` |
| `border/brand` | Selected answer border | `#046C4B` |
| `risk/low` · `risk/low-soft` | Low risk / safe | `#258267` · `#E3F2E6` |
| `risk/moderate` · `risk/moderate-soft` | Moderate / warning | `#E3A33A` · `#FBEFD6` |
| `risk/high` · `risk/high-soft` | High risk / alerts / emergency | `#D95040` · `#FBE3DF` |
| radius | cards 24, tiles 20, buttons & chips pill (fully round) |  |
| font | Hind Siliguri (Bangla), Inter (numbers/English) |  |
| icons | Material Symbols Rounded |  |

Put these in `theme/tokens.ts` and use only these. No one-off colors.

## Copy rules
- Bangla first, short English sub-label only on buttons and key headings.
- Big text (min 16sp body), big tap targets (min 48dp). Many users are older.
- Every result screen has the footer: "স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় (Screening support only)".

## Demo script (3 min)
1. Problem stat (30s)
2. Risk quiz → High gauge → doctor card (40s)
3. Snap a real iftar plate live → foods → fix one count (40s)
4. Forecast: red spike → jilapi 2→1, add chola, walk → curve drops into safe zone (40s) ← wow moment
5. Pre-iftar check → "dizzy" → safety steps; how it's built (30s)
