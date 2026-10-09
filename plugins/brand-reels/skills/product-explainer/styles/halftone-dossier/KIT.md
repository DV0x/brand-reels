# Halftone Dossier: the drawing kit (K.style)

`engine.mjs` in this folder is loaded for any film whose `script.json` says `"style": "halftone-dossier"`; the film
calls it `D` (`const D = K.style`). This file lists every call and option of the kit, so you never need to open
`engine.mjs`: if a call or an option is not here, it does not exist. The shared calls (`script.json`, `K.*`, the
camera, the product photo, captions, the score) are in [film-api.md](../../references/film-api.md); the style's look
and its numbers are in [STYLE.md](STYLE.md). It is a kit of parts with no story: it draws nothing unless a scene calls
it.

The kit holds two kinds of part:
- **Techniques:** how the medium is made (the paper, the dots, the ink line, the print shadow, the transitions, the
  camera, the motion curves, the page zones, the inks and fonts). Use them for everything you draw.
- **Optional objects:** finished designs (a stamp, a pin, the evidence print, the HUD, the caption bar). Each one
  returns the same picture in every film, so a film built from them looks like the last one. Use one only when the
  treatment gives it a reason from this film's story (directing.md, section 4), in the brand's inks and fonts, and
  never as the end card by default. Draw the film's own objects (its subjects, props, frames, tags) with the
  techniques: `D.ink` shapes in the brand's inks, `D.dotFill` or `D.halftone` for shading, `D.line` for creases.

## Contents
- Techniques: the brand's look and the page, motion, dots and fields, ink and shapes, type, the camera and transitions
- Optional objects: type objects, props, the product print, the HUD, the caption bar
- The brand's look, set once

## Techniques
**The brand's look and the page**
| Name | Meaning |
|---|---|
| `D.inks({...})` | sets the ink roles (returns them): `paper`, `ink`, `spot`, `spot2`, `overprint`, `highlight`, `stamp`, `night`, `night2`, `cream`, `card`, `tone` (the paper's vignette and fold: warm by default, a grey for a cool or white brand). Put the brand's colours on them (the design card in `research.md`), before the first frame is drawn |
| `D.C`, `D.INKS` | the current inks; the defaults |
| `D.fonts({...})` | puts families on the five type roles (returns them): `head`, `display`, `sans`, `mono`, `hand`; each a family name or `{ family, weight }`, e.g. `D.fonts({ head: { family: 'Jost', weight: 700 }, sans: { family: 'Jost', weight: 600 } })`. The font must be loaded (bundled, or in the film's `fonts/` from `fonts.mjs`), or it stops with an error. Every kit call that draws text then uses them |
| `D.F`, `D.FW`, `D.FONTS`, `D.WEIGHTS` | the current families and weights; the defaults: `head` Alfa Slab One, `display` Bagel Fat One, `sans` Archivo Black, `mono` JetBrains Mono 800, `hand` Caveat 700 |
| `D.font(family, size, weight = 400)`, `D.measure(str, font)` | a font string; a text width |
| `D.ZONE` | the 9:16 page: `hudTop`, `hudBottom`, `headTop`, `heroTop`, `heroBottom`, `captionTop`, `captionBottom` (from the placement) |
| `D.finish` | the paper (multiplied) and the dust: use it as the film's `finish` |
| `D.paperTex()`, `D.grain(g, t)` | the paper canvas; the dust alone |

**Motion**: `D.E` = eases `out`, `in`, `io`, `back` (0..1). `D.pop(t, at, d = 0.35)`: 0, then a pop with overshoot.
`D.rise(t, at, from, to, d = 0.4)`: a value that rises with overshoot. `D.slam(t, at)`: a slam's scale, 2.6 → 1 in
0.09 s ending at `at`, then a small bounce. `D.squash(t, at, k = 0.18)`: a landing squash; use as `scale(1 / sq, sq)`.

**Dots and fields**
| Call | What it does |
|---|---|
| `D.halftone(g, { x, y, w, h, step = 22, angle = 15, field, k = 0.68, color, blend, alpha, cache })` | a dot field; `field(x, y)` → 0..1 sets the dot size; `cache: 'key'` draws it once. The rotated grid spills past the box's edges: clip it (`g.clip()`) for a hard edge |
| `D.radial(cx, cy, R, pw = 1.2, gain = 1)`, `D.edge(R = 1, pw = 1.6, gain = 1.3)`, `D.ramp(x0, y0, x1, y1, a = 0.25, b = 1)` | density fields: a halo, the frame's edges, a gradient |
| `D.max(...fields)`, `D.scaled(field, k)` | combine fields |
| `D.dotFill(g, path, { fill, dot, step, angle, field, k, blend, box })` | a flat fill with a darker halftone clipped to the shape |

**Ink and shapes**: what the film's own objects are drawn with
| Call | What it draws |
|---|---|
| `D.ink(g, pts, { fill, line, width, t, boil = 1.5, seed, smooth, closed, dots, grain })` | any shape: flat fill, heavy ink outline, boil; `dots` = halftone options inside it |
| `D.line(g, pts, { line, width, t, seed, smooth })` | an open inked line (a crease, a crack) |
| `D.rectPts(x, y, w, h, r = 0, n = 6)`, `D.ellipsePts(cx, cy, rx, ry, n = 28, rot = 0)` | outlines as points, for `D.ink` |
| `D.bbox(pts)` | `{ x, y, w, h }` of points |

**Type**: in the fonts set by `D.fonts`
| Call | What it draws |
|---|---|
| `D.headline(g, t, text, { x, y, top, size = 120, font, weight, color, shadow, dx, dy, maxW, lineH, align, upper, at, stagger, d, from, line, lead, until, emph, id, role })` | big type, letter by letter with a misregistered shadow. With `line: 'l3'` it follows that line's spoken words; `until` pops it out. Returns its box. To have it fully printed on the cover (frame 0), set `at` earlier than −(letters × stagger + 0.4) s |
| `D.text(g, str, x, y, { face, size, weight, align, baseline, color, alpha, shadow, dx, dy, stroke, strokeW, t, id, role })` | static type in a role (`head`, `display`, `sans`, `mono`, `hand`) or a family name; `align` and `baseline` take the canvas values (`left`, `center`, `right`; `alphabetic`, `middle`, `top`) |

**The camera and transitions**
| Call | What it does |
|---|---|
| `D.camera(keys, { shakes: [[t0, amp, dur]], pulse: G, when(t), amount = 0.006 })` | the camera with shakes (5 to 26 px) and a small zoom pulse on every beat of `G` |
| `D.dotWipe(g, t, at, color)` | the style's transition: dots cover the frame by `at` and clear after it (in `top`) |
| `D.flashAt(g, t, [[t0, amp, dur]])` | white flashes (in `top`); keep `amp` at 0.5 or less |

## Optional objects
Use one only with a reason in the treatment. They take the inks and fonts set by `D.inks` and `D.fonts`; their
`color`, `fill` and `face` options restyle them further.

**Type objects**
| Call | What it draws |
|---|---|
| `D.numeral(g, str, { x, y, size = 820, fill, dot, angle, t, at, rot, alpha })` | a giant halftone-filled numeral that pops in |
| `D.stamp(g, t, str, { x, y, size = 96, at, until, rot = -8, color, alpha, blend })` | a rough-ink stamp that slams at `at` |
| `D.redact(g, t, [x, y, w, h], { at, lift, color })` | a black bar drawn on at `at`, lifted at `lift` |

**Props** (each pops in at `at` when given `t`)
| Call | What it draws |
|---|---|
| `D.burst(g, x, y, r, { t, at, points, rot, inner, fill, text, face, size, color })` | a starburst, with optional text |
| `D.bubble(g, str, { x, y, w, h, t, at, size, face, tail, role })` | a speech bubble; `tail` = `[x, y]` it points to |
| `D.note(g, str, { x, y, w, h, t, at, rot, color, size, role })` | a sticky note |
| `D.tag(g, str, { x, y, t, at, size, to, rot, fill, role })` | a manila tag; `to` = where its string goes |
| `D.folder(g, { x, y, w, h, t, color, dots, label })` | a case folder |
| `D.chart(g, { x0, x1, y0, step, n, from, by, unit })` | a height chart behind a subject |
| `D.plate(g, rows, { x, y, w, t, at, rot })` | a name plate; rows of `[text, size, colour?]` |
| `D.pin(g, x, y, { color })`, `D.paperclip(g, x, y, s = 1, rot = 0.12)` | a pin; a paperclip |
| `D.string(g, pts, prog, { width = 5, color })`, `D.ring(g, cx, cy, rx, ry, prog, { color, width = 10, seed })` | a string drawn on; a marker ring |

**The product print, the HUD, the caption bar**
| Call | What it does |
|---|---|
| `D.evidence(g, t, P, { x, y, h = 760, rot, scale, at, enter: 'drop' \| 'slide', pad, margin, label, strip, note, backdrop, clip })` | the real photo as an evidence print, in `over`. It crops the photo to its non-transparent box and lays it on `backdrop` (a light tint of the paper by default). An uncut photo (`cutout.mjs --uncut`) is shown whole, background and all, which suits the print. Returns `{ x, y, w, h, rot, point(px, py), photo, strip }`. Without it, place the photo yourself with `P.draw` (film-api.md, section 7) on a frame or ground drawn with the techniques |
| `D.hud(g, t, { caseNo, chip: [a, b], chipAt, date, dark, until })` | the HUD in the top band of the safe box; `until` folds it away in 0.15 s |
| `D.captions` | the caption bar: use it as the film's `captions` (`D.captionRender` is its renderer). Without it, design the film's captions in the brand's look (film-api.md, section 9) |
| `D.captionBar({ font, weight, size, fill, color, emph, shadow, radius, tilt, unsaid })` | the caption bar in the brand's look: its font (default the `sans` role), the pill's colour (`fill`, default `ink`), the words' colour (`color`, default `cream`), the keyword's (`emph`, default `highlight`), the offset shadow's (`shadow`; `null` for none), the corner radius (14), the tilt in degrees (0.6), the unspoken words' opacity (0.45). `size` is at least 56 |

## The brand's look, set once
At the top of `film(K)`, before anything is drawn, from the treatment's "The look" (the values come from the brand's
design card; these are placeholders):
```js
D.inks({ paper: '#…', ink: '#…', highlight: '#…', spot: '#…', tone: '#…' });
D.fonts({ head: { family: '…', weight: 700 }, sans: { family: '…', weight: 600 } });   // in the film's fonts/ first
D.captionBar({ fill: '#…', color: '#…', emph: '#…', shadow: null });                    // only if the film uses D.captions
```
