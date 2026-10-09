# Block Print

> Indian hand block printing brought to life: carved wooden blocks, one block per colour, natural dyes (indigo, madder,
> iron black), mud resist and repeat motifs pressed by hand on handwoven cloth, with a title cartouche and a maker's
> seal. Every shot is a complete printed cloth. **Its power for a brand:** it shows the hand behind a craft or an origin:
> one subject in a series of views, each pressed block by block.
>
> References (grammar only, never copy): Bagru and Sanganer block printing (carved blocks, dye pads, mud resist); Ajrakh
> resist printing (repeat grids, borders, indigo and madder); 19th-century Japanese view-print series (one subject in
> many compositions, a title cartouche, a red seal). Never copy a real cloth, a famous print or a maker's mark.
>
> Adapted from lemo-opuscar `styles/ukiyoe/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this skill's
> runtime, and adapted to Indian hand block printing. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

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
Every shot is **a complete printed cloth:** off-white handwoven cloth, a printed border, flat colour pressed from
separate blocks, an outline block on top, a title cartouche and a madder-red seal. The world is flat on purpose. Depth
comes from stacked rows and bold cropping, never from perspective, lighting or shading. What makes it read as *printed
by hand,* not as a vector pattern:
- **The cloth is always visible:** warp and weft, slubs, uneven tone.
- **Each colour is its own block,** out of register by 2 to 4 px (registration is by eye).
- **Every repeat is its own impression:** a little off in position, angle and dye load. Never a perfect tile.
- **Natural dye:** pooling at carved edges, weave showing through, dye creeping along threads. Indigo gets its tone
  from the number of dips. **Dabu** (mud resist) leaves a cream motif with hairline cracks of indigo.

Not a vector pattern with a cloth overlay. Not Silkscreen Poster (opaque inks, no weave). Not Japanese woodblock (no
gradient washes). Not Paper-cut (Sanjhi).

## 2. Materials and rendering
Plain Canvas 2D (Node and Skia).
- **The cloth is the frame.** It fills the screen at zoom 1, with a printed border (the kinara: bel motifs between a 6 px
  and a 2 px rule) 48 px in from the edge. Cloths hang from a line or lie on a long table.
- **Every repeat is a separate impression:** its own seeded offset (±1.5 px), rotation (±0.4°) and dye load (0.85 to
  1.0), and a darker squeeze-out rim (about 2 px) where dye pooled at the carved edge. Rows run in a half-drop.
- **Texture every dye block,** in order: the weave showing through (`destination-out`, alpha about 0.18); mottle
  (low-frequency noise, `source-atop`, ±12%); specks (`destination-out`, alpha about 0.3). The outline block gets
  specks only (0.12). **Wicking:** blur each cached block 1.2 px and re-cut it with an alpha curve, so edges are
  slightly irregular but hard. Light fibres (alpha about 0.09) over the finished cloth.
- **Carved line:** even, 3 to 4 px, small chips, square ends. It does not taper (wood does not).
- **Tone is dips, not gradients:** indigo in three strengths. No bokashi, no shading on forms.
- **Motifs:** buti (a small flower repeated), jaal (an all-over trellis), bel (a vine border), keri (paisley), lotus,
  dot rows, wavy water lines, stepped hills made of rows of one block. Rows are flat, parallel, slightly slanted.

## 3. Colour logic
- **A dye set, not a colour wheel:** 4 to 6 flat colours, each from its own block: indigo in three strengths, madder
  red, iron black, harda ochre, and optionally a green made by overprinting indigo on yellow. No gradients.
- **The cloth is the white.** No white dye: foam, mist, snow and blank sky are bare cloth.
- **One dominant hue family** (usually indigo) carries sky and ground. **Red is rare:** the seal, one garment, a tab, or
  the product's accent. Far rows are pale; near rows saturated, with the outline block darkest.
- **Take the one accent from the pack.** Example: indigo `#1E2F55` / `#3E5A8C` / `#8FA9C8`, madder `#A8412D`, black
  `#2A2522`, ochre `#C9A04F` on cloth `#EFE5D0`.

## 4. Type and captions
Fonts (SIL OFL, fetched by the font script; both cover Devanagari and Latin): **Yatra One 400** (headlines) and
**Eczar** (800 cartouche titles, 700 captions, 600 labels).
- **Headlines:** Yatra One 400, 100 to 140 px, one to three lines, left at x 120 (about 10 letters a line at 120 px).
  A headline is one carved block: one offset, one dye texture, small chips in the letter edges.
- **View cartouche:** a cream slip with a printed border (6 px and 2 px rules), a pale tab with the series title (Eczar
  600, 40 px), the view title below (Eczar 800, 72 px), a madder seal at one end: the full stop of each view.
- **Captions are a cartouche slip,** never a floating pill: cream, printed border, a small madder seal at the left,
  Eczar 700 at 56 px in iron-black, the **keyword in madder**. Words light up as they are spoken (unspoken at 45%, a
  paler dye). Bottom edge y 1236, left edge x 120, at most 660 px wide, two lines.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.6 s), and about (letters ÷ 15 + 1.5) s
  after it lands. Nothing fades: a slip slides in 14 px with a back ease (0.25 s); a seal stamps (1.35 → 1 in 0.2 s).

## 5. Motion quality
- **Cloths are still.** Most of the frame does not move; each view has one or two small actions (steam, a bird, a
  turning wheel, a falling leaf). Figures and nature step at 8 fps, fast water at 12 fps, the camera on ones (30 fps).
- **Press reveal:** each block lands in one press: a wooden slab with a handle drops (scale 1.04 → 1 in 0.12 s), the dye
  shows at the lift, and the impression slides 3 to 4 px into register. A row prints on beats, one impression every
  0.18 to 0.25 s. No wipes, no fades.
- **Indigo oxidises:** lifted from the vat, the dye is yellow-green and turns blue over about 1.2 s.
- A native move needs a held beat of about a second to be read.

## 6. Camera grammar and the 9:16 page
The camera moves over cloths and between them; it never turns in 3D inside one. A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked frame on one cloth | reading a print on a wall | a place; a product; a still moment |
| Cloth-roll slide, bottom to top (shorter slides = urgency) | travel, the next view | a journey; the steps of a process |
| Very slow push toward a framing device (an arch, a door) | attention narrowing | discovery; a detail that matters |
| Tilt past the border onto the table | something larger than the print | a flood; a giant; a rumour |
| Pull-back from one cloth to many on a line | the series seen whole | a summary; a range |
| Crash-zoom into the weave and dye specks | the medium becomes the image | a memory; a craft detail |
| Pan up across three stacked cloths | a scene too tall for one cloth | a procession; a harvest |
| Hard cut to blank cloth | a held breath | aftermath; a pause before a decision |

Bold cropping and extreme foreground elements are native. Transitions: cloth-roll slides, reprints, a sweep to blank cloth.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | the printed border, sky rows of dots or stepped hills; no words |
| View cartouche | y 270 to 510, x 120 to 888 | cream slip: series tab, view title, seal at one end |
| Hero | y 520 to 1580, full width | the view in rows of block-cut shapes; the product or subject 770 px or more tall |
| Caption slip | bottom at y 1560, x 120 to 780 | the caption cartouche |
| Bottom bleed | y 1580 to 1920 | foreground rows, lower border, selvedge; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Indian instruments, not piano and pads:** sitar or sarod pluck, santoor, bansuri, a tanpura drone, tabla and dholak,
  manjira, wooden clappers (khartal), ghungroo bells. One raga-like mode per film (Bhoopali for calm, Yaman for evening).
- **Options:** silence as a held breath (cut the reverb tails too); one drone note left ringing; free-rhythm bansuri
  against a steady pulse; clappers that accelerate, one clap per block; a dholak roll into a hit.
- **Foley follows the material:** a block set down on cloth (a wooden thap), the dye-pad squelch, cloth rustle and snap,
  mud paste slapped on, a sawdust hiss, river water.
- **Voice:** calm, few short lines, like a poem beside the print. Music ducks about 8 dB under it, ambience 4 dB;
  −14 LUFS; no added grain (the weave is the grain).
- **Our kit:** closest preset `warm` (92 BPM plucked strings). Preset to build: `raga`, sitar or santoor pluck, tanpura
  drone, tabla and dholak, bansuri, clappers; free rhythm into 72 to 96 BPM. Effects: `stamp` and `stampbig` (a block,
  the seal), `thud`, `pour` and `plop` (dye pad, vat), `swish` and `whoosh` (cloth slide), `crinkle`, `tick`, `chime`.

## 8. Native moves
A menu: use the ones the story needs.
- **A series of views.** One constant subject in different compositions; where it sits in the frame tells the story.
  *Fits:* one tea estate through the seasons; a kurta in five homes; one street in four festivals.
- **The cloth-roll.** Scenes don't cut; the cloth slides and the next print arrives. *Fits:* the steps of a recipe; a
  bean's journey from farm to cup; loom to door.
- **Printing, block by block.** The outline first, then each colour lands a little off and snaps into register. *Fits:*
  a festive box design taking shape; a cushion pattern; a new flavour's label.
- **Cloth is the white.** Foam, mist, snow and blank sky are bare cloth; a wash can erase a print to blank cloth.
  *Fits:* a stain-removing detergent; a clean start for a new season; milk.
- **The frame is an object.** Border and cartouche are physical; something big breaks out of them. *Fits:* a runaway
  bestseller; a sell-out; a festival too big for one cloth.
- **Alternate impressions.** The same outline block reprinted with different colour blocks. *Fits:* a kurta in indigo
  and in madder; a tea at morning and at evening; before and after the monsoon.
- **The triptych.** A scene split across three cloths that join. *Fits:* farm, mill and shop; morning, noon and night of
  a routine; three sizes of a gift box.
- **Resist, dip, wash (dabu).** Mud is printed, the cloth dipped in indigo, the mud washed off: the cream motif appears.
  *Fits:* an indigo-dyed apparel line; a hidden-ingredient reveal; a secret recipe.

## 9. Pitfalls of the medium
- Perfect tiling looks digital: give every impression its own offset, angle and load; run rows in a half-drop.
- Too much weave or speckle makes dark dye look like sandpaper: weave about 0.18, specks about 0.3, fibres about 0.09.
- A gradient or a soft shadow breaks the medium: tone is dips and tints; shadows are flat offset dye.
- Tapered brush lines read as ink wash: carved lines are even, with square ends and chips.
- Straight, glassy cracks in dabu look fake: branch them in short segments and vary the width.
- A seal drawn with `multiply` vanishes on dark indigo: use `source-over` there.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it),
test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `cloth` | kora cloth | cached tile: off-white base, warp and weft threads 3 to 4 px, slubs, ±3% mottle, stains |
| `dyeBlock(name)` | one dye's layer | offscreen canvas cached once (outline, indigo ×3 strengths, madder, ochre, black); fixed offset 2 to 4 px, a different direction per block |
| `impress(motif, i)` | one hand impression | seeded offset ±1.5 px, rotation ±0.4°, load 0.85 to 1, 2 px squeeze-out rim; half-drop rows |
| `dyeFinish(block)` | dye texture | weave `destination-out` 0.18, mottle `source-atop` ±12%, specks 0.3, 1.2 px wicking; fibres 0.09 |
| `dabu(motif)` | mud resist | cream motif on indigo; branching hairline cracks 1 to 1.5 px by `source-atop`; indigo specks |
| `vat(t)` | indigo oxidation | dye colour lerps from yellow-green to indigo over 1.2 s |
| `blockPress(block, at)` | the press | slab with handle drops 1.04 → 1 in 0.12 s, lifts; the impression slides 3 to 4 px into register |
| `cartouche`, `chhaap`, `kinara` | slip, seal, border | cream slip, 6 px and 2 px rules; madder seal 120 to 160 px with chipped edges, stamp 1.35 → 1 in 0.2 s; bel border |
| `hangTag(photo)` | the product | the real photo as a hang-tag stitched on with madder thread; cartouche beneath, seal at the corner |

## 11. Variation space
You decide the subject, the number of views, the opening, the ending, the camera and the pacing.
- **Structures:** alternate impressions (one outline block reprinted for dawn, rain, a festival night, a new colourway);
  a triptych unfolding; a print being made (one carved block per shot, each block's colour telling one chapter).
- **Openings:** a close crop (an extreme foreground detail; the pull-back finds the cloth); the bare block (carved wood
  inked, the cloth laid, the printer's fist thumps, the block lifts); a clothesline of printed cloths in the wind.
- **Endings:** a seal alone (the print washes back to blank cloth, only the madder seal remains); cloths drying in the
  sun; the last print left unfinished (outline only, colour blocks never land).

## 12. The product and brand fit
- **The product:** the real photo hangs on the cloth as a hang-tag stitched with madder thread, with a printed cartouche
  beneath and a seal at the corner (`hangTag`). Never redrawn, filtered or covered; its label stays readable.
- **Brand fit:** Indian craft, heritage, home, apparel, tea, coffee, spices, sweets; festive editions. Avoid high-tech or
  clinical products, or packs with many colours.
