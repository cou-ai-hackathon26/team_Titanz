# Roza-Safe — Claude Code instructions

Read this first, every session. Then read the file in `docs/` that matches the task.

## What this is
Roza-Safe is an Android app (APK) for people with type 2 diabetes in Bangladesh who fast in Ramadan.
It is our entry for the CoU AI Hackathon 2026 (Team Titanz). Final: 24 Nov 2026, 5 hours on-site.

Core flow: risk check → snap iftar plate → AI finds foods → our math predicts a 2-hour sugar curve → what-if swaps → pre-iftar safety check.

## Docs map
| File | Read it when |
|---|---|
| `docs/RULES.md` | Always. Hackathon rules + safety rules we must never break |
| `docs/PRODUCT.md` | Building any screen or feature |
| `docs/STACK.md` | Setting up, adding packages, building the APK, touching the API |
| `docs/LOGIC.md` | Food table, glycemic load, forecast curve, IDF-DAR risk score |
| `docs/PLAN.md` | Deciding what to work on next |
| `docs/PROGRESS.md` | Start and end of every session (read, then update) |

## How to work with us
- The team are beginners at reading code. Keep code simple, small files, clear names.
- Add a short comment above every function saying what it does in plain English. Judges will ask us to explain the code.
- Build one thing at a time. After each feature: run it, tell us how to test it, then stop.
- Prefer MUST features over NICE ones (see `docs/PRODUCT.md`). Never start a NICE feature while a MUST one is broken.
- Match the Figma designs (page "My choice"; clickable prototype link in docs/PRODUCT.md). Don't invent new layouts or colors; use the tokens in `docs/PRODUCT.md`.
- Bangla is the main UI language, with short English sub-labels on buttons and key headings.
- Ask before adding a new dependency, changing the stack, or deleting files.
- After each finished task, add a line to `docs/PROGRESS.md` and suggest a git commit message.

## Hard rules (short version — full list in docs/RULES.md)
- Real AI only. Never hard-code, fake or pre-record AI output. Mock data is allowed only in clearly named dev fixtures, never in the demo path.
- API keys live only in Vercel env vars. Never put a key in the app, the repo, or a commit.
- No medicine or insulin dose advice anywhere in the app or in AI prompts' output.
- Show sugar predictions as estimates/ranges, with a "screening support, not medical advice" note.
- No force-push. Small commits.

## Commands
```bash
npx expo start            # run on phone with Expo Go
npx eas build -p android --profile preview   # build APK
cd api && vercel dev      # run the scan API locally
```
