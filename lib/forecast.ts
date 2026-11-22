// Sugar forecast after iftar (docs/LOGIC.md section 3, tuned in our build report Part 3).
// An explainable ESTIMATE of the trend, not a medical device. Never used for any medicine decision.
//
//   rise      = K × GL × dampen × walk × personal
//   glucose(t) = baseline + rise × shape(t),   shape(t) = (t/T) × e^(1 − t/T)   (peaks at T minutes)
import { mealTotals, type MealItem } from './meal.ts';
import { FOOD_BY_ID } from './foods.ts';

// Every constant with its evidence (full list in the build report, Part 3).
export const FORECAST = {
  BASELINE_DEFAULT: 5.5, // mmol/L before iftar when the user has not entered a reading
  K_PER_GL: 0.12, // mmol/L rise per unit of glycemic load (plausible 0.10–0.28; any 0.08–0.20 gives the same demo result)
  T_PEAK_MIN: 75, // peak time: CGM in type 2 diabetes, median 70–85 min (PMC3728307); ADA says 1–2 h
  DAMPEN_PER_G: 0.006, // per g of fibre + protein: whey 50 g → −28% (Jakubowicz 2014)
  DAMPEN_CAP: 0.3, // never more than −30%
  WALK_FACTOR: 0.85, // 15-min walk after eating: −12% to −22% (Reynolds 2016) → −15%
  SAFE_LOW: 4.0, // below 3.9 is a low (IDF-DAR: break the fast)
  SAFE_HIGH: 10.0, // ADA 2025 target for the after-meal peak
  RANGE_PCT: 0.15, // show the peak as a range: people differ
  HORIZON_MIN: 120, // the chart shows 0–120 minutes (Figma)
  STEP_MIN: 5, // a point every 5 minutes
} as const;

export type ForecastOptions = { baseline?: number; walk15?: boolean; personal?: number };
export type Zone = 'low' | 'safe' | 'high';

export type Forecast = {
  carbs: number;
  gl: number;
  rise: number; // mmol/L above the starting value at the peak
  peak: number; // mmol/L
  peakLow: number; // peak − 15% of the rise
  peakHigh: number; // peak + 15% of the rise
  peakAtMin: number;
  zone: Zone; // where the peak lands
  points: { t: number; glucose: number }[];
};

// The curve's shape: 0 at the start, 1 at the peak time, then slowly down.
export function shape(t: number, T: number = FORECAST.T_PEAK_MIN): number {
  return t <= 0 ? 0 : (t / T) * Math.exp(1 - t / T);
}

// Works out the 2-hour sugar curve for a plate.
export function forecast(items: MealItem[], options: ForecastOptions = {}): Forecast {
  const C = FORECAST;
  const baseline = options.baseline ?? C.BASELINE_DEFAULT;
  const personal = options.personal ?? 1;
  const totals = mealTotals(items);
  const dampen = 1 - Math.min(C.DAMPEN_CAP, totals.fiberProtein * C.DAMPEN_PER_G);
  const walk = options.walk15 ? C.WALK_FACTOR : 1;
  const rise = C.K_PER_GL * totals.gl * dampen * walk * personal;

  const points: Forecast['points'] = [];
  for (let t = 0; t <= C.HORIZON_MIN; t += C.STEP_MIN) points.push({ t, glucose: baseline + rise * shape(t) });

  const peak = baseline + rise;
  return {
    carbs: totals.carbs,
    gl: totals.gl,
    rise,
    peak,
    peakLow: baseline + rise * (1 - C.RANGE_PCT),
    peakHigh: baseline + rise * (1 + C.RANGE_PCT),
    peakAtMin: C.T_PEAK_MIN,
    zone: peak > C.SAFE_HIGH ? 'high' : peak < C.SAFE_LOW ? 'low' : 'safe',
    points,
  };
}

// ---------- What-if changes (screen 07) ----------

export const CHOLA_ID = 'chola_bhuna';

export type WhatIf = {
  reduceFoodId: string | null; // the food the user can eat less of
  reduceTo: number; // its new count
  addChola: boolean; // add 1 cup of chola bhuna (fibre + protein slow the rise)
  walk15: boolean; // walk 15 minutes after iftar
};

// The food that adds the most glycemic load to this plate (the best one to eat less of).
export function biggestSugarFood(items: MealItem[]): string | null {
  let best: string | null = null;
  let bestGl = 0;
  for (const item of items) {
    const food = FOOD_BY_ID[item.foodId];
    if (!food || item.count <= 0) continue;
    const gl = (food.carbsPerUnit * item.count * food.gi) / 100;
    if (gl > bestGl) {
      bestGl = gl;
      best = item.foodId;
    }
  }
  return best;
}

// "No changes yet": same plate, no chola, no walk.
export function noChanges(items: MealItem[]): WhatIf {
  const reduceFoodId = biggestSugarFood(items);
  const count = items.find((i) => i.foodId === reduceFoodId)?.count ?? 0;
  return { reduceFoodId, reduceTo: count, addChola: false, walk15: false };
}

// Builds the changed plate from the user's what-if choices.
export function changedPlate(items: MealItem[], w: WhatIf): MealItem[] {
  let plate = items.map((i) => (i.foodId === w.reduceFoodId ? { ...i, count: Math.max(0, w.reduceTo) } : i));
  if (w.addChola) {
    const has = plate.some((i) => i.foodId === CHOLA_ID);
    plate = has ? plate.map((i) => (i.foodId === CHOLA_ID ? { ...i, count: i.count + 1 } : i)) : [...plate, { foodId: CHOLA_ID, count: 1 }];
  }
  return plate;
}

// Forecast for the plate with the what-if changes applied.
export function forecastWith(items: MealItem[], w: WhatIf, options: ForecastOptions = {}): Forecast {
  return forecast(changedPlate(items, w), { ...options, walk15: w.walk15 });
}

// How much one change moves the peak (mmol/L, negative = lower), compared with the same plan without it.
export function changeEffect(items: MealItem[], w: WhatIf, change: 'reduce' | 'chola' | 'walk', options: ForecastOptions = {}): number {
  const without: WhatIf =
    change === 'reduce'
      ? { ...w, reduceTo: items.find((i) => i.foodId === w.reduceFoodId)?.count ?? 0 }
      : change === 'chola'
        ? { ...w, addChola: false }
        : { ...w, walk15: false };
  const withIt: WhatIf =
    change === 'chola' ? { ...w, addChola: true } : change === 'walk' ? { ...w, walk15: true } : w;
  return forecastWith(items, withIt, options).peak - forecastWith(items, without, options).peak;
}
