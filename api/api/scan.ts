// POST /api/scan — reads an iftar plate photo with a vision AI and returns which foods are on it.
// AI: Google Gemini by default (GEMINI_API_KEY, free tier), then OpenAI, Groq (free) and Claude as backups.
// The AI ONLY names foods and counts. All sugar maths happens in the app (lib/meal.ts, lib/forecast.ts).
// API keys live only in Vercel env vars (or api/.env.local for local tests). Never put a key in the app.
//
// Request:  { "image": "<base64 jpeg>" }
// Response: { "items": [{ "id": "jilapi", "count": 2, "confidence": 0.86 }], "unknown": ["green chutney"], "model": "..." }
// Errors:   { "error": "..." } with a 4xx/5xx status. The app then shows the manual food picker.
import { FOOD_LIST } from '../food-list.ts';
import { askGeminiWithBackups } from '../providers/gemini.ts';
import { askClaude } from '../providers/claude.ts';
import { askGroq, hasGroq } from '../providers/groq.ts';
import { askOpenAI, hasOpenAI } from '../providers/openai.ts';
import { ScanError } from '../providers/scanError.ts';

const QUESTION = 'Which foods are on this plate, and how many of each?';
const MAX_IMAGE_CHARS = 7_000_000; // ~5 MB photo after base64. The app sends ~1024px JPEGs (~150–300 KB).
const MAX_COUNT = 10; // more than 10 of one food on one plate is almost surely a mistake

const FOOD_IDS = FOOD_LIST.map((f) => f.id);

// The exact JSON shape Claude must answer with. "id" can only be one of our food ids.
const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'unknown'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'count', 'confidence'],
        properties: {
          id: { type: 'string', enum: FOOD_IDS },
          count: { type: 'integer' },
          confidence: { type: 'number' },
        },
      },
    },
    unknown: { type: 'array', items: { type: 'string' } },
  },
};

// Instructions for Claude, including the full food list with what "1 unit" means for each food.
const SYSTEM_PROMPT = `You look at a photo of a Bangladeshi iftar or sehri plate and list the foods you can see.

Use ONLY these food ids. "1 unit" is the amount written after each food:
${FOOD_LIST.map((f) => `- ${f.id}: ${f.nameEn} (${f.nameBn}), 1 ${f.unit} = ${f.portion}`).join('\n')}

How to count:
- First look at the whole photo and find each separate food. Then count each food on its own.
- For piece foods, count only the separate pieces you can actually see. Do not guess hidden pieces, and do not count one piece twice.
- For loose foods (chola, muri, haleem, rice, dal...), give how many cups, bowls or glasses it looks like, at least 1.
- If you are not sure of the exact number, give the lower number and lower the confidence.

Rules:
- count = how many units of that food are on the plate. Whole number, at least 1.
- confidence = how sure you are that the food is really this id, from 0 to 1. Use below 0.6 when you are unsure.
- List each food id once. If you see food that is not in the list, put a short English name for it in "unknown" instead.
- If the photo shows no food, return empty lists.
- Never give medical, diet or medicine advice. Only identify foods.`;

// Lets the app's web preview call this API from another address (browsers block it otherwise).
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Sends a JSON answer with the right headers.
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

// Answers the browser's "may I call you?" check.
export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Opening the address in a browser: say the server is running (never shows any key).
export function GET(): Response {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY);
  return json({ ok: true, service: 'Roza-Safe scan server', aiKeySet: hasKey, howToUse: 'The app sends photos here with POST.' });
}

type ScanItem = { id: string; count: number; confidence: number };

// Cleans Claude's answer: keeps only known ids, whole counts 1–10, confidence 0–1, one row per food.
export function cleanAnswer(raw: { items?: ScanItem[]; unknown?: string[] }) {
  const merged = new Map<string, ScanItem>();
  for (const item of raw.items ?? []) {
    if (!FOOD_IDS.includes(item.id as (typeof FOOD_IDS)[number])) continue;
    const count = Math.min(MAX_COUNT, Math.max(1, Math.round(Number(item.count) || 1)));
    const confidence = Math.min(1, Math.max(0, Number(item.confidence) || 0));
    const before = merged.get(item.id);
    merged.set(
      item.id,
      before
        ? { id: item.id, count: Math.min(MAX_COUNT, before.count + count), confidence: Math.min(before.confidence, confidence) }
        : { id: item.id, count, confidence },
    );
  }
  const unknown = (raw.unknown ?? []).filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim().slice(0, 40)).slice(0, 10);
  return { items: [...merged.values()], unknown };
}

// Gemini answers a used-up daily quota very slowly (~90 s). So: give the whole Gemini step at most 25 s,
// and once it says "daily limit used up", skip it for 30 minutes (remembered while this server copy stays warm).
const GEMINI_MAX_MS = 25_000;
const SKIP_GEMINI_MS = 30 * 60_000;
let geminiOutUntil = 0;

// Rejects with a "busy" error if the promise takes longer than `ms`, so the next AI can take over.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ScanError(503, 'The AI is busy right now, please try again in a minute')), ms);
    promise.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e) => (clearTimeout(timer), reject(e)),
    );
  });
}

// Asks the AI services in order until one answers (see the comment in POST).
async function askWithFallback(image: string) {
  if (process.env.SCAN_PROVIDER === 'claude') return askClaude(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
  if (process.env.SCAN_PROVIDER === 'groq') return askGroq(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
  if (process.env.SCAN_PROVIDER === 'openai') return askOpenAI(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
  // True when another AI service might still answer (this one is out of quota, busy, or has no/a wrong key).
  const tryNext = (error: unknown) => error instanceof ScanError && (error.status === 429 || error.status === 503 || /key/i.test(error.message));
  let lastError: unknown;
  if (Date.now() < geminiOutUntil) {
    lastError = new ScanError(429, 'Daily free AI limit used up'); // Gemini said so recently: don't wait for it again
  } else {
    try {
      return await withTimeout(askGeminiWithBackups(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION), GEMINI_MAX_MS);
    } catch (error) {
      if (error instanceof ScanError && /daily/i.test(error.message)) geminiOutUntil = Date.now() + SKIP_GEMINI_MS;
      if (!tryNext(error)) throw error;
      lastError = error;
    }
  }
  if (hasOpenAI()) {
    try {
      return await askOpenAI(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
    } catch (error) {
      console.error('OpenAI backup failed:', error instanceof Error ? error.message : error);
      // A wrong model name or key on OUR side (500) should not stop the free backups below.
      if (!tryNext(error) && !(error instanceof ScanError && error.status === 500)) throw error;
      lastError = error;
    }
  }
  if (hasGroq()) {
    try {
      return await askGroq(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
    } catch (error) {
      console.error('Groq backup failed:', error instanceof Error ? error.message : error);
      if (!tryNext(error)) throw error;
      lastError = error;
    }
  }
  if (process.env.ANTHROPIC_API_KEY) return askClaude(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
  throw lastError;
}

// The endpoint: check the photo, ask the AI, clean the answer, send it back.
export async function POST(request: Request): Promise<Response> {
  let image: unknown;
  try {
    ({ image } = await request.json());
  } catch {
    return json({ error: 'Body must be JSON: { "image": "<base64 jpeg>" }' }, 400);
  }
  if (typeof image !== 'string' || image.length < 100) return json({ error: 'Missing photo' }, 400);
  if (image.length > MAX_IMAGE_CHARS) return json({ error: 'Photo too large' }, 413);
  // Which AI to ask: SCAN_PROVIDER=claude / groq / openai → only that one. Otherwise Gemini (all keys in turn);
  // if Gemini is out of quota or busy: OpenAI (OPENAI_API_KEY), then Groq (free, GROQ_API_KEY), then Claude (ANTHROPIC_API_KEY).
  try {
    const answer = await askWithFallback(image);
    const cleaned = cleanAnswer(answer.raw as { items?: ScanItem[]; unknown?: string[] });
    return json({ ...cleaned, model: answer.model });
  } catch (error) {
    if (error instanceof ScanError) return json({ error: error.message }, error.status);
    return json({ error: 'Could not reach the AI service' }, 502);
  }
}
