// Checks lib/customFood.ts (foods the user adds when the AI can't recognise them). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCustomFood, registerFoods, validCustomCarbs, CUSTOM_GI } from '../../lib/customFood.ts';
import { FOOD_BY_ID, FOODS } from '../../lib/foods.ts';
import { mealTotals } from '../../lib/meal.ts';

test('a food the user adds counts with their grams, as fast sugar, and is not an AI choice', () => {
  const food = makeCustomFood('  spaghetti ', 45, 1);
  assert.equal(food.id, 'custom_1');
  assert.equal(food.nameBn, 'spaghetti');
  assert.equal(food.gi, CUSTOM_GI);
  registerFoods([food]);
  assert.equal(FOOD_BY_ID.custom_1.carbsPerUnit, 45);
  assert.ok(!FOODS.some((f) => f.id === 'custom_1'));
  const t = mealTotals([{ foodId: 'custom_1', count: 2 }]);
  assert.equal(t.carbs, 90);
  assert.equal(Math.round(t.gl), 63); // 90 g × 70 / 100
});

test('typed grams must be 0–300', () => {
  assert.equal(validCustomCarbs(45), true);
  assert.equal(validCustomCarbs(0), true);
  assert.equal(validCustomCarbs(301), false);
  assert.equal(validCustomCarbs(null), false);
  assert.equal(validCustomCarbs(Number.NaN), false);
});
