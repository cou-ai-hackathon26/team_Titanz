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
async function scanWithFakeGemini(status: number | number[], reply: unknown) {
  const statuses = Array.isArray(status) ? [...status] : [status];
  let calls = 0;
  const realFetch = globalThis.fetch;
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  let sentBody: any = null;
  const usedKeys: string[] = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    sentBody = JSON.parse(String(init.body));
    usedKeys.push((init.headers as Record<string, string>)['x-goog-api-key']);
    calls++;
    const s = statuses.length > 1 ? statuses.shift()! : statuses[0];
    return new Response(JSON.stringify(s === 200 || !Array.isArray(status) ? reply : { error: { message: 'busy' } }), { status: s });
  }) as typeof fetch;
  try {
    const res = await POST(new Request('http://x/api/scan', { method: 'POST', body: JSON.stringify({ image: 'a'.repeat(200) }) }));
    return { status: res.status, body: await res.json(), sentBody, calls, usedKeys };
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

test('Gemini busy (503): retries once, then succeeds or gives a clear busy message', async () => {
  const good = { candidates: [{ content: { parts: [{ text: '{"items":[{"id":"khejur","count":3,"confidence":0.9}],"unknown":[]}' }] }, finishReason: 'STOP' }] };
  const recovered = await scanWithFakeGemini([503, 200], good);
  assert.equal(recovered.status, 200);
  assert.equal(recovered.calls, 2);
  assert.equal(recovered.sentBody.generationConfig.thinkingConfig.thinkingLevel, 'low'); // fast: no long thinking
  const stillBusy = await scanWithFakeGemini([503, 503], good);
  assert.equal(stillBusy.status, 503);
  assert.equal(stillBusy.calls, 2); // 1 try + 1 retry, then give up quickly (backup AI or clear message)
  assert.match(stillBusy.body.error, /busy/);
});

test('Backup keys: key 1 out of free quota (429) → key 2 answers', async () => {
  process.env.GEMINI_API_KEY_2 = 'backup-key';
  try {
    const good = { candidates: [{ content: { parts: [{ text: '{"items":[{"id":"khejur","count":3,"confidence":0.9}],"unknown":[]}' }] }, finishReason: 'STOP' }] };
    const r = await scanWithFakeGemini([429, 200], good);
    assert.equal(r.status, 200);
    assert.deepEqual(r.usedKeys, ['test-key', 'backup-key']);
    const allOut = await scanWithFakeGemini([429, 429], good);
    assert.equal(allOut.status, 429); // no Claude key set: clear "limit" message
    assert.match(allOut.body.error, /limit/);
  } finally {
    delete process.env.GEMINI_API_KEY_2;
  }
});

// Verify provider order and recovery without sending a real photo or using paid credits.
for (const failure of ['quota', 'network']) {
  test(`OpenAI ${failure} failure falls back to Gemini`, async () => {
    const realFetch = globalThis.fetch;
    const savedOpenAI = process.env.OPENAI_API_KEY;
    const savedGemini = process.env.GEMINI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-openai';
    process.env.GEMINI_API_KEY = 'test-gemini';
    const urls: string[] = [];
    globalThis.fetch = (async (url: string) => {
      urls.push(url);
      if (url.includes('api.openai.com')) {
        if (failure === 'network') throw new TypeError('Network unavailable');
        return new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), { status: 429 });
      }
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"items":[],"unknown":[]}' }] } }], modelVersion: 'test-gemini' }), { status: 200 });
    }) as typeof fetch;
    try {
      const response = await POST(new Request('http://x/api/scan', { method: 'POST', body: JSON.stringify({ image: 'a'.repeat(200) }) }));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).model, 'test-gemini');
      assert.equal(urls.length, 2);
      assert.ok(urls[0].includes('api.openai.com'));
      assert.ok(urls[1].includes('generativelanguage'));
    } finally {
      globalThis.fetch = realFetch;
      if (savedOpenAI === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = savedOpenAI;
      if (savedGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = savedGemini;
    }
  });
}

test('Groq backup: Gemini out of daily quota → Groq reads the photo (JSON inside thinking text is still found)', async () => {
  const realFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GROQ_API_KEY = 'groq-test-key';
  const urls: string[] = [];
  let groqBody: any = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    urls.push(url);
    if (url.includes('generativelanguage')) {
      return new Response(JSON.stringify({ error: { message: 'Quota exceeded ... requests per day limit exceeded on Free Tier' } }), { status: 429 });
    }
    groqBody = JSON.parse(String(init.body));
    const content = '<think>looking</think>{"items":[{"id":"khejur","count":3,"confidence":0.9},{"id":"made-up","count":1,"confidence":0.9}],"unknown":[]}';
    return new Response(JSON.stringify({ model: 'qwen/qwen3.8-27b', choices: [{ message: { content } }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const res = await POST(new Request('http://x/api/scan', { method: 'POST', body: JSON.stringify({ image: 'a'.repeat(200) }) }));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(body.items, [{ id: 'khejur', count: 3, confidence: 0.9 }]); // made-up id dropped
    assert.equal(body.model, 'groq/qwen/qwen3.8-27b');
    assert.ok(urls.some((u) => u.includes('api.groq.com')));
    assert.equal(groqBody.response_format.type, 'json_object');
    assert.match(groqBody.messages[1].content[1].image_url.url, /^data:image\/jpeg;base64,/);

    // Groq also out for the day → clear "daily limit" message
    globalThis.fetch = (async (url: string) =>
      new Response(JSON.stringify({ error: { message: url.includes('groq') ? 'Rate limit reached ... tokens per day (TPD)' : 'requests per day limit exceeded' } }), { status: 429 })) as typeof fetch;
    const out = await POST(new Request('http://x/api/scan', { method: 'POST', body: JSON.stringify({ image: 'a'.repeat(200) }) }));
    assert.equal(out.status, 429);
    assert.match((await out.json()).error, /Daily free AI limit/);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
  }
});

test('OpenAI first: answers before Gemini or Groq with a strict JSON schema and the photo', async () => {
  const realFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.OPENAI_API_KEY = 'openai-test-key';
  process.env.GROQ_API_KEY = 'groq-test-key';
  const urls: string[] = [];
  let sent: any = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    urls.push(url);
    if (url.includes('generativelanguage')) return new Response(JSON.stringify({ error: { message: 'requests per day limit exceeded' } }), { status: 429 });
    sent = JSON.parse(String(init.body));
    const content = '{"items":[{"id":"khejur","count":3,"confidence":0.9}],"unknown":[]}';
    return new Response(JSON.stringify({ model: 'gpt-6-luna', choices: [{ message: { content }, finish_reason: 'stop' }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const res = await POST(new Request('http://x/api/scan', { method: 'POST', body: JSON.stringify({ image: 'a'.repeat(200) }) }));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.model, 'openai/gpt-6-luna');
    assert.equal(urls.length, 1, 'Only OpenAI is called when it succeeds');
    assert.ok(urls[0].includes('api.openai.com'));
    assert.ok(!urls.some((u) => u.includes('groq')), 'Groq not needed when OpenAI answers');
    assert.equal(sent.response_format.json_schema.strict, true);
    assert.equal(sent.reasoning_effort, 'low'); // fast: little reasoning
    assert.match(sent.messages[1].content[1].image_url.url, /^data:image\/jpeg;base64,/);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
  }
});
