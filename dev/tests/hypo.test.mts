// Checks lib/hypo.ts (low sugar rules). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReading, adviceFor, minutesToIftar } from '../../lib/hypo.ts';

test('Readings: Bangla or English digits, comma or dot; nonsense is rejected', () => {
  assert.equal(parseReading('৩.৫'), 3.5);
  assert.equal(parseReading('3,5'), 3.5);
  assert.equal(parseReading(' 7 mmol'), 7);
  assert.equal(parseReading(''), null);
  assert.equal(parseReading('abc'), null);
  assert.equal(parseReading('3.5.1'), null);
  assert.equal(parseReading('0.5'), null); // too low for a glucometer
  assert.equal(parseReading('70'), null); // mg/dL typed by mistake
});

test('Advice: below 3.9 break the fast; 3.9–5.5 recheck; above is not low', () => {
  assert.equal(adviceFor(3.8), 'break-fast');
  assert.equal(adviceFor(3.9), 'recheck');
  assert.equal(adviceFor(5.5), 'recheck');
  assert.equal(adviceFor(5.6), 'not-low');
});

test('Minutes to iftar', () => {
  const now = new Date(2026, 1, 20, 17, 30);
  assert.equal(minutesToIftar(18 * 60 + 8, now), 38);
  assert.ok(minutesToIftar(17 * 60, now) < 0);
});
