# Roza-Safe — illustration prompts (onboarding)

For: Welcome (00a) + Guide 1–3 (00b–00d) on the Figma page "My choice".
Tool: Midjourney / ChatGPT (GPT image) / Gemini. Generate all 4 in the same chat or with the same style reference so they match.

## Shared style (paste at the start of every prompt)

> Flat vector illustration, modern mobile-app onboarding style, layered silhouettes with soft gradients and gentle depth, clean shapes, no outlines, subtle grain. Calm, spiritual Islamic Ramadan mood in soft even daylight — no sunset, no sunrise, no night sky, no sun or moon disc in the sky. Colour palette strictly: deep green #0B4A33, forest green #205C42, mid green #258267, soft sage #92CE9B, lime highlight #E2F28F, pale lime #F4FBD1, warm cream #F7F7F4, small accents of warm amber #E3A33A. Delicate Islamic geometric patterns (8-point stars, arabesque lattice) used lightly as texture. Hanging Ramadan lanterns (fanous) as small accents. No text, no letters, no logos, no watermark, no people's faces.

## 1 · Welcome (00a) — full screen, portrait 9:19.5 (1170 × 2532)

> [shared style] A grand flat-vector scene of the Sixty Dome Mosque (Shat Gombuj Masjid, Bagerhat, Bangladesh): long low red-brick facade rendered in brand greens, rows of small rounded domes, corner towers with small domes, arched doorways glowing softly lime. Layered depth: a pale lime sky with faint geometric star pattern at the top, the mosque in the middle third, palm and betel-nut tree silhouettes on both sides, a calm pond in front reflecting the domes. Three small lanterns hang from the top edge. The bottom 40% of the image fades smoothly into solid deep green #0B4A33 with no details, leaving empty space for a headline and two buttons. Centered composition, lots of breathing room.

Midjourney add: `--ar 9:19.5 --style raw --v 6.1`
Negative / avoid: sunset, sunrise, night, stars in a dark sky, sun, moon disc, people, text, cluttered, photorealistic, 3D render, neon.

## 2 · Guide 1 — "রোজার আগে ঝুঁকি জেনে নিন" (risk check) — square 1:1 (1200 × 1200)

> [shared style] A large soft pale-lime circle (#F4FBD1) in the centre of a plain cream #F7F7F4 background. Inside the circle: the white Star Mosque (Tara Masjid, Dhaka) rendered in flat greens, its domes decorated with small lime and sage star motifs. In the foreground, slightly overlapping the circle's lower edge: a friendly flat illustration of a simple clipboard with three check marks and a small blood-glucose meter beside it, in white and deep green, with a soft shadow. Two small lanterns hang on the left. Small 4-point sparkles in lime and amber around the circle. Everything centered, lots of empty space around the circle.

Midjourney add: `--ar 1:1 --style raw --v 6.1`

## 3 · Guide 2 — "প্লেটের ছবি তুললেই শর্করার হিসাব" (plate scan) — square 1:1

> [shared style] A large soft sage-green circle (#E3F2E6) on a plain cream #F7F7F4 background. Behind, inside the circle: a tall pointed Mughal-style arched window with a lattice (jali) of Islamic geometric stars, in forest green. In front of the arch: a round iftar plate seen from slightly above with dates, chickpeas (chola), a few orange jalebi spirals and a small glass of water, flat and appetising. Four rounded scan-frame corner brackets in deep green around the plate, and one glowing lime horizontal scan line across it. Small 4-point sparkles in lime and amber. Centered, generous empty space.

Midjourney add: `--ar 1:1 --style raw --v 6.1`

## 4 · Guide 3 — "খাওয়ার আগেই সুগারের ধারণা" (sugar forecast) — square 1:1

Idea: "change one food, your sugar stays balanced" — shown as a balance scale (mizan), not as a chart (AI tools draw charts badly).

> [shared style] A large soft pale-amber circle (#FBEFD6) on a plain cream #F7F7F4 background. Behind, inside the circle: a tall pointed mosque arch in forest green with a faint geometric star lattice, framing the scene. In the centre, in front of the arch: an elegant brass-and-green balance scale (mizan), perfectly level and calm. On the left pan: a small bowl of chickpeas (chola) and a cucumber slice. On the right pan: one single orange jalebi spiral and two dates. A soft lime glow under the level beam shows balance. A brass Ramadan lantern hangs on the upper right. A few small 4-point sparkles in lime and amber. Simple, iconic, centered, lots of empty space, nothing else in the scene.

Midjourney add: `--ar 1:1 --style raw --v 6.1`
Negative / avoid: charts, graphs, lines, numbers, text, tilted or broken scale, many objects, people, sunset, night.

**Backup idea (if the scale doesn't work):**
> [shared style] A large soft pale-amber circle on cream. Inside: a calm iftar table seen from the front — one plate with dates and chola in the middle, a glass of water, and a small jalebi pushed aside onto a separate saucer. Behind the table, a mosque arch window with a geometric lattice in forest green and a hanging brass lantern. Simple, iconic, centered, empty space.

## Tips for consistency
- Generate the Welcome first, then use it as a style reference for the three guides (Midjourney `--sref <url>`; in ChatGPT/Gemini say "same style as the previous image").
- If a famous-mosque detail looks wrong, add "simplified, iconic silhouette, not architecturally exact".
- Ask for "PNG with transparent background outside the circle" for the guides if the tool supports it; otherwise keep the cream background — it matches `bg/app`.

## Where they go in Figma
| Image | Frame | Placement |
|---|---|---|
| Welcome | 00a · Welcome | Replace "Photo", full-bleed 390×844; text and buttons sit on the green bottom part |
| Guide 1–3 | 00b–00d | Replace the tint circle + mini illustration inside "Illustration" (390×390) |
