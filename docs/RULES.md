# Rules

Two kinds of rules: the hackathon's (break them and we lose points or get disqualified) and our own safety rules (break them and the app could hurt someone).

## 1. Hackathon rules (CoU AI Hackathon 2026)

### Timing
- No project code before **21 Nov 2026**. The GitHub repo must be **created on or after 21 Nov**.
- Pay the Tk 1,350 team fee by **23 Nov, 11:59 PM**, only to the number in the official email. Organisers never ask for PIN/OTP/password.
- Final: **24 Nov, 5 continuous hours on-site** at Comilla University. 30+ minutes late can mean no entry. Stay the full 5 hours.

### Repo
- Repo must be **public**.
- On final day, commit **at least once every hour**.
- **No force-push.** No rewriting history.
- `README.md` must list **every AI tool, model and API** used (coding assistants too: Claude, Claude Code, Cursor, Gemini, etc.). An undisclosed tool = point deductions or a warning.

### AI
- Coding assistants are allowed (ChatGPT, Claude, Gemini, Copilot, Cursor and similar).
- **Real AI only.** Hard-coded, pre-recorded or human-faked AI output = **disqualification**.
- AI must be central to the solution, not an add-on.
- A bare prompt-forwarding wrapper scores low. Our own logic (food table, forecast, risk score) is what makes this more than a wrapper.
- Judges score what we **designed and can explain**, not how much code was generated. Every teammate must be able to explain the whole flow.
- Bring our own API keys and credits.

### Delivery
- Public live deployment **or** a demo video of 3 minutes or less. For us: APK in GitHub Releases **plus** a demo video.

### Bring on final day
Laptops, chargers, extension cord, backup mobile data (venue internet is best-effort; a network failure is not grounds for extra time), original student IDs.

### Other
- Disqualification also for: outside help, pre-written code, plagiarism, false info.
- Organisers' interpretation is final; rules can change by email or on the website. Check email daily.

## 2. Our safety rules (non-negotiable)
- **No medicine or insulin dose advice.** Never tell a user to change, skip or adjust a dose. Only "talk to your doctor".
- **High risk → doctor first.** If the IDF-DAR result is High, the app says fasting may not be safe and to see a doctor before fasting.
- **Hypo symptoms → act now.** If the user reports low-sugar symptoms, tell them to check sugar now and break the fast if it is low (below 3.9 mmol/L / 70 mg/dL), following standard guidance. Always show this, never hide it behind a paywall or extra taps.
- **Predictions are estimates.** Show ranges or clearly label as "estimate". Never a fake exact value presented as a measurement.
- **Low confidence → ask the user.** If the AI is unsure about a food, ask the user to confirm or pick it manually.
- **Footer on result screens:** "স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় (Screening support only, not a doctor)".
- **No personal data leaves the phone** except the meal photo sent to our scan API. No login, no analytics, no storing photos on the server.

## 3. Code rules
- Keys only in Vercel env vars (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY`). `.env*` is in `.gitignore`.
- Mock/fixture data goes in `dev/fixtures/` and is never used in the demo build.
- Small commits with clear messages, e.g. `feat: forecast curve chart`.
