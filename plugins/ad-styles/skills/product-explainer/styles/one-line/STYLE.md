# One-line Drawing

> A single ink line that never leaves the paper. Everything on screen is that one line being drawn; scenes don't cut, they
> morph. **Its power for a brand:** one line turns one thing into another, so a problem becomes the product before the
> viewer's eyes.
>
> References (grammar only, never copy): a TV cartoon where one drawn line is both world and character, and its
> transformations are the jokes; long-exposure photographs of a painter drawing in light; hand-made abstract films drawn to
> jazz. No character, voice or specific continuous-line illustration is copied.
>
> Adapted from lemo-opuscar `styles/one-line/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **One continuous line on warm white paper.** The pen never lifts: in code, the whole film can be one point array.
- **Everything is a line:** characters, places, objects, even time. No fills, no shading, no second line weight, no
  background art. The one non-line thing is the real product photo, revealed inside a traced outline (section 12).
- **We watch the line being drawn.** The camera follows the nib with a little lag and anticipation.
- Besides ink there is only the paper and a soft shadow of the pen (the real world above the paper). One accent colour at most.

Not a whiteboard (no hand, no marker, no erasing, no text-heavy boards). Not ink wash (no tones, no brush bloom as a look).
Not line-art animation with cuts and many strokes.

## 2. Materials and rendering
Canvas 2D in this skill's runtime; everything is a function of t. Paper units map to px by the camera zoom.
- **Paper:** warm white (about `#F4EFE4`) with large-tile mottling (`soft-light`), long fibres that fade out when zoomed out
  (or they shimmer), a sparse paper-tooth speckle over the ink at close zoom, a light vignette. Cached tiles used as patterns
  anchored to the paper, so they move with the camera.
- **Ink is a filled polygon around the path,** not `ctx.stroke`: one quad per segment, each mixed with paper colour to an
  opaque tone.
  - Width = the line's base width × pen pressure × fine noise (±8%). Pressure from speed: 0.66 + 0.8·exp(−v/300), so fast is
    thin and slow is fat. Base width 2 to 3 paper units: about 3 px on screen in a wide view, about 12 px in a macro.
  - The line's voice (base width, alpha 0.76 to 0.96, tremble, dryness) can change along the path; blend over about 60 units.
  - Bleed: the same polygon slightly wider, blurred offscreen (`ctx.filter`), composited at 20 to 22%. Pooling: round dots
    where speed falls under about 45 units/s.
  - Tremble (perpendicular noise, up to about 1.1 units) and dry-brush gaps (long-scale noise plus thin bristle strands) for
    age, fear or fatigue. A stop leaves a teardrop blot: tip at the nib, belly sagging down, a dark tide line at the rim.
  - **Screen-space minimum width:** widths scale with zoom, but clamp the zoom used for width to 1.3 or more in pull-backs.
- **The pen is never drawn:** a soft blurred wedge of shadow from the nib toward the lower right (about 560 × zoom px long,
  alpha 0.15) and a 1 to 4 px contact dot. Hands appear only as shadows, each hand one flat offscreen layer.
- **Path design:** chapters are path strings, sampled by arc length, joined by tangent-continuous connectors, with time per
  point weighted by curvature.

## 3. Colour logic
- **Ink on paper.** A warm black (about `#1D1A17`) on warm white. Nothing else fills the frame.
- **One accent at most, used once,** on a stretch of the line that means something. It returns to ink afterwards and stays
  visible in the final picture. Take it from the pack's accent. Jobs: red for love or danger; blue for water or cold; gold for
  money or a prize. Never a second accent.

## 4. Type and captions
Fonts (SIL OFL): **Caveat 600** (captions, sub-lines; bundled) and **Sacramento 400** (titles; a monoline script, itself a
one-line drawing; downloaded by the font script).
- **Captions are written, like the line:** Caveat 600 at 64 px, ink at 84%, no box, in the caption lane (bottom edge y 1236,
  left edge x 120, at most 660 px wide, two lines). Each word is written on left to right as it is spoken (at least 0.2 s,
  or 17 ms a letter) behind a soft paper-coloured halo (a blurred paper-colour copy), so passing ink never crosses the
  letters. The keyword gets a hand-drawn underline. The caption fades out over 0.45 s.
- **Titles:** Sacramento, 110 to 140 px, one to three lines, written on over about 1.6 s in empty paper away from the drawing,
  and gone before the camera moves into it. An optional Caveat sub-line at 40 px or more.
- **Reading time:** hold at least max(1.8 s, spoken line + 0.6 s).

## 5. Motion quality
- **Everything on every frame** (30 fps): the appeal is the continuous act of drawing, and stepping breaks it.
- **Timing = chapter windows + curvature.** Within a window, time per point is weighted by 1 + K·turn (sharp turns get more
  time, smoothed so speed never jumps). Pin musical beats with marks: by arc-length fraction or by position ("the second time
  the pen passes here"). A stop is two marks at the same place.
- Corners (speed minima at high turn) can be exported to the soundtrack as candidate note onsets.
- **Speeds:** about 300 to 700 units/s for travelling lines, 50 to 150 for small details. The most important stroke, and the
  last one, is the slowest.
- **Retracing** over an existing line is legal and invisible: it only thickens slightly.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. The camera is one continuous move: composition centre, zoom, a few degrees of roll, and a follow
weight f (0 = composed, 1 = locked to the nib). The follow point averages the nib over about −0.55 to +0.4 s (lag and
anticipation). Travel uses f 0.6 to 0.85; composed vignettes use f 0.15 to 0.35.

| Move | What it expresses | Can serve |
|---|---|---|
| Follow the nib (high f) | travel; momentum; a thread of time | a journey; a process; a timeline |
| Composed frame (low f) | a scene that must read as a whole | a vignette; a joke; a diagram |
| Macro on the nib | intimacy; the act of making | a first touch; a signature; a detail |
| Hold with a slow push-in | weight; a stop | a loss; a doubt; a decision |
| Mirrored framing | rhyme across time | before and after; parent and child |
| Continuous pull-back | everything was one picture | a reveal; a map; a word |
| Lateral scroll, the line running ahead | a horizon; a graph; a race | a chart; a heartbeat; a road |
| Roll with the line | vertigo; play | a loop-the-loop; a fall; a dance |

No cuts. Transitions are morphs: the last stroke of one image is the first stroke of the next. The reveal is one pull-back over
about 3 to 5 s, then a 1 s hold.

**The 9:16 page** (1080 × 1920; the paper fills the whole frame, only words and key details keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | empty paper, the line passing through; no words (the app's header) |
| Title | y 330 to 830, x 120 to 888 | the written-on title, in empty paper |
| Drawing | y 410 to 1570 | the composed vignette; at the reveal the finished picture, 770 to 1150 px tall (it may run into the bleeds) |
| Nib clamp | x 150 to 780, y 320 to 1560 | a soft clamp keeps the nib here while the camera follows it |
| Caption lane | bottom y 1560, x 120 to 780 | the written-on caption |
| Bottom bleed | y 1580 to 1920 | paper, a pen shadow, lines running off the edge; no words (the app's caption and buttons) |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music: one solo instrument, one unbroken melodic line,** the sound of the drawing: a bowed or plucked string (cello, violin,
  viola, harp), a solo woodwind (clarinet, flute, bassoon), a hummed voice, or a single guitar. A second colour only as a rare
  accent (a chime, a pizzicato stretch). No pads.
- **Write the score to the drawing:** key notes on marks and corners; a fast line is short notes; a stopped line is one long
  note fading to silence; the highest note on the most important touch.
- **The pen on paper is the most important sound,** synthesised from the pen speed: band-passed noise (bright, 2.2 to 7.5 kHz,
  when fast; dull, 0.7 to 2.4 kHz, when slow), random paper-fibre ticks with density in proportion to speed, amplitude
  proportional to the square root of speed, panned with the nib's screen x, broken by dry gaps, lighter and jerkier for a young
  hand. Add a wooden tap on the first touch, a faint wet swell for a blot, a tiny rub for a handoff, a page lift.
- **Silence is literal:** zero the music bus, reverb tails included, and drop room tone to about 15%.
- **Mix:** music ducks about 5 dB and the pen about 4 dB under the voice. **Voice:** warm, few short lines that leave space,
  key words on picture beats (use the voice's word times).
- **Our presets:** closest is `warm` (92 BPM plucked strings), but this line is free-tempo. Preset to build: `solo`, one
  cello, violin or guitar line written to the pen's corners and stops, no pads or drums. **Effects:** marker (the pen), tick
  (first touch), paper (page lift, handoff), plop (the blot), chime (the rare accent).

## 8. Native moves
A menu: use the ones the story needs.
- **The pen never lifts.** Anything that is one continuous thing. *Fits:* a coffee bean from farm to cup; a bottle's refill
  loop; a skincare routine from morning to night.
- **The line is time.** The stroke's character changes with age, mood or strain. *Fits:* a sneaker fraying over its miles;
  coffee going stale week by week; skin through twelve weeks.
- **Transformation.** One image morphs into the next. *Fits:* a tangled cable into an earbud case; a wrinkle into a serum
  bottle; a seed into a cardamom pod into a tea tin.
- **Stopping is an event.** The nib stops, ink pools, the music cuts to silence for 1.5 to 3 s. *Fits:* the "wait 60 seconds" of
  a serum routine; the moment before a price; the pause before the first sip.
- **Reverse-designed scale reveal.** Every vignette is secretly part of one picture seen at the end. *Fits:* a founder's
  milestones forming the logo; a recipe's steps forming the dish; seven products forming one face.
- **Handoff.** The pen passes to another hand (as a shadow) and a new line begins. *Fits:* a founder to a customer; a
  grandmother's recipe to a granddaughter; a gift from giver to receiver.
- **Line as graph.** The line becomes a chart while staying a drawing. *Fits:* freshness falling after roasting; a sleep score
  over 30 days (the brand's own numbers); a heartbeat settling.

## 9. Pitfalls of the medium
- **Stray connectors ruin a reveal:** every extra line reads as a wrinkle, beard or mask. Fix the topology (where each chapter
  enters and leaves). Plan it like an Euler path: a closed motif is a circuit, so retrace or reorder chapters. Draw each region
  of the final picture exactly once; connectors fall on natural lines of that picture.
- **Test the reveal early and often:** render the whole path at once at final scale after every change.
- Lines drawn too close braid together once width is applied: keep a gap of about 5 units. A round blot reads as a mole: make
  it a sagging teardrop. Thin lines at wide zoom: clamp the width zoom.
- Translucent hand shadows double-darken where they overlap: one layer per hand.
- Titles collide with the drawing as the camera moves: check every frame of the title's window. Speech-to-text mishears short
  lines: rephrase them.
- The traced product outline must match the photo's cut-out edge, or the reveal shows a gap or a spill.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each
on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `parse(d)`, `sample(path)` | path strings as points at equal arc length | a small parser for M, L, C, Q, Z (absolute and relative); flatten curves, resample by arc length; Hermite connectors between chapters |
| `timeline(chapters)` | time per point | weight 1 + K·turn, smoothed; marks by arc fraction or position; holds for stops |
| `ink(pts, voice)` | the line | one quad per segment mixed with paper to an opaque tone; pressure, ±8% noise, bleed, pooling, tremble, dry brush, accent stretch, minimum screen width; a stop is a teardrop blot (tip at the nib, belly sagging down) |
| `paper(cam)`, `penShadow(nib)` | paper, fibres, tooth, vignette; the pen's shadow | cached tiles anchored to the paper, `soft-light` mottle; a blurred wedge at alpha 0.15 and a contact dot; each hand shadow one offscreen layer |
| `nibCam(keys)` | the following camera | composition keys, nib average over −0.55 to +0.4 s, soft clamp to x 150 to 780, y 330 to 1230 |
| `writeOn(words, t)` | captions and titles written on | left-to-right clip per word on the voice's word times; blurred paper halo; underline stroke |
| `outlineReveal(P)` | the real photo inside the traced outline | trace the cut-out's alpha edge into a path, draw the line along it, clip the photo to it and wipe it in over 0.5 s |

The source samples SVG paths with the browser's `SVGPathElement`. There is no DOM here: write the small parser and the
arc-length sampler yourself. Ink bleed uses `ctx.filter = 'blur()'` on an offscreen layer.

## 11. Variation space
You decide what the line draws, whether it reveals one final picture, where it stops, the accent (or none), the opening and the ending.
- **Reverse design:** draw the final picture first, cut it into chapters, then design each chapter to read as its own scene in
  close-up and as a part of the final picture (one picture to end on, 6 to 8 moments that become its parts).

Far from a plain life story:
- **Structures:** a line that is a graph (a data series drawn as a horizon, each peak and trough a scene); two lines that
  start in opposite corners and alternate until they meet; a loop (the line retraces to the start, which now means something else).
- **Openings:** mid-line at speed; a finished drawing whose line unravels into the story; a word in script whose last letter
  becomes the first scene.
- **Endings:** the line runs off the edge and keeps going; the ink runs out and the last stroke fades to dry scratches; the pen
  stops in mid-air before the last stroke.

## 12. The product and brand fit
- **The product:** the line traces the product's outline, then the real photo fills it. Trace the outline from the photo's
  cut-out edge so the photo fits exactly. The photo is never redrawn, inked over or tinted, and its label stays readable.
- **Brand fit:** calm, human, craft-led brands: jewellery, skincare, stationery, founder-led food and home. Avoid it for loud,
  price-led or many-claim reels (it carries one idea), and for packs too busy to trace.
