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

// Says in plain Bangla what is wrong with the number, or null if it is fine (empty is fine: it is optional).
export function phoneProblem(digits: string): string | null {
  if (digits === '' || isValidPhone(digits)) return null;
  if (digits[0] !== '1') return 'মোবাইল নম্বর ১ দিয়ে শুরু হয় (যেমন ১৮১৯ ২৩৪ ৫৬৭)। নম্বর না দিতে চাইলে বক্স খালি রাখুন।';
  if (digits.length >= 2 && !/[3-9]/.test(digits[1])) return 'এটি বাংলাদেশের মোবাইল নম্বর নয় (০১৩ থেকে ০১৯ দিয়ে শুরু হয়)।';
  return `আরও ${toBanglaDigits(String(10 - digits.length))}টি সংখ্যা লিখুন, অথবা বক্স খালি রাখুন।`;
}
