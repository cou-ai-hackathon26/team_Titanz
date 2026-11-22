// POST /api/scan — reads an iftar plate photo with Claude (vision) and returns which foods are on it.
// The AI ONLY names foods and counts. All sugar maths happens in the app (lib/meal.ts, lib/forecast.ts).
// The API key lives only in Vercel env vars (ANTHROPIC_API_KEY). Never put it in the app.
//
// Request:  { "image": "<base64 jpeg>" }
// Response: { "items": [{ "id": "jilapi", "count": 2, "confidence": 0.86 }], "unknown": ["green chutney"], "model": "..." }
// Errors:   { "error": "..." } with a 4xx/5xx status. The app then shows the manual food picker.
import Anthropic from '@anthropic-ai/sdk';
import { FOOD_LIST } from '../food-list.ts';

const MODEL = process.env.SCAN_MODEL || 'claude-opus-5-5';
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

Rules:
- count = how many units of that food are on the plate (pieces for piece foods; cups, bowls or glasses for the others). Round to the nearest whole number, at least 1.
- confidence = how sure you are that the food is really this id, from 0 to 1. Use below 0.6 when you are unsure.
- List each food id once. If you see food that is not in the list, put a short English name for it in "unknown" instead.
- If the photo shows no food, return empty lists.
- Never give medical, diet or medicine advice. Only identify foods.`;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

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
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'Server has no ANTHROPIC_API_KEY set' }, 500);

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      // If a safety check declines the request, the API retries on a fallback model automatically.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ANSWER_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'Which foods are on this plate, and how many of each?' },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') return json({ error: 'The AI could not read this photo' }, 422);
    if (response.stop_reason === 'max_tokens') return json({ error: 'The AI answer was cut off' }, 502);
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'The AI gave no answer' }, 502);

    const cleaned = cleanAnswer(JSON.parse(text.text));
    return json({ ...cleaned, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return json({ error: 'Server API key is wrong' }, 500);
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'Too many scans right now, try again in a minute' }, 429);
    if (error instanceof Anthropic.BadRequestError) return json({ error: `AI request rejected: ${error.message}` }, 502);
    if (error instanceof Anthropic.APIError) return json({ error: `AI service error ${error.status}` }, 502);
    if (error instanceof SyntaxError) return json({ error: 'The AI answer was not valid JSON' }, 502);
    return json({ error: 'Could not reach the AI service' }, 502);
  }
}
