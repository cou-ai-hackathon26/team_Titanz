// Sends the plate photo to our scan API (api/api/scan.ts) and returns the foods it found.
// The app never holds the AI key: it only knows the API address (Settings, or EXPO_PUBLIC_SCAN_URL).
import { loadSettings } from './storage';

export type ScanResult = {
  items: { id: string; count: number; confidence: number }[];
  unknown: string[];
  model: string;
};

export const LOW_CONFIDENCE = 0.6; // below this, the app asks the user to check the food
const TIMEOUT_MS = 90_000; // the server may retry a busy AI and then try backup keys (see api/providers/gemini.ts)

// The scan server address: the one saved in Settings, otherwise the one built into the app.
export async function scanUrl(): Promise<string> {
  const saved = (await loadSettings()).scanUrl.trim();
  return saved || process.env.EXPO_PUBLIC_SCAN_URL || '';
}

// Checks that a scan server answers (sends an empty request: a working server replies "Missing photo").
export async function testScanServer(url: string): Promise<'ok' | 'no-answer' | 'not-scan-server'> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json().catch(() => ({}));
    return res.status === 400 && body?.error === 'Missing photo' ? 'ok' : 'not-scan-server';
  } catch {
    return 'no-answer';
  }
}

// Calls the scan API. Throws an Error with a Bangla message the screen can show.
export async function scanPlate(base64Jpeg: string): Promise<ScanResult> {
  const url = await scanUrl();
  if (!url) throw new Error('স্ক্যান সার্ভার সেট করা নেই। খাবারগুলো নিজে যোগ করুন।');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Jpeg }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 503 || res.status === 429) throw new Error('AI এখন ব্যস্ত। এক মিনিট পর আবার ছবি তুলুন, অথবা খাবারগুলো নিজে যোগ করুন।');
    if (!res.ok) throw new Error(`ছবি পড়া যায়নি (${res.status})। খাবারগুলো নিজে যোগ করুন।`);
    if (!Array.isArray(body.items) || !Array.isArray(body.unknown)) throw new Error('সার্ভারের উত্তর বোঝা যায়নি।');
    return body as ScanResult;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('অনেক সময় লাগছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।');
    if (error instanceof TypeError) throw new Error('ইন্টারনেট সংযোগ নেই। খাবারগুলো নিজে যোগ করুন।');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
