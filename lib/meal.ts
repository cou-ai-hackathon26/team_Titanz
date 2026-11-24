// Meal maths from docs/LOGIC.md section 2. Pure functions, no AI here: this is OUR code.
import { FOOD_BY_ID, type Food } from './foods.ts';

export type MealItem = {
  foodId: string;
  count: number; // pieces / cups / bowls / glasses
  unsure?: boolean; // the AI was not sure (confidence < 0.6): the app asks the user to check
  size?: number; // g or ml of ONE piece/cup/bowl/glass, if the user changed it (missing = our standard portion)
};

// How much bigger or smaller than our standard portion one piece is (1 = standard). Used for every number.
export function sizeScale(item: MealItem): number {
  const food = FOOD_BY_ID[item.foodId];
  if (!food || !item.size || food.unit === 'serving' || food.portion <= 0) return 1;
  return item.size / food.portion;
}

// The size of one piece of this item in g/ml (the user's size, or our standard portion).
export function itemSize(item: MealItem): number {
  const food = FOOD_BY_ID[item.foodId];
  return item.size ?? food?.portion ?? 0;
}

// Grams of carbohydrate this item adds to the plate (count × size).
export function itemCarbs(item: MealItem): number {
  const food = FOOD_BY_ID[item.foodId];
  return food ? food.carbsPerUnit * item.count * sizeScale(item) : 0;
}

// Ready-made sizes to pick from: small (half), our standard portion, large (one and a half), rounded to 5 g/ml.
export function sizeChoices(food: Food): { label: string; size: number }[] {
  const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
  return [
    { label: 'ছোট', size: round5(food.portion * 0.5) },
    { label: 'নিয়মিত', size: food.portion },
    { label: 'বড়', size: round5(food.portion * 1.5) },
  ];
}

export type CarbBand = 'low' | 'moderate' | 'high';

// Carb load bands for one iftar plate (docs/LOGIC.md): Low < 45 g, Moderate 45–75 g, High > 75 g.
export const CARB_BANDS = { lowBelow: 45, highAbove: 75 };

export type MealTotals = {
  carbs: number; // g of carbohydrate
  gl: number; // glycemic load = carbs × GI / 100, added up
  fiberProtein: number; // g of fibre + protein (they slow the sugar rise)
  band: CarbBand;
};

// Adds up carbs, glycemic load, and fibre+protein for the foods on the plate.
export function mealTotals(items: MealItem[]): MealTotals {
  let carbs = 0;
  let gl = 0;
  let fiberProtein = 0;
  for (const item of items) {
    const food = FOOD_BY_ID[item.foodId];
    if (!food || item.count <= 0) continue;
    const amount = item.count * sizeScale(item); // e.g. 2 glasses of 300 ml = 2 × 1.2 standard glasses
    carbs += food.carbsPerUnit * amount;
    gl += (food.carbsPerUnit * amount * food.gi) / 100;
    fiberProtein += (food.fiberPerUnit + food.proteinPerUnit) * amount;
  }
  return { carbs, gl, fiberProtein, band: carbBand(carbs) };
}

// Turns grams of carbohydrate into Low / Moderate / High.
export function carbBand(carbs: number): CarbBand {
  if (carbs < CARB_BANDS.lowBelow) return 'low';
  if (carbs <= CARB_BANDS.highAbove) return 'moderate';
  return 'high';
}

// Colour dot for one food row: how much it raises sugar per unit (glycemic load of one unit).
export function foodImpact(foodId: string): CarbBand {
  const food = FOOD_BY_ID[foodId];
  if (!food) return 'low';
  const glPerUnit = (food.carbsPerUnit * food.gi) / 100;
  if (glPerUnit >= 10) return 'high';
  if (glPerUnit >= 3) return 'moderate';
  return 'low';
}
