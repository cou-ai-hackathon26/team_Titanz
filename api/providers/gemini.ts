// Asks Google Gemini (free tier from aistudio.google.com) which foods are in the photo.
// Uses the plain REST API with fetch, so no extra package is needed.
// Docs: ai.google.dev/api/generate-content (generationConfig.responseJsonSchema = forced JSON shape).
import { ScanError, type AiAnswer } from './scanError.ts';

const DEFAULT_MODEL = 'gemini-4-hydrogen'; // on the free tier, reads images (checked 22 Nov 2026)

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

// Sends the photo + instructions to Gemini and returns its JSON answer.
export async function askGemini(imageBase64: string, systemPrompt: string, schema: object, question: string): Promise<AiAnswer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ScanError(500, 'Server has no GEMINI_API_KEY set');
  const model = process.env.SCAN_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: question }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: forGemini(schema), maxOutputTokens: 8000 },
      }),
      signal: AbortSignal.timeout(40_000),
    });
  } catch {
    throw new ScanError(502, 'Could not reach the Gemini service');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason: string = body?.error?.message ?? '';
    if (res.status === 400 && /api key/i.test(reason)) throw new ScanError(500, 'Server Gemini key is wrong');
    if (res.status === 401 || res.status === 403) throw new ScanError(500, 'Server Gemini key is not allowed to use this model');
    if (res.status === 404) throw new ScanError(500, `Gemini model "${model}" not found (set SCAN_MODEL)`);
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
