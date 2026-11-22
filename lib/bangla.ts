// Helpers for showing numbers in Bangla and reading numbers the user typed.

const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Turns English digits into Bangla digits: "58" -> "৫৮". Other characters stay the same.
export function toBanglaDigits(text: string | number): string {
  return String(text).replace(/[0-9]/g, (d) => banglaDigits[Number(d)]);
}

// Turns Bangla digits into English digits: "৫৮" -> "58", so we can do math with them.
export function toEnglishDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(banglaDigits.indexOf(d)));
}

// Keeps only the digits (Bangla or English) from what the user typed, as English digits.
export function onlyDigits(text: string): string {
  return toEnglishDigits(text).replace(/[^0-9]/g, '');
}
