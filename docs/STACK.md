# Stack & architecture

## Stack
| Layer | Tool | Notes |
|---|---|---|
| App | React Native + **Expo** (TypeScript), **Expo Router** | Run with Expo Go during dev |
| Photos | `expo-image-picker` | Camera + gallery. Resize to ~1024px, JPEG quality 0.7 before upload |
| Chart | `react-native-svg` | Hand-drawn path for the curve + safe-zone band (simpler than a chart lib) |
| Storage | `@react-native-async-storage/async-storage` | Risk result, logs, history. No login, no DB |
| Notifications | `expo-notifications` (local only) | NICE feature N2 |
| Speech | `expo-speech` | NICE feature N5 |
| Fonts | `@expo-google-fonts/hind-siliguri`, `@expo-google-fonts/inter` | Import each weight from its own subpath (e.g. `/400Regular`) so only used files ship |
| Icons | Material Symbols Rounded, **subset font** in `assets/fonts/` (from Google Fonts, 34 icons, 12 KB) | Add icons: regenerate the subset + add the code in `components/Icon.tsx` |
| Images | `expo-image` (added 22 Nov, approved) | Shows Figma PNG and SVG files (Metro `assetExts` includes `svg`) |
| Web preview | `react-dom`, `react-native-web`, `@expo/metro-runtime` (added 22 Nov, approved) | Dev only: lets Claude preview screens in a browser. Real testing = Expo Go / APK |
| API | One **Vercel** serverless function `api/scan.ts` (Node) | Holds the AI key |
| Vision AI | **Gemini** (vision, JSON mode) or **Claude** (vision) | Test both on our photos, keep the best. Record the result for judges |
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
- Return JSON only, matching the schema. No prose.
- Pick ids only from the provided list.
- Never give medical or dose advice (the app does all explaining).
- Keep `temperature` low (0–0.2) for stable results.

## Env vars (Vercel only)
`GEMINI_API_KEY` and/or `ANTHROPIC_API_KEY`, `SCAN_MODEL` (which one to use).
The app only knows the API URL: `EXPO_PUBLIC_SCAN_URL`.

## Setup checklist
1. Node LTS, `npm i -g eas-cli vercel`
2. `npx create-expo-app roza-safe -t` (tabs or blank TypeScript)
3. Expo Go on an Android phone
4. Accounts: GitHub (public repo), Vercel, Expo (for EAS), AI provider with credits
5. `eas build:configure` → set `preview` profile to `"buildType": "apk"`
