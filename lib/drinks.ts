// User-confirmed drink portions. The photo cannot reveal sugar or a homemade recipe.
import type { Food } from './foods.ts';
import { toEnglishDigits } from './bangla.ts';

export type DrinkDetails =
  | { kind: 'beverage'; ml: number; carbsPer100: number; basis: 'cola-estimate' | 'label' }
  | { kind: 'homemade'; tablespoons: number; base: 'water' | 'other'; otherCarbs: number };

// Approximation: USDA portion report lists 4 g per teaspoon; 3 level teaspoons per tablespoon.
// https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/portion.pdf
export const SUGAR_PER_TABLESPOON = 12;
// Explicit regular-cola proxy only, not a value for every packaged drink.
// https://www.coca-cola.com/gb/en/brands/coca-cola-original-taste
export const COLA_CARBS_PER_100 = 10.6;
export const DRINK_ML_CHOICES = [100, 200, 250, 330, 500];

// Reads decimals without silently changing 10.6 into 106; accepts Bangla digits and comma decimals.
export function drinkNumber(text: string): number | null {
  const value = toEnglishDigits(text).trim().replace(',', '.');
  return /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
}

// Rejects missing, negative, excessive or non-finite quantities before saving any drink.
export function validDrink(drink: DrinkDetails): boolean {
  if (drink.kind === 'beverage') {
    return Number.isFinite(drink.ml) && drink.ml >= 1 && drink.ml <= 2000 &&
      Number.isFinite(drink.carbsPer100) && drink.carbsPer100 >= 0 && drink.carbsPer100 <= 100 &&
      drink.ml * drink.carbsPer100 / 100 <= 300;
  }
  return Number.isInteger(drink.tablespoons) && drink.tablespoons >= 0 && drink.tablespoons <= 6 &&
    Number.isFinite(drink.otherCarbs) && drink.otherCarbs >= 0 && drink.otherCarbs <= 200 &&
    (drink.base !== 'water' || drink.otherCarbs === 0);
}

// Carbohydrate for ONE glass/serving; the plate's count multiplies this once, later.
export function drinkCarbs(drink: DrinkDetails): number {
  if (!validDrink(drink)) throw new Error('Invalid drink quantities');
  return drink.kind === 'beverage' ? drink.ml * drink.carbsPer100 / 100 :
    drink.tablespoons * SUGAR_PER_TABLESPOON + drink.otherCarbs;
}

// Stores an immutable recipe as a custom food so forecast, comparison and history share its values.
export function makeDrinkFood(name: string, drink: DrinkDetails, now = Date.now()): Food {
  const carbs = drinkCarbs(drink);
  const beverage = drink.kind === 'beverage';
  const description = beverage ? `${drink.ml} ml, ${drink.carbsPer100} g carbohydrate/100 ml (${drink.basis})` :
    `${drink.tablespoons} level tablespoons added sugar + ${drink.otherCarbs} g other carbohydrate per glass`;
  return {
    id: `drink_${now}`, nameBn: name.trim().slice(0, 40) || (beverage ? 'প্যাকেটের পানীয়' : 'ঘরে তৈরি পানীয়'),
    nameEn: beverage ? 'Packaged drink' : 'Homemade drink',
    unit: beverage ? 'glass' : 'serving', portion: beverage ? drink.ml : 1,
    portionUnit: beverage ? 'ml' : 'g', carbsPerUnit: carbs,
    gi: 70, fiberPerUnit: 0, proteinPerUnit: 0, estimated: true,
    src: `User-confirmed drink: ${description}. GI 70 assumed, not measured. Tablespoon estimate: 12 g, USDA portion.pdf (4 g/tsp × 3). Cola proxy: Coca-Cola GB label 10.6 g/100 ml.`,
    drink: { ...drink },
  };
}

// Lets unrecognised drinks open the drink form directly; the same choice is also available for any item.
export function looksLikeDrink(name: string): boolean {
  return /\b(drinks?|beverages?|juice|sharbat|sherbet|soda|cola|lemonade|lassi|milk|milkshake|tea|coffee)\b|পানীয়|শরবত|জুস|লাচ্ছি|দুধ|কফি|(?:^|\s)চা(?:\s|$)/i.test(name);
}
