// Foods the user adds themselves when the AI can't recognise something and it is not in our table
// (e.g. "spaghetti" with 45 g carbohydrate from the packet). No guessing: the user types the grams.
// They are looked up like our own foods (FOOD_BY_ID), but are never sent to the AI as a choice.
import { FOOD_BY_ID, type Food } from './foods.ts';

// We don't know how fast a user's food raises sugar, so it is counted as fast sugar (GI 70): the safe side.
export const CUSTOM_GI = 70;
export const MAX_CUSTOM_CARBS = 300; // grams in one serving; more than this is almost certainly a typo

// Builds a food from what the user typed: its name and grams of carbohydrate in one serving.
export function makeCustomFood(name: string, carbs: number, now = Date.now()): Food {
  const clean = name.trim().slice(0, 40);
  return {
    id: `custom_${now}`,
    nameBn: clean,
    nameEn: clean,
    unit: 'serving',
    portion: 1,
    portionUnit: 'g',
    carbsPerUnit: carbs,
    gi: CUSTOM_GI,
    fiberPerUnit: 0,
    proteinPerUnit: 0,
    estimated: true,
    src: `Added by the user: ${carbs} g carbohydrate per serving (typed by them). GI ${CUSTOM_GI} assumed, counted as fast sugar to stay on the safe side.`,
  };
}

// True if the typed grams can be used (a number from 0 up to 300).
export function validCustomCarbs(carbs: number | null): carbs is number {
  return carbs !== null && Number.isFinite(carbs) && carbs >= 0 && carbs <= MAX_CUSTOM_CARBS;
}

// Makes the user's foods findable everywhere the app looks foods up (plate, forecast, history, compare).
export function registerFoods(foods: Food[]) {
  for (const f of foods) FOOD_BY_ID[f.id] = f;
}
