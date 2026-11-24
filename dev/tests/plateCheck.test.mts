// Checks lib/plateCheck.ts (challenge 2: no false promise when foods are not recognised). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPlate, missingWarning, unsureWarning } from '../../lib/plateCheck.ts';

test('a plate with unrecognised foods is never "complete"', () => {
  const c = checkPlate([{ count: 2 }, { count: 1, unsure: true }, { count: 0, unsure: true }], ['green chutney', ' ']);
  assert.deepEqual(c.missing, ['green chutney']);
  assert.equal(c.unsure, 1); // the 0-count unsure row does not count
  assert.equal(c.complete, false);
  assert.match(missingWarning(c)!, /অসম্পূর্ণ: ১টি খাবার/);
  assert.match(unsureWarning(c)!, /১টি খাবার AI নিশ্চিত নয়/);
});

test('a fully recognised plate has no warnings', () => {
  const c = checkPlate([{ count: 3 }], []);
  assert.equal(c.complete, true);
  assert.equal(missingWarning(c), null);
  assert.equal(unsureWarning(c), null);
});
