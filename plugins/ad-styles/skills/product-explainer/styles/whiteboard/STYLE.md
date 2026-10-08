# Whiteboard

> An explainer drawn live on one glossy dry-erase board: single-line handwriting written stroke by stroke, floating markers
> with no hand, magnets that move, an eraser that can rewind, and a camera that travels across the board instead of cutting.
> **Its power for a brand:** the viewer watches the reason appear in order, with arrows and logic, so a claim is explained,
> not asserted.
>
> References (grammar only, never copy): lecture-animation videos drawn on one continuous board; short physics explainers
> where one sentence is one drawing; phasing music (two copies of one figure at two tempi). Nothing is copied.
>
> Adapted from lemo-opuscar `styles/whiteboard/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **One physical whiteboard.** Everything the viewer learns is drawn in dry-erase marker in front of them, in handwriting order.
- **The board is a map:** each idea has its own region and the camera travels between them, often led by the pen. Distance on
  the board is distance in the argument. A 25 to 45 s reel needs two or three regions.
- **Real marker, not animated text:** ink pools where the nib lands, dry streaks and speckle, strokes overshoot and don't quite
  close, ghosts of old lessons remain, a glossy sheen drifts slower than the board, and every stroke makes a sound.
- **No hands.** Markers float with a cast shadow that grows when they lift, park outside the frame between phrases and fly
  back in. Magnets and the eraser move on their own. Never draw a hand, an arm or a cursor.

Not Blueprint (no blue sheet). Not Crayon Picture Book (no wax, no children's story). Not kinetic type: text is handwritten
stroke by stroke, never animated as blocks.

## 2. Materials and rendering
Canvas 2D in this skill's runtime; everything is a function of t.
- **Board:** a warm white gradient, a cached scuff and micro-scratch tile, a few dozen **ghost marks** (old words, circles,
  arrows) at 5 to 10% in grey or pale blue, and a diagonal **window sheen** (a skewed gradient band, white at 10 to 16%) moving
  at about 0.35× the camera. This one detail sells "glossy".
- **Ink layer:** strokes at alpha about 0.94 go into a transparent offscreen layer, composited over the board with `multiply`
  so overlaps darken like real marker. Width 6 to 11 px for drawing, about 13% of the cap height for lettering.
- **Stroke character:** resampled every 0.6 × width; a low-frequency wobble along the normal (±2.6 px, wavelength about 220 px)
  plus a finer tremor; chisel width by direction (0.8 to 1.0); a pressure ramp at the start (0.72 to 1) and a 12% taper at
  the end. Circles start at an angle and **overlap past closure**; a rectangle is four strokes with corner overshoot; a
  darker pooled dot sits *inside* the start of long strokes.
- **Dry-marker texture:** a 512 px tile of speckles and short streaks removed from the ink layer with `destination-out`,
  locked to board space, faded out when the camera is wide.
- **Lettering:** a single-stroke hand in stroke order, each glyph with ±2° rotation and ±3.5% baseline and scale jitter.
  Missing symbols (× → ✓ ≈ ² °) are defined by hand; a sub-width stroke (a period) renders as a dot.
- **Props:** white-barrel markers with a colour band and cap, a felt eraser, glossy magnets (radial gradient, specular
  highlight, soft shadow). Frame, tray and wall show only if the camera passes the board edge.
- **The real photo** is taped to the board and drawn after the sheen (section 12).

## 3. Colour logic
- **Three marker colours at most,** each with a meaning held for the whole film: a dark ink for things and structure, one
  for signals, measurement or process, one accent for the thing that matters (one accent per region).
- **Monochrome variant:** all dark ink, one element in the accent (the "only colour").
- Ghost marks and board stay neutral. The accent appears on no prop except its own marker cap and the hero magnet.
- **Take the accent from the pack's main colour.** Example sets: black `#23262c` / blue `#2a5cb3` / orange `#d97757`; navy
  `#1f2a44` / teal `#1f8a8a` / purple `#7a4fb3`.

## 4. Type and captions
Font (SIL OFL), downloaded by the font script: **Architects Daughter 400** for all board text (thinned to a single stroke,
section 10) and for captions.
- **Titles and the end card** are written on the board in the same hand: 130 to 150 px, one to three lines of about 10
  characters. Labels 40 to 90 px, notes 36 px or more. A label is fully in or fully out of every shot. Writing finishes on
  the word: a term appears exactly when the narrator says it. No board writing between y 1080 and y 1250.
- **Captions are a burned-in label:** an off-white rounded label (about 90%), Architects Daughter 400 at 56 px in dark ink, a
  short accent marker dash at its left. Bottom edge y 1236, left edge x 120, at most 660 px wide, split at clauses, 20
  characters a line, two lines. Words light up as spoken (unspoken at 45%); the dash slides under the keyword.
- **Reading time:** hold at least max(1.8 s, spoken line + 0.6 s).

## 5. Motion quality
- **Hand speed:** every stroke follows a slow-fast-slow curve, `u − sin(2πu)/2π × 0.8`. Strokes are scheduled into a **time
  window** and the engine solves the speed, so writing always finishes on time.
- **Pen hops** lift in proportion to distance (up to 35% of the window; the shadow slides and blurs). A gap over 0.75 s sends
  the pen off-frame to park; it returns 0.42 s before its next stroke.
- **Magnet:** a drop takes 0.3 s with a shrinking shadow; a slide has a small lift; a sink is a 0.5 rad tilt and a 40 px drop.
- **Eraser:** constant speed along a path, a band 90 to 230 px wide at about 90% strength (a 10% ghost always remains).
- **Speed:** faster than real hands, never so fast the stroke order is lost: a label 0.3 to 0.8 s, a title up to 3 s (1.5 s in a reel).
- **Camera** moves every frame, with motion blur above about 14 px a frame: average sub-frames (at most 4 px apart, up to 12).

## 6. Camera grammar and the 9:16 page
A 2D camera over a large board (for portrait, about 6000 × 6000 units): position and zoom, interpolated in 1/z so pushes feel
like dollies, plus a little roll. A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Pull back from a tiny drawing | scale | a surprising size; context |
| Ride the line the pen is drawing | one idea leads to the next | a transition; a process; a path |
| Hold still | read now | an equation; a definition; a list |
| Whip to a new region | a new idea after a pause | a twist; a "but" |
| Return to an earlier region | a callback, for free | reusing a result; a comparison |
| Split view of two regions | two things at once | a duet; before and after |
| Slow push into one symbol | this term is the point | a unit; a variable; a name |
| Track along a long diagram | sequence, time | a timeline; a pipeline; a journey |
| Pull back past the board edge to the wall | the whole lesson as one picture | a summary; a scale jump |

No cuts on the board; if one is needed, it is a whip. In portrait, stack a region's ideas top to bottom and ride the line down.

**The 9:16 page** (1080 × 1920; the board fills the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | board, ghost marks, sheen, the parked pen; no words (the app's header) |
| Title or claim | y 280 to 720, x 120 to 888 | the written title or claim, up to three short lines |
| Drawing and hero | y 410 to 1580 | the beat's drawing or the taped photo, 770 to 1150 px tall in its main shot; labels of 40 px or more; the photo's label above y 1350 |
| Caption lane | bottom y 1560, x 120 to 780 | the off-white caption label |
| Bottom bleed | y 1580 to 1920 | the lower board, ghost marks, the tray in the final pull-back; no words (the app's caption and buttons) |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Every stroke sounds:** band-passed felt-on-gloss noise (hiss about 2 to 7.5 kHz plus body about 0.5 to 1.5 kHz) shaped by
  the stroke's speed curve, a tiny nib tick at the start, stick-slip grains, and on about 28% of long strokes a **dry-erase
  squeak** (a 1.5 to 2.6 kHz sine, 7 to 13 Hz vibrato). Each colour sounds slightly different. Pan = the stroke's screen x.
- **Props and room:** a magnet on steel = a click, metal modes (about 830, 1370, 2210, 3120 Hz) and a 140 Hz board thump; the
  eraser = a 250 to 2600 Hz felt rub; cap off and on. Low room tone; one ticker (a wall clock) can own a silence.
- **Music options:** a solo piano figure; a jazz trio with brushes; plucked strings and kalimba; a synth arpeggio; clockwork
  minimalism (marimba, pizzicato, woodblock, glockenspiel). Add one instrument per step of a mechanism; stop into silence
  before a surprise; play two copies of one figure at two tempi for anything that diverges, snapping into unison when resolved.
  Cues: a rising whistle for growth, pings for signals, a harp run for a fall. Voice on top, music ducked, foley about 11 dB under.
- **Our presets:** closest are `warm` (plucked strings) for a calm board and `dossier` (marimba pluck, a `drop` silence before
  the twist) for a brisk one. Preset to build: `clockwork`, marimba 8th-note arpeggio, pizzicato strings, woodblock tick,
  glockenspiel, kalimba, 100 to 120 BPM, one instrument added per step. **Effects:** marker (every stroke), tick, click
  (magnet), thud (board, drop), swish (eraser), tape (the photo), pop (cap), chime, ding, rise, whoosh (a whip).

## 8. Native moves
A menu: use the ones the story needs.
- **Writing in stroke order.** The reveal is the explanation: a formula term by term as it is spoken. *Fits:* a coffee
  recipe's ratios; a skincare active's percentage; a protein bar's macros as a sum.
- **The pen leads the camera.** Transitions are drawn lines the camera rides. *Fits:* a parcel's route to the door; a tea
  leaf's journey; an ingredient crossing the skin's layers.
- **Magnets.** The only things that move: give the hero to a magnet. *Fits:* a pack magnet sliding along a routine's steps; a
  bottle sinking in "before" and rising in "after"; a box crossing a map.
- **The eraser rewinds.** Wiping a trail backwards undoes time. *Fits:* wiping a stain away; rewinding a day of frizz; undoing
  a sugar crash with another snack.
- **Two pens at once.** A live duet of two quantities. *Fits:* sugar in a usual bar against ours; a ten-step routine against a
  three-step one; two brews cooling at two speeds.
- **Ghosts of the old lesson.** A faint earlier drawing becomes relevant. *Fits:* the old ingredient list under the new one;
  last year's recipe under the reformulation; "usual way" faded under "our way".
- **The full-board view.** Every region seen at once as one picture. *Fits:* a routine's five steps; a farm-to-door supply
  chain; the ingredient story as a map.

## 9. Pitfalls of the medium
- **One pen, too many jobs** drifts later and later: give each drawing a deadline window; overlapping jobs go to another pen.
- **Dashes** (60 dashes × a minimum stroke time) take seconds: give them their own tiny floor.
- **A pooled-ink dot bigger than the stroke start** leaves halos on every letter: keep it inside the stroke.
- **Punctuation vanishes** (a period is a 1 px stroke): render sub-width strokes as dots.
- **Labels half-cut by a push-in, motion blur with few sub-frames, eraser paths over labels** all look sloppy: a label is fully
  in or fully out; sub-frames at most 4 px apart; keep erasers off labels you want. Match a voice's language code to its phonemes.
- **Writing, tape or the sheen over the photo's label** hides it: tape the top corners, draw the sheen first.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each
on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `stroke(pts, o)` | a marker stroke | resample at 0.6 × width; wobble ±2.6 px plus tremor; chisel width 0.8 to 1.0; pressure 0.72 to 1; 12% taper; pooled dot; ribbon into the ink layer |
| `shapes` | line, curve, poly, arc, circle, rect, arrow, dashed, hatch | circles start at an angle and overlap past closure; a rect is 4 strokes with overshoot |
| `strokeFont(str, o)` | single-stroke handwriting in writing order | thin each glyph of Architects Daughter 400 (Zhang-Suen on an `ImageData` raster, about 192 px), chain pixels into strokes from the top-left end, smooth, cache per glyph |
| `draw(pen, shapes, t, by)` | scheduling to a deadline; the floating marker | speed solved per window on the slow-fast-slow curve; hops; parking; the pen's shadow grows with lift |
| `board(cam)` | board, ghosts, ink layer, sheen | gradient, cached tiles, ghosts drawn once; ink layer by `multiply`; dry tile by `destination-out`; sheen at 0.35× camera |
| `magnet`, `eraser` | glossy magnet; felt eraser | radial gradient, specular dot, soft shadow; eraser = `destination-out` at 0.9 along a 90 to 230 px band |
| `camera(keys)` | the travelling camera | position and zoom keyed, zoom in 1/z, roll; sub-frame averaging past 14 px a frame |
| `captionLabel(words, t)` | the off-white caption label | rounded label at 90%, accent dash, word light-up |
| `tapedPhoto(P)` | the real photo taped to the board | two translucent tape strips at the top corners (±3°), a small soft shadow; drawn after the sheen |

The source uses a ready-made single-line font (EMS Tech, SIL OFL, not a Google font): use it if the project vendors it,
otherwise thin Architects Daughter. Motion blur is sub-frame averaging into an offscreen canvas.

## 11. Variation space
You decide the topic's object, the board layout, the colours, the voice, the music, the camera route, the opening, the ending
and the length. The handle: one object the viewer owns, one number that surprises, one consequence you can walk across the
board, with the surprise in the middle after a silence.
- **Structures:** a proof (one claim on top, the board fills downward, each step boxed when proven); a debate (two pens, two
  halves, drawings that meet); a timeline (one long line ridden top to bottom).
- **Openings:** a huge question mark that shrinks to a dot in the first diagram; an erased board with a wrong answer's ghost; a
  magnet dropping on an empty board with a clack.
- **Endings:** the answer circled twice and the pen capped; the board wiped except one line; a push into the smallest symbol,
  which becomes the title.

## 12. The product and brand fit
- **The product:** the real photo taped to the board (two tape strips, a small soft shadow), drawn after the sheen. It is never
  inked over, erased or tinted; circles and arrows may point at its label from outside but never cross it. Show it big once.
- **Brand fit:** brands with a mechanism or claim to explain: haircare, supplements, skincare actives, food. Avoid it for pure
  mood, luxury or festive stories, and for claims that don't fit three steps.
