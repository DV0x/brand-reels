# Mid-century Cartoon

> 1950s flat colour and limited animation for follow-along films: colour printed a few pixels off its broken ink line, a
> body that holds still while the hands work, colour-block rooms, a calm classroom voice, a cool-jazz combo. The film is a
> manual that performs one real use. **Its power for a brand:** it makes a routine look easy: one hand, one step, one beat.
>
> References (grammar only, never copy): early-1950s limited-animation shorts (colour and line on separate cels, geometric
> people, colour-plane rooms); 1950s classroom films (direct address, one sentence per picture); atomic-age picture-book
> art (soft complements); 1950s appliance manuals (numbered medallions, round call-outs). Nothing is copied or named.
>
> Adapted from lemo-opuscar `styles/midcentury-toon/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **A printed manual page that moves.** Flat colour and a thin ink line that breathes and never quite closes.
- **Every fill is its own "cel", printed a few px off its line** and re-rolled on twos, so the picture shimmers like
  hand-registered paint. Light dry-brush tooth, paper grain, warm vignette.
- **Geometric people:** egg or bean heads (the nose is part of the face outline), garments in two or three flat colours,
  four-finger gloves. The body is a held drawing: only arms, hands, eyes and mouth move.
- **Rooms are not drawn:** one colour plane, a floor band, a horizon line with gaps, one or two props.
- **It shows how to do, not why.**

Not 1930s rubber hose (no black and white, no bouncing world). Not a whiteboard (printed, not written). Not clean vector art.

## 2. Materials and rendering
Canvas 2D in this skill's runtime. Everything is a function of t; jitter is seeded by the frame index on twos.
- **Off-register cel:** fill the line's own Path2D shifted by (6, 4) px. The offset jitters ±1.6 px, re-rolled every second
  frame. On everything, text included; off only for a crisp diagram.
- **Ink ribbon:** a filled polygon, not `ctx.stroke`. Width 3 to 5 px with ±40% breathing from noise; 12 to 25% of the
  length skipped for breaks. Characters 4 px, props 3 to 4.5 px, plan walls 6 to 7 px.
- **Hands:** stroke every part 6 px first, then fill every part: one union outline. Finger separations 2.4 px.
- **Shading:** one flat darker plane clipped inside the shape, never a gradient. Drop shadow: the shape shifted (12, 12) in a
  paper shade at 50%.
- **Ornaments:** 4-point sparkles, 8 to 18-point starbursts, sunburst rays (30 wedges, 55% alpha), boomerangs, kidneys, dots.
- **Tooth and grain:** a cached speckle tile (`destination-out`, about 10%), a multiplied paper tile, a warm vignette.
- **Close-ups** are drawn at native scale in a round call-out (offscreen canvas, circle clip). Scaling the world triples the ink.

## 3. Colour logic
- **Warm paper ground, warm near-black ink, soft atomic-age complements.** Nothing pure or neon.
- **One ground per scene:** a lighter tint for walls (0.45), a darker shade for floors (0.16); grounds rotate. Never put the
  product on its own colour, or the presenter on their own accent.
- **The product keeps one colour all film;** the accent (garment, stars, keywords) is another hue.
- **Roles from the pack:** its main colour is the product colour (no ground matches it), its accent is the highlight.
  Example, a dark green pack with gold type: paper `#F2E7D0`, ink `#2A2321`, highlight `#E6B33E`, grounds coral `#E2643F`,
  powder blue `#86A3C4`, dusty pink `#EDB5A6`. Other families: coral / mustard / turquoise; tomato / olive / powder blue.

## 4. Type and captions
Fonts (SIL OFL): **Oleo Script 700** (kicker), **Alfa Slab One 400** (titles, numerals), **Jost 500/600** (body, labels,
captions). Jost is bundled; the font script downloads the others.
- **Kicker:** Oleo Script 700, 130 to 150 px, one or two words, written on left to right with a clip, over a colour plate.
- **Titles and step titles:** Alfa Slab One, 88 to 120 px, one to three lines, left at x 120 (about 14 characters a line at
  88 px), ink over a colour plate offset 4 to 7 px.
- **Step header:** an ink disc 120 px across with a paper numeral (Alfa Slab One 72 px), "STEP n OF N" (Jost 600, 40 px,
  wide tracking) and the title. It slides in on twos.
- **Detail tags:** a paper card with a star bullet, Jost 600 at 40 px, at most 30 characters, popping on the action beat.
- **Captions are a paper card:** a rounded slab, thin ink border (colour cel offset 5 px), turning stars at the ends, Jost 600
  at 56 px, **keyword in the accent ink**. Words light up as spoken (unspoken at 45%). It rises 10 px and fades in over 0.16 s.
  Bottom edge y 1236, left edge x 120, at most 660 px wide.
- **Reading time:** hold at least max(1.8 s, spoken line + 0.6 s, letters ÷ 12 + 1 s).

## 5. Motion quality
- **On twos:** poses, hands and cel jitter change every second frame (15 fps). Camera, irises, arrows, routes and rays move
  every frame.
- **Held body, moving hands.** One in-between per pose change. A hand action: anticipation (pull back or lift 20 to 60 px), a
  fast action (0.15 to 0.25 s, eased out), follow-through (recoil 6 to 10 px, settle, lift away), landing on a beat.
- **Pop-ins** (medallions, tags, titles): back ease, about 0.25 s, strong overshoot (about 1.9).
- **Reaching the floor:** a kneel pose with two-bone IK keeps hands on the object. Never stretch standing arms.
- **Lettering** writes on left to right with a clip; headers slide in on twos.

## 6. Camera grammar and the 9:16 page
The camera is the animation stand, never handheld. A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Slow push (a few %) | collecting the eye | a product on its stage; a result settling |
| Iris through a medallion | the number is the door | a change of step or rule |
| Round call-out with a leader line | context and detail at once | a hand action; a small part |
| Tilt with a pointing finger | the finger leads | the one action that matters most |
| Push into a device, pan along signal rings | person, interface, device | pairing; connecting |
| Iris from a round object into a top view | function becomes plan | a button starting a job; a lid; a dial |
| Pull-back with counter-rotation | one lane becomes a pattern | a route; a schedule; a floor plan |
| Colour-block wipe (side, or bottom-up) | turning the manual's page | a tip; a summary; a new card |
| Split frame in two colour blocks (top, bottom) | right vs wrong; before vs after | a safety rule; an upgrade |
| Dead still, 3 s or more | "screenshot this frame" | a summary; a CTA; a QR code |
| Iris-out onto one object | the last circle | a close on the product or result |

Key subjects are at least 40% of the frame height in their main shot and clear of the caption lane. Transitions: circles,
colour-block wipes, cuts on a beat. No dissolves.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | wall plane, sunburst rays; no words (the app's header) |
| Step header | y 270 to 610, x 120 to 888 | disc, "STEP n OF N", title (two lines at most) |
| Hero | y 580 to 1600, full width | the call-out (770 px or more, subject above y 1350, tag on its rim, x 120 to 780), or the presenter 770 to 1150 px tall, legs into the bottom bleed |
| Caption lane | bottom y 1560, x 120 to 780 | the caption card |
| Bottom bleed | y 1580 to 1920 | floor band, props; no words (the app's caption and buttons) |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music:** an original West-Coast cool-jazz combo: flute or muted trumpet, vibraphone (chords, arpeggios, glissandi,
  tremolo), pizzicato walking bass, brushes (sticks on the ride for energy), celesta, bongos or finger snaps. Not ragtime, not
  a spy big band, not piano and strings. **Every step gets its own vibraphone chord**, brought back one per summary item.
  Halve or double the feel instead of changing tempo; move up a step for the payoff.
- **Silence as a tool:** cut everything, ambience included, for the beat before the key action, so the first sound after it is
  the step. Room tone alone before a summary.
- **Foley by material:** cardboard creaks, plastic clicks, floor scrapes, glass clinks, pours, damped rubber stamps for
  medallions, paper swishes for wipes, slide whistles for arrows, rising pips for "connected", pen scratches, an iris "shhk".
  **Ambience:** quiet warm room tone, a mantel-clock tick.
- **Voice:** calm classroom authority, one clause per line. Lines start before their iris; tails ring on. Music ducks 8 dB.
- **Our presets:** closest is `warm`. Preset to build: `cooljazz`, vibraphone, flute or muted trumpet, pizzicato walking bass,
  brushes, celesta, finger snaps, 100 to 132 BPM. **Effects:** stamp, swish, paper, click, tick, pop, thud, pour, chime, ding,
  rise, marker, whoosh.

## 8. Native moves
A menu. Each move serves information.
- **Off-register colour** makes a card hand-made and warm. *Fits:* a granola ingredient card; a skincare set's "in the box"
  card; a linen care-label card.
- **Limited animation points the eye:** the still body leaves the hand as the only mover; the hand is the step. *Fits:* a
  three-step pour-over; seasoning a cast-iron pan; "3 drops, pat, wait" for a serum.
- **The round call-out** is the close-up; the step's data lands on it on the beat. *Fits:* a protein scoop's dose; a grinder's
  setting; a pea-sized amount of cleanser.
- **The numbered medallion** marks hierarchy and opens the next step; the camera goes through it. *Fits:* a five-step hair-oil
  ritual; a linen wash; four stages of cold brew.
- **The payoff turns function into ornament:** a real process draws itself and, seen whole, reads as an atomic-age textile.
  *Fits:* a week of supplements as lanes; a refill loop; a monthly box rotation.

## 9. Pitfalls of the medium
- A route that ignores obstacles: follow the product's real rules; lines bend round obstacles, never cross; one region per beat.
- A nose wedge looks glued on: one open spline from the bridge round the skull, closed at the nose tip.
- Thin arms read as sticks: shoulders at the torso corners; sleeves as a thick ink ribbon with colour on top. Fat fingers
  make a cloud: slender fingers, one union outline.
- Zooming the world triples the ink: draw close-ups at native scale in call-outs.
- Detail text without reading time: data in the detail, context in the title and voice. A transition must not draw the next
  scene early: clamp local time to just past the start.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each
on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `shape(path, o)` | any shape: off-register fill, tooth, broken line; colour planes | fill shifted (6, 4) ±1.6 px per second frame; line from `ribbon`; shade plane via `clip`; walls tint 0.45, floors shade 0.16 |
| `ribbon(pts, w, o)` | a 3 to 5 px breathing line, never closed | polygon, per-point width from noise (±40%), 12 to 25% skipped; `upto` 0..1 draws it on |
| `glove(x, y, a, kind)` | four-finger glove: open, flat, point, grip | stroke all parts 6 px, then fill all parts |
| `callout(draw, c, r)` | round close-up, dashed leader, data tag | offscreen canvas at native scale, circle clip, ink ring |
| `medallion(n)`, `iris(c, p)` | numbered stamp; the circle into the next step | circular clip grows from the disc to the farthest corner (up to about 1,800 px) in 0.9 beat |
| `type(str, o)`, `captionCard(words, t)` | plate lettering; paper caption card with star ends | plate offset 4 to 7 px under ink; slab, border, offset cel, word light-up |
| `route(plan, t)` | the payoff route drawing itself | wall-follow, then lanes bending round obstacles; curls at turns; one region per beat |
| `photoCard(P, c, r)` | the real photo in a call-out | drawn as is; flat paper-shade shadow (12, 12) at 50%; ring clear of the label |

The source is plain 2D canvas: no effect needs a rewrite. Grain was an ffmpeg step there; do it in the final pass.

## 11. Variation space
You decide the thing, the presenter (or none), the steps and their order, the opening, the ending, the camera path, the colours
and the music. Use cases are **grammar for the order and length of information**.

| Use case | Information order | Hold per layer | Length |
|---|---|---|---|
| Set-up guide | name, title, step title, detail on the action beat, payoff, tip, CTA | title 4 s+; detail letters ÷ 12 + 1 s; summary 3 s | 30 to 40 s, 2 to 4 steps |
| Rules card | rule number, rule, one "why"; a figure, medallion and gesture per rule | 3 to 4 s per rule | 25 to 40 s |
| Recipe or ritual card | step, quantity or time, result; call-out on the hands; top-view result | 3 to 5 s per step | 30 to 45 s |
| Drop or event notice | headline, time and place, CTA; colour-block wipes | 3 s+ per card | about 25 s |

Far from the plain set-up guide:
- **Structures:** a rules card with no product (a figure and a medallion per rule); a recipe ending in a top view; a do and
  don't split in two colour blocks.
- **Openings:** the finished result first; the problem in one gesture (a hand fumbling a lid); a numbered list stamped on.
- **Endings:** a checklist ticking itself; hands at rest beside the finished thing; a QR code held still in a starburst.

## 12. The product and brand fit
- **The product:** the real photo in a round call-out, like a manual's magnifier, with a flat paper-shade shadow. It is never
  redrawn, offset, toothed or covered, and the ring never crosses its label. A simple pack may be drawn as a prop in wide
  shots if its label text is typeset true. Show the real photo big at least once (the lockup).
- **Brand fit:** routine-led, friendly brands with a real action to show: coffee, skincare routines, kitchen, apparel care,
  supplements with a dose. Avoid it for pure claim or ingredient stories (use Halftone Dossier) and for edgy or luxury brands.
