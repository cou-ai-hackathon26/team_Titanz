# Logic — the part WE own and must explain

The AI only tells us **which foods and how many**. Everything below is our code. Keep it simple enough to explain on a whiteboard.

## 1. Food table — `lib/foods.ts`
One entry per food. Values must come from a real source; write the source in the `src` field.

```ts
type Food = {
  id: string;          // e.g. "jilapi"
  nameBn: string;      // "জিলাপি"
  nameEn: string;      // "Jilapi"
  unit: "piece" | "cup" | "bowl" | "glass";
  carbsPerUnit: number; // grams of carbohydrate per unit
  gi: number;           // glycemic index (0–100)
  fiberPerUnit: number; // g
  proteinPerUnit: number; // g
  src: string;          // where the numbers came from
};
```

### Foods to cover (~30)
Iftar: khejur (dates), jilapi, beguni, piyaju, alur chop, chola/chola-boot, muri, haleem, dimer chop, samosa, singara, pakora, fruit chaat, banana, watermelon, papaya, apple, rooh afza / sweet sharbat, lemon sharbat (no sugar), lassi, doi (yogurt), firni/payesh, cake/pastry.
Sehri/meals: white rice (cup), brown/red rice, ruti, paratha, dal, fish curry, chicken curry, egg, shobji (mixed veg), milk.

**TODO (Teammate 3):** fill carbs/GI/fiber/protein from a real source — e.g. the *Food Composition Table for Bangladesh* and published international GI tables. Mark any estimate with `src: "estimate"`. Don't guess silently.

## 2. Meal numbers
```
carbs      = Σ (carbsPerUnit × count)
GL         = Σ (carbsPerUnit × count × gi / 100)      // glycemic load
fiberProt  = Σ ((fiberPerUnit + proteinPerUnit) × count)
```
Carb load band for the scan screen: Low < 45 g, Moderate 45–75 g, High > 75 g (tune after testing; document what we chose).

## 3. Forecast curve — `lib/forecast.ts`
Goal: a believable, explainable 2-hour curve. It's an **estimate**, not a medical model. Say so on screen.

```
baseline   = user's last pre-iftar reading, default 5.5 mmol/L
peakRise   = k × GL                       // k ≈ 0.12 mmol/L per GL unit (tune; document)
dampen     = 1 − min(0.30, fiberProt × 0.01)   // fiber + protein flatten the peak (max −30%)
walk       = walk15 ? 0.85 : 1                 // 15-min walk after iftar: −15%
personal   = user factor from logged readings (default 1.0) — NICE N3

rise(t)    = peakRise × dampen × walk × personal × shape(t)
shape(t)   = (t/45) × e^(1 − t/45)        // rises, peaks at ~45 min, falls; t in minutes 0–120
glucose(t) = baseline + rise(t)
```
- Draw points every 5 min from 0 to 120.
- Safe zone band: 4.0–10.0 mmol/L (show the label, let us change it in one place).
- Show "now" curve (red dashed) and "with swaps" curve (dark green solid).
- What-if controls change `count` of a food, add a chola portion, or toggle `walk15`, then recompute both numbers and curve instantly (no API call).
- Display peak as a range: `peak ± 15%`.

## 4. Risk score — `lib/dar.ts` (IDF-DAR)
Based on the **IDF-DAR Practical Guidelines (2021)** risk scoring.

Result bands:
| Score | Band | App says |
|---|---|---|
| 0 – 3 | Low | Can fast with care, follow the plan |
| 3.5 – 6 | Moderate | Fasting has some risk; check sugar often; talk to doctor |
| > 6 | High | Fasting may not be safe; see a doctor before fasting |

Risk elements (one quiz question each, roughly): diabetes type, duration, hypoglycemia history, HbA1c / sugar control, treatment type (diet, tablets, insulin), self-monitoring, acute complications, kidney disease, heart/vascular disease, pregnancy, frailty/cognitive issues, heavy physical work, previous Ramadan experience.

**TODO (Teammate 3):** copy the exact points for each answer from the official IDF-DAR 2021 scoring table into `dar.ts`, with a comment citing it. Do not invent points. Keep the quiz to the questions that matter most if time is short (aim for 8), and note which ones we dropped.

### Test cases (write these as unit tests or a simple check screen)
- Diet-controlled, no hypo history, HbA1c < 7.5 → Low
- Tablets (sulfonylurea), HbA1c 8–9 → Moderate
- Insulin, recent severe hypo, kidney disease → High

## 5. Pre-iftar check rules
- Any symptom tapped + "Yes, low sugar" → emergency steps screen:
  1. Check blood sugar now.
  2. If below 3.9 mmol/L (70 mg/dL): break the fast now with sugary drink or 3 dates, as per guidelines.
  3. Recheck in 15 minutes; if still low or feeling worse, get medical help.
- "I feel normal" → reassurance + reminder to check sugar if unsure.
- Logged reading (lib/hypo.ts, IDF-DAR 2021 "break the fast" rule): below 3.9 → break the fast now (red); 3.9–5.5 → recheck in 15 min (amber); 5.6–10 → ok (green); 10.1–16.7 → high, drink water and recheck (amber); **above 16.7 mmol/L (300 mg/dL) → break the fast now and contact a doctor (red)**. No medicine or insulin advice.

## 6. Sehri or iftar, and reminders (`lib/time.ts`, `lib/reminders.ts`)
- **Which meal a plate is:** from midnight until 1 hour after the district's sehri end → sehri; the rest of the day → iftar (`mealForTime`). The user can switch it on the plate screen; it is saved with the plan.
- **Pre-iftar reminder:** 1 hour before iftar for the user's district (`reminderTime`), tap opens the pre-iftar check.
- **Sehri medicine reminder:** only for tablet/insulin users, 30 minutes before sehri ends. Text: take your sehri medicine the way your doctor said, don't change the dose yourself. **Never a dose or medicine name** (`docs/RULES.md`).
- Sun times (sehri end = Fajr at 18°, iftar = sunset) are computed on the phone (`lib/places.ts`, NOAA formulas) for the districts in the list (9 cities: Cumilla and the 8 divisional cities).
