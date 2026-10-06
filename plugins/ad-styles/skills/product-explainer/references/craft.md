# Craft: look, motion, captions and sound

The bar is a film someone would believe a good studio made by hand. A few flat rectangles with a product on top is not
the bar. The template film shows the API, not the finish.

## The look
1. **Pick a medium the brand already suggests,** then rebuild how it's physically made, don't imitate how it looks:
   - paper cut-out: layers of coloured paper with small cast shadows and torn or scissor edges
   - block print: flat inks, slightly off register, the paper showing through
   - editorial flat illustration: clean shapes, one light, soft grain
   - silkscreen poster: a few ink plates, knockouts, halftone in the shadows
   Their packaging art, their site and their own videos are the best hint. Choose with restraint: premium means fewer
   elements, drawn with more care.
2. **One light.** Decide where it comes from (a window, a lamp, the sky). Every object has its lit side and its contact
   or cast shadow on the side away from it (`K.contact` for contact shadows).
3. **Depth: at least three layers.** The far layer (wall, sky, shelf), the action, and a foreground at the frame's edge
   (a plant leaf, a counter edge, a mug). Draw them through `K.view(g, cam, t, depth, fn)` with depths around
   0.85 / 1 / 1.2, so they move at different speeds.
4. **Specific, never generic.** Every prop comes from this brand's real story and its customers' real lives: the steel
   tumbler, the shelf above the stove, the monsoon window, the gym bag. No stock icons, no generic "home".
5. **Richness from variation, not more colours.** Keep the palette tight: the brand's colours, the pack's colours and one
   accent. Jitter repeated things by 4 to 10 % (`K.jitter`). Never stamp identical copies.
6. **Detail where the camera gets closest.** If the shot pushes in on something, draw it for that size.
7. **The subject always reads against its ground:** a value step between the product and what's behind it. The paper
   border of the product card helps; don't put a cream pack on a cream wall.
8. **The look's finish** (`look`: `paper`, `print`, `clean`, `none`) goes on after drawing, and captions go on top of it.

## The product in the picture
- The real photo, as a cut-out card (`P.draw`), which is the default treatment: a scissor-cut paper edge, a printed drop
  shadow and a strip of tape. `border: false` and `tape: false` for a cleaner look.
- Never paint over the label, never redraw it, never generate it. Keep hands, labels and arrows off the label.
- Shown big and clear at least once (the end card). Never drawn bigger than its photo (the QA flags upscaling).

## Motion
Choose the setting from the brand's voice (`motion` in the film): **warm** (default: enters fast, lands soft, settles a
few percent past the mark), **playful** (more overshoot, quicker), **crisp** (no overshoot, clean: clinical and tech brands).
- Things that belong together arrive 60 to 120 ms apart (`K.M.stagger`).
- Use `K.settle` for arrivals, `K.p` for progress, `K.wobble` for a landing rock, `K.move` for a move with a settle.
- **Hand-made feel:** drawn shapes can boil on twos (`K.boil`, 12 fps), while the camera and captions move every frame.
- **Only one or two sharp moments:** a stamp, a snap. Everything else eases.
- **The camera travels** between ideas with eased moves (`inOut` for travel, `warm` for push-ins). A constant slow zoom
  is not motion.
- Every frame is a pure function of `t`. No state that carries between frames.

## Captions and words on screen
- **Captions are automatic:** short phrases, one line, timed to the voice's words, in the lane above the app's buttons
  (bottom-left, y about 1180 to 1240). Set the style in the film's `captions`: font, size, colour, and `style: 'shadow'`
  (default) or `'chip'` (on a dark chip, for busy pictures).
- **Statements:** 3 to 5 per film, `K.statement`, big type in the brand's display font, built into the scene where
  possible.
- **The safe box:** words and important product details stay inside x 120 to 888 and y 288 to 1248, and left of x 780
  below y 840 (the like and share buttons). The QA flags anything outside.
- **Keep the caption lane clear** of important picture detail. The bottom 600 px belong to the app's UI and the captions.
- **Fonts:** match the brand. Bundled: Jost (geometric sans, Futura-like), Inter (neutral sans), Fraunces (warm display
  serif), Cormorant Garamond (elegant serif), DM Serif Display (classic display), Caveat (handwriting, for notes and
  labels). If the brand uses a Google Font, download its static TTFs into `<project>/fonts/` named
  `Family_Name-700.ttf` (and `-400`, `-400-italic` ...); they register automatically.

## Sound
- **Music** by the brand's voice: `warm` (fingerpicked, 92 BPM), `bright` (plucks, claps, 108 BPM), `calm` (slow arpeggio
  and pad, 76 BPM), or `none`. It resolves on the end card and ducks under the voice by itself.
- **One sound per action,** on the frame it happens, listed in `cues`. The QA counts cues and animation starts as events.
- **Effects:** pop, click, snap, tick, whoosh, swish, thud, stamp, paper, tape, marker, flip, crinkle, chime, ding, steam,
  door, pour, sparkle, rise. Use `gain` (0.3 to 1.2) and `pan` (-1 to 1) so they sit naturally.
- Mastered to -14 LUFS automatically.

## Before showing anything
- [ ] Which medium, and is the code doing the steps of making it?
- [ ] Where is the light, and does every object answer to it?
- [ ] Three depth layers or more, with a foreground?
- [ ] Is every prop specific to this brand and its customers? Any stamped repeats?
- [ ] Is the product readable, uncovered, and never upscaled?
- [ ] Is anything frozen for more than 2 s?
- [ ] Do the sheet's QA lines all read clean?
