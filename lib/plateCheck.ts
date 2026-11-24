// Is the forecast for this plate complete, or is something missing?
// Challenge: "stay safe when the plate scan cannot recognise the food, so the forecast never becomes a false promise".
// Foods the AI could not match to our table have NO carbs in the maths, so the real sugar can be higher.
import { toBanglaDigits } from './bangla.ts';

export type PlateCheck = {
  missing: string[]; // foods seen in the photo but not in our table (not counted)
  unsure: number; // foods the AI was not sure about and the user has not checked
  complete: boolean; // true only when nothing is missing
};

// Looks at a plate and says what the forecast could be missing.
export function checkPlate(items: { count: number; unsure?: boolean }[], unknown: string[]): PlateCheck {
  const missing = unknown.map((u) => u.trim()).filter(Boolean);
  const unsure = items.filter((i) => i.unsure && i.count > 0).length;
  return { missing, unsure, complete: missing.length === 0 };
}

// The warning shown on the forecast when foods are missing (Bangla, plain words). Null when complete.
export function missingWarning(check: PlateCheck): string | null {
  if (check.complete) return null;
  const n = toBanglaDigits(check.missing.length);
  return `পূর্বাভাস অসম্পূর্ণ: ${n}টি খাবার হিসাবে নেই (${check.missing.join(', ')})। আসল সুগার এর চেয়ে বেশি হতে পারে — খাওয়ার ২ ঘণ্টা পরে গ্লুকোমিটারে মেপে নিন।`;
}

// The reminder shown when some foods were guessed by the AI and not checked yet. Null when none.
export function unsureWarning(check: PlateCheck): string | null {
  if (check.unsure === 0) return null;
  return `${toBanglaDigits(check.unsure)}টি খাবার AI নিশ্চিত নয় — প্লেটের তালিকায় ফিরে মিলিয়ে নিন।`;
}
