# Isometric Infographic

> A system diagram comes alive: an isometric diorama of flat three-tone blocks, thin ink labels and rows of identical
> icons, where things open up to show their insides and numbers are drawn, not stated. **Its power for a brand:** it shows
> scale and process (where it is made, how it travels, how many) as one small world the camera moves through.
>
> References (grammar only, never copy): true-isometric architecture in flat colour blocks (three fixed tones per face, a
> camera that never breaks the projection); city-builder cutaway dioramas (a floating board with soil strata); animated
> science explainers (one visual metaphor per step, a change of scale when a number is too big to feel); pictorial
> statistics in the Isotype tradition (identical icons stand for a quantity); continuous dives through nested scales.
>
> Adapted from lemo-opuscar `styles/iso-infographic/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **Flat, true isometric.** No perspective, no outlines on solids; shapes are separated only by the three tones of each
  face. The projection never rotates or tilts.
- **Infographic furniture is part of the picture:** leader lines, label pins, dashed cut lines, hatched section faces,
  tracking rings, a legend and a route line all live in the world.
- **Numbers are built from icons** (Isotype), and they add up. This style lives on credibility.
- **A diorama:** the system sits on a floating board or plinth, with a cross-section visible at its edges, on a pale
  ground.

Not low-poly 3D (no perspective, no lighting beyond three face tones). Not a flat 2D explainer (everything has isometric
depth). Not a blueprint (colour blocks, not line drawings on blue).

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia: no browser, DOM or SVG filters). Every
element is a pure function of t.
- **Projection:** axes at 30°. `sx = (x − y)·cos30°·k`, `sy = ((x + y)·½ − z)·k`; x runs down-right, y down-left, z up;
  painter depth = x + y + z. Every solid queues its faces; one flush sorts by depth and fills each as a Path2D, with a
  same-colour 1 px stroke to seal seams.
- **Three tones per face,** chosen from its normal: top light, left (+y) mid, right (+x) dark. From one base: top 20%
  toward warm white, dark side 22% toward a cool dark (`#231A2C`), so shadows are slightly cool.
- **Ink lines** (2 px) only for infographic elements: leaders, pins, cut lines, rings, routes, labels.
- **The board** floats on a pale ground with a faint isometric dot lattice and a soft shadow (a cached, blurred offset
  copy). Its front faces show strata (soil, water column, floors, pipes).
- **People:** minimal billboards (round head, tapered two-tone body, thick arm stroke, no faces), at 12 fps.
- **Portrait:** a flat board is always 1.73 times wider than tall (a square board is a 1080 × 624 px rhombus at full
  width). Height comes from z: plinth strata, towers, floors.

## 3. Colour logic
- **A pale neutral ground** (cream, paper grey or pale blue) and **5 to 7 flat hues**, each with its three tones, plus one
  ink colour.
- **Colour codes meaning,** like a legend: one hue per material or role, never reused for two meanings. **The subject's hue
  is reserved:** for "this one", everything else desaturates toward warm grey and only the subject keeps its colour.
  Take the subject hue from the pack.
- A station that must be found in a wide shot gets a pale plate with a dashed ink outline and one accent hue.
- Examples: a refill loop (teal, coral, cream, steel grey, mustard); a spice route (turmeric yellow, leaf green, soil
  brown, sky blue on cream).

## 4. Type and captions
Fonts (SIL OFL, bundled): **Jost** 600 (pin titles, all caps, 0.12 em tracking), 400 (numbers), 500 (units, captions),
700 (extruded title words).
- **Labels:** pin titles 40 px; numbers 96 px with units at 48 px. Text has a 7 px halo in the ground colour (a 14 px
  round-join stroke under the fill) so it reads over any block.
- **Label pins:** dot (ink ring, pale fill) → vertical leader → horizontal rule → text. Pins point up, down, left or
  right so labels never cover the subject and stay left of x 780 below y 840.
- **The caption is a map label:** a pale card (10 px radius, 2 px ink border), a tiny iso cube as the legend chip, Jost
  500 at 56 px, in the caption lane (bottom edge y 1236, left edge x 120, at most 660 px wide). The border draws first
  (0.2 s), then the text wipes in. The words light up as they are spoken: unspoken words at 45%.
- **Reading time:** every caption or title holds at least max(1.8 s, its spoken line + 0.6 s), and about
  (letters ÷ 15 + 1.5) s after it lands. Lines never overlap titles or other lines.
- **The end frame can be the legend:** title, total, the Isotype key and the real product photo, with "NOT TO SCALE".

## 5. Motion quality
- **Nothing moves without a line leading it:** a route line is drawn slightly ahead, a leader grows before an inset opens,
  a cut line draws before a skin slides away.
- **Cutaway:** cut line (0.3 s), then the near skin slides out along its normal and fades (0.35 s, ease-out, alpha 1 to 0
  between 10% and 75%), then hatched rims fade in over the last 40%.
- **Isotype fill:** icons pop with a back ease (overshoot 2.2), one per sixteenth note; count-up numbers run over the same
  span.
- **Accumulation = acceleration:** arrivals on quarter notes, then eighths, then waves. Solids arrive by motion, never by
  alpha (see-through blocks look like ghosts).
- **Objects perform:** squash on landing (about 18%) and small bounces; colour changes that show a process (raw to cooked,
  empty to full). Vehicles follow polylines with ease-in-out and face their tangent.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. The camera is a world centre plus a **log-interpolated zoom** k (px per unit); the projection
never changes. The opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Follow along a route | process; cause → effect | a supply chain; a journey |
| Hold wide + circular inset | the system and the individual together | one worker in a factory |
| Push through nested cutaways | a fall into scale; one thing among millions | a needle in a haystack |
| Fast log pull-out | release; the big picture after a detail | a statistic made physical |
| Locked frame while things accumulate | a system filling up; overload | a queue; traffic |
| Lateral follow over emptiness | a breath; distance | an ocean; a wait |
| Top-to-bottom tilt through strata | layers; depth; history | a city's underground; a software stack |
| Switch boards | before/after; here vs there | two cities; two designs |

The subject is at least 1/3 of the frame height at key moments; labels never cover it; the caption lane stays clear.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame. Words and key details keep to x 120 to 888,
y 260 to 1580, and left of x 780 below y 1100):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | sky, flat clouds, tall objects rising off the top; no words |
| Label row | y 270 to 630, x 120 to 888 | one label pin (title, number, unit, Isotype row) pointing down to its station |
| Hero | y 440 to 1580, bleeding past it | the diorama block: board, station, route, tracked-subject ring. Main shot: 780 to 1000 px tall (40 to 52%) with its plinth strata |
| Caption lane | bottom at y 1560, x 120 to 780 | the map-label card |
| Bottom bleed | y 1580 to 1920 | the board's strata front faces, soil, water column; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music:** acoustic and light: kalimba, marimba, nylon guitar, pizzicato, woodblock and hand percussion, upright or
  synth bass, glockenspiel; or a clean electronic pulse for technical systems. A short motif can mark the subject.
- **Techniques:** one sound per icon as numbers fill; instruments dropping out as the camera dives; J-cuts 0.5 s early.
- **Foley by material:** fibre snap, fleshy thud, grains pouring, steel partials for containers, paper tear, ceramic
  plink, a liquid pour with rising pitch, servo whine, keyboard clicks. One ambience bed per station, crossfaded.
- **Silence:** digital zero or one faint sound; the first sound after it is one of the most important. **Mix:** music
  ducked 8 dB under the voice, ambience 7 dB (beds at 2.5 to 7 kHz very low under speech), -14 LUFS.
- **Our presets:** closest is `warm` (92 BPM plucked strings); `bright` (108 BPM) suits technical systems. Effects: `pop`
  (icons), `tick` (cut line), `whoosh` (skin slides), `thud` (landing), `pour`, `click` (machines), `ding` (arrival),
  `chime` (ring), `sparkle`. No new preset needed.

## 8. Native moves
A menu: use the ones the story needs.
- **Cutaway.** Cut line, skin slides away, hatched rims remain. *Fits:* a mattress's layers; a serum pump; a protein bar.
- **Isotype number.** Identical icons in a new arrangement each time. *Fits:* orders as icons; litres of water per kilo of
  cotton; tea leaves forming a cup.
- **Focus + context.** Everything greys except the subject. *Fits:* your order among a day's parcels; one batch in a
  warehouse; one leaf on an estate.
- **Frame within the frame.** A leader grows into a circular inset. *Fits:* a spice grinder's burr; a loom's weave; a pouch
  seal.
- **Scale reveal.** Pull back until every label is on screen and the last frame is a finished infographic. *Fits:* a
  farm-to-pack route; a dark-store network; a refill loop.
- **Tracked subject.** One object followed with a "you are here" ring. *Fits:* a parcel from click to doorstep; a drop of
  oil from press to bottle; a refill jar.
- **Strata cross-section.** The board's edge is the story. *Fits:* a sole's layers; a moisturiser's formula; a mine of
  clay for a pot.

## 9. Pitfalls of the medium
- Face culling depends on vertex order → give every face an outward hint and flip the normal to match before culling.
- Painter sorting breaks on composites → draw them as one ordered item; add a depth bias for overhangs.
- See-through moving solids look like ghosts → motion only, no alpha.
- World geometry behind a close-up becomes giant discs; a pull-out through a tall object gives one ugly frame → skip detail
  above a zoom threshold and fade tall objects in by zoom.
- The product photo sheared into the iso plane, or greyed by focus + context → it stays a flat card with its own colours.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test
each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `Iso(g, cam)` | the projection and the depth-sorted queue | `P(x, y, z)` as in section 2; queue faces, sort by x + y + z, flush; zoom k interpolated in log space |
| `box`, `prism`, `cyl`, `roof`, `shape(pts, z, depth)` | solids, and any 2D outline extruded into one | one Path2D per face filled by its normal's tone; 1 px same-colour stroke seals seams |
| `board(iso, size, strata)` | the floating board, strata, dot lattice, soft shadow | cached layer; shadow = offset copy under `ctx.filter = 'blur(28px)'` |
| `pin(g, x, y, o)` | a label pin with a 7 px halo | halo stroke first, then fill; a 0..1 reveal grows the leader, then wipes the text |
| `cutaway(iso, region, t, at)` | cut line, sliding skin, hatched rims | dashed line over 0.3 s; skin along its normal over 0.35 s; hatch = diagonal ink lines clipped to the face |
| `iconGrid(g, n, lit, o)` | rows of identical icons that add up | back-ease pop (overshoot 2.2), one per sixteenth; count-up on the same span |
| `billboard(iso, P, x, y, z)` | the product photo as a flat card in the world | `P.draw` at the projected base point, scaled by k, never sheared, never desaturated |

## 11. Variation space
You decide the system, the board (or several), whether there is a tracked subject, the numbers, the camera path, the
opening and the ending. Far from the original demo:
- **Structures:** one building, floor by floor (a tilt down through a cutaway tower); two boards compared; a cycle (a loop
  route that returns with one number changed each lap).
- **Openings:** the finished infographic, which then comes apart; one icon that multiplies until it is the landscape; a
  question written as an isometric title on an empty board.
- **Endings:** an unanswered station (the route stops at an empty plate); the legend alone, the board faded out; a close-up
  of one icon with the whole number behind it out of focus.

## 12. The product and brand fit
- **The product:** the real photo as a flat billboard on a shelf, a truck or a sign in the world (`billboard`). It is never
  redrawn, sheared, filtered or covered, and its label stays readable. Show it big at least once (the end card).
- **Brand fit:** brands with a real process or promise (refill, fast delivery, sourcing). The numbers must add up.
