# Voice script (record in ElevenLabs)

One file per line, named as below, placed in `public/vo/`. ⭐ = core lines. Leftover silence is fine (it gets trimmed).
Then set `VOICE_ON = true` in `src/Main.tsx`, add the start frames for any optional lines, and render.

| # | File | Starts at | Max length | Line |
|---|---|---|---|---|
| 1 ⭐ | hook1 | 0:00 | 2.3s | ডায়াবেটিস নিয়ে রোজা রাখবেন? |
| 2 ⭐ | hook2 | 0:02.7 | 2.2s | প্রায় সবাই রাখতে চান… |
| 3 ⭐ | hook3 | 0:05.2 | 2.3s | কিন্তু নিরাপদ, অর্ধেকেরও কম। |
| 4 ⭐ | hook4 | 0:07.7 | 1.9s | আর বিপদ লুকিয়ে থাকে ইফতারের প্লেটেই। |
| 5 | logo | 0:09.7 | 2.5s | রোজা-সেফ। ইফতারের আগেই সুগার জানুন। |
| 6 | risk | 0:16.6 | 3.5s | প্রথমে জেনে নিন, আপনার রোজার ঝুঁকি কতটা। |
| 7 | scan | 0:23.7 | 4.5s | ইফতারের প্লেটের একটা ছবি তুলুন। এ-আই নিজেই খুঁজে নেবে, কোন খাবার কতটা। |
| 8 ⭐ | fc1 | 0:34.0 | 3.8s | খাওয়ার আগেই দেখুন, সুগার কোথায় উঠবে। |
| 9 ⭐ | fc2 | 0:37.8 | 1.8s | একটা জিলাপি কম… |
| 10 ⭐ | fc3 | 0:39.7 | 1.8s | পনেরো মিনিট হাঁটা… |
| 11 ⭐ | fc4 | 0:41.5 | 2.8s | ব্যস! সুগার ফিরে এল নিরাপদ সীমায়। |
| 12 | check | 0:44.7 | 4.5s | ইফতারের আগে মাথা ঘোরা বা ঘাম? অ্যাপ সাথে সাথে বলে দেবে কী করবেন। |
| 13 | result | 0:52.8 | 4.0s | ঝুঁকি যাচাই, প্লেট স্ক্যান, সুগারের পূর্বাভাস… সব এক অ্যাপে। |
| 14 ⭐ | cta1 | 1:00.5 | 1.8s | রোজা রাখুন নিরাপদে। |
| 15 ⭐ | cta2 | 1:02.4 | 1.5s | রোজা-সেফ। |

Tone: calm, caring (1–4); building up with a small smile on "ব্যস!" (8–11); warm and slow (14–15).
ElevenLabs: a model that supports Bengali (e.g. Eleven v3), Stability ~50%, Similarity ~75%, Style 0–20%.
