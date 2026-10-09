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
keywords with `*asterisks*` and land a line on the grid with a longer pause (`at`, `anchor`): neither records the
voice again. The "how it's said" marks (pause, speed) were approved with the words: change one only to fix a delivery
problem you can show (a word cut short, a rushed fact), and write it in `REVIEW.md`.

| # | Time map part | Spoken | How it's said | On screen (caption, or STATEMENT) |
|---|---|---|---|---|
| 1 | hook | | | |
| 2 | hook | | | |
| 3 | hook (turn) | | a pause before | |
| 4 | the fact | | slower | |
| 5 | the product | | | |
| 6 | the tip | | | |

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

## Brand look (from the design card in BRAND.md)
The style gives the techniques; the brand gives the colours, the fonts and the end card.
- **Fonts:** <headline family and weight; caption family and weight; "stand-in for <their font>" if theirs is not free>.
- **Colours, with jobs:** <ground, text, accent (what it marks)>.
- **Logo:** <`images/logo.png` from `<brand>/logo.png` | "only as printed on the pack">.
- **Do / don't:** <the card's three of each, in short>.

## Material
- **Voice:** <Cartesia voice name and id>, the user's pick from <2 or 3> audition takes. The whole script is in one
  take in `vo/`; `voice.mjs <film> --words` prints every word's time. A new take needs the API key at <where it is>.
- **Product photo:** `product/main.png` (<w × h>, cut from <source>, <date if known>). The cut-out report's `closeUps`
  line: <how big it can be drawn>. Label details the film points at, with their pixels in `main.png`: <detail: x, y>.
  Other views: <back.png, or none>.
- **Fonts, music, logos:** <supplied by the brand, or from the design card>. A logo is the brand's own file, used as
  it is (never redrawn or recoloured), or only as printed on the pack.

## What you decide alone
Staging, structure, shots, camera, timing on the beat, the score, the sounds, the labels (from the facts table), the
caption design within the style, and every review round. Write each decision in `TREATMENT.md` or `REVIEW.md`.

## This machine
- Memory: <GB>. Free disk at the start: <GB>. Render the video with `--workers <n>` (1 on 8 GB). Keep at least 1.5 GB
  free; check with `df -h ~` before each video render.
