// Drink quantities feed the same meal, forecast and history math as the rest of the plate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDrinkFood, drinkCarbs, drinkNumber, validDrink, looksLikeDrink } from '../../lib/drinks.ts';
import { registerFoods } from '../../lib/customFood.ts';
import { mealTotals } from '../../lib/meal.ts';
import { forecast, forecastWith } from '../../lib/forecast.ts';

test('homemade sugar is per serving, extra carbs counted once, water adds none', () => {
  const food = makeDrinkFood('শরবত', { kind: 'homemade', tablespoons: 2, base: 'water', otherCarbs: 0 }, 10);
  registerFoods([food]);
  assert.equal(food.carbsPerUnit, 24);
  assert.equal(mealTotals([{ foodId: food.id, count: 2 }]).carbs, 48);
  assert.equal(drinkCarbs({ kind: 'homemade', tablespoons: 2, base: 'other', otherCarbs: 9 }), 33);
  assert.equal(drinkCarbs({ kind: 'homemade', tablespoons: 0, base: 'water', otherCarbs: 0 }), 0);
  assert.equal(drinkCarbs({ kind: 'homemade', tablespoons: 6, base: 'water', otherCarbs: 0 }), 72);
});

test('beverage ml and label concentration scale together; zero-carb label remains zero', () => {
  assert.equal(drinkCarbs({ kind: 'beverage', ml: 100, carbsPer100: 10.6, basis: 'cola-estimate' }), 10.6);
  assert.equal(drinkCarbs({ kind: 'beverage', ml: 250, carbsPer100: 10.6, basis: 'cola-estimate' }), 26.5);
  assert.equal(drinkCarbs({ kind: 'beverage', ml: 500, carbsPer100: 8, basis: 'label' }), 40);
  assert.equal(drinkCarbs({ kind: 'beverage', ml: 250, carbsPer100: 0, basis: 'label' }), 0);
});

test('invalid and missing drink inputs never become a zero-sugar drink', () => {
  for (const input of ['', ' ', '-1', '1.2.3', 'Infinity', 'abc', '1e2']) assert.equal(drinkNumber(input), null);
  assert.equal(drinkNumber('১০.৬'), 10.6);
  assert.equal(drinkNumber('10,6'), 10.6);
  for (const ml of [0, -1, 2001, NaN, Infinity]) assert.equal(validDrink({ kind: 'beverage', ml, carbsPer100: 10.6, basis: 'label' }), false);
  assert.equal(validDrink({ kind: 'beverage', ml: 2000, carbsPer100: 100, basis: 'label' }), false);
  for (const tablespoons of [-1, 7, 1.5, NaN]) assert.equal(validDrink({ kind: 'homemade', tablespoons, base: 'water', otherCarbs: 0 }), false);
  assert.equal(validDrink({ kind: 'homemade', tablespoons: 2, base: 'water', otherCarbs: 9 }), false);
});

test('saved drink recipes survive JSON roundtrip and change the forecast; edits preserve old plans', () => {
  const oldFood = makeDrinkFood('Drink', { kind: 'beverage', ml: 250, carbsPer100: 10.6, basis: 'label' }, 20);
  const newFood = makeDrinkFood('Drink', { kind: 'beverage', ml: 100, carbsPer100: 10.6, basis: 'label' }, 21);
  registerFoods(JSON.parse(JSON.stringify([oldFood, newFood])));
  const oldPlate = [{ foodId: oldFood.id, count: 2 }];
  assert.equal(mealTotals(oldPlate).carbs, 53);
  assert.equal(mealTotals([{ foodId: newFood.id, count: 1 }]).carbs, 10.6);
  const full = forecast(oldPlate);
  const reduced = forecastWith(oldPlate, { reduceFoodId: oldFood.id, reduceTo: 1, addChola: false, walk15: false });
  assert.ok(full.peak > reduced.peak);
  assert.equal(mealTotals(oldPlate).carbs, 53);
  assert.equal(looksLikeDrink('unknown beverage'), true);
  assert.equal(looksLikeDrink('লেবুর শরবত'), true);
  assert.equal(looksLikeDrink('steak'), false);
  assert.equal(looksLikeDrink('চাল'), false);
});
