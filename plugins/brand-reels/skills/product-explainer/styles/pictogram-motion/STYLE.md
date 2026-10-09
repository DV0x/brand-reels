# Pictogram Motion

> A beat-locked flash-card film built from three things: a square-grid pattern of circles, half-discs and tiny motif cells
> whose rows slide past each other; geometric pictograms made of round-capped bars and a disc head; and bold type that
> slides up out of masks. Every cut lands on a drum hit. **Its power for a brand:** it turns a list into a rhythm: seven
> uses, five variants, every label, one card each.
>
> References (grammar only, never copy): geometric mid-century sports pictograms; sports-games identity systems (a
> modular pattern and one colour set for everything); sports-broadcast graphics (mono meta text, tick-bar progress). Never
> copy a real event's pictograms, emblem, slogan, pattern artwork or colour names.
>
> Adapted from lemo-opuscar `styles/pictogram-motion/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
> skill's runtime. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

**Status: rules only.** No engine yet: build the primitives in section 10 first (see `references/craft.md`).

## Contents
1. Essence, and what it is not
2. Materials and rendering
3. Colour logic
4. Type and captions
5. Motion quality
6. Camera grammar and the 9:16 page
7. Sound palette
8. Native moves
9. Pitfalls of the medium
10. Engine
11. Variation space
12. The product and brand fit

## 1. Essence, and what it is not
A **catalogue film:** N items (uses, steps, flavours, products) shown one card at a time, fast, on the beat. Each card is
**one pictogram doing one action + a huge title + an optional second-language line + a mono index "07 / N"**. Cards group
into chapters; each chapter owns one hue and opens with a full-bleed pattern card. A 25 to 45 s reel holds about 6 to 12
cards. What makes a frame read as this style:
1. **The grid pattern:** big discs and half-discs spanning square cells, about half the cells carrying a small motif, in
   **five tones of one hue**, with **whole rows cut and shifted sideways**. It drives backgrounds and transitions.
2. **The pictogram figure:** flat, faceless, rounded bars and a disc head; far-side limbs mixed toward the background.
   Props are discs, rings, capsules, lines.
3. **Type as architecture:** a 900-weight grotesk title, very large; a heavy second-language line; small mono meta text.
4. **Beat lock:** every shot starts on a beat, every key action lands on a beat.

Mood: flat colour, one soft light sweep as the only gradient. Not an isometric infographic (no depth). Not Swiss Motion
(figure and pattern carry as much as the type). Not a cartoon (figures never emote). Not a data film (numbers are labels).

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia: no browser, DOM, CSS or SVG filters). Every
element is a pure function of t.
- **One square grid** (cell 180 px: six columns across the frame) rules bands, transitions and walls. No grain.
- **Pattern model:** fill with a mid-dark tone. On grid nodes, 34% get a cell-radius disc in a random tone and 16% a lighter
  disc with a darker half-radius disc inside. About half the cells get a generic motif (quarter-discs, fish-scale waves,
  dot and triangle scales, arcs, sun wheels, checkers, crescents), rotated by multiples of 90°. Never mascots, landmarks
  or logos. Draw it 3 cells wider than the frame so any row can shift one cell.
- **Figure model:** unit = body height 1, origin at the hip. Torso 0.30, neck 0.045, head radius 0.082, upper arm 0.16,
  forearm 0.15, thigh and shin 0.225; widths torso 0.145, arm 0.076, leg 0.094, round caps. Draw far limbs (mixed about 40%
  toward the background), torso, near limbs, head. A second person sits behind, mixed about 60%.
- **Stage:** the figure stands on a large **sun disc** in a neighbouring tone, crossed by one faint light sweep (about 9% white).

## 3. Colour logic
- **Five hues and one dark neutral,** each hue in **five tones** (darkest to lightest, the middle one is the base). A
  chapter is one hue; a multi-hue chapter rotates through the set per card.
- Under type the pattern runs at **low contrast** (about 40% of full spread); on chapter cards at **full contrast**.
- **Light hues take dark type and dark figures,** and their disc uses the lighter tone; dark hues take cream. On the dark
  neutral the disc uses a lighter tone or it vanishes; its accent is one warm hue. One cream and one ink serve every hue.
  No outlines, no highlights except the sweep.
- **Choose the set from the pack:** its main colour is the first base, its neighbours fill the rest. Invent your own hue
  names. Examples: coastal (navy, teal, coral, sand, sky); kitchen (tomato, basil, saffron, aubergine, flour cream).

## 4. Type and captions
Fonts (SIL OFL): **Inter Tight 900** (titles), **Noto Sans Devanagari 800** (a Hindi second line; the Noto Sans 800 of any
other script), **DM Mono 500** (meta, HUD, captions).
- **Title:** Inter Tight 900, 120 to 300 px, tight tracking, fitted to the 768 px width, one or two lines. Second language:
  72 to 90 px under it. **One language is always the big title;** the second is chosen once per film, never by hand.
- **HUD on every card:** the index "07 / N" and a chapter chip in mono (DM Mono 500, 40 px, tracking 3 px; tags are chips), and a **progress bar of N ticks** (the
  current one tall, done ticks at 75%, the rest at 28%).
- **The caption is a mono line on a solid band in the chapter hue's darkest tone,** in the caption lane (bottom edge
  y 1236, left edge x 120, at most 660 px wide: about 18 characters a line, up to 3 lines), DM Mono 500 at 56 px, never over
  the title. The words light up as they are spoken: unspoken words at 45%, the keyword in the hue's lightest tone.
- **Reading time:** every card or caption holds at least max(1.8 s, its spoken line + 0.6 s), and about
  (letters ÷ 15 + 1.5) s after it lands. A card that must be read (a spec, a number) holds at least 1.6 s.

## 5. Motion quality
- **A grid of time:** one tempo for the film; every shot starts on a beat; every key action in a pose (release, contact,
  landing) lands on an integer beat. At 120 BPM a bar is 2 s.
- **Pace ladder:** normal cards last one bar; related sub-items become half-length rapid-fire runs. A second tempo comes
  from dividing the beat, never from changing tempo.
- **Easing:** exponential ease-out for entrances, exponential in-out for whips and wipes, a back ease once at most.
- **Type enters by mask slide-up:** title first, the second line about 0.08 s later, the tag about 0.2 s later; meta lines
  type on without a caret. Short cards compress all timings (×0.7).
- **Figure assembly:** horizontal bands (about 54 px, 0.42 s) slide into register from alternating sides by 90 to 250 px.
  **Backgrounds breathe:** rows drift in alternating directions (about 26 px/s), jumping a quarter cell on chapter beats.
- **Transitions snap to the grid:** sliding rows, dropping columns, a push, quarter-discs from cell corners, an iris from
  the last figure, a tile flip. Rotate them; each runs from 0.12 s before the cut to 0.26 s after. **Motion blur only where
  things move:** 5 sub-frames averaged in transition and whip windows; static frames render once.

## 6. Camera grammar and the 9:16 page
Mostly a locked flat frame; energy comes from row shifts, transitions and figure actions. When the camera moves, it moves
along the grid. The opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked flat frame | clarity, the card as a poster | any item; a spec that must be read |
| Lateral track with a one-screen whip per beat | one family, momentum | a line of stations; a route |
| Slow drift along a row | calm, browsing | a gallery; a menu |
| Vertical scroll by grid rows | ranking, depth, descent | a top ten; floors |
| Push into one motif cell until it is the next frame | zooming into a part | an ingredient inside a dish |
| Pull back to a tiled wall of items | the whole set at once | a summary; "all of them" |
| Tiles collapsing to one point | many become one | a shared goal; a count reaching zero |
| Split screen along a grid line | two items side by side | versus; before/after |

Text and figure never overlap (one text column, one stage). Never dissolves, 3D camera moves, handheld shake or depth of field.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame. Words and key details keep to x 120 to 888,
y 260 to 1580, and left of x 780 below y 1100):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | pattern rows; no words |
| HUD row | y 270 to 390 | chapter chip at x 120; index at x 888, right-aligned; the tick bar just under it |
| Title block | y 410 to 910, x 120 to 888 | the title (1 to 2 lines), the second-language line, a tag chip |
| Stage | y 830 to 1580 | the sun disc (r about 330) and the figure, left of x 780 below y 1100. Main shot: the figure or the product is 780 to 1000 px tall (40 to 52%), the title cut to one line |
| Caption lane | bottom at y 1560, x 120 to 780 | the caption band |
| Bottom bleed | y 1580 to 1920 | pattern rows sliding past; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Percussion is the spine:** a drum family that suits the topic (frame drums, taiko, snares, steel pans, an electronic
  kit) plus rim clicks, claps, shakers and crashes. On top: plucks, mallets, detuned-saw stabs, a synth bass, pads, risers.
- **Per-family accents:** every shot onset gets a hit chosen by chapter (a splash, a pok, a clank, a crack, a whoosh, a
  sizzle), so the foley reads the chapter's matter. Check each onset to 15 ms.
- **Silence as a tool:** half a beat with drums and bass muted before a big hit, or one bar stripped to a single tick.
- **Voice:** in a reel the voice carries the script, calm; the music ducks under it. **Mix:** -14 LUFS, true peak -1 dB or lower.
- **Our presets:** closest is `bright` (108 BPM, claps). Effects: `pop`, `click`, `tick`, `whoosh`, `thud`, `snap`, `flip`,
  `rise`, `sparkle`. Preset to build (optional): `pictogram`: frame drums or taiko, clicks, claps, plucked stabs, synth
  bass, 100 to 130 BPM.

## 8. Native moves
A menu: use the ones the film needs.
- **One card = one item.** The count is the hook ("ALL 7"). *Fits:* every flavour of a snack range; every shade of a
  lipstick line; the 7 uses of a coconut oil.
- **Chapter = colour.** Families become hues. *Fits:* skincare steps (cleanse, treat, protect); meal-kit food groups; hair,
  skin and body in one brand.
- **One verb per item.** One body or prop action. *Fits:* yoga poses; toast, grind and stir a spice blend; ways to wear a scarf.
- **Pace ladder run.** A sub-family at double speed. *Fits:* four ways to drink a protein powder; three sizes; weekday
  mornings.
- **Long take down a track.** Stations one screen apart, a whip on each cut. *Fits:* the steps of a night routine; the
  stages of brewing; a laundry cycle.
- **Count-up slam.** A big number rolls to its value on a bar. *Fits:* 10,000 reviews; "0 g" added sugar; 48-hour hydration.
- **Icon wall.** All pictograms return as a grid and turn one colour. *Fits:* every diet tag (vegan, gluten-free, no palm
  oil); every product in a range; a month of habits.

## 9. Pitfalls of the medium
- Figure environments spread into the text column → render the figure into its own buffer and mask it to zero before the text.
- Horizontal poses (swimming, lying) cross the title → move the stage outward and narrow the text column.
- Imitating a real identity → your own palette, mark and slogan. The photo under the disc or a motif → draw it above, label clear.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test
each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `pattern(hue, seed, o)`, `drawPattern(g, pat, rowOffset)` | the cached grid pattern, with per-row sideways offsets (±1 cell) | the disc and motif rules of section 2; bounded LRU of about 10; one `drawImage` strip per row |
| `motif(g, kind, x, y, size, tones)` | one cell from about 14 generic motifs | arcs, quarter-discs, wave rows, checker cells, rotated by multiples of 90° |
| `figure(g, J, near, far)` | the pictogram from a pose | `lineCap = 'round'` strokes with the lengths in section 2; far limbs mixed 40% |
| `maskText(g, str, x, y, font, col, p)` | text sliding up out of a mask | `clip()` to the line box; y offset = (1 − p) × line height |
| `transition(kind, A, B, p)` | rows, columns, push, quarter-discs, iris, flip | A and B on offscreen canvases, composited with clip paths; 5-sub-frame blur in the window |
| `sun(g, ...)`, `photoCard(g, P, ...)` | the sun disc and its sweep; the real photo on it | disc plus a 9% white band; `P.draw` above the disc, label clear |

## 11. Variation space
You decide the items, grouping, verbs, palette, chapter order, any long take, the pace ladder, opening, ending and music.
Far from the original demo:
- **Structures:** a countdown (items ranked N to 1, the camera scrolling down rows, the pace speeding up); a day in
  pictograms (one card per hour, hues moving from dawn to night); an assembly (each card adds one part to a growing machine).
- **Openings:** a single motif cell fills the frame and splits into the grid; mid-action (the first pictogram is already
  running when the type slams in); a blank grid drawn on the beat.
- **Endings:** one card held long while the pattern rows stop, one by one; the figure walks off and the HUD ticks out; the
  grid slides off in rows, leaving cream.

## 12. The product and brand fit
- **The product:** a pictogram of the pack (geometric, no label text) in the early cards, then the real photo on the sun
  disc at the end (`photoCard`). The photo is never redrawn, filtered or covered, and its label stays readable.
- **Brand fit:** brands with many uses or variants, sports nutrition, kitchen staples, bilingual Indian brands. Avoid calm luxury.
