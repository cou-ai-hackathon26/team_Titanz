# Stack & architecture

## Stack
| Layer | Tool | Notes |
|---|---|---|
| App | React Native + **Expo** (TypeScript), **Expo Router** | Run with Expo Go during dev |
| Photos | `expo-camera` (live camera, screen 05), `expo-image-picker` (gallery), `expo-image-manipulator` (resize) | Added 22 Nov (approved). Photos are shrunk to 1024px wide, JPEG 0.7 (`lib/photo.ts`) |
| Chart | `react-native-svg` | Hand-drawn path for the curve + safe-zone band (simpler than a chart lib) |
| Storage | `@react-native-async-storage/async-storage` | Risk result, logs, history. No login, no DB |
| Notifications | `expo-notifications` (local only) | NICE feature N2 |
| Speech | `expo-speech` | NICE feature N5 |
| Fonts | `@expo-google-fonts/hind-siliguri`, `@expo-google-fonts/inter` | Import each weight from its own subpath (e.g. `/400Regular`) so only used files ship |
| Bangla digits | Noto Sans Bengali, **digits ০–৯ only** (`assets/fonts/BanglaDigits_*.ttf`, ~3 KB each) | Hind Siliguri's "১" is unreadable. Always use `components/Txt` instead of `Text`; number inputs use `digitsOnly` |
| Icons | Material Symbols Rounded, **subset font** in `assets/fonts/` (from Google Fonts, 34 icons, 12 KB) | Add icons: regenerate the subset + add the code in `components/Icon.tsx` |
| Images | `expo-image` (added 22 Nov, approved) | Shows Figma PNG and SVG files (Metro `assetExts` includes `svg`) |
| Web preview | `react-dom`, `react-native-web`, `@expo/metro-runtime` (added 22 Nov, approved) | Dev only: lets Claude preview screens in a browser. Real testing = Expo Go / APK |
| API | One **Vercel** function `api/api/scan.ts` (its own project in `api/`, own package.json) | Holds the AI key. Local test without Vercel: `cd api && npm run dev` |
| Vision AI | **Claude** `claude-opus-5-5` via Anthropic API (`@anthropic-ai/sdk`), structured JSON output | Chosen 22 Nov. Needs an Anthropic **API** key (console.anthropic.com) — a Claude Pro subscription can't be used by an app. Gemini can be added later behind `SCAN_MODEL` |
| Build | **EAS Build** → APK (`preview` profile) | Upload APK to GitHub Releases |
| Coding help | Claude Code, Claude Pro, Cursor | List all in README |

## Folder layout
```
roza-safe/
  CLAUDE.md  AGENTS.md  README.md
  docs/                 RULES, PRODUCT, STACK, LOGIC, PLAN, PROGRESS
  design/               old Stitch exports (reference only; build from Figma)
  app/                  Expo Router screens
    index.tsx           onboarding (M1)
    risk-quiz.tsx       M2
    risk-result.tsx     M3
    scan.tsx            M4
    forecast.tsx        M5
    check-in.tsx        M6
    home.tsx            N1
  components/           Button, Card, Gauge, CurveChart, FoodRow, Footer
  lib/
    foods.ts            food table (see LOGIC.md)
    dar.ts              IDF-DAR scoring
    forecast.ts         glycemic load + curve + what-if
    api.ts              calls /api/scan
    storage.ts          AsyncStorage helpers
  theme/tokens.ts       colors, radius, fonts
  api/
    scan.ts             Vercel function
  dev/fixtures/         sample JSON for dev only (never in demo path)
```

## Scan API contract
`POST /api/scan`
Request: `{ "image": "<base64 jpeg>" }`
Response:
```json
{
  "items": [
    { "id": "jilapi", "count": 2, "confidence": 0.86 },
    { "id": "chola", "count": 1, "confidence": 0.74 }
  ],
  "unknown": ["green chutney"],
  "model": "gemini-…"
}
```
- `id` must be one of the ids in `lib/foods.ts` (send the id list in the prompt).
- `count` = pieces, or cups/bowls for loose foods (unit defined per food in `foods.ts`).
- `confidence` 0–1. Under 0.6 → the app asks the user to confirm.
- Anything not in our table goes in `unknown` (show it, but no carb estimate).
- On error return `{ "error": "..." }` with a 4xx/5xx; the app shows a manual food picker.

### Prompt rules for the vision model
- JSON only: enforced with `output_config.format` (a JSON schema). `id` is an enum of our food ids, so the AI cannot invent foods.
- Never give medical or dose advice (the app does all explaining).
- No `temperature`: current Claude models reject it. `effort: "low"` keeps it fast and cheap.
- The API cleans the answer (`cleanAnswer`): unknown ids dropped, counts rounded to 1–10, duplicates merged.
- If a safety check declines a photo, the API retries on a fallback model (`fallbacks: "default"`).
- Food list for the AI is generated from `lib/foods.ts`: run `cd api && npm run sync-foods` after changing foods (a test fails if you forget).

## Env vars
- API (Vercel env vars, or `api/.env.local` for local tests): `ANTHROPIC_API_KEY`, optional `SCAN_MODEL`. See `api/.env.example`.
- App (`.env.local` in the root): `EXPO_PUBLIC_SCAN_URL` = the API address. See `.env.example`.
- Both `.env.local` files are git-ignored. Never commit a key.

## Try a real scan (needs your Anthropic API key)
1. console.anthropic.com → add a few dollars of credit → create an API key.
2. Copy `api/.env.example` to `api/.env.local` and paste the key there.
3. `cd api && npm run dev` (API on port 3001).
4. Root `.env.local`: `EXPO_PUBLIC_SCAN_URL=http://<laptop Wi-Fi IP>:3001/api/scan` (phone and laptop on the same Wi-Fi), then restart `npx expo start`.
5. Deploy later: `cd api && npx vercel`, add `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables, and point `EXPO_PUBLIC_SCAN_URL` at `https://<project>.vercel.app/api/scan`.

## Setup checklist
1. Node LTS, `npm i -g eas-cli vercel`
2. `npx create-expo-app roza-safe -t` (tabs or blank TypeScript)
3. Expo Go on an Android phone
4. Accounts: GitHub (public repo), Vercel, Expo (for EAS), AI provider with credits
5. `eas build:configure` → set `preview` profile to `"buildType": "apk"`
