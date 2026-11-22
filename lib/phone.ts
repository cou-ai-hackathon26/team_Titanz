// Bangladeshi mobile number helpers (the part after +880, e.g. "1819234567").
import { onlyDigits, toBanglaDigits } from './bangla.ts';

// True for a valid mobile number after +880: 10 digits starting with 13–19.
export function isValidPhone(digits: string): boolean {
  return /^1[3-9][0-9]{8}$/.test(digits);
}

// Shows "1819234567" as "১৮১৯ ২৩৪ ৫৬৭".
export function formatPhone(digits: string): string {
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10)].filter(Boolean);
  return toBanglaDigits(parts.join(' '));
}

// Reads what the user typed (Bangla or English digits, with or without the leading 0 or +880).
export function cleanPhoneInput(text: string): string {
  let digits = onlyDigits(text);
  if (digits.startsWith('880')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}
