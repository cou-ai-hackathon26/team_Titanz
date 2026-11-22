// Meal maths from docs/LOGIC.md section 2. Pure functions, no AI here: this is OUR code.
import { FOOD_BY_ID } from './foods.ts';

export type MealItem = {
  foodId: string;
  count: number; // pieces / cups / bowls / glasses
  unsure?: boolean; // the AI was not sure (confidence < 0.6): the app asks the user to check
};

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
    carbs += food.carbsPerUnit * item.count;
    gl += (food.carbsPerUnit * item.count * food.gi) / 100;
    fiberProtein += (food.fiberPerUnit + food.proteinPerUnit) * item.count;
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
