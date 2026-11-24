// Checks lib/foods.ts and lib/meal.ts (docs/LOGIC.md section 2). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, FOOD_BY_ID } from '../../lib/foods.ts';
import { mealTotals, carbBand, foodImpact } from '../../lib/meal.ts';

test('Food table: 35 foods, unique ids, every food has a source and sane numbers', () => {
  assert.equal(FOODS.length, 35);
  assert.equal(new Set(FOODS.map((f) => f.id)).size, FOODS.length);
  for (const f of FOODS) {
    assert.ok(f.src.length > 10, `${f.id} needs a source`);
    assert.ok(f.carbsPerUnit >= 0 && f.carbsPerUnit < 100, f.id);
    assert.ok(f.gi >= 0 && f.gi <= 100, f.id);
    assert.ok(f.nameBn && f.nameEn, f.id);
  }
});

test('Jilapi plate: 2 jilapi + 2 piyaju + 1 chola + 3 dates', () => {
  const t = mealTotals([
    { foodId: 'jilapi', count: 2 },
    { foodId: 'piyaju', count: 2 },
    { foodId: 'chola_bhuna', count: 1 },
    { foodId: 'khejur', count: 3 },
  ]);
  // carbs = 36 + 9 + 28 + 16.2 = 89.2
  assert.equal(Math.round(t.carbs * 10) / 10, 89.2);
  // GL = 25.2 + 3.15 + 7.84 + 7.938 = 44.128
  assert.equal(Math.round(t.gl * 10) / 10, 44.1);
  assert.equal(t.band, 'high');
});

test('Count 0 and unknown ids add nothing', () => {
  const t = mealTotals([{ foodId: 'jilapi', count: 0 }, { foodId: 'not_a_food', count: 3 }]);
  assert.equal(t.carbs, 0);
  assert.equal(t.band, 'low');
});

test('Carb bands: <45 low, 45–75 moderate, >75 high', () => {
  assert.equal(carbBand(44.9), 'low');
  assert.equal(carbBand(45), 'moderate');
  assert.equal(carbBand(75), 'moderate');
  assert.equal(carbBand(75.1), 'high');
});

test('Food dots: jilapi and muri high, khejur and egg low', () => {
  assert.equal(foodImpact('jilapi'), 'high');
  assert.equal(foodImpact('khejur'), 'low');
  assert.equal(foodImpact('egg'), 'low');
  assert.equal(foodImpact('muri'), 'high');
  assert.ok(FOOD_BY_ID.khejur);
});

test('user size: count × size scales carbs, GL and fibre+protein; choices are half / standard / 1.5×', async () => {
  const { mealTotals, sizeScale, itemCarbs, sizeChoices } = await import('../../lib/meal.ts');
  const { FOOD_BY_ID } = await import('../../lib/foods.ts');
  const muri = FOOD_BY_ID.muri; // 30 g bowl
  const standard = mealTotals([{ foodId: 'muri', count: 1 }]);
  const bigger = mealTotals([{ foodId: 'muri', count: 1, size: 60 }]); // 60 g instead of 30 g
  assert.equal(sizeScale({ foodId: 'muri', count: 1, size: 60 }), 2);
  assert.ok(Math.abs(bigger.carbs - standard.carbs * 2) < 1e-9);
  assert.ok(Math.abs(bigger.gl - standard.gl * 2) < 1e-9);
  assert.ok(Math.abs(bigger.fiberProtein - standard.fiberProtein * 2) < 1e-9);
  assert.ok(Math.abs(itemCarbs({ foodId: 'muri', count: 2, size: 15 }) - muri.carbsPerUnit) < 1e-9); // 2 × half = 1 bowl
  assert.deepEqual(sizeChoices(FOOD_BY_ID.milk).map((c) => c.size), [125, 250, 375]);
  assert.equal(sizeScale({ foodId: 'muri', count: 1 }), 1); // no size = our standard portion
});
