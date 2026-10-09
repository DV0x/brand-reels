# Copperplate Engraving

> An intaglio plate that engraves itself: a burin cuts swelling lines into copper, a proof is pulled, and the figure
> builds up (outline, hatching, cross-hatching) until lettering, magnified details and a hand-laid wash make a finished
> plate. **Its power for a brand:** it makes a product look studied, like a museum plate: parts labelled, details
> magnified, and the one part that matters coloured by hand.
>
> References (grammar only, never copy): 19th-century natural-history plates (a centred subject, numbered roundels, a
> roman title over an italic name, the plate mark); book-illustration burin work (hatching that follows the form,
> crossing only in half-tones); hand-coloured plates (washes laid after printing).
>
> Adapted from lemo-opuscar `styles/engraving/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
An **intaglio print:** the line is ink held in a groove that a burin cut into copper. Three rules:
1. **Tone is made of lines, never of fills.** Light is bare paper. Half-tone is one family of parallel lines, shadow a
   second family crossing it, the deepest dark a third (lozenges). No grey fill anywhere in the ink.
2. **Every line swells and tapers.** It enters fine, bites deeper mid-run and lifts out to a point. Lines thicken where
   the form turns from the light and vanish where it faces it. Contours are cut in several runs, thin where runs hand
   over. A uniform-width line reads as a pen or vector drawing: never.
3. **Colour comes afterwards, by hand:** transparent wash laid region by region over the finished black print,
   spilling past the lines and pooling at its edges, ink always on top. Colour arriving is an event.

Not a woodcut (black block, white gouges). Not a pen sketch (loose lines). Not an engineering drawing. Not a sepia filter.

## 2. Materials and rendering
Plain Canvas 2D (Node and Skia). A line is a filled ribbon, never a stroked path.
- **The sheet is the world:** laid paper (cream, about `#F1E8D2`) with a world-space texture (fibres, laid lines, sparse
  foxing) that zooms with the camera; a pressed, bevelled plate mark (dark bevel top and left, light bottom and right)
  and a ruled border (2.4 px rule, 0.8 px hairline 9 px inside). In 9:16 the plate mark sits 40 px in, the border 64 px.
- **Ink** is one warm near-black (about `#1C1510`). Widths: outlines about 2 px (swelling ×0.45 to ×1.35); first
  hatching from a hair (0.18 px) to about 2 px; crossing ×0.8; third family ×0.6; hair and stipple finest.
- **Spacing is relative to the figure:** about 1/180 of its height (×1.1 crossing, ×1.25 third), never under 4 px on
  screen (finer hatching goes grey in the encode).
- **Swell law** for every hatch line: width × (0.2 + 0.8·sin(πu)^0.7), tapered over the first and last 22%. Families
  switch on at tone thresholds of about 0.14, 0.5 and 0.75 (tone 0 to 1).
- **One light direction** (upper left); heavier outlines away from it. Tone comes from the shape (pillow lighting off
  the silhouette's distance field, analytic spheres and cylinders), never from texture. Lines stop at shapes in front.
- **Strokes in 2D:** offset a polyline both sides by the swell law and fill it. Keep strokes in cutting order, bucketed
  by width, each cut to its fraction of length at time t; cache finished groups as sprites.
- **Roundels:** a double-ruled circle (2 px and 0.75 px) on a ruled ground (lines every 11 px) with a white halo; author at
  radius 500, scale in. **Leaders:** 1 px hairlines, 34 px or more of clearance, a small italic figure number at the root.
- **Hand colouring** is `multiply` over the paper and under the ink: 3.5 px spill (blur the region mask), 1.5 to 2 px
  misregistration, a tide-line at the wet edge, a low-frequency density lift, backruns, granulation.
- **Copper** (the hook shot): warm metal with a soft reflected window; a groove is a dark trough with a bright burr.
  The burin is turned at most 15° off the line; swarf is a narrowing ribbon curling ahead of the point.

## 3. Colour logic
- The print is two values, paper and ink. All tone is line density.
- Colour is **transparent wash only,** in muted earth and mineral pigments, one stronger pigment at most. Never opaque,
  never on lettering, rules, or paper outside the figure.
- Reserve it: the whole subject at one moment, or only the part that matters, or none.
- **Take the one stronger pigment from the pack's accent.** Examples: an amber root with one madder-rose part; a cocoa
  pod in burnt sienna.

## 4. Type and captions
Fonts (SIL OFL, fetched by the font script): **Bodoni Moda** (600 capitals, 500 italic) and **Pinyon Script 400**.
- **Title:** Bodoni Moda 600 capitals, 84 to 104 px, tracked 0.16 em, centred, one to three lines (about 9 letters a
  line at 96 px). **Labels:** Bodoni Moda 600 capitals, 40 px, tracked 0.14 em. **Latin names:** Bodoni Moda italic
  500, 44 px. **Notes:** Pinyon Script, 56 px, fixed size, balanced over two lines, never shrunk.
- Roman letters are **cut glyph by glyph.** Script is **written** in one left-to-right stroke. Nothing fades in.
- **Captions** are script on a deckled paper slip (never a pill): Pinyon Script at 72 px, dark brown ink, two lines at
  most. The pen writes each word as it is spoken. The keyword gets a hand-laid wash stripe under it (wash never goes on
  lettering). Bottom edge y 1236, left edge x 120, at most 660 px wide. If a phone check shows the script too thin,
  use Bodoni Moda italic 500 at 60 px.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.6 s), and about (letters ÷ 15 + 1.5) s
  after it lands; an engraved note counts from when it starts writing.

## 5. Motion quality
- **Cutting order is the animation:** outline, then the first hatching sweeping across each form, then crossing, then
  darks, hair and stipple. Strokes run at constant burin speed, many at once (a few for outlines, 6 to 90 for
  hatching). A full build takes 3 to 5 s.
- **Roundels** fly on an eased arc with a 30 px lift at mid-flight and grow log-linearly to size (radius 150).
- **Colour** blooms from one point with a ragged front and a wet rim that dries. Each region takes 1.25 to 1.6 s;
  regions start about 0.4 s apart.
- Nothing fades or slides like UI: lines are cut, text is cut or written, colour blooms, sheets are pressed or peeled.

## 6. Camera grammar and the 9:16 page
The camera is a loupe over a sheet. A vocabulary, not a route; the opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Loupe following the burin tip | one point of attention; making | a first mark; a signature |
| Log-zoom pull-out | the line was part of something larger | a scale reveal; context |
| Push to a part, ride with its roundel | where, then what, in one take | an invisible detail; a mechanism |
| Tilt or pan along the sheet at reading zoom | labels in order | a parts list; an origin map |
| Pull back while something flies | everything placed in relation | acceleration; a summary |
| Locked frame, or a push of 2% or less | the plate as a document | reading time; colour moving |
| Raking view across the copper | the groove as depth | the cost of craft |
| Cut from mirrored copper to true proof | reversal | a hidden truth; before and after |

Transitions come from printmaking only: a proof pulled, a tissue guard, a region burnished and re-cut. No dissolves.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | paper margin, plate mark, ruled border; no words |
| Title block | y 270 to 630, x 120 to 888 | roman title, italic name beneath, centred |
| Hero | y 520 to 1580 | the specimen, 770 px or more tall; roundels fly to slots at upper right (x 540 to 888, y 280 to 760) and lower left (x 120 to 470, y 1070 to 1560) |
| Caption slip | bottom at y 1560, x 120 to 780 | script on a deckled slip |
| Bottom bleed | y 1580 to 1920 | plate margin, credit lines (texture, may be small); no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Foley by material:** paper (peel crackle, a slip tapped down, tissue rustle); press (roller rumble, thump); copper
  and steel (high band-passed burin hiss with chatter, swarf pings, a tick on lift, burnishing rub); ink and water (pen
  scratch, ticks for cut letters, a water plip, a wet brush swish). Hatching is micro-scratches, denser each pass.
- **Instruments (choose):** harpsichord, string quartet, solo cello or viola da gamba, lute, chamber organ; glass
  harmonica for a cold subject. Plucked and dry while lines are cut; bowed only when something soft arrives.
- **Silence is real:** cut the room tone too. Melody an octave above the voice; music about half under speech; −14 LUFS.
- **Our kit:** the closest preset is `warm` (92 BPM plucked strings). Preset to build: `plate`, harpsichord and
  pizzicato strings plus one bowed layer for the colour moment, 90 to 100 BPM. Effects: `tick` (cut letters, lift),
  `type` (pen), `paper` (peel, slip), `thud` (press), `chime` (roundel ring), `whoosh` (roundel flight), `plop`, `swish`.

## 8. Native moves
A menu: use the ones the story needs.
- **The cut.** The burin mid-stroke, swarf rising, nothing else. *Fits:* the first line of a serum's formula plate; a
  roaster's single bean curve; the contour of a cast-iron pan.
- **The three passes.** Form gains volume pass by pass. *Fits:* a cocoa pod; a licorice root; a handloom weave.
- **Magnification roundel.** A ring is scribed, burnished, re-cut larger, flown to a margin with a leader, its label cut
  on landing. *Fits:* a coffee bean's crease; a strand of handspun cotton; a turmeric root's cells.
- **The proof.** The sheet peels off; mirrored copper becomes true paper. *Fits:* the real ingredient list revealed; a
  final formula after drafts; a batch number struck on a tin.
- **States of the plate.** A region is burnished out and re-cut. *Fits:* a reformulated recipe (sugar removed); a
  packaging redesign; a price change.
- **Hand colouring.** Washes bloom after the print. *Fits:* one active in madder-rose on a black plate; saffron strands
  in saffron wash; a mango ripening.
- **Natural size.** A tiny true-scale figure beside the engraving. *Fits:* a cardamom pod; a grain of millet; a capsule.
- **The finished plate.** Every label and credit, locked. *Fits:* an ingredient list as a museum label; a founder's
  certificate; a range frontispiece.

## 9. Pitfalls of the medium
- Uniform width reads as pen: swell hatches, pinch contours between runs, keep the thinnest width hair-fine.
- Overlaps without occlusion: subtract the shapes in front from each hatch family (even-odd would cancel overlaps).
- A burin along the cut hides the groove; a big skew looks like poking: at most 15°. A regular swarf helix reads as a
  spring: vary the winding and light one edge.
- Roundels authored small freeze at sub-pixel scale: author large, scale in. Leaders hugging the subject read as
  crossing it: keep clearance.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it),
test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `sheet` | paper, plate mark, ruled border | cached world-space tile (laid lines, fibres, foxing); bevel by two offset fills; zooms with the camera |
| `stroke(pts, w)` | one swelling burin line | polyline offset by the swell law, filled; stored in order, bucketed by width; cut to fraction p |
| `formTone(mask, light)` | a tone field for any shape | silhouette mask, distance field cached in ImageData, pillow lighting from the upper left |
| `hatch(poly, tone)` | tone as lines | families at 0.14 / 0.5 / 0.75; spacing = figure height ÷ 180 (×1.1, ×1.25); bent to the form; occluders subtracted |
| `outline(poly)` | contours | several runs, swelling ×0.45 to ×1.35, heavier away from the light, thin where runs hand over |
| `engraveText`, `writeScript` | cut roman, written script | a per-glyph mask that grows with a tick; script by a clip that grows left to right |
| `roundel(p)` | a magnified detail | ruled circle scribed by p, ruled ground, content at radius 500 scaled in, arc with 30 px lift, leader |
| `wash(region)` | hand colouring | mask with spill, tide-line, density lift, granulation, backruns; `multiply` under the ink; ragged bloom |
| `copperBurin` | the hook shot | copper plate, groove, burr, burin, swarf; the first stroke already partly cut at frame 0 |
| `figPlate(photo)` | the product | the real photo tipped in as "Fig. N": ruled frame, photo corners, flat shadow; never hatched or washed |

## 11. Variation space
You decide the subject, details, order, opening, ending, camera, colour and music. Information order is grammar: a
**museum label** (title and name, details with a note each, where to find it; 30 to 40 s); **one minute on…** (question,
name, 2 or 3 facts, one number; 35 to 45 s); a **textbook figure** (figure, parts labelled one by one; 25 to 40 s).
- **Structures:** states of one plate (one view re-cut three times); a book of plates (four small plates turned like
  pages, one fact each); a dissection (parts labelled in teaching order, colour only on the part taught).
- **Openings:** the finished proof burnished back to its first line; on paper at 1× (title cut first, figure grows
  below); raking light over blank copper as the design is traced.
- **Endings:** plate beside its proof; the natural-size figure held alone; a blank new sheet laid on the stack.

## 12. The product and brand fit
- **The product:** the real photo is tipped into the plate as "Fig. 7" (`figPlate`), or a simple pack is engraved. The
  photo is never hatched, washed, redrawn or covered; a leader may point at its label but never cross it.
- **Brand fit:** science-led, heritage and craft brands with an ingredient story. Avoid it for loud, fast, youth-led
  brands: the build needs 3 to 5 s of patience.
