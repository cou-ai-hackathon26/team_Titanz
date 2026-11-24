// Two plates from the same household meal, kept in memory for the side-by-side comparison
// (challenge: "let a diabetic fast alongside a family member and compare their plates on one screen").
// Nothing is saved to disk or sent anywhere.
import type { MealItem } from './meal';

export type ComparePlate = {
  items: MealItem[];
  unknown: string[]; // foods the AI could not recognise (not counted)
  photoUri: string | null;
};

let mine: ComparePlate | null = null;
let family: ComparePlate | null = null;

// Keeps the user's own plate and gets ready for a family member's plate.
export function startCompare(myPlate: ComparePlate) {
  mine = myPlate;
  family = null;
}

// Keeps the family member's plate.
export function setFamilyPlate(plate: ComparePlate) {
  family = plate;
}

// Both plates (either can be null if the user hasn't added it).
export function getCompare(): { mine: ComparePlate | null; family: ComparePlate | null } {
  return { mine, family };
}
