// Asks Anthropic Claude which foods are in the photo (needs an Anthropic API key with credit).
// Kept so the team can compare Claude and Gemini on the same test photos (set SCAN_PROVIDER=claude).
import Anthropic from '@anthropic-ai/sdk';
import { ScanError, type AiAnswer } from './scanError.ts';

const DEFAULT_MODEL = 'claude-opus-5-5';

// Sends the photo + instructions to Claude and returns its JSON answer.
export async function askClaude(imageBase64: string, systemPrompt: string, schema: object, question: string): Promise<AiAnswer> {
  if (!process.env.ANTHROPIC_API_KEY) throw new ScanError(500, 'Server has no ANTHROPIC_API_KEY set');
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  try {
    const response = await client.beta.messages.create({
      model: process.env.SCAN_MODEL || DEFAULT_MODEL,
      max_tokens: 8000,
      // If a safety check declines the request, the API retries on a fallback model automatically.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: schema as Record<string, unknown> } },
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: question },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') throw new ScanError(422, 'The AI could not read this photo');
    if (response.stop_reason === 'max_tokens') throw new ScanError(502, 'The AI answer was cut off');
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new ScanError(502, 'The AI gave no answer');
    return { raw: JSON.parse(text.text), model: response.model };
  } catch (error) {
    if (error instanceof ScanError) throw error;
    if (error instanceof Anthropic.AuthenticationError) throw new ScanError(500, 'Server Anthropic key is wrong');
    if (error instanceof Anthropic.RateLimitError) throw new ScanError(429, 'Too many scans right now, try again in a minute');
    if (error instanceof Anthropic.BadRequestError) throw new ScanError(502, `AI request rejected: ${error.message}`);
    if (error instanceof Anthropic.APIError) throw new ScanError(502, `AI service error ${error.status}`);
    if (error instanceof SyntaxError) throw new ScanError(502, 'The AI answer was not valid JSON');
    throw new ScanError(502, 'Could not reach the AI service');
  }
}
