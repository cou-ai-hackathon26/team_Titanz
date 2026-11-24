// Groq (free plan, no card): a backup photo reader for when every Gemini key is out of quota.
// Free plan: about 1,000 requests a day, but only 8,000 tokens a minute, so roughly 3 scans a minute.
// Uses Groq's OpenAI-style chat API with the photo as a base64 data URL and JSON mode.
import { ScanError, type AiAnswer } from './scanError.ts';

const DEFAULT_MODEL = 'qwen/qwen3.8-27b'; // Groq's free model that can see images (Nov 2026)
const TIMEOUT_MS = 30_000;

// True if a Groq key is set on the server.
export function hasGroq(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

// Pulls the JSON object out of the answer (in case the model adds thinking text around it).
function jsonFrom(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new ScanError(502, 'The AI answer was not valid JSON');
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new ScanError(502, 'The AI answer was not valid JSON');
  }
}

// Sends the photo + instructions to Groq and returns its JSON answer.
// Groq's JSON mode does not enforce our exact shape, so the shape is written into the instructions;
// cleanAnswer() in api/scan.ts then drops anything that is not one of our food ids.
export async function askGroq(imageBase64: string, systemPrompt: string, schema: object, question: string): Promise<AiAnswer> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new ScanError(500, 'Server has no GROQ_API_KEY set');
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_completion_tokens: 700, // our JSON answer is ~300 tokens; the free plan allows only 1,000 output tokens a minute
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${systemPrompt}\n\nAnswer with one JSON object only, matching this JSON schema:\n${JSON.stringify(schema)}` },
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
    throw new ScanError(502, 'Could not reach the Groq service');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason: string = body?.error?.message ?? '';
    console.error(`Groq ${res.status}: ${reason.replace(/\s+/g, ' ').slice(0, 500)}`); // for the Vercel logs (never the key)
    if (res.status === 401) throw new ScanError(500, 'Server Groq key is wrong');
    if (res.status === 429 && /per day|\(TPD\)|\(RPD\)/i.test(reason)) throw new ScanError(429, 'Daily free AI limit used up');
    if (res.status === 429) throw new ScanError(429, 'Too many scans right now (free-tier limit), try again in a minute');
    if (res.status === 503 || res.status === 500) throw new ScanError(503, 'The AI is busy right now, please try again in a minute');
    throw new ScanError(502, `Groq error ${res.status}${reason ? `: ${reason.slice(0, 120)}` : ''}`);
  }

  const text: string = body?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new ScanError(502, 'The AI gave no answer');
  return { raw: jsonFrom(text), model: `groq/${body.model ?? model}` };
}
