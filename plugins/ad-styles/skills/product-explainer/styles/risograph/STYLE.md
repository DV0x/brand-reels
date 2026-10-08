# Risograph

> Frames that look printed on a stencil duplicator: two or three translucent spot inks overprinted on warm paper,
> halftone dots, ink grain, and plates that never quite line up. **Its power for a brand:** two or three bright inks
> overprint into new colours, so a blend, a pair or a flavour drop is colour made on the page, with zine energy.
>
> References (grammar only, never copy): modern riso illustration (colour fields, silhouettes, extra colours made by
> overprinting); mid-century comic cinema staged small in a wide frame; real riso prints (translucent inks,
> misregistration, pinholes, feed streaks).
>
> Adapted from lemo-opuscar `styles/risograph/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
A risograph prints **one colour at a time.** Each colour is its own stencil (a plate) with its own drum of translucent
ink. That makes the look:
- **A tiny palette:** 2 or 3 spot inks on warm off-white paper.
- **Overprint mixing:** inks multiply. Two inks make a third colour; all three approach black. A tint of one ink over a
  solid of another gives the brightest mixes.
- **Misregistration:** every plate lands a few pixels off, leaving slivers of paper or a coloured halo.
- **Halftone dots** for mid-tones, each plate on its own screen angle. **Imperfect ink:** pinholes, feed streaks,
  blotchy density. **Flat shapes, no outlines.**

Not flat vector art with a noise overlay. Not CMYK pop-art halftone (no keyline). Not Silkscreen Poster (riso ink is
translucent and grainy, not opaque). Never show the RISO brand, logo or machine trade dress: ink names are colour
references only.

## 2. Materials and rendering
The source used a WebGL shader; here the same print is made in 2D (section 10).
- **Plate canvas:** one opaque RGB canvas, each channel one plate's density (R = ink 1, G = ink 2, B = ink 3).
  `source-over` knocks out. `lighter` adds ink only to the channels you set: a true overprint.
- **The print pass** is an ImageData pass over that canvas, once per frame (cached when nothing moves). Per plate and
  pixel: read the density at the plate's own offset and tiny rotation; threshold it against a cosine halftone spot on a
  grid rotated by the plate's screen angle (at least 15° apart), period 7 px (6 to 8), smoothstep ±0.07, solid from
  0.9; grain ±0.08; pinholes where noise > 0.93 (× 0.75); ink load `0.80 + 0.14·streak + 0.08·blot` (streak = noise
  stretched ×10 along the feed direction). Composite `paper × Π (1 − coverage × (1 − ink))` per channel, plus fibre.
- **Dots belong to the paper:** the screen is fixed in frame coordinates, so a pan slides the image under it.
- **Gate and roller sweep:** coverage × a moving edge, with a heavier band (about 40 px) at the edge, lets a plate
  arrive mid-shot.
- **Composition:** at most two plates in any area, one a tint (three halftones make mud). Big flat shapes, solid paper
  and ink; halftone only in stepped bands (20, 40, 60, 100%). The hero gets a paper-white knockout halo of 4 to 5 px
  that picks up coloured fringes like a real trap. One horizon, one flat field or disc, one hero. Design for the
  one-plate version: every main colour contains some of plate 1, so a one-ink frame is a complete silhouette. A
  deliberate exception stays blank paper until its plate arrives: a reveal.

## 3. Colour logic
- **2 or 3 spot inks, never more,** plus paper. Every other colour is an overprint or a tint. No gradients but stepped
  halftone. Pick inks whose pairs mix into useful colours; at least one must carry a silhouette alone.
- Paper is warm off-white (about `#F4EEE2`), never pure white. Paper white is a colour too (knockouts, caption strips).
- Skin and other light neutrals are a light tint of the palest ink: saturated dots on skin look like a rash.
- Save the full overprint (every plate, the densest mixes) for the moment that earns it.
- **Take the inks from the pack:** two of its colours become two plates; the third colour is where they overprint.
- Example sets: Blue `#0078BF` + Yellow `#FFE800` + Fluorescent Pink `#FF48B0` (blue + yellow = green, blue + pink =
  violet, yellow + pink = orange-red); Teal `#00838A` + Fluorescent Orange `#FF7477`.

## 4. Type and captions
Fonts: **Bricolage Grotesque 800** (titles; fetched by the font script) and **Jost 600** (captions, labels; bundled).
- **Type is printed:** titles and captions live on one plate, so they misregister and grain with it. A title may print
  on two plates with an 8 to 10 px offset: the riso double-hit.
- **Headlines:** Bricolage Grotesque 800, 100 to 140 px, one to three lines, left at x 120 (about 9 letters a line at
  140 px), 2 to 5 words. A big number is the same face at 200 px or more and may bleed off the right edge.
- **Labels:** Jost 600, 40 px.
- **Captions are a knockout strip:** paper-white (zero ink in every plate, 6 px radius), text on one plate in Jost 600
  at 56 px, the **keyword on the second plate's ink**. Its edges catch the misregistration fringes. Words light up as
  they are spoken (unspoken as a 45% halftone tint). Bottom edge y 1236, left edge x 120, at most 660 px wide.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.6 s), and about (letters ÷ 15 + 1.5) s
  after it lands. Prints don't fade: titles arrive by roller sweep or on a beat, and leave on a cut.

## 5. Motion quality
- **Things act on twos (12 fps); the camera moves on ones (30 fps).** A stepped camera reads as judder.
- **Registration is not jittered every frame.** One fixed set of offsets per shot (±1 to 3 px). A **kick** (8 to 14 px,
  decaying in about 0.25 s with slight ringing) lands on an accent. A **drift** of up to about 25 px runs through a
  held moment and snaps back on the downbeat.
- **Grain boils partly:** about a third re-rolls per print. Sheet streaks and blots change only at cuts.
- **Plates arrive** by roller sweep (0.3 to 0.5 s) or a growing shape, and leave by a lift.

## 6. Camera grammar and the 9:16 page
A 2D camera over a printed sheet. A vocabulary, not a route; the opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Wide lateral tracking, small figure, empty sky | travel, routine | a commute; a process line; a title |
| Static wide, the subject crosses the frame | comedy of scale | a gag; an arrival; a crowd |
| Locked composition: horizon, disc, hero | stillness, awe | a decision; a reveal; the one pause |
| Ground-level low angle, big foreground shapes | energy, abundance | a burst; a harvest; a launch |
| Medium two-shot held for a look | reaction | a joke landing; a deal |
| Straight top-down, long shadows | pattern, a map | a schedule; a game board |
| Push into a halftone field until dots are shapes | entering the print | a close look at data; a cell |
| Pull back to reveal the paper | it was one sheet | a series; an archive; a summing-up |
| Match cut on a flat shape | continuity through form | a time jump; before and after |

Transitions: overprint growths, roller sweeps, match cuts, hard cuts on beats. Never a cross-dissolve or a soft wipe.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | the sky: a stepped halftone band or a solid ink field; no words |
| Title area | y 270 to 850, x 120 to 888 | the title on empty sky, or on a knockout strip |
| Hero | y 520 to 1580, full width | the product or subject on the flat disc or field: 770 px or more tall in its main shot |
| Caption strip | bottom at y 1560, x 120 to 780 | the knockout strip |
| Bottom bleed | y 1580 to 1920 | the ground: solid ink, the horizon, long shadows; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Instruments, as options:** warm, dry, handmade, slightly lo-fi: upright or electric bass, vibraphone or marimba,
  nylon guitar, a whistled or hummed melody, Rhodes, toy piano, a brushed kit, shaker and rim clave, a small drum
  machine through tape saturation. Option: each new plate brings one instrument, and they leave one by one.
- **The machine is the signature foley:** feed "shhk", drum "ka-chunk" at a plate arrival, motor hum, a sheet landing on
  a stack, a guillotine cut. Other foley is dry, close and papery.
- **Silence:** a held bar with the reverb tails cut. It pairs with a registration drift, and the snap brings everything
  back. Music ducks about 8 dB under a relaxed voice; −14 LUFS; add no grain at the mux (it is in the print).
- **Our kit:** the closest preset is `warm` (92 BPM plucked strings), with instruments added plate by plate. Effects:
  `paper` (the feed), `thud` (the drum), `swish` (a roller sweep), `snap` (the registration snap), `whoosh` (an
  overprint growth), `stamp`, `tick`, `click`, `flip`.

## 8. Native moves
A menu: use the ones the story needs.
- **Plates as narrative.** The world gains a plate at each turning point. *Fits:* a chai where milk, tea and spice each
  arrive as an ink; a skincare routine, a plate per step; a new flavour as a new ink.
- **Two inks, a third where they meet.** *Fits:* a tea and lemon blend; vitamin C and niacinamide in one serum; two
  spices becoming one masala.
- **Overprint transition.** A shape of one ink grows over the frame, turning what is beneath into the mix, then shrinks
  into the next key shape. *Fits:* a serum drop becoming the moon; a lemon slice becoming the sun; a capsule dissolving.
- **Registration as rhythm and feeling.** Kicks on accents, drift in a held moment, snap on the downbeat. *Fits:* the
  4 pm slump ended by a snack; the groggy minute before coffee; the nerves before a first order.
- **Reflections as separated plates.** Each plate wobbles on its own phase. *Fits:* a glass of cold brew; a water bottle
  on a table; a perfume in a shop window.
- **Knockout reveal.** A shape made only of missing ink; its plate arrives later. *Fits:* the missing ingredient (no
  palm oil); a new flavour's silhouette; a label hidden in plain sight.
- **Halftone scale.** Dots grow into shapes as the camera pushes in. *Fits:* 1,00,000 orders as a crowd of dots; grains
  of millet; the pores of skin.
- **It is a sheet of paper.** The print can be stacked, folded, cut or pinned. *Fits:* a zine cover per flavour; an
  order slip; a flyer for a pop-up.

## 9. Pitfalls of the medium
- Three halftoned plates in one area make mud: two plates, one of them a tint.
- Saturated dots smear in a lossy encode: check the video at 100% and 50% for moiré. A dot period under 6 px aliases.
- Overprint on the opaque plate canvas, never inside a transparent layer (additive blending loses its meaning there).
- A main colour without the first plate floats loose in one-ink frames: build recipes up from the one-ink silhouette.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it),
test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `plateCanvas` | the plate densities | one opaque RGB canvas, 1080 × 1920; `source-over` knocks out, `lighter` overprints; `bands` fills 20, 40, 60, 100% |
| `screenMaps` | the halftone thresholds | per plate, once: `(cos(2πu/P) + cos(2πv/P))/2` on a grid rotated 15°, 0°, 75°, P = 7 px, plus fixed hash grain |
| `printPass(plates, shot)` | the print | ImageData loop: offset density, smoothstep ±0.07, solid at 0.9, streak, blot, pinholes, `paper × Π(1 − cov·(1 − ink))` |
| `shotReg(shot)` | misregistration | fixed ±1 to 3 px offsets and a tiny rotation per plate; `kick` 8 to 14 px over 0.25 s; `drift` to 25 px |
| `gate(plate, edge)` | a plate arriving by roller | coverage × a moving edge with a 40 px heavier band; the edge is a function of t |
| `halo(subject, 4.5)` | the paper-white knockout | 12 stamps of the silhouette in zero ink on a ring of radius 4 to 5 px, then the subject; copies the camera transform |
| `risoType(text, plates)` | titles and the caption strip | text in one plate; double-hit = two plates 8 to 10 px apart; the strip is a 6 px rounded rect at zero ink |
| `overprintGrow(shape, t)` | the transition | a shape of one plate grows with `lighter` over the frame, then shrinks into the next shape |
| `photoSheet(photo)` | the product | the real photo drawn after the print pass as a loose print with a paper edge and a flat offset shadow |

**The 2D rewrite.** The source's WebGL shader becomes `printPass`. The spot function depends on the pixel position
only, so `screenMaps` is built once and each frame costs a lookup, a compare and a multiply per plate.

## 11. Variation space
You decide the inks, what each plate means, the structure, the hero, the opening, the ending, the camera and the pacing.
- **Structures:** two inks in dialogue; subtraction (full overprint down to one ink); a zine (a page per shot).
- **Openings:** a knockout filled by its plate later; dots first, pulling back to an image; ghosts that snap together.
- **Endings:** one ink left; the print pasted on a wall; a folded sheet (a box, an envelope, a ticket).

## 12. The product and brand fit
- **The product:** it first appears as a drawn stand-in (the pack's shape and colour areas, laid plate by plate). Then
  the real photo lands clean as a loose print on the paper (`photoSheet`). The photo is never run through the plates,
  dotted, tinted, redrawn or covered (so no duotone of the photo), and its label stays readable.
- **Brand fit:** young, zine-like brands with two or three brand colours; blends, flavour drops, pop-ups. Avoid it for
  calm luxury or clinical brands, and for packs with many colours.
