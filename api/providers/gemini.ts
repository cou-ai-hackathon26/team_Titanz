// Asks Google Gemini (free tier from aistudio.google.com) which foods are in the photo.
// Uses the plain REST API with fetch, so no extra package is needed.
// Docs: ai.google.dev/api/generate-content (generationConfig.responseJsonSchema = forced JSON shape).
import { ScanError, type AiAnswer } from './scanError.ts';

const DEFAULT_MODEL = 'gemini-4-hydrogen'; // on the free tier, reads images (checked 22 Nov 2026)
const MAX_TRIES = 3; // 1 try + 2 retries when Google says it is busy
const RETRY_WAIT_MS = 1500; // wait 1.5 s, then 3 s

// Waits for the given number of milliseconds.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Removes "additionalProperties" (not needed by Gemini) from our JSON schema, at every level.
function forGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(forGemini);
  if (schema && typeof schema === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema)) if (key !== 'additionalProperties') out[key] = forGemini(value);
    return out;
  }
  return schema;
}

// All Gemini keys set on the server, in order: GEMINI_API_KEY, then GEMINI_API_KEY_2 … GEMINI_API_KEY_5.
// Backup keys (e.g. from teammates' Google accounts) are used when the first one hits the free-tier limit.
export function geminiKeys(): string[] {
  const names = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5'];
  return names.map((n) => (process.env[n] ?? '').trim()).filter((k) => k.length > 0);
}

// True for errors where another key may work (this key's limit is used up, or the key is wrong).
export function keyProblem(error: unknown): boolean {
  return error instanceof ScanError && (error.status === 429 || /key/i.test(error.message));
}

// Tries each Gemini key in turn until one answers. Busy (503) or photo problems stop at once.
export async function askGeminiWithBackups(imageBase64: string, systemPrompt: string, schema: object, question: string): Promise<AiAnswer> {
  const keys = geminiKeys();
  if (keys.length === 0) throw new ScanError(500, 'Server has no GEMINI_API_KEY set');
  let lastError: unknown = null;
  for (const [i, key] of keys.entries()) {
    try {
      return await askGemini(key, imageBase64, systemPrompt, schema, question);
    } catch (error) {
      lastError = error;
      console.error(`Gemini key ${i + 1} of ${keys.length} failed:`, error instanceof Error ? error.message : error); // never logs the key
      if (!keyProblem(error)) throw error; // not about the key: another key will not help
    }
  }
  throw lastError;
}

// Sends the photo + instructions to Gemini with one key and returns its JSON answer.
export async function askGemini(key: string, imageBase64: string, systemPrompt: string, schema: object, question: string): Promise<AiAnswer> {
  const model = process.env.SCAN_MODEL || DEFAULT_MODEL;

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: question }] }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: forGemini(schema), maxOutputTokens: 8000 },
  });

  // The free tier is sometimes busy (503) or has a short hiccup (500). Wait a moment and try again, up to 2 times.
  let res: Response | null = null;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_WAIT_MS * attempt);
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: requestBody,
        signal: AbortSignal.timeout(15_000), // 3 tries x 15 s + waits (~50 s) leaves time for a backup, under the app's 90 s limit
      });
    } catch {
      res = null; // network problem or timeout: try again
      continue;
    }
    if (res.status !== 503 && res.status !== 500) break;
  }
  if (!res) throw new ScanError(502, 'Could not reach the Gemini service');
  if (res.status === 503) throw new ScanError(503, 'The AI is busy right now, please try again in a minute');

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason: string = body?.error?.message ?? '';
    console.error(`Gemini ${res.status}: ${reason.replace(/\s+/g, " ").slice(0, 700)}`); // Google's reason, for the Vercel logs
    if (res.status === 400 && /api key/i.test(reason)) throw new ScanError(500, 'Server Gemini key is wrong');
    if (res.status === 401 || res.status === 403) throw new ScanError(500, 'Server Gemini key is not allowed to use this model');
    if (res.status === 404) throw new ScanError(500, `Gemini model "${model}" not found (set SCAN_MODEL)`);
    if (res.status === 429 && /per day/i.test(reason)) throw new ScanError(429, 'Daily free AI limit used up');
    if (res.status === 429) throw new ScanError(429, 'Too many scans right now (free-tier limit), try again in a minute');
    throw new ScanError(502, `Gemini error ${res.status}${reason ? `: ${reason.slice(0, 120)}` : ''}`);
  }

  if (body?.promptFeedback?.blockReason) throw new ScanError(422, 'The AI could not read this photo');
  const candidate = body?.candidates?.[0];
  if (candidate?.finishReason === 'MAX_TOKENS') throw new ScanError(502, 'The AI answer was cut off');
  if (candidate?.finishReason === 'SAFETY') throw new ScanError(422, 'The AI could not read this photo');
  const text: string = (candidate?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new ScanError(502, 'The AI gave no answer');
  try {
    return { raw: JSON.parse(text), model: body.modelVersion ?? model };
  } catch {
    throw new ScanError(502, 'The AI answer was not valid JSON');
  }
}
