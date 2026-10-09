# Watercolor

> A hand-painted journal page that paints itself: translucent brush strokes with dry-brush flying white on warm cotton
> paper, handwritten notes beside what is painted, nothing drawn with a vector line. **Its power for a brand:** it
> makes a product feel natural and unhurried: ingredients bloom onto the page, a hand names each one, and the colour
> itself carries the message.
>
> References (grammar only, never copy): naturalist field-journal and botanical-plate watercolours (a specimen and a
> note); long horizontal handscroll panoramas (one continuous painted world); the textbook transect diagram (a gradient
> read across space). Borrow the grammar, never a specific artwork or layout.
>
> Adapted from lemo-opuscar `styles/watercolor/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **One sheet of warm, fibrous paper** under everything. It is also the eraser: paper-coloured mist washes things away.
- **Everything is individual brush strokes:** a variable-width ribbon at partial opacity plus a few thin **bristle
  tracks** that break into dashes (flying white). Strokes overlap and darken where they cross, like transparent
  pigment. No vector outlines; a darker edge stroke along a form is the only "line".
- **Things paint themselves in,** stroke by stroke, structure before detail (trunk, branches, leaves).
- **An annotation layer** in a painter's hand: labels with pen leader lines, a small measured value, a quiet title.
- Tone: calm, curious, precise. Numbers are real, and the palette can carry data.

Not ink wash (colour, not ink tones). Not impasto (no thick paint). Not a children's picture book (no crayon, no cute
outlines). Not a vector illustration with a watercolour texture on top.

## 2. Materials and rendering
Plain Canvas 2D (Node and Skia); every stroke is a filled `Path2D`, and the paint is transparent.
- **Paper:** a cached image (warm base about `#F1E9DA`, three octaves of smooth noise ±3.5%, about 2,600 short curved
  fibres, fine grain, a 5% vignette), drawn first every frame.
- **Stroke:** a ribbon whose width follows a profile (`brush`, `leaf`, `even`, `tip`, `trunk`) with about ±22%
  value-noise roughness, filled as a thin wash (body alpha about 0.57 with bristles), plus 3 to 9 **bristle tracks** at
  30 to 85% alpha, each with a random dash pattern (runs of 18 to 90 px) and a random early end: the flying white. A
  stroke can be painted to any fraction of its length (a moving brush tip).
- **Wash:** the same polygon painted in 3 passes at a third of the alpha with vertices jittered by about 1.6 px, so edges
  darken where passes disagree (a pooled edge). **Bloom:** a wash with a growing, noise-ragged radius and a darker
  pooled rim: a drop spreading on wet paper.
- **Depth by layers:** 3 or 4 parallax layers; farther is smaller (the far layer about 0.4×), lighter and less
  saturated, with paper-coloured mist bands between layers.
- **Cache finished objects as sprites;** draw stroke by stroke only what is being painted or transformed. Everything is
  a pure function of t: strokes made inside the frame function use a fixed seed.

## 3. Colour logic
- **Paper is the white.** Never paint pure white; light is unpainted paper.
- **Transparent layering:** darker means more passes, not a darker pigment on top. 3 to 5 hues a scene, plus ink.
- **Ink** (a warm near-black and a lighter brown) is for lines, text, edges and stems only.
- **Colour may carry data or mood:** blend sky, ground and background by position or time. Ramps quantised into 4 to 6
  bands read as paint; continuous ramps read as software.
- **One accent** (a vermilion, a rain blue) for one recurring element: a stamp, a marker, the product.
- **Take the hues from the product's ingredients,** the accent from the pack. Example: a harbour at dawn `#F3E2C8` sky,
  `#9FB4C4` water, `#5F7486` hulls, accent `#C8442A`.

## 4. Type and captions
Fonts: bundled **Cormorant Garamond** (600 italic, titles and captions) and **Caveat** (600, hand notes); **IBM Plex
Mono 500** (measured labels; fetched by the font script).
- **Titles:** Cormorant Garamond italic 600, 112 to 140 px, one to three lines, left at x 120 (about 16 letters a line
  at 120 px). **Measured labels:** IBM Plex Mono 500, 40 px, tracked 3 px.
- **Hand notes:** Caveat 600, 48 px, drawn twice over a paper-coloured halo and revealed left to right like writing,
  with a pen leader line that grows to its specimen.
- **Captions sit on the paper, not in a box:** Cormorant Garamond italic 600 at 60 px, ink at 88% over a paper-coloured
  halo (18 px, drawn twice), two lines at most. The **keyword sits on a loose accent wash stroke** (a swipe at about
  35%). Words light up as they are spoken (unspoken at 45%). Bottom edge y 1236, left edge x 120, at most 660 px wide.
- Numbers are spelled out in the voice text and written as digits on screen.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.6 s), and about (letters ÷ 15 + 1.5) s
  after it lands.

## 5. Motion quality
- **Painting in is the main motion:** an object's progress is a function of where it sits on screen or of a cue. A list
  of N strokes gives each stroke `clamp(4/N, 0.12, 0.5)` of the progress, so structure appears first.
- **Sway only after an object is finished:** a small horizontal skew `sin(1.15t + φ) + 0.4·sin(2.7t + 2φ)`, about 0.006
  for trees and 0.01 to 0.03 for grass.
- **Brush-edge wipes:** a wavy vertical clip reveals a whole scene; lines grow by stroke progress; labels open with a
  left-to-right clip. **Mist erases:** paper-coloured layers with a wavy rising edge.
- Creatures and events may be phased to the music's beat grid. Smooth easing at 30 fps; nothing jitters, no line boil.

## 6. Camera grammar and the 9:16 page
The picture is one painted sheet; cutting is rare. A vocabulary, not a route; the opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Long lateral dolly over a continuous world | a gradient; a journey | a transect; a route; a timeline |
| Vertical tilt along one object | scale; measurement | a tall tree; a depth |
| Locked sheet, things painted in | study; attention | a specimen plate; a recipe |
| Slow push into a detail | the observer leaning in | a seed; an insect; a note |
| Pull-back to a map or diagram | the whole re-framed | where it all happened; a system |
| Mist wash to blank paper | chapter end; time passing | a season; forgetting |
| Page turn, a new sheet slides over | a new entry in the journal | a new day; a new species |
| Change in time on a locked view | growth; decay; history | a season cycle; before and after |

Generous paper margins; one hero per view with its note; labels never cover the subject. Transitions: brush-edge wipes,
mist, a page turn, a continuous camera move. No hard cuts, no dissolves between unrelated pictures.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | sky wash, mist, the top of the painted world; no words |
| Title and note | y 270 to 740, x 120 to 888 | a handwritten title or question on paper; hand notes with leaders |
| Hero | y 520 to 1580 | one painted hero, 770 px or more tall; the product card sits among the washes |
| Caption | bottom at y 1560, x 120 to 780 | the caption on paper, with its halo |
| Bottom bleed | y 1580 to 1920 | ground wash fading to paper, foreground plants; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music:** acoustic and gentle: felt piano, fingerpicked guitar, woodwinds, light strings, glockenspiel, kalimba, soft
  pads.
- **Foley from the scene's matter:** a paper brush rustle for each painting-in (band-passed noise, a light tremolo, a
  panned sweep); pencil scratch for notes; a soft thump for a stamp; page flips; nature beds and creatures of the
  subject (birds, wind, rain plinks, water).
- **Silence:** the brush lifted. Music out, only paper and room; it frames one painted moment.
- **Mix:** voice forward; music ducked about 4 dB under it with a smoothed envelope; a short soft reverb; −14 LUFS. The
  voice is a warm, unhurried documentary read, one line per idea.
- **Our kit:** closest preset `calm` (76 BPM pad); `warm` (92 BPM plucked strings) when the film has a rhythm. Effects:
  `swish` (each painting-in), `marker` (a note being written), `stamp` (a soft thump), `flip` (page), `plop` (a drop,
  a bloom), `pour` (a wash), `rise` (mist), `chime` and `sparkle` (glockenspiel), `paper`.

## 8. Native moves
A menu: use the ones the story needs.
- **Painting-in as reveal.** A new thing appears stroke by stroke as it enters. *Fits:* the spices of a masala; the
  herbs of a hair oil, one per beat; the fruit in a juice.
- **Burst.** A whole group paints in at once (1 s or less) for a peak. *Fits:* a marigold field for a festive launch; a
  monsoon garden for a tea; a bowl of berries.
- **Palette as data.** Sky, ground and background blend by a measured value. *Fits:* coffee roast level, green to dark;
  SPF levels by sun; sugar across a drinks category.
- **Specimen + note.** One hero object with a hand-written label and leader. *Fits:* a tea sprig ("first flush"); a
  turmeric root with its curcumin %; a cotton boll for towels.
- **Mist erase.** The world washes back to paper. *Fits:* a stain wiped away by a detergent; the old way fading; a sale
  ending.
- **Map in time.** A painted map whose fills change through the years. *Fits:* a tea's growing region by season; a
  delivery network growing; pin codes served.
- **Painted transformation.** An object cross-fades to a burnt, wet or aged sprite and regrows. *Fits:* a coffee cherry
  ripening to roast; a mango ripening; a plant regrowing after rain.

## 9. Pitfalls of the medium
- Wash strips that are too short flatten tall shapes and show seams on tilts: size them well beyond the frame.
- A translucent wash that ends at its canvas edge shows a hard seam under other layers: extend below the frame and fade
  to paper.
- A stroke builder that uses a global random source gives different frames on different workers: build every stroke
  under a fixed seed.
- Thousands of strokes per frame are too slow: cache finished objects as sprites.
- Beat-locked animation must be re-derived when the music changes.
- Text over a dark wash fails contrast: keep a paper-coloured halo, or put a mist band under the caption.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it),
test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `paperImage` | the sheet | cached: warm base, 3 octaves of smooth noise ±3.5%, about 2,600 curved fibres ±3.5%, grain, 5% vignette; drawn first |
| `stroke(pts, w, col, o)` | one brush stroke | ribbon by width profile with ±22% roughness, body alpha 0.57; 3 to 9 bristle tracks with dashes (18 to 90 px) and early ends; paint to fraction p |
| `wash(poly, col, a)` | a pooled wash | the polygon painted 3 times at a/3 with 1.6 px vertex jitter |
| `paintList(strokes, p)` | structure before detail | N strokes in order, each taking clamp(4/N, 0.12, 0.5) of p |
| `sprite(strokes)` | a cached finished object | offscreen canvas; sway as a skew transform; stroke by stroke only while painting |
| `mist(edge)` | the eraser | the paper image clipped by a wavy rising edge; mist bands between depth layers |
| `note(text, from, to)` | hand notes and leaders | Caveat drawn twice over a paper halo, revealed by a left-to-right clip; leader grows by point count |
| `bloom(x, y, col, t)` | a wet drop spreading | a wash with a growing noise-ragged radius, a darker pooled rim and granulation: the first-second shot |
| `layers` | depth | 3 or 4 parallax layers; far about 0.4× and 50% alpha; mist between |
| `photoCard(photo)` | the product | the real photo as a cut-out card laid on dry paper, thin paper edge, soft shadow; washes bloom behind and around it |

## 11. Variation space
You decide the subject, the structure, what gets painted, the palette logic, whether anything is measured, the opening,
the ending and the camera.
- **Structures:** a journal kept over one year (a locked page per month, each painted over the last); anatomy of one
  object (a specimen dissected into labelled parts, each a painted close-up); a recipe or process (steps painted top to
  bottom on one tall sheet, tilting down).
- **Openings:** a finished painting watched backwards to its first stroke, then forwards; a close-up of wet pigment
  spreading, pulled back to show what it became; a handwritten question on blank paper, answered by painting.
- **Endings:** the page left unfinished, brush lifted mid-stroke; one detail held as the rest fades to paper; the sheet
  dries and is filed into a stack of other pages.

## 12. The product and brand fit
- **The product:** the wash blooms around the real photo, which is laid on the dry paper as a cut-out card (`photoCard`)
  with a thin edge and a soft shadow. It is never washed over, redrawn, filtered or covered, and its label stays
  readable. Show it big at least once.
- **Brand fit:** natural, botanical, Ayurveda, baby care, tea, organic food, slow wellness. Avoid it for loud or
  high-energy brands, strong flat pack colours, or a hard number that must shout.
