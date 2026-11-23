// Time helpers for Bangla labels ("সন্ধ্যা ৬:১২ PM", "২ ঘণ্টা ১৮ মিনিট").
import { toBanglaDigits } from './bangla.ts';

// Bangla word for the part of the day, from minutes after midnight.
export function dayPart(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  if (m >= 4 * 60 && m < 12 * 60) return 'সকাল';
  if (m >= 12 * 60 && m < 15 * 60) return 'দুপুর';
  if (m >= 15 * 60 && m < 17 * 60 + 30) return 'বিকাল';
  if (m >= 17 * 60 + 30 && m < 20 * 60) return 'সন্ধ্যা';
  return 'রাত';
}

// Splits a number of minutes into whole hours and minutes, e.g. 138 → { h: 2, m: 18 }.
export function hoursAndMinutes(total: number): { h: number; m: number } {
  const t = Math.max(0, Math.round(total));
  return { h: Math.floor(t / 60), m: t % 60 };
}

// Minutes after midnight for a date (local time).
export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// Bangla short weekday names, Sunday first (Date.getDay order).
export const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

// True if two dates are the same calendar day.
export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "২২/১১" — short Bangla day/month.
export function shortDate(d: Date): string {
  return `${toBanglaDigits(d.getDate())}/${toBanglaDigits(d.getMonth() + 1)}`;
}

// When the pre-iftar reminder goes off on a given day: 1 hour before iftar (iftarMinutes = minutes after midnight).
export function reminderTime(day: Date, iftarMinutes: number, minutesBefore = 60): Date {
  const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  at.setMinutes(iftarMinutes - minutesBefore);
  return at;
}

// "2026-11-23" for a date (local time). Used to link a day on Home to that day in History.
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Which meal a plate most likely is, from the time it is eaten:
// from midnight until 1 hour after sehri ends → sehri; the rest of the day → iftar (and the evening meal).
export function mealForTime(nowMinutes: number, sehriEndMinutes: number): 'sehri' | 'iftar' {
  return nowMinutes < sehriEndMinutes + 60 ? 'sehri' : 'iftar';
}
