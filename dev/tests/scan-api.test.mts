// Checks the scan API's input checks and answer cleaning, without calling the AI. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST, cleanAnswer } from '../../api/api/scan.ts';
import { FOOD_LIST } from '../../api/food-list.ts';
import { FOODS } from '../../lib/foods.ts';

test('API food list matches lib/foods.ts (run `cd api && npm run sync-foods` if this fails)', () => {
  assert.deepEqual(FOOD_LIST.map((f) => f.id), FOODS.map((f) => f.id));
});

test('cleanAnswer drops unknown ids, rounds and clamps counts, merges duplicates', () => {
  const r = cleanAnswer({
    items: [
      { id: 'jilapi', count: 2.4, confidence: 0.9 },
      { id: 'jilapi', count: 1, confidence: 0.5 },
      { id: 'pizza', count: 1, confidence: 1 },
      { id: 'khejur', count: 40, confidence: 3 },
      { id: 'piyaju', count: 0, confidence: -1 },
    ],
    unknown: ['  green chutney ', '', 'x'.repeat(80)],
  });
  assert.deepEqual(r.items, [
    { id: 'jilapi', count: 3, confidence: 0.5 },
    { id: 'khejur', count: 10, confidence: 1 },
    { id: 'piyaju', count: 1, confidence: 0 },
  ]);
  assert.deepEqual(r.unknown, ['green chutney', 'x'.repeat(40)]);
});

test('POST rejects bad requests before calling the AI', async () => {
  const post = (body: string) => POST(new Request('http://x/api/scan', { method: 'POST', body }));
  assert.equal((await post('not json')).status, 400);
  assert.equal((await post('{}')).status, 400);
  assert.equal((await post(JSON.stringify({ image: 'abc' }))).status, 400);
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const noKey = await post(JSON.stringify({ image: 'a'.repeat(200) }));
  assert.equal(noKey.status, 500);
  assert.match((await noKey.json()).error, /ANTHROPIC_API_KEY/);
  if (saved) process.env.ANTHROPIC_API_KEY = saved;
});
