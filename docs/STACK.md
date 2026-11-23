# Stack & architecture

## Stack
| Layer | Tool | Notes |
|---|---|---|
| App | React Native + **Expo** (TypeScript), **Expo Router** | Run with Expo Go during dev |
| Photos | `expo-camera` (live camera, screen 05), `expo-image-picker` (gallery), `expo-image-manipulator` (resize) | Added 22 Nov (approved). Photos are shrunk to 1024px wide, JPEG 0.7 (`lib/photo.ts`) |
| Chart | `react-native-svg` | Hand-drawn path for the curve + safe-zone band (simpler than a chart lib) |
| Storage | `@react-native-async-storage/async-storage` | Risk result, logs, history. No login, no DB |
| Notifications | `expo-notifications` (local only, added 23 Nov, approved) | `lib/reminders.ts`: 14 days of reminders scheduled on the phone, refreshed on app open |
| Speech | `expo-speech` | NICE feature N5 (not built) |
| Fonts | `@expo-google-fonts/hind-siliguri`, `@expo-google-fonts/inter` | Import each weight from its own subpath (e.g. `/400Regular`) so only used files ship |
| Bangla digits | Noto Sans Bengali, **digits ০–৯ only** (`assets/fonts/BanglaDigits_*.ttf`, ~3 KB each) | Hind Siliguri's "১" is unreadable. Always use `components/Txt` instead of `Text`; number inputs use `digitsOnly` |
| Icons | Material Symbols Rounded, **subset font** in `assets/fonts/` (from Google Fonts, 34 icons, 12 KB) | Add icons: regenerate the subset + add the code in `components/Icon.tsx` |
| Images | `expo-image` (added 22 Nov, approved) | Shows Figma PNG and SVG files (Metro `assetExts` includes `svg`) |
| Web preview | `react-dom`, `react-native-web`, `@expo/metro-runtime` (added 22 Nov, approved) | Dev only: lets Claude preview screens in a browser. Real testing = Expo Go / APK |
| API | One **Vercel** function `api/api/scan.ts` (its own project in `api/`, own package.json) | Holds the AI key. Local test without Vercel: `cd api && npm run dev` |
| Vision AI | **Gemini** `gemini-4-hydrogen` (free tier, REST + JSON schema, up to 5 keys) → **Groq** `qwen/qwen3.8-27b` (free, JSON mode) → **Claude** `claude-opus-5-5` (if `ANTHROPIC_API_KEY`) | Order is automatic on quota/busy errors. `SCAN_PROVIDER=claude` or `=groq` forces one. Live: https://roza-safe-api.vercel.app/api/scan |
| Build | **EAS Build** → APK (`preview` profile in `eas.json`, Expo team `titanz`) | Scan URL is built in (`lib/scanApi.ts`); APK in GitHub Releases |
| Motion | React Native's built-in `Animated` (no extra package) | `lib/motion.ts` springs + reduce-motion; `PressScale`, `FadeIn`, `SlideIn`, `Sheet` components |
| Navigation | Expo Router stack + `app/(tabs)` tab group | Home / Forecast / History share one fixed `BottomNav`; back goes to Home, double back exits |
| Coding help | Claude Code, Claude Pro, Cursor | List all in README |

## Folder layout
```
roza-safe/
  CLAUDE.md  README.md  eas.json  app.json
  docs/                 RULES, PRODUCT, STACK, LOGIC, PLAN, PROGRESS
  app/                  Expo Router screens
    index.tsx           welcome (00a)        guide/[step].tsx  guides 1–3
    about-you.tsx       00g (also ?edit=1)   iftar.tsx         00h: district, family number, reminders
    risk-quiz.tsx       M2                   risk-result.tsx   M3
    scan.tsx            camera / gallery / add by hand          scan-result.tsx  M4 plate (sehri/iftar)
    (tabs)/             fixed tab bar: home.tsx (N1), forecast.tsx (M5), history.tsx (N4)
    plan/[date].tsx     history detail       check.tsx, emergency.tsx  M6
    settings.tsx        profile, family number, scan server, backup, delete
  components/           Button, Txt, Icon, BottomNav, Sheet, PickerSheet, ReadingSheet, RiskGauge,
                        ForecastChart, CarbScale, Stepper, PressScale, FadeIn, SlideIn, ...
  lib/
    foods.ts  meal.ts  forecast.ts  dar.ts  hypo.ts     food table + all the maths (tested)
    scanApi.ts  scanStore.ts  photo.ts                  scan flow
    storage.ts  backup.ts  reminders.ts  places.ts       phone storage, backup text, notifications, sun times
    time.ts  phone.ts  bangla.ts  nav.ts  motion.ts      helpers
  theme/tokens.ts       colors, radius, fonts
  api/                  Vercel project: api/scan.ts + providers/ (gemini, groq, claude)
  dev/tests/            41 unit tests (npm test)
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
- Gemini: `generationConfig.responseJsonSchema` forces the JSON shape. Claude: `output_config.format`, no `temperature` (current Claude models reject it), `effort: "low"`.
- The API cleans the answer (`cleanAnswer`): unknown ids dropped, counts rounded to 1–10, duplicates merged.
- Claude only: if a safety check declines a photo, the API retries on a fallback model (`fallbacks: "default"`).
- Food list for the AI is generated from `lib/foods.ts`: run `cd api && npm run sync-foods` after changing foods (a test fails if you forget).

## Env vars
- API (Vercel env vars, or `api/.env.local` for local tests): `GEMINI_API_KEY`; optional `SCAN_MODEL`, `SCAN_PROVIDER=claude` + `ANTHROPIC_API_KEY`. See `api/.env.example`.
- Free key ran out? Add backup keys `GEMINI_API_KEY_2` … `GEMINI_API_KEY_5` (other Google accounts). The server tries them in turn on 429/bad key, then Claude if `ANTHROPIC_API_KEY` is set. Keys never go in the app: the app's Settings only stores the scan server address (with a Test button).
- App (`.env.local` in the root): `EXPO_PUBLIC_SCAN_URL` = the API address. See `.env.example`.
- Both `.env.local` files are git-ignored. Never commit a key.

## Try a real scan (needs your Gemini key — free)
1. aistudio.google.com → "Get API key" → copy it.
2. Copy `api/.env.example` to `api/.env.local` and paste the key there.
3. `cd api && npm run dev` (API on port 3001).
4. Root `.env.local`: `EXPO_PUBLIC_SCAN_URL=http://<laptop Wi-Fi IP>:3001/api/scan` (phone and laptop on the same Wi-Fi), then restart `npx expo start`.
5. Live server (deployed 22 Nov): **https://roza-safe-api.vercel.app/api/scan** — Vercel project `roza-safe-api`. The app uses it by default (`lib/scanApi.ts` → `DEFAULT_SCAN_URL`); a local `EXPO_PUBLIC_SCAN_URL` or the Settings box overrides it.
   - Open the address in a browser: `aiKeySet: true` means the key is in Vercel.
   - Redeploy after code or key changes: `cd api && npx vercel deploy --prod`.
   - Add a key: `cd api && npx vercel env add GEMINI_API_KEY_2 production` (choose Secret, paste the key), then redeploy.
   - Free backup: Groq (console.groq.com, no card) → add `GROQ_API_KEY` the same way. Order: Gemini keys → Groq → Claude (if `ANTHROPIC_API_KEY`). Gemini free tier is only 20 scans/day per Google project; Groq free ≈ 1,000 requests/day but 8K tokens/min (~3 scans/min).

## Setup checklist
1. Node LTS, `npm i -g eas-cli vercel`
2. `npx create-expo-app roza-safe -t` (tabs or blank TypeScript)
3. Expo Go on an Android phone
4. Accounts: GitHub (public repo), Vercel, Expo (for EAS), AI provider with credits
5. `eas build:configure` → set `preview` profile to `"buildType": "apk"`
