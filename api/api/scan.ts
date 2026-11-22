// POST /api/scan — reads an iftar plate photo with a vision AI and returns which foods are on it.
// AI: Google Gemini by default (GEMINI_API_KEY, free tier). Set SCAN_PROVIDER=claude to use Claude instead.
// The AI ONLY names foods and counts. All sugar maths happens in the app (lib/meal.ts, lib/forecast.ts).
// API keys live only in Vercel env vars (or api/.env.local for local tests). Never put a key in the app.
//
// Request:  { "image": "<base64 jpeg>" }
// Response: { "items": [{ "id": "jilapi", "count": 2, "confidence": 0.86 }], "unknown": ["green chutney"], "model": "..." }
// Errors:   { "error": "..." } with a 4xx/5xx status. The app then shows the manual food picker.
import { FOOD_LIST } from '../food-list.ts';
import { askGemini } from '../providers/gemini.ts';
import { askClaude } from '../providers/claude.ts';
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

// The endpoint: check the photo, ask Claude, clean the answer, send it back.
export async function POST(request: Request): Promise<Response> {
  let image: unknown;
  try {
    ({ image } = await request.json());
  } catch {
    return json({ error: 'Body must be JSON: { "image": "<base64 jpeg>" }' }, 400);
  }
  if (typeof image !== 'string' || image.length < 100) return json({ error: 'Missing photo' }, 400);
  if (image.length > MAX_IMAGE_CHARS) return json({ error: 'Photo too large' }, 413);
  // Which AI to ask: SCAN_PROVIDER if set, otherwise Gemini.
  const provider = process.env.SCAN_PROVIDER === 'claude' ? 'claude' : 'gemini';
  try {
    const ask = provider === 'claude' ? askClaude : askGemini;
    const answer = await ask(image, SYSTEM_PROMPT, ANSWER_SCHEMA, QUESTION);
    const cleaned = cleanAnswer(answer.raw as { items?: ScanItem[]; unknown?: string[] });
    return json({ ...cleaned, model: answer.model });
  } catch (error) {
    if (error instanceof ScanError) return json({ error: error.message }, error.status);
    return json({ error: 'Could not reach the AI service' }, 502);
  }
}
