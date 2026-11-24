// OpenAI (ChatGPT API, paid key): the primary photo reader; Gemini and Groq remain backups.
// Chat Completions API with the photo as a base64 data URL and Structured Outputs (strict JSON schema),
// so the answer can only use our food ids. Docs: developers.openai.com/api/docs/guides/structured-outputs
import { ScanError, type AiAnswer } from './scanError.ts';

const DEFAULT_MODEL = 'gpt-6-luna'; // OpenAI's fast, low-cost model (Nov 2026). Change with OPENAI_MODEL.
const TIMEOUT_MS = 30_000;

// True if an OpenAI key is set on the server.
export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

// Sends the photo + instructions to OpenAI and returns its JSON answer.
export async function askOpenAI(imageBase64: string, systemPrompt: string, schema: object, question: string): Promise<AiAnswer> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new ScanError(500, 'Server has no OPENAI_API_KEY set');
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_completion_tokens: 2000,
        // Naming foods needs little reasoning; the default made scans take ~80 s. "low" is OpenAI's lowest advised level.
        reasoning_effort: process.env.OPENAI_REASONING || 'low',
        response_format: { type: 'json_schema', json_schema: { name: 'iftar_plate', schema, strict: true } },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: question },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ScanError(502, 'Could not reach the OpenAI service');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason: string = body?.error?.message ?? '';
    console.error(`OpenAI ${res.status}: ${reason.replace(/\s+/g, ' ').slice(0, 500)}`); // for the Vercel logs (never the key)
    if (res.status === 401) throw new ScanError(500, 'Server OpenAI key is wrong');
    if (res.status === 404 || /model/i.test(reason)) throw new ScanError(500, `OpenAI model "${model}" not available (set OPENAI_MODEL)`);
    if (res.status === 429 && /quota|billing/i.test(reason)) throw new ScanError(429, 'Daily free AI limit used up'); // no credit left
    if (res.status === 429) throw new ScanError(429, 'Too many scans right now (free-tier limit), try again in a minute');
    if (res.status >= 500) throw new ScanError(503, 'The AI is busy right now, please try again in a minute');
    throw new ScanError(502, `OpenAI error ${res.status}${reason ? `: ${reason.slice(0, 120)}` : ''}`);
  }

  const message = body?.choices?.[0]?.message;
  if (message?.refusal) throw new ScanError(422, 'The AI could not read this photo');
  if (body?.choices?.[0]?.finish_reason === 'length') throw new ScanError(502, 'The AI answer was cut off');
  const text: string = message?.content ?? '';
  if (!text) throw new ScanError(502, 'The AI gave no answer');
  try {
    return { raw: JSON.parse(text), model: `openai/${body.model ?? model}` };
  } catch {
    throw new ScanError(502, 'The AI answer was not valid JSON');
  }
}
