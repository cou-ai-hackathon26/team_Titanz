// Checks lib/forecast.ts against the worked examples in our build report (Part 3). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast, shape, biggestSugarFood, noChanges, changedPlate, forecastWith, changeEffect, FORECAST } from '../../lib/forecast.ts';

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const JILAPI_HEAVY = [
  { foodId: 'jilapi', count: 2 }, { foodId: 'beguni', count: 3 }, { foodId: 'piyaju', count: 2 },
  { foodId: 'khejur', count: 3 }, { foodId: 'rooh_afza_sharbat', count: 1 },
];
const WITH_SWAPS = [
  { foodId: 'jilapi', count: 1 }, { foodId: 'beguni', count: 3 }, { foodId: 'piyaju', count: 2 },
  { foodId: 'khejur', count: 2 }, { foodId: 'chola_bhuna', count: 1 }, { foodId: 'lemon_water', count: 1 },
];

test('Curve shape: 0 at start, 1 at 75 min, report values at 15-min steps', () => {
  assert.equal(shape(0), 0);
  assert.equal(shape(75), 1);
  assert.deepEqual([15, 30, 45, 60, 90, 105, 120].map((t) => round(shape(t), 3)), [0.445, 0.729, 0.895, 0.977, 0.982, 0.938, 0.878]);
});

test('Jilapi-heavy plate peaks at 12.2 mmol/L (range 11.2–13.2) → above 10', () => {
  const f = forecast(JILAPI_HEAVY);
  assert.equal(round(f.carbs, 1), 110.4);
  assert.equal(round(f.gl, 2), 63.77);
  assert.equal(round(f.peak, 1), 12.2);
  assert.equal(round(f.peakLow, 1), 11.2);
  assert.equal(round(f.peakHigh, 1), 13.2);
  assert.equal(f.zone, 'high');
});

test('With swaps + 15-min walk peaks at 8.2 mmol/L (range 7.8–8.6) → safe', () => {
  const f = forecast(WITH_SWAPS, { walk15: true });
  assert.equal(round(f.carbs, 1), 84.8);
  assert.equal(round(f.peak, 1), 8.2);
  assert.equal(round(f.peakLow, 1), 7.8);
  assert.equal(round(f.peakHigh, 1), 8.6);
  assert.equal(f.zone, 'safe');
});

test('Curve points match the report table (jilapi-heavy, 15-min steps)', () => {
  const pts = forecast(JILAPI_HEAVY).points.filter((p) => p.t % 15 === 0).map((p) => round(p.glucose, 2));
  assert.deepEqual(pts, [5.5, 8.47, 10.36, 11.47, 12.01, 12.17, 12.05, 11.75, 11.35]); // copied from the report table
});

test('Empty plate: flat line at the starting value', () => {
  const f = forecast([]);
  assert.equal(f.peak, FORECAST.BASELINE_DEFAULT);
  assert.ok(f.points.every((p) => p.glucose === FORECAST.BASELINE_DEFAULT));
  assert.equal(f.points.length, 25); // 0..120 every 5 min
});

test('What-if: biggest sugar food is jilapi; no changes = same peak', () => {
  assert.equal(biggestSugarFood(JILAPI_HEAVY), 'jilapi');
  const w = noChanges(JILAPI_HEAVY);
  assert.deepEqual(w, { reduceFoodId: 'jilapi', reduceTo: 2, addChola: false, walk15: false });
  assert.equal(forecastWith(JILAPI_HEAVY, w).peak, forecast(JILAPI_HEAVY).peak);
});

test('What-if: chola is added (or +1 if already there), the original plate is not changed', () => {
  const w = { ...noChanges(JILAPI_HEAVY), addChola: true };
  assert.deepEqual(changedPlate(JILAPI_HEAVY, w).find((i) => i.foodId === 'chola_bhuna'), { foodId: 'chola_bhuna', count: 1 });
  assert.equal(changedPlate(WITH_SWAPS, { ...noChanges(WITH_SWAPS), addChola: true }).find((i) => i.foodId === 'chola_bhuna')?.count, 2);
  assert.equal(JILAPI_HEAVY.length, 5);
});

test('What-if effects: eating less jilapi, adding chola and walking each lower this peak', () => {
  const w = { ...noChanges(JILAPI_HEAVY), reduceTo: 1, addChola: true, walk15: true };
  assert.ok(changeEffect(JILAPI_HEAVY, w, 'reduce') < 0);
  assert.ok(changeEffect(JILAPI_HEAVY, w, 'chola') < 0);
  assert.ok(changeEffect(JILAPI_HEAVY, w, 'walk') < 0);
  assert.ok(forecastWith(JILAPI_HEAVY, w).peak < forecast(JILAPI_HEAVY).peak);
});
