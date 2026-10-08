# Craft: the design rules every style shares

**The bar:** a film people would believe a good studio made by hand. What fails is clip-art (flat fills with blurred drop
shadows, generic fonts, shapes with no idiom), a real-looking scene pushed through a filter, and a frame filled with
decoration (texture and props everywhere, no centre). What passes is one
designed system per frame, in one medium: the type, the product, the captions and the transitions all made of the same
stuff. The style's `STYLE.md` holds its own numbers; this file holds what is true for every style.

## Contents
1. The style draws every element
2. A design system per style
3. The 9:16 frame
4. The product inside the style
5. Detail, variation and the closest shot
6. Building a style that has no engine yet
7. Painterly styles: the paint-over pass
8. Checklist before anyone sees a frame

## 1. The style draws every element
- **Don't draw what a style looks like; rebuild how the medium is made.** In a print style every shape goes through the
  style's own drawing calls (ink plates, dots, overprint); in a cartoon, through its line and fill; in paper-cut,
  through cut paper. Nothing is drawn plainly and filtered afterwards.
- **The style's materials frame the film** (case-file paper and its HUD, a spec sheet's grid, a printed board), but the
  story comes from the topic: find one picture that makes the fact obvious, and don't act out every line.
- **The medium makes the reveals and transitions:** a stamp slams, a squeegee pulls an ink, a dot wipe covers the cut.
- **Copy the grammar of a style, never the likeness** of a character, a title design or a brand's art.

## 2. A design system per style
- **Colours with jobs:** a ground, one dark ink for lines and text, **one accent with one meaning** (the new, the
  changed, the important thing), one warning colour (cost, waste, the alarm), five inks at most. Take the accent from
  the product's pack.
- **Fonts with jobs:** at most 3 sizes and 2 families on screen at once, plus a mono for data. Fonts are part of the
  style (STYLE.md section 4); get them with `fonts.mjs`, never fall back to a default face.
- **Minimum sizes** at 1080 × 1920: captions 56 px, headlines 72 px, labels and stamps 40 px, notes 36 px. Smaller only
  as texture with no meaning (a case number, a ruler).
- **Captions belong to the style** (a dark ink pill, a pulled strip of ink, a chalk line, a dialog box) and light up
  word by word as they are spoken.
- **A fixed layout per style** inside the safe zones (STYLE.md section 6, "the 9:16 page"), so every frame of every
  film sits on the same grid.
- **Texture is one element with a job,** never a background filler: at most one dot, grain or hatch field per frame,
  and it means something (a halo behind the subject, tension at the edges, the fill of a numeral).

## 3. The 9:16 frame
- **The picture fills all of 1080 × 1920, edge to edge,** and a big subject may run into the bands and off the edges.
  Only words and the product's label keep clear of the app's overlay. The safe box is for words, not for the picture.
- **Words keep to the safe box,** set by `"placement"` in `script.json`:

  | Placement | Words inside | Caption lane |
  |---|---|---|
  | `organic` (default: a post) | x 120 to 888, y 260 to 1580, and left of x 780 below y 1100 (the like, comment and share buttons) | bottom-aligned at y 1560 from x 120, at most 660 px wide |
  | `ad` (a paid ad) | x 120 to 888, y 288 to 1248, and left of x 780 below y 840 (Meta's ad safe zone: no text in the top 14% and bottom 35%) | bottom-aligned at y 1236 |

- **The bands** (organic: y 0 to 260 behind the app's header, y 1580 to 1920 under its caption, username and buttons)
  hold no words, but the picture continues through them. Don't add filler there (props, dot fields, texture). Empty
  ground around a subject is design; a third of the frame left empty is not.
- **The subject is big:** at least a third of the frame height (640 px) at key moments; 40 to 60% in its main shot.
  Centre the composition on the safe box, not on the top of the frame.
- **The subject reads against its ground:** a value step between them. Never a colour on the same colour.

## 4. The product inside the style
- **It is always the real photo,** cut out (`product.md`). Never repainted, redrawn, generated or filtered: a generated
  label comes out as gibberish, and a customer has to recognise the pack on a shelf.
- **The style decides how it appears** (STYLE.md section 12): an evidence print pinned to a case file, a clean block on
  a Swiss grid, a cut-out card on watercolor paper, an item card in a pixel game. It sits above the style's finish, so
  no texture, dot or paint lands on it.
- **Circles, arrows and labels may point at the label, never cover it.** Captions and props stay off it.
- **Shown big and clear at least once** (the end card), and never drawn bigger than its photo.

## 5. Detail, variation and the closest shot
- **Richness comes from variation, not more colours:** jitter every repeated element by 4 to 13% in value, size and
  angle (`K.jitter`, seeded noise). Never stamp identical copies.
- **Detail where the camera gets closest.** Plan each subject's closest shot and build its detail for that size; check
  it on a 100% crop (`render.mjs <project> frame <t> --crop x,y,w,h`) before anyone else sees it.
- **Specific, never generic:** props come from this brand's story and its customers' lives (an object from their daily
  routine, the real ingredient), researched before drawn.
- **Material goes on last and stays put:** the medium's texture (paper, screen, weave, pixel grid) is fixed to the
  frame or the page, so subjects move under it; an object's own texture rides with the object.

## 6. Building a style that has no engine yet
Styles marked "rules" in SKILL.md have a full `STYLE.md` but no drawing code. Build it before the film:
1. Read the whole `STYLE.md`. Its section 10 lists the primitives to write: the material, the signature mark, the type
   treatment, the caption, the transition and the product treatment, with their numbers.
2. Write them in `<project>/style.mjs` (a module the film imports) as pure functions of t, on the canvas API. Draw
   with paths, fills, composite modes (multiply, screen) and ImageData passes; there's no browser, SVG filter or WebGL.
3. Test each primitive on a 100% crop, then compose one style frame (the hardest card) and check it against the style's
   sections 1 to 6. Only then build the film from `templates/film.mjs`.
4. Keep what worked: the primitives become the style's drawing kit later (see `styles/halftone-dossier/engine.mjs` for
   the shape a kit takes: drawing calls, a caption renderer, a finish and transitions, with no story and no defaults).

## 7. Painterly styles: the paint-over pass
A few media really are made by painting over a drawing (oil, gouache, watercolor washes over a block-in). For those, the
film draws the world plainly in `draw`, and a pass remakes it stroke by stroke (`look: 'painted'`: an underpainting,
then about 35,000 colour-sampled bristle strokes laid coarse to fine along the forms, re-laid 10 times a second, canvas
weave on top). Only for painterly scenes do the realism rules apply: one light every object answers to (a lit face, a
contact shadow, a cast shadow), depth bands with haze, a foreground at the frame's edge. Flat and print styles forbid
them: gradients, blur and fake 3D light fight print.

## 8. Checklist before anyone sees a frame
- [ ] Is every element drawn by the style's own calls, and does the frame read as the style in one glance (STYLE.md
      section 1)?
- [ ] Colours with jobs, one accent with one meaning, the style's fonts, nothing under the minimum sizes?
- [ ] One subject, at least a third of the frame's height at key moments, with ground around it and a clear order from
      top to bottom? Does the picture use the whole frame, with no empty band at the bottom? Nothing the treatment
      didn't ask for?
- [ ] At most one texture field, with a job? No filler in the bands? Nothing touching or crowding?
- [ ] Words inside the safe box, three text sizes at most, nothing important under the caption?
- [ ] Does every shape read as what it is at phone size, and not as some other object?
- [ ] Does every arrow, ring, bracket or pointer carry a short label (1 to 3 words) that says why it points, without
      repeating the words it points at?
- [ ] Does every element have a job a stranger would notice? A style's apparatus (a case number, a file tag, a frame,
      a stamp) stays only when it tells the viewer something; otherwise it goes.
- [ ] Is the product the real photo, crisp, uncovered, readable, never upscaled, placed the style's way?
- [ ] Has the closest shot of each subject been checked on a 100% crop?
- [ ] Does `render.mjs check` pass?
- [ ] Would this frame sit next to the style's best work without looking cheaper or busier? If not, fix it, and write
      the round in `REVIEW.md`.
