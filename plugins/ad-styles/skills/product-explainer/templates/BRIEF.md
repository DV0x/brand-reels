# Brief: "<working title>" (<Brand>, <Product>)

Saved after the script approval (SKILL.md, step 3). It holds the results of the research, the questions and the
approved script. From here the agent works alone until delivery: fill every other gap with your own decision, and
write it in `TREATMENT.md`. A new chat that changes this film reads this file first.

## The film
- **Style:** <name> (`styles/<folder>`).
- **Topic:** <the viewer's habit or belief → the hidden fact → the product as the answer, in two sentences>.
- **Brand:** <who they are, in one line>. <"The user is the brand." or "A spec concept film: the user is not the
  brand; the post must say so.">
- **Viewer:** <who scrolls past, and the belief or habit the hook breaks>.
- **Format:** 1080 × 1920, 30 to 35 s, placement `<organic | ad>`.
- **Language:** <language>. Captions with digits.
- **See the look first:** <yes: stop after the style frames | no: don't stop>.
- **Benchmark for the hooks:** <entry numbers in benchmarks.md, and the one thing learned from each>.

## The script (approved and locked)
The words are fixed. Everything else is directing: staging, shots, timing, labels, sound. You may mark caption
keywords with `*asterisks*` and place lines on the grid (`at`, `anchor`); both keep the recorded takes.

| # | Time map part | Spoken | On screen (caption, or STATEMENT) |
|---|---|---|---|
| 1 | hook | | |
| 2 | hook | | |
| 3 | hook (turn) | | |
| 4 | the fact | | |
| 5 | the product | | |
| 6 | the tip | | |

**The story shape:** <PAS | BAB | FAB>. **Word count:** <about 70>. **Estimated length:** <s>.

## Facts you may show (only these)
| Claim, exactly as it may appear | Source (page and date) |
|---|---|
| | |

Short labels on drawings come only from this table. An illustration is labelled as one ("a typical brand").

**Never say or show:** <claims the brand doesn't make, medical or results claims, competitor names or packs, words
from the brand's never-say list>.

## Brand voice
- Three words for how they sound, and one they never do: <...>.
- Lines in their own words: <two or three, from research.md>.
- Fonts and colours from the brand: <or "none: the style decides">.

## Material
- **Voice:** <Cartesia voice name and id>. All lines voiced in `vo/`; `voice.mjs <film> --words` prints every word's
  time. New words need the API key at <where it is>.
- **Product photo:** `product/main.png` (<w × h>, cut from <source>, <date if known>). The cut-out report's `closeUps`
  line: <how big it can be drawn>. Label details the film points at, with their pixels in `main.png`: <detail: x, y>.
  Other views: <back.png, or none>.
- **Fonts, music, logos:** <supplied, or "none: by the STYLE.md">. Logos appear only as printed on the pack.

## What you decide alone
Staging, structure, shots, camera, timing on the beat, the score, the sounds, the labels (from the facts table), the
caption design within the style, and every review round. Write each decision in `TREATMENT.md` or `REVIEW.md`.

## This machine
- Memory: <GB>. Free disk at the start: <GB>. Render the video with `--workers <n>` (1 on 8 GB). Keep at least 1.5 GB
  free; check with `df -h ~` before each video render.
