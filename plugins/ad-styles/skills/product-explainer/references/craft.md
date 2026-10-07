# Craft: how the film is made

**The bar:** a film people would believe a good studio made by hand. The failure this file exists to prevent is
clip-art: flat fills, blurred drop shadows, a few rectangles with the product on top. It has been rejected every time
("looks like shit", "garbage", "why did it come like a clip art?"). What passed: an oil-painted animation and a silkscreen
poster of the same shot, each built the way that medium is really made ("this is kind of output im asking for"). Pure
Canvas 2D films like *Spider-Man in Ten Eras* and *Superman in Flight* set the ceiling: about 1,000 lines for each
3-second plate.

**The headline:** don't draw what a style looks like. Rebuild how the medium was physically made. Then light it with
one light, stack it in depth, make it specific, and spend the detail where the camera gets closest.

**IP rule:** copy the grammar of a style, never the likeness of a character or a brand's art.

## How a frame is built
1. **The world** (`draw`): the places, props, light, hands and anything that isn't the product, drawn plainly as the
   reference: values, colours, edges and light in the right places.
2. **The medium** (`look`): a pass that remakes the world from that reference by the medium's physical steps (strokes,
   plates, stones, stitches). Nothing reaches the viewer without it.
3. **The crisp layer** (`over`): the real product photo, any hand in front of it, and every word, mark, label and stamp.
   The medium never touches it, so a label is never painted over or printed over.
4. **The captions**, last.

## 1. Simulate the medium
There is no fixed list of styles: any medium suits any message. Choose from the brand's world first (its packaging art,
its site, its own videos), because recognition does half the work. Then build it the way it was made:
- **Painted** (in the kit: `look: 'painted'`): an underpainting, then about 35,000 colour-sampled bristle strokes laid
  coarse to fine. Strokes follow edges, broken colour runs warm in the lights and violet in the darks, the strokes are
  re-laid 10 times a second, and canvas weave sits on top. `media.focus` gets finer strokes where the eye goes.
- **Silkscreen / screen print** (in the kit: `look: 'silkscreen'`): each ink is its own plate. Tones are halftone dots
  fixed to the paper, plates sit 1 to 2 px off register, the ink density is uneven, and bare paper serves as the
  lightest colour. `media.inks` holds 4 to 8 inks, lightest first: the brand's colours plus a dark.
- **Write any other medium as a pass of your own** (`media.custom`, the same shape as the kit's), doing its steps:
  - **Risograph:** 2 or 3 fluorescent drum inks, grainy dither, heavy misregistration, ink starvation at the edges.
  - **Paper cut-out:** layers of coloured paper with scissor or torn edges, fibres on the cut, small cast shadows
    between layers.
  - **Block print / linocut:** flat ink, carved gouge marks in the solids, paper showing through, slightly off register.
  - **1960s comic:** colour plates in flat ink or Ben-Day dots at a screen angle, a black brush plate, yellowed newsprint.
  - **Mosaic:** stones following the contours (a distance field), bevelled, with ±7.5% value jitter, grout between them.
  - **Stained glass:** Voronoi cells, lead on the bisectors, backlight and bloom.
  - **Cross-stitch:** two legs per stitch with a round profile, sheen and shadow, on woven linen.
  - **Pixel / Game Boy:** a grid of exactly 4 colours, LCD gaps, slow pixel ghosting.
  - **To rebuild a subject in a unit-based medium:** paint flat ID colours of the subject onto a small canvas, read them
    back as a role map, and build the subject from the medium's own unit (stone, stitch, pixel).
- **Mixed media are allowed** when the mix has a rule:
  - **By time:** a different medium per world or shot, switching on a cut on the beat (*Ten Eras*): `look: t => ...`.
  - **By layer:** one element in a contrasting medium inside the frame, with `K.medium(g, name, t, opts, fn)`. For
    example a painted world with a silkscreen callout, or real UI plus editorial type plus a dithered 3D narrator in a
    webcam bubble (the Pocketsflow launch film).
  - Two or three media at most, each one built properly. The product photo is always its own crisp layer.
- **Medium texture is fixed to the frame** (screens, weave, stitch and pixel grids), so the subject moves under it.
  **Object texture rides with the object**, so it never swims.

## 2. One light, and every object answers to it
- Decide where it comes from: a window, a lamp, the sky. Write it down.
- Every object has a lit face toward it and a shadow away from it: a contact shadow where it touches, and a cast
  shadow on the surface behind. Rim light on edges that face the light.
- Highlights and reflections: steel, glass and liquid hold the light source; sugar and sugar-like grains sparkle.
- When the light changes, the shadows change.

## 3. Depth: four bands or more
- Far (wall, sky, shelf), mid, the action, and a foreground framing the edges: a counter lip, a leaf, a cup rim, out of
  focus. Haze or fog between bands outdoors; a value step between bands indoors.
- Draw through `K.view(g, cam, t, depth, fn)` with depths around 0.85 / 1 / 1.2, so the bands move at different speeds.
- Draw far layers bigger than the frame, so camera moves never show an edge.

## 4. Specific, never generic
Every prop comes from this brand's real story and its customers' real lives: the steel tumbler, the shelf above the
stove, the monsoon window, the gym bag, the steel teaspoon. Research real details first, then draw them. No stock icons,
no generic "home".

## 5. Richness from variation, not more colours
A tight palette (the brand's colours, the pack's colours, one accent), with every repeated element jittered by 4 to 13%
in value, hue, size and angle (`K.jitter`). Never stamp identical copies.

## 6. Detail where the camera gets closest
- Plan the closest shot of each subject and build its detail for that size: grain on sugar, wrinkles on a date, the
  bevel on a chocolate square, the brushed grain on steel.
- **Check it on full-resolution crops:** `render.mjs <project> frame <t> --crop x,y,w,h`. Look at the hero at 100%
  before anyone else does.
- A thin film is the usual failure. If the world for a 30-second film is only a few hundred lines, it's thin. Spend
  about 1,000 lines on each new place or hero object; places and props that come back cost less.

## 7. The frame is full
- **The picture fills all of 1080 x 1920, edge to edge.** No empty bands and no bare floor at the bottom. Instagram's
  buttons and caption sit over the picture, they don't replace it.
- Only words and key details keep to the safe box (x 120 to 888, y 288 to 1248, and left of x 780 below y 840). Picture
  runs everywhere.
- The hero is big: 40 to 60% of the frame's height in its main shot, closer for close-ups.
- The subject always reads against its ground: a value step between it and what's behind it.

## 8. Material goes on last
Fine grain that moves on twos, paper or canvas tooth, a soft vignette. The kit's media include their own.

## The product in the picture
- It's always the real photo, cut out (`references/product.md`), drawn in `over`. It's never painted, never redrawn,
  never generated, never covered: hands go behind it (`part: 'back'`) or hold its edge.
- The cut-out card (`P.draw`) gives it a paper edge that sits naturally in a painted or printed world.
- It's shown big and clear at least once (the end card), and never drawn bigger than its photo.

## Motion
1. **A beat clock.** One tempo drives the cut points and the hits: the music's (warm 92 BPM, bright 108, calm 76).
   Arrivals, snaps and stamps land on beats where they can.
2. **Camera grammar.** Wide, then push in on the detail that matters (z 1.5 to 2) for the line that names it, then back
   out. A small roll and zoom pulse on a hit. Shake of 6 to 14 units on impacts. Travel between ideas instead of
   cutting: 5 hard cuts or fewer.
3. **Animation principles.** Anticipation before every action (a bend before a snap, a lift before a drop). Landings
   squash, rebound and settle. Follow-through on anything loose.
4. **Physics where things fall or pour:** 0.5·g·t², stretched along the motion. Grains, crumbs and drops scatter on
   landing.
5. **Nothing is still for more than a second:** steam, a breathing light, drifting dust, grain on twos, a hand's
   small sway. Something new happens every 1.5 to 2 s (the QA checks 2.2 s).
6. **Hit-stop on the one big moment:** freeze the object for 45 to 85 ms, then catch up, while the camera and debris keep
   the real clock.
7. **The motion setting** (`motion`) follows the brand's voice: `warm` (enters fast, lands soft), `playful` (more
   overshoot), `crisp` (none: clinical and tech brands). Things that belong together arrive 60 to 120 ms apart.
8. Every frame is a pure function of `t`. Nothing carries between frames.

## Words on screen
- **Captions are automatic:** short phrases, one line, timed to the voice's words, in the lane above the app's buttons
  (bottom-left, y about 1180 to 1240). The style is set in `captions`: font, size, colour, and `style: 'shadow'`
  (default) or `'chip'` (on a dark chip, for busy pictures).
- **Statements:** 3 to 5 per film (`K.statement`), big type in the brand's display font, built into the scene where
  possible. The hook's on-screen text is up from the first frame.
- **Fonts match the brand.** Bundled: Jost (geometric sans), Inter (neutral sans), Fraunces (warm display serif),
  Cormorant Garamond (elegant serif), DM Serif Display (classic display), Caveat (handwriting). Download a brand's Google
  Font's static TTFs into `<project>/fonts/` as `Family_Name-700.ttf`.

## Sound
- **Sound follows the picture:** one cue per action on the frame it happens (`cues`), panned with the picture.
- **Music** by the brand's voice: `warm`, `bright`, `calm` or `none`. It ducks under the voice and resolves on the end card.
- **Effects:** pop, click, snap, tick, whoosh, swish, thud, stamp, paper, tape, marker, flip, crinkle, chime, ding, steam,
  door, pour, sparkle, rise. Use `gain` (0.3 to 1.2) and `pan` (-1 to 1).
- Mastered to -14 LUFS automatically.

## Process
1. Choose the medium (or two to A/B when the brand doesn't make it obvious) and write down how it's physically made
   and where the light is.
2. **Build the hardest beat to final first.** Render it, crop it at 100%, and fix it until it meets the bar. Only then
   build the rest.
3. Build shot by shot, rendering frames at key moments and looking at them.
4. The contact sheet shows one finished frame per beat. Look at it yourself before anyone else does.

## Checklist before showing anything (all of it, every time)
- [ ] Which medium, how was it physically made, and is the code doing those steps? (Never `look: 'none'`.)
- [ ] Where is the light, and does every object answer to it (lit side, contact shadow, cast shadow)?
- [ ] Four depth bands or more, with a foreground at the frame's edge?
- [ ] Does the picture fill the whole frame, with no empty bands?
- [ ] Is every prop specific to this brand and its customers? Any stamped repeats?
- [ ] Has the closest shot of the hero been checked on a 100% crop?
- [ ] Is the product the real photo, crisp, uncovered, readable and never upscaled?
- [ ] Is anything frozen for more than a second? Is there an event every 2 s?
- [ ] Would this sit next to the painted and silkscreen tests without looking cheaper? If not, don't show it: fix it.
