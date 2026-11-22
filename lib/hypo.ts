// Low blood sugar (hypoglycaemia) rules, from IDF-DAR 2021 and docs/LOGIC.md section 5.
// The app NEVER gives medicine or insulin advice; it only follows these safety steps.
import { toEnglishDigits } from './bangla.ts';

export const HYPO_BELOW = 3.9; // mmol/L (70 mg/dL): below this, break the fast (IDF-DAR)
export const HYPER_ABOVE = 16.7; // mmol/L (300 mg/dL): above this, also break the fast (IDF-DAR 2021)
export const HIGH_ABOVE = 10.0; // above the safe band: watch closely and check again
export const HELPLINE = '16263'; // Shasthyo Batayon, Bangladesh government health helpline

export type ReadingAdvice = 'break-fast' | 'recheck' | 'ok' | 'high' | 'very-high';

// Reads a typed reading like "৩.৫" or "3,5" as a number, or null if it is not a sensible value.
export function parseReading(text: string): number | null {
  const clean = toEnglishDigits(text).replace(',', '.').replace(/[^0-9.]/g, '');
  if (!clean || (clean.match(/\./g) ?? []).length > 1) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 1 || value > 33) return null; // glucometers read about 1.1–33.3 mmol/L
  return value;
}

// What to do after a reading (IDF-DAR 2021: break the fast below 3.9 OR above 16.7 mmol/L).
//   below 3.9 → break the fast now (low)        3.9–5.5 → check again in 15 min (may be dropping)
//   5.6–10 → ok                                 10.1–16.7 → high: check again, watch closely
//   above 16.7 → break the fast now (very high)
export function adviceFor(value: number): ReadingAdvice {
  if (value < HYPO_BELOW) return 'break-fast';
  if (value <= 5.5) return 'recheck';
  if (value <= HIGH_ABOVE) return 'ok';
  if (value <= HYPER_ABOVE) return 'high';
  return 'very-high';
}

// Minutes from now until iftar (negative once iftar has passed).
export function minutesToIftar(iftarMinutesAfterMidnight: number, now = new Date()): number {
  return Math.round(iftarMinutesAfterMidnight - (now.getHours() * 60 + now.getMinutes()));
}
