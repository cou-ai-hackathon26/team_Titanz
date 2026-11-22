// Low blood sugar (hypoglycaemia) rules, from IDF-DAR 2021 and docs/LOGIC.md section 5.
// The app NEVER gives medicine or insulin advice; it only follows these safety steps.
import { toEnglishDigits } from './bangla.ts';

export const HYPO_BELOW = 3.9; // mmol/L (70 mg/dL): below this, break the fast (IDF-DAR)
export const HELPLINE = '16263'; // Shasthyo Batayon, Bangladesh government health helpline

export type ReadingAdvice = 'break-fast' | 'recheck' | 'not-low';

// Reads a typed reading like "৩.৫" or "3,5" as a number, or null if it is not a sensible value.
export function parseReading(text: string): number | null {
  const clean = toEnglishDigits(text).replace(',', '.').replace(/[^0-9.]/g, '');
  if (!clean || (clean.match(/\./g) ?? []).length > 1) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 1 || value > 33) return null; // glucometers read about 1.1–33.3 mmol/L
  return value;
}

// What to do after a reading taken because of symptoms.
// Below 3.9 → break the fast now. 3.9 to 5.5 with symptoms → recheck in 15 min. Above → not low.
export function adviceFor(value: number): ReadingAdvice {
  if (value < HYPO_BELOW) return 'break-fast';
  if (value <= 5.5) return 'recheck';
  return 'not-low';
}

// Minutes from now until iftar (negative once iftar has passed).
export function minutesToIftar(iftarMinutesAfterMidnight: number, now = new Date()): number {
  return Math.round(iftarMinutesAfterMidnight - (now.getHours() * 60 + now.getMinutes()));
}
