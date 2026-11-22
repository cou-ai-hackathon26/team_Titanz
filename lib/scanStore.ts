// Holds the current scan in memory while the user moves between Camera → Result → Forecast.
// Photos are too big for screen links, so we keep them here. Nothing is saved to disk or a server.
import type { MealItem } from './meal';

type CurrentScan = {
  photoUri: string | null; // to show the photo on the result screen
  photoBase64: string | null; // to send to the scan API
  items: MealItem[]; // the foods on the plate (after the user's edits)
};

let current: CurrentScan = { photoUri: null, photoBase64: null, items: [] };

// Starts a new scan with a fresh photo.
export function setScanPhoto(uri: string, base64: string) {
  current = { photoUri: uri, photoBase64: base64, items: [] };
}

// Saves the food list (the forecast screen reads it).
export function setScanItems(items: MealItem[]) {
  current = { ...current, items };
}

// Reads the current scan.
export function getScan(): CurrentScan {
  return current;
}
