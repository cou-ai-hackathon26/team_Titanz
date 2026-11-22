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
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const noKey = await post(JSON.stringify({ image: 'a'.repeat(200) }));
  assert.equal(noKey.status, 500);
  assert.match((await noKey.json()).error, /GEMINI_API_KEY/);
  if (saved) process.env.GEMINI_API_KEY = saved;
});

// Runs one scan with a fake Gemini reply (no internet, no real key) and returns status + body.
async function scanWithFakeGemini(status: number, reply: unknown) {
  const realFetch = globalThis.fetch;
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  let sentBody: any = null;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    sentBody = JSON.parse(String(init.body));
    return new Response(JSON.stringify(reply), { status });
  }) as typeof fetch;
  try {
    const res = await POST(new Request('http://x/api/scan', { method: 'POST', body: JSON.stringify({ image: 'a'.repeat(200) }) }));
    return { status: res.status, body: await res.json(), sentBody };
  } finally {
    globalThis.fetch = realFetch;
    if (savedKey) process.env.GEMINI_API_KEY = savedKey;
    else delete process.env.GEMINI_API_KEY;
  }
}

test('Gemini: good answer is parsed and cleaned; request has photo + JSON schema with food ids', async () => {
  const answer = { items: [{ id: 'jilapi', count: 2, confidence: 0.9 }, { id: 'burger', count: 1, confidence: 0.9 }], unknown: ['chutney'] };
  const r = await scanWithFakeGemini(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] }, finishReason: 'STOP' }], modelVersion: 'gemini-4-hydrogen' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { items: [{ id: 'jilapi', count: 2, confidence: 0.9 }], unknown: ['chutney'], model: 'gemini-4-hydrogen' });
  assert.equal(r.sentBody.contents[0].parts[0].inlineData.mimeType, 'image/jpeg');
  assert.equal(r.sentBody.generationConfig.responseMimeType, 'application/json');
  assert.ok(r.sentBody.generationConfig.responseJsonSchema.properties.items.items.properties.id.enum.includes('khejur'));
  assert.ok(!JSON.stringify(r.sentBody.generationConfig).includes('additionalProperties'));
});

test('Gemini errors become clear messages', async () => {
  assert.equal((await scanWithFakeGemini(400, { error: { message: 'API key not valid. Please pass a valid API key.' } })).body.error, 'Server Gemini key is wrong');
  assert.equal((await scanWithFakeGemini(429, { error: { message: 'Resource exhausted' } })).status, 429);
  assert.match((await scanWithFakeGemini(404, { error: { message: 'not found' } })).body.error, /not found/);
  assert.equal((await scanWithFakeGemini(200, { promptFeedback: { blockReason: 'SAFETY' } })).status, 422);
  assert.equal((await scanWithFakeGemini(200, { candidates: [{ content: { parts: [{ text: '{"items": [' }] }, finishReason: 'MAX_TOKENS' }] })).body.error, 'The AI answer was cut off');
  assert.equal((await scanWithFakeGemini(200, { candidates: [{ content: { parts: [{ text: 'not json' }] }, finishReason: 'STOP' }] })).body.error, 'The AI answer was not valid JSON');
});
