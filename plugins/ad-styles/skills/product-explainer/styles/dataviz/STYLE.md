# Data Storytelling

> A chart that tells a story: real numbers, drawn mark by mark on cream paper by a red-and-blue pencil, with handwritten
> notes pinned to the data. The chart is the camera, the rhythm and the plot. **Its power for a brand:** it makes one
> number or trend visible, so a claim becomes a line that suddenly changes.
>
> References (grammar only, never copy): animated bubble-chart lectures (one dot is a character); climate-stripe graphics
> (a diverging ramp on a reference mean, no axes); scrollytelling data journalism (one idea at a time, growing axes,
> pinned notes). Copy none of their charts, layouts or typefaces.
>
> Adapted from lemo-opuscar `styles/dataviz/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this skill's
> runtime. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

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
- **The chart is the film.** Every mark is a real number. Every movement is a chart operation: a mark lands, an axis
  grows, the scale changes, a series morphs, a note is pinned.
- **The data is real and traceable.** You change the framing, never the numbers. In a reel the numbers are the brand's own
  published data or an open dataset, and the source is printed in the kicker.
- **Three layers make a story:** a human scale (notes pinned to marks), a performer (a pencil draws every mark) and
  sonification (each mark is a pitch, so the trend is heard before it is read).

Pick the chart the data asks for:

| The data is about | Chart |
|---|---|
| comparing categories, rankings | bars, a ranked bar race |
| a relationship between two measures | scatter or bubble chart |
| place | map, dots on a map |
| parts of a whole, counts of people | unit or waffle chart |
| before → after | slope or dumbbell chart |
| a distribution | histogram, beeswarm |
| where things go | flow or Sankey |
| change over time | line or dot series, stripes, area |

Not a dashboard (one idea at a time). Not a keynote with charts (no slides). Never decoration.

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia: no browser, DOM or SVG filters). Every
element is a pure function of t.
- **Paper** is fixed in world space: warm cream, fixed-seed fibre noise, a faint 24 px dot grid. Build one cached tile
  (upscaled low-resolution mottling, ±6 per-pixel noise in an ImageData pass, seeded fibre hairlines).
- **Marks:** dots (r 6 px) carry a thin ink ring (1.5 px) so pale values show on cream. A mark lands with a short pop
  (0.25 s, ×1.55) and a thin ripple; no ripple when marks arrive closer than 0.1 s.
- **Pencil strokes** (axes 1.5 px, series 2.4 px; grid 1 px and zero line 1.3 px in pale warm grey): 2 or 3 passes of one
  polyline with seeded wobble (up to 1 px), tapered ends and graphite grain; the write-on is cut at a length along the path.
- **Handwriting** (Caveat): per-glyph jitter (±1.7°, ±2.5% baseline), 16% of pixels knocked out (`destination-out` noise
  tile), written on as the tip dances over the x-height. Leaders are wobbly curves ending in an **un-closed** ring.
- **The red-and-blue pencil:** hex body, blue half, red half, sharpened wood cone. Only the tip end shows, from the lower
  right. Its shadow drifts farther and softer as it lifts (a blurred offset copy).
- **Layout:** a plot box fixed in world space; a **memory zone** (paper left of the first mark) for early notes; every note
  pinned in **data space** (value + pixel offset), so rescales keep the layout.

## 3. Colour logic
- Colour encodes **one thing: the value.** Diverging data uses an RdBu-family ramp centred on the mean of a meaningful
  reference period, with a symmetric span. Data with no natural centre uses one sequential ramp. All else is ink on cream.
- **Honesty beats drama:** pale values stay pale. Never stretch a ramp to make a change look bigger.
- The two pencil leads have meanings: **blue for memories and human notes, red for records and warnings.** A change of
  lead marks a turn.
- **One accent colour** may bypass the ramp for a mark that is not data. In a reel it is the pack's accent, used only for
  the brand's own mark.

## 4. Type and captions
Fonts (SIL OFL): **Newsreader** (600 headline, 500 captions), **IBM Plex Mono 500** (ticks, kicker), **Caveat 700** (notes).
- **Chart headline:** Newsreader 600, 84 to 100 px, one or two lines, left at x 120, in world space above the data. It
  fades when the camera is close and returns with the full view.
- **Ticks and kicker:** IBM Plex Mono 500, 40 px, at most 6 ticks per axis. **Notes:** Caveat 700, 52 px.
- **The caption is the figure caption:** Newsreader 500, 56 px, in the caption lane (bottom edge y 1236, left edge x 120,
  at most 660 px wide, up to 3 lines) on a paper-colour band, with a hairline rule above it and a mono kicker above that
  (the range drawn so far, the data source). The words light up as they are spoken: unspoken words at 45%, spoken words in
  ink, the keyword in the current lead colour. No caption over a signature chart operation or a silence.
- **Reading time:** every caption holds at least max(1.8 s, its spoken line + 0.6 s), and about (letters ÷ 15 + 1.5) s
  after it lands.

## 5. Motion quality
- **The rhythm of the data is the rhythm of the film.** Map marks onto a musical grid. To accelerate, divide the beat
  instead of changing tempo. Pick a tempo whose finest note is a whole number of frames: at 30 fps, 75 BPM gives 3 frames
  per 1/32 note and 112.5 BPM gives 2.
- **Pencil acting:** lift before each tap, land with the shadow meeting the tip, a tiny rebound. Hurry as data densifies;
  tremble like a seismograph needle at a peak. It can **flinch** (recoil, freeze half a beat, flip to the red lead in
  0.5 s), **hesitate** (hover before a mark) and **exit** (hand the story to the viewer).
- **Rescale** reads as ratchet clicks: stepped, each step eased (4 steps on 1/32 notes, 0.09 beat each). A calm one is smooth.
- **Morph:** a staggered sweep (about 0.85 beat); each mark eases into its new form; notes return as tiny marks.
- **No fades to blank, no dissolves.** Transitions are chart operations: axis growth, pull-backs, rescales, morphs.

## 6. Camera grammar and the 9:16 page
A 2D camera `{x, y, zoom, roll}` over **one sheet of paper**. A film is one take; a hard cut is rare and meaningful. A
vocabulary, not a route; the opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Extreme close-up on one mark, following its leader | one fact, one life | a single case; a named person |
| Full view first, then dive to one mark | the pattern before the case | a familiar trend; a myth to correct |
| Pull back as axes grow out of the marks | the frame arrives with the unit | naming the measure |
| Track the pencil, newest mark at about 60% of the width | past behind, future ahead | a series in time; a race |
| Pedestal with rising data, a Dutch angle creeping in | escalation, unease | runaway growth; a debt |
| Punch-in over 2 frames, decaying shake, jolt on rescale | surprise, a broken frame | an outlier; a crash |
| Fast pull-out, roll, small constant tremor | a rush | a boom; a cascade |
| Locked off | the transformation is the movement | a morph; a slow reading |
| Hold on one mark, then pull back | the part inside the whole | a verdict; context |
| Pull and pan to add more real data | scale switch | a longer record |
| Lateral pan across the memory zone | recollection | a biography; a timeline |

Subjects fill at least 1/3 of the frame height at key moments. A scrolled-off axis pins its ticks to a paper strip.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame. Words and key details keep to x 120 to 888,
y 260 to 1580, and left of x 780 below y 1100):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | paper, dot grid, a series or axis running off the top; no words |
| Headline | y 280 to 580, x 120 to 888 | the chart's headline, over the plot's empty top band |
| Plot | y 380 to 1480, x 120 to 888 | the plot box, 768 × 800 px in world space (42% of the frame at zoom 1). Keep the top fifth of the value range empty for the headline |
| Notes | in data space, left of x 780 below y 1100 | handwriting and leaders; early notes sit in the memory zone, where the camera pans |
| Caption lane | bottom at y 1560, x 120 to 780 | kicker, rule and figure caption |
| Bottom bleed | y 1580 to 1920 | paper; the pencil's body enters from the lower right; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Foley is graphite, paper and wood:** pencil taps, handwriting scratches, a ruler hiss for axes, a paper puncture for a
  broken frame, a wooden click for the flip, ratchet teeth for a rescale, a paper sweep for a morph.
- **Sonification is the music:** pitch = value, rhythm = time density. Low values snap to a pentatonic scale, middle ones
  to semitones, extreme ones are unquantized, with detune growing away from the reference. Timbre: a low-pass-gate
  "plonk" (sine plus FM, index rising with the value).
- **Silence is a tool:** true digital silence before a key mark, a morph or a verdict. The first sound after it matters
  most. The voice never talks over a rush, a silence or a morph. **Mix:** music ducked about 11 dB, -14 LUFS.
- **Our presets:** closest is `calm` (76 BPM pad). Effects: `tick`, `marker`, `swish`, `snap`, `click`, `crinkle`, `rise`.
  Preset to build: `sonify`, a low-pass-gate plonk voice driven by the data, a detuned-saw pad, soft kick, 75 or 112.5 BPM.

## 8. Native moves
A menu: use the ones the story needs.
- **One mark = one fact.** *Fits:* a store's first order; a roast's first batch; the first customer review.
- **Axes grow with the story.** The y axis arrives when the narration names the unit. *Fits:* grams of sugar per 100 g;
  days since roasting; weeks of a skincare trial.
- **Pinned annotations.** Their content and colour carry the arc. *Fits:* a 12-week hair trial noted at weeks 2, 6, 12; a
  freshness curve marked "peak" and "stale"; a price over three years.
- **Breaking the frame.** The chart makes room; the torn edge stays as a scar. *Fits:* a sugar bar that runs off the chart;
  a restock spike; a record sale day.
- **Encoding morph.** Bars into a waffle, a map into a ranking, a line into a slope. *Fits:* 100 g of a snack as 100
  squares; cities ranked by orders; daily use as a year strip.
- **Scale switch.** One value, then the series, then a longer real record, never extrapolated. *Fits:* one week then the
  12-week curve; one batch then a year; one order then ten years.
- **The empty next cell.** A dashed slot for the value nobody knows yet. *Fits:* next month's restock; your week-12 result;
  the next flavour.

## 9. Pitfalls of the medium
- Select data columns by header name, never by index. Print every fact the narration claims.
- A frame break rescaled too fast is invisible → hold the pierced state at least half a beat.
- In dense passages the pencil lies across fresh marks → steepen its angle.
- A product card pinned over the last stretch of the series hides the data → pin it beside the last mark with a leader.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test
each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `paper(g, cam)` | fixed-world paper, fibre noise, 24 px dot grid | one cached ImageData tile (±6 noise, seeded fibres) under the camera transform |
| `pencilStroke(g, pts, o)` | a polyline in pencil: wobble, taper, grain, write-on | 2 or 3 seeded offset passes (up to 1 px); `destination-out` grain; `progress` cuts by length |
| `handText(g, str, x, y, o)` | handwriting (Caveat 700, 52 px), revealed left to right | per-glyph ±1.7° and ±2.5%; 16% grain; returns the tip and width |
| `dataDot(g, x, y, r, fill, fresh)` | a mark with ring, landing pop and ripple | r 6, ring 1.5 px, pop 0.25 s ×1.55; ripple only if the last mark landed over 0.1 s ago |
| `morph(g, u, ...)`, `rescale` | dots to stripes, bars to waffle; the ratchet rescale | a staggered sweep over 0.85 beat; stepped, eased steps |
| `drawPencil(g, o)` | the pencil, its tip at a point | hex body, blue and red halves, wood cone; shadow = blurred offset copy that grows with lift |
| `productPin(g, P, mark, t)` | the real photo as the last data point | `P.draw` beside the last mark; leader and Caveat note kept off the label |

## 11. Variation space
You decide the dataset, the chart, the notes, the opening, the ending, the camera path and the pacing. Far from the original
demo:
- **Structures:** a ranked race (bars overtake; a newcomer breaks the frame); a map that becomes a count (dots fall into a
  unit chart); a before-and-after slope chart with one line left unfinished.
- **Openings:** the finished chart, then the film works backwards; the object before the axis; the question first (an empty
  plot, a handwritten question).
- **Endings:** one mark, close (a single value and its note); the chart folds back into a drawing of the thing measured; the
  headline revised (the pencil strikes a word and writes the true one).

## 12. The product and brand fit
- **The product:** the real photo pinned as the last data point (`productPin`), with a handwritten note beside it. It is
  never redrawn, filtered or covered: the leader and the pencil stop short of the label.
- **Brand fit:** brands with real numbers (trial results, lab data, sugar per 100 g). Never invent a number or round one up.
