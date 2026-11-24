# Handoff — where we are (24 Nov 2026, final day, ~11:30)

Read `CLAUDE.md` / `AGENTS.md`, then `docs/RULES.md`, then this file. `docs/PROGRESS.md` has the full log.

## State in one look
- Last commit on GitHub: `ed52c00` (main) — everything below is committed and pushed. Public repo: github.com/nadim-titanz/roza-safe
- GitHub Release **v1.0** = the 23 Nov APK (older). Newer APKs are on Expo (team `titanz`, project `roza-safe`).
- Scan server live: https://roza-safe-api.vercel.app/api/scan (Vercel project `roza-safe-api`, code in `api/`). Up to date with `main`.
- Tests: `npm test` → **46 pass**. Type check: `npx tsc --noEmit` clean.
- APK on Nadim's phone now: EAS build `dc9a8ec0` (has add-it-yourself + reminder fix, **not** food sizes). Food sizes are only in Expo Go until the next APK.

## Latest work (committed in `a24f590` + `edfd39b`; tested in the web preview, 46 tests pass)
1. **Add it yourself** — food the AI can't recognise (or not in our list): plate screen → "নিজে যোগ করুন" → name + grams of carbohydrate per serving. Counted as GI 70 (safe side). Saved on the phone so History still shows it.
   - `lib/customFood.ts` (new), `dev/tests/customFood.test.mts` (new), `lib/storage.ts` (loadCustomFoods / saveCustomFood; deleteAllData clears them), `app/_layout.tsx` (loads them before showing the app), `app/scan-result.tsx` (sheet + "+ তালিকায় নেই? নিজে লিখুন" as first option of the food list), `lib/foods.ts` (`serving` unit).
2. **Reminders never crash** — `lib/reminders.ts`: skipped inside Expo Go (it can't create the Android channel); errors are caught and logged, never shown.
3. **Food size** — each food on the plate has a pill "✎ ১ বাটি = ৩০ g" → sheet with ছোট (½) / নিয়মিত / বড় (1½) or exact g/ml. Count × size scales carbs, GL, fibre+protein.
   - `lib/meal.ts` (`size` on MealItem, `sizeScale`, `itemSize`, `itemCarbs`, `sizeChoices`), `dev/tests/meal.test.mts`, `app/scan-result.tsx`, `lib/storage.ts` (MealPlan items keep `size`), `app/(tabs)/forecast.tsx` (saves size), `app/plan/[date].tsx` (shows size, carbs per food).
- **Do not commit `demo-video/`** (another session's work in progress, has node_modules).

## Next steps (in order)
1. Nadim tests food size + add-it-yourself on the phone (Expo Go over USB, see below).
2. Keep committing small changes (hackathon rule: at least once an hour today).
3. Final APK: `npx eas-cli build -p android --profile preview --non-interactive --no-wait` (~15–20 min on the free plan). Install fast over USB: download the `.apk` from the build page, then `~/Library/Android/sdk/platform-tools/adb install -r file.apk`.
4. New GitHub Release with that APK — automatic: `bash dev/release-apk.sh <eas-build-id> v1.2` (waits for the build, downloads, publishes). Manual way: `gh release create v1.1 roza-safe-v1.1.apk --title "Roza-Safe v1.1" --notes "..."`, then check README links (`/releases/latest`).
5. README: add the demo video link when ready.

## How to run / test
- Web preview: `npx expo start --web` (port 8081). Phone: Expo Go.
- Phone over USB (venue Wi-Fi blocks phone↔Mac): dev server `npx expo start --port 8082`, then
  `adb reverse tcp:8082 tcp:8082` and `adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8082`.
  Nadim's phone shows in `adb devices` as `0015935AF001697`. Reminders do not work in Expo Go (APK only).
- No Java on this Mac → no local Android builds; use EAS.
- Deploy the scan server after changing `api/`: `cd api && npx vercel deploy --prod --yes`. If `lib/foods.ts` FOODS changes: `cd api && npm run sync-foods` first (a test checks it).

## Things that bit us (don't undo)
- Android cut the last Bangla letter/word → `components/Txt.tsx` adds a trailing space on Android. Keep it.
- Gemini `gemini-4-hydrogen` thinks "high" by default → scans took 90 s. `api/providers/gemini.ts` sends `thinkingConfig.thinkingLevel: 'low'` → 6–16 s. Keep it.
- Gemini free tier = 20 requests/day per Google project. Backups: `GEMINI_API_KEY_2…5`, then Groq (`GROQ_API_KEY`, ~1 scan/min: 1,000 output tokens/min), then Claude (if `ANTHROPIC_API_KEY`). Groq is not yet proven on a real photo.
- `expo-image-picker` `cameraPermission: false` removed the CAMERA permission → keep it out of `app.json`.
- Hackathon challenges (both done, committed): (1) household plate comparison `app/compare.tsx`; (2) unrecognised food → forecast marked "অসম্পূর্ণ", "≥" numbers, never "safe" (`lib/plateCheck.ts`).
- Safety rules: no dose advice anywhere; predictions are estimates/ranges; keys only in Vercel.
