// Holds the current scan in memory while the user moves between Camera → Result → Forecast.
// Photos are too big for screen links, so we keep them here. Nothing is saved to disk or a server.
import type { MealItem } from './meal';

type CurrentScan = {
  photoUri: string | null; // to show the photo on the result screen
  photoBase64: string | null; // to send to the scan API
  items: MealItem[]; // the foods on the plate (after the user's edits)
  version: number; // goes up on every change, so the Forecast tab knows to start fresh
  manual: boolean; // true = no photo, the user adds the foods by hand
  meal: 'iftar' | 'sehri' | null; // which meal; null = not chosen yet (the plate screen picks by time)
  unknown: string[]; // foods the AI saw but could not match to our table (not counted in the maths)
};

let current: CurrentScan = { photoUri: null, photoBase64: null, items: [], version: 0, manual: false, meal: null, unknown: [] };

// Starts a new scan with a fresh photo.
export function setScanPhoto(uri: string, base64: string) {
  current = { photoUri: uri, photoBase64: base64, items: [], version: current.version + 1, manual: false, meal: null, unknown: [] };
}

// Starts a plate without a photo: the user picks the foods from our list.
export function startManualScan() {
  current = { photoUri: null, photoBase64: null, items: [], version: current.version + 1, manual: true, meal: null, unknown: [] };
}

// Saves the food list (the forecast screen reads it).
export function setScanItems(items: MealItem[]) {
  current = { ...current, items, version: current.version + 1 };
}

// Remembers whether this plate is sehri or iftar.
export function setScanMeal(meal: 'iftar' | 'sehri') {
  current = { ...current, meal };
}

// Remembers which foods the AI could not match (the forecast warns about them).
export function setScanUnknown(unknown: string[]) {
  current = { ...current, unknown };
}

// Reads the current scan.
export function getScan(): CurrentScan {
  return current;
}
