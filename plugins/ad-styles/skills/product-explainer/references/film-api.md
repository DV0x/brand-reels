# The film's code: script.json, film.mjs, the kit, the score and the style kits

This is the complete reference for everything a film can call. You never need to open `scripts/lib/` or a style's
`engine.mjs`: if a call or an option is not here, it does not exist. Commands are in [tools.md](tools.md); why to use
a call is in [directing.md](directing.md).

## Contents
1. The folders
2. script.json
3. film.mjs: the film object and the frame's layers
4. Time: K.T and the music grid
5. Motion
6. The camera
7. The product photo
8. Drawing calls
9. Text, captions and the checks
10. Paths, maths and colour
11. Sound: cues and the score
12. The Halftone Dossier kit (K.style)
13. Patterns

## 1. The folders
```
<brand>/                 one folder per brand (directing.md, section 12)
  BRAND.md  LEARNINGS.md  research.md
  <film>/                one folder per film
    script.json          the words, the voice, the style, and where each line sits on the music grid
    BRIEF.md             the locked brief, saved after the script approval (templates/BRIEF.md)
    TREATMENT.md         the plan, before any drawing (directing.md, section 4)
    film.mjs             the film, from templates/film.mjs and the treatment
    style.mjs            a draft style's primitives, if you built them (craft.md, section 6)
    REVIEW.md            every review round: what you saw, what you changed
    CREDITS.md  DELIVERY.md   written at delivery (templates/)
    product/raw/         downloaded photos;  product/main.png  the cut-out (other views: back.png, open.png)
    images/              other pictures the film may draw (images/logo.png is K.images.logo)
    fonts/               fonts from fonts.mjs, named Family_Name-700.ttf
    vo/                  the voice: voice.wav, timing.json (the film's clock)
    out/                 frames/, contact.jpg, strips/, check.json, the MP4, its .srt, cover.jpg, report.json
```

## 2. script.json
```json
{
  "brand": "Brand", "product": "Product name", "slug": "brand-product",
  "style": "halftone-dossier", "placement": "organic",
  "voice": { "provider": "cartesia", "id": "<voice id>", "model": "sonic-3.6", "language": "en", "speed": 1.0 },
  "lead": 0.4, "gap": 0.35, "tail": 2.8,
  "lines": [
    { "id": "l1", "text": "Your shampoo has 14 ingredients.", "say": "Your shampoo has fourteen ingredients.", "at": 0.5, "anchor": "shampoo" },
    { "id": "l2", "text": "Most of them are *water*.", "at": 4.5, "anchor": "water", "show": "statement" },
    { "id": "l6", "text": "It costs ₹499.", "say": "It costs four hundred and ninety-nine rupees.", "pause": 0.2 }
  ]
}
```
| Field | Meaning |
|---|---|
| `style` | a folder under `styles/`. Its fonts load, and its drawing kit (if it has one) reaches the film as `K.style` |
| `placement` | `organic` (default, a post) or `ad` (a paid ad). Sets the safe box for words and the caption lane (craft.md, section 3) |
| `voice` | the Cartesia voice (`voice.mjs --voices` lists them); `speed` stays 1.0: never speed the voice up to fit |
| `lead`, `gap`, `tail` | seconds before the first line, between lines, after the last line |
| `duration` | optional: fixes the film's length; otherwise the last line's end + `tail` |
| `lines[].id` | what the film times things to. Keep ids stable once the film is written |
| `lines[].text` | what is shown; `*asterisks*` mark emphasis (removed before the voice reads it) |
| `lines[].say` | what the voice reads when it differs (numbers, prices, units, brand names) |
| `lines[].show` | `caption` (default), `statement` (drawn big by the film; no caption), or `none` |
| `lines[].at`, `anchor` | place the line on the music grid: it starts at `at`, or its `anchor` word does (`"word#2"` = the second one) |
| `lines[].pause` | extra seconds before a line that follows the one before it |

Lines without `at` follow the one before. After changing `at`, `anchor`, `text` or `say`, run `voice.mjs` again: lines
already voiced cost nothing.

## 3. film.mjs: the film object and the frame's layers
Start from `templates/film.mjs`. It exports one function that gets the kit `K` and returns the film object:
```js
export default function film(K) {
  const { T, W, H } = K;
  const D = K.style;                 // the style's kit, or undefined for a draft style
  const P = K.product('main');       // the cut-out
  const G = K.grid(90, 0.5);         // the music grid
  return { background, draw, captions, finish, over, top, motion, shots, hits, cues, music, beats };
}
```
| Field | Meaning |
|---|---|
| `background` | a colour; the world is cleared to it every frame |
| `draw(g, t)` | 1. the world, drawn in the style |
| `captions` | the caption settings or a style's renderer (section 9); `layer: 'print'` draws them into the world, under the finish |
| `look` | a paint-over pass for painterly styles: `'painted'`, `'silkscreen'`, or a name in `media.custom`; a function of t may switch it. With a `style`, the default is `'direct'` (the style draws its own medium) |
| `media` | options for the pass; `media.custom = { name(g, ref, t, opts) }` adds a pass |
| `finish(g, t)` | 3. the medium's finish over the world (paper, grain) |
| `over(g, t)` | 4. above the finish: the real product photo and anything in front of it; no texture lands here |
| `top(g, t)` | 5. after the captions: transitions and flashes, over everything |
| `motion` | `warm`, `playful` or `crisp`: the kit's default timing and overshoot (`K.M`) |
| `shots` | `[{ name, from, to, cut }]`; `cut: true` = a hard cut, `'wipe'` = the style's transition, `false` = a camera move |
| `hits` | `[{ t, name }]`: the big hits. The check proves each lands on the grid |
| `cues` | `[{ t, sfx, gain, pan, dur }]`: one sound per visible action (section 11) |
| `music` | `{ bpm, offset, score(S), silences: [[a, b]], end, underVoice }` (section 11), or a preset name for a first draft |
| `musicEnd` | optional: when the music stops (default `music.end`, else the end card) |
| `beats` | optional `{ l3: 4.2, end: 29.5 }`: the moment the `sheet` shows for a line |

**Layers, in order:** `draw` → printed captions → the pass (`look`) and/or `finish` → `over` → captions → `top`.
Every function must be a pure function of t: no state carried between frames (frames render out of order).

## 4. Time: K.T and the music grid
| Call | Returns |
|---|---|
| `T.at('l3', off?)`, `T.end('l3', off?)` | a line's start or end in seconds (plus an offset) |
| `T.word('l3', 'cupboard', n?)` | when a word starts; `n` = which time it occurs (default 1). Throws if the word is not in the line |
| `T.wordEnd('l3', 'cupboard', n?)` | when that word ends |
| `T.line('l3')` | `{ id, text, start, end, words: [{ w, start, end }] }` |
| `T.lines`, `T.dur`, `T.endCard` | all lines; the film's length; just after the last line (0.25 s after it ends) |
| `K.grid(bpm, offset)` | `G = { bpm, offset, beat, bar, snap(t, 'nearest' \| 'next' \| 'prev', unit?), barIndex(t), barStart(n) }` |

`G.snap(T.word('l4', 'half'), 'nearest', G.beat / 4)` puts an action on the nearest 16th note. Time every action from a
word or the grid, never from a typed number: a re-placed line then re-times its scene.

## 5. Motion
All are pure functions of t. `at` is when the move starts; the kit records every `at` for the check's "nothing new
for 4 s" warning.

| Call | Returns |
|---|---|
| `K.p(t, at, dur?, ease?)` | eased progress 0 → 1. `ease`: `linear`, `in`, `out`, `inOut`, `outExpo`, `outBack`, `warm`, `crisp`, `soft`, or a function |
| `K.settle(t, at, dur?, over?)` | 0 → a little past 1 → 1: arrivals that land |
| `K.move(t, at, from, to, dur?)` | a number or `[x, y]` moving with a settle |
| `K.wobble(t, at, amp = 0.05, freq = 9, decay = 5)` | a damped rock after a landing (radians) |
| `K.fade(t, a, b, fin = 0.25, fout = 0.25)` | 0 → 1 → 0 over a window: idle life, not entrances |
| `K.wave(t, period = 3, amp = 1, phase = 0)` | a sine for idle life |
| `K.twos(t, fps = 12)` | time held on twos, for a hand-made boil |
| `K.boil(pts, t, amp = 1.6, seed = 1, fps = 12)` | the point list, jittered and reseeded `fps` times a second |
| `K.counter(t, at, dur, from, to, { decimals = 0, e = 'out' })` | a counting number, as a string |
| `K.M` | the motion setting: `{ name, dur, ease, over, stagger }` |
| `K.ease.<name>(x)`, `K.seg(t, a, b)`, `K.ss(x)` | an easing curve; 0 → 1 between a and b; smoothstep |

## 6. The camera
```js
const cam = K.camera([{ t: 0, x: 540, y: 960, z: 1 }, { t: T.at('l2'), x: 700, y: 900, z: 1.2, r: 0.02, e: 'inOut' }],
  { shakes: [{ at: 3.1, dur: 0.25, amp: 8 }] });
K.view(g, cam, t, 1, () => drawRoom(g, t));       // depth < 1 is far (moves less), > 1 is a foreground (moves more)
const s = K.toScreen(cam, t, [worldX, worldY]);   // where a world point is on screen, for labels and rings
```
A key is `{ t, x, y, z, r, e }`: the world point at the frame's centre, the zoom, the roll in radians, and the ease into
the key (any name in `K.ease`, default `inOut`). Shakes are `{ at, amp, dur }` or `[at, amp, dur]` (both work, here and in `D.camera`). **A hard cut** to a
new framing: give the new shot its own camera, so no frame interpolates between the two. Draw far layers bigger than the frame, so a move never shows an edge. Anything that follows a subject goes
through `K.toScreen`, never hand-typed screen positions. A style kit may wrap the camera (`D.camera`, section 12).

## 7. The product photo
`const P = K.product('main')` (or `'back'`, `'open'`: any PNG in `product/`). Before a cut-out exists it is a
placeholder bottle. `P.w`, `P.h`, `P.aspect` and `P.srcH` give the photo's size.

`P.draw(g, o)` draws it as a cut-out paper card and returns `rect = { x, y, w, h, rot, point(px, py) }`;
`rect.point(px, py)` is where a pixel of `product/main.png` landed, for rings and arrows.

| Option | Meaning |
|---|---|
| `x`, `y` | the middle of the card's base |
| `h` | how tall the product is drawn (never more than the photo: the check flags it) |
| `t`, `at`, `dur` | the time, when it enters, how long the entrance takes |
| `enter`, `from` | `drop`, `slide-left`, `slide-right`, `rise`, `pop` or `none`; `from` overrides the start point |
| `rot`, `scale`, `alpha` | turn (radians), extra scale, opacity |
| `border`, `paper`, `tape`, `shadow` | the card's paper edge, its colour, a tape strip, its shadow; `false` turns each off |

## 8. Drawing calls
`prog` is a progress 0 → 1 (usually `K.p(t, at, dur)`), so marks draw on.

| Call | What it draws |
|---|---|
| `K.mark(g, cx, cy, rx, ry, prog, { color, width = 8, seed, turns = 1.12, tilt, alpha })` | a hand-drawn ring around something |
| `K.arrow(g, from, to, prog, { bend = 0.18, width = 7, color, head = 26, t, bob = 5 })` | a curved arrow that draws on; `from`, `to` are `[x, y]` |
| `K.strike(g, x0, y0, x1, y1, prog, { color, width = 9, seed })` | a strike-through |
| `K.tick(g, x, y, size, prog, { color, width = 10 })` | a check mark about `size` wide, centred near `x, y` |
| `K.drawOn(g, pts, prog, { width = 6, color, cap, smooth = true, alpha, dash })` | any line through points, drawing on |
| `K.shape(g, pts, color, { t, boil, seed, smooth, stroke, width = 3 })` | a filled shape from points; returns its path |
| `K.contact(g, x, y, rx, ry, alpha = 0.32, color)` | a soft contact shadow where something meets a surface |
| `K.wisps(g, x, y, t, { n, h, w, color, alpha, width, speed, strength, seed })` | steam or scent rising |
| `K.sparkle(g, x, y, t, at, { size = 26, color })` | a twinkle that grows and shrinks over 0.7 s from `at` |
| `K.hand(g, { x, y, rot, scale, pose, part, flip, skin, sleeve, t, boil })` | a hand: x, y = the wrist; fingers point along `rot` (0 = up). `pose`: `point`, `open`, `hold`, `pinch`. `part`: `back` or `front`, drawn either side of a held product |
| `K.wipe(g, prog, fn, { shape = 'circle', cx, cy, edge })` | reveals `fn()` through a growing shape: `circle`, `left`, `right`, `up`, `down` |
| `K.cache(key, w, h, fn(g, canvas))` | draws something once and returns the canvas |
| `K.canvas(w, h)` | an offscreen canvas |
| `K.medium(g, name, t, opts, fn)` | draws `fn()` through a paint-over pass (`painted`, `silkscreen`) and lays it over g |
| `K.images.<name>` | a picture from `images/` (draw with `g.drawImage`) |

The canvas `g` is a standard 2D canvas (paths, fills, `globalCompositeOperation`, `getImageData`). There is no browser,
SVG filter or WebGL.

## 9. Text, captions and the checks
| Call | What it does |
|---|---|
| `K.statement(g, t, id, { x, y, size, font, weight, italic, emph, maxW, lineH, align, color, shadow, all, until, lead })` | the line `id` as big type, word by word as it is spoken. Mark the line `"show": "statement"` |
| `K.text(g, str, x, y, { font, weight, italic, size, emph, maxW, lineH, align, color, alpha, t, id, role })` | static text with `*emphasis*`, wrapped at `maxW`; `align`: `left` (default), `center`, `right`; returns its box |
| `K.label(g, str, { x, y, t, at, until, to, bend, size, font, weight, pad, color, bg, border, radius, shadow, rot, lineW, lineColor, role })` | a label that pops in, with a line to the point `to` it names. `x`, `y` are the label's **centre**: for a left edge at `L`, measure the width (`g.measureText`) and use `x: L + width / 2 + pad` |
| `K.stamp(g, str, x, y, t, at, { size, color, font, weight, border, from, rot, alpha, blend, until })` | a stamp that slams in |
| `K.noteText(id, { text, role, size, box: [x0, y0, x1, y1], t, spoken })` | registers your own drawn text for the checks |
| `K.font({ family, size, weight, italic }, size?)` | a canvas font string |
| `K.parseMarkup(str)`, `K.plain(str)` | `*a b* c` → `[{ w, emph }]`; the text without marks |
| `K.align(tokens, words, a, b)`, `K.norm(str)` | times for tokens from the voice's words; a word folded for matching |

**Register every text** you draw yourself with `K.noteText` (the kit's and the style kits' text calls do it already).
`role` sets the minimum size: `caption` 56, `headline` 72, `label` 40, `stamp` 40, `note` 36; `texture` (a case
number, a ruler, words that are part of a prop) has none. The first and last time a text is seen give its reading time.

**Captions** run on their own from the voice, phrase by phrase, in the caption lane (`K.LANE = { x, y1, maxW }`; words
stay inside `K.SAFE = { x0, y0, x1, y1 }`). A style kit gives its own (`captions: D.captions`). A draft style sets them
with an object: `captions: { font, weight, size, color, emph: { family, weight, italic, scale }, style: 'shadow' |
'chip', bg, layer: 'over' | 'print' }`, or its own renderer `render(g, cap, t, { prev, next, i, style, lane })`, where
`cap.toks[i]` is a word (`{ w, emph }`) and `cap.times[i] = { a, b }` its spoken time.

Also on K: `K.W`, `K.H` (1080 × 1920), `K.script` (script.json), `K.products`, `K.event(t)` (records an animation start
for the 4-second check; the motion calls do it already), `K.qa` (what the frame and video modes flag).

## 10. Paths, maths and colour
| Call | Returns |
|---|---|
| `K.spline(pts, closed = false, tension = 0.5)`, `K.poly(pts, closed = true)` | a Path2D through points |
| `K.circle(x, y, r)`, `K.ellipse(x, y, rx, ry, rot)`, `K.roundRect(x, y, w, h, r)` | Path2D shapes |
| `K.ribbon(pts, widths)` | a filled ribbon along a line; `widths[i]` is the half-width at `pts[i]` |
| `K.sampleSpline(pts, per = 10)` | points along a smooth curve through `pts` |
| `K.Path2D`, `K.DOMMatrix`, `K.TAU` | the canvas classes; 2π |
| `K.clamp(x, a = 0, b = 1)`, `K.lerp(a, b, t)` | limits; a value between a and b |
| `K.rng(seed)` | a seeded random function `() → 0..1` |
| `K.hash2(x, y, seed)`, `K.noise(x, y, seed)`, `K.fbm(x, y, oct = 4, seed)` | repeatable hash, value noise, layered noise (0..1) |
| `K.rgb('#hex')`, `K.hex([r, g, b])` | colour conversions |
| `K.mix(a, b, t)`, `K.shade(c, k)`, `K.rgba(c, alpha)` | a mixed colour; lighter (k > 0) or darker (k < 0); a CSS rgba string |
| `K.jitter(c, r, amt = 0.06)` | a colour varied a little by the random function `r` |

## 11. Sound: cues and the score
**Cues** (`cues: [{ t, sfx, gain, pan, dur }]`): `gain` 1 is a normal level for every effect (the levels are already
balanced under the voice), 0.3 to 1.5; `pan` −1 to 1; `dur` for the effects that have a length (whoosh, swish, marker,
crinkle, steam, pour, rise, squeak). Effects: `pop`, `click`, `tick`, `whoosh`, `swish`, `thud`, `stamp`, `stampbig`, `paper`,
`tape`, `marker`, `flip`, `crinkle`, `chime`, `ding`, `steam`, `door`, `pour`, `sparkle`, `rise`, `snap`, `shutter`,
`type`, `boing`, `plop`, `squeak` (skin or rubber rubbed clean; has a length), `drip` (a water drop).

**The score** (`music: { bpm, offset, score(S), silences, end, underVoice }`): `score(S)` runs once before the mix and
writes the film's own music. `underVoice` is how many dB the music's sounding parts sit under the voice (default 10).
Presets (`warm`, `bright`, `calm`, `dossier`, `none`) are only for a first draft.

| Call | What it plays |
|---|---|
| `S.bpm`, `S.beat`, `S.bar`, `S.offset`, `S.duration` | the grid in seconds |
| `S.at(bar, beat = 0)` | a time on the grid (`bar` from 0 at `offset`) |
| `S.hz(note)` | a note's frequency; notes are MIDI numbers (60 = C4) or names (`'F2'`, `'Bb3'`, `'C#4'`) |
| `S.kick(t, g)`, `S.snare(t, g)`, `S.clap(t, g)`, `S.hat(t, g)`, `S.snap(t, g)` | the synth kit; `g` is a gain around 1 |
| `S.roll(t, dur, g)`, `S.sweep(t, dur, g, down = false)` | a snare roll that speeds up; a rising (or falling) sweep |
| `S.bass(t, note, len, g)` | a bass note with harmonics |
| `S.marimba(t, note, g, pan)`, `S.bell(t, note, g, pan)` | a marimba-like pluck; a music-box bell |
| `S.pad(t, [notes], len, g)` | a soft chord |
| `S.pluck(t, note, g, { decay, bright, dur, pan })`, `S.pizz(t, note, g, pan)` | a plucked string; a short pizzicato |
| `S.tone(t, note, dur, g, { wave: 'sine' \| 'triangle' \| 'square', attack, release, pan })` | a plain synth voice |
| `S.room(from, to, g)`, `S.hum(from, to, hz = 100, g)` | a room-tone bed; a faint hum (both play on through silences) |
| `S.noise(t, dur, lo, hi, g, pan)` | filtered noise; `lo`, `hi` are 0..1 of the band |
| `S.silence(a, b)` | empties the music between a and b, so the next hit lands alone |

Write it section by section from the cue map: for example a call bar on the marimba, and an answer bar that stays
empty until the story's answer arrives. No pad notes below MIDI 48.

## 12. The Halftone Dossier kit (K.style)
Loaded when `script.json` says `"style": "halftone-dossier"`; the film calls it `D`. It is a kit of parts with no
story: it draws nothing unless a scene calls it. Its look and numbers are in `styles/halftone-dossier/STYLE.md`.

**Setup and constants**
| Name | Meaning |
|---|---|
| `D.inks({...})` | sets the ink roles (returns them): `paper`, `ink`, `spot`, `spot2`, `overprint`, `highlight`, `stamp`, `night`, `night2`, `cream`, `card` |
| `D.C`, `D.INKS` | the current inks; the defaults |
| `D.F`, `D.FONTS` | faces: `head` Alfa Slab One, `display` Bagel Fat One, `sans` Archivo Black, `mono` JetBrains Mono, `hand` Caveat |
| `D.font(family, size, weight = 400)`, `D.measure(str, font)` | a font string; a text width |
| `D.ZONE` | the 9:16 page: `hudTop`, `hudBottom`, `headTop`, `heroTop`, `heroBottom`, `captionTop`, `captionBottom` (from the placement) |
| `D.finish` | the paper (multiplied) and the dust: use it as the film's `finish` |
| `D.paperTex()`, `D.grain(g, t)` | the paper canvas; the dust alone |
| `D.captions` | the caption bar: use it as the film's `captions` (`D.captionRender` is its renderer) |

**Motion**: `D.E` = eases `out`, `in`, `io`, `back` (0..1). `D.pop(t, at, d = 0.35)`: 0, then a pop with overshoot.
`D.rise(t, at, from, to, d = 0.4)`: a value that rises with overshoot. `D.slam(t, at)`: a stamp's scale, 2.6 → 1 in
0.09 s ending at `at`, then a small bounce. `D.squash(t, at, k = 0.18)`: a landing squash; use as `scale(1 / sq, sq)`.

**Dots and fields**
| Call | What it does |
|---|---|
| `D.halftone(g, { x, y, w, h, step = 22, angle = 15, field, k = 0.68, color, blend, alpha, cache })` | a dot field; `field(x, y)` → 0..1 sets the dot size; `cache: 'key'` draws it once. The rotated grid spills past the box's edges: clip it (`g.clip()`) for a hard edge |
| `D.radial(cx, cy, R, pw = 1.2, gain = 1)`, `D.edge(R = 1, pw = 1.6, gain = 1.3)`, `D.ramp(x0, y0, x1, y1, a = 0.25, b = 1)` | density fields: a halo, the frame's edges, a gradient |
| `D.max(...fields)`, `D.scaled(field, k)` | combine fields |
| `D.dotFill(g, path, { fill, dot, step, angle, field, k, blend, box })` | a flat fill with a darker halftone clipped to the shape |

**Ink and shapes**
| Call | What it draws |
|---|---|
| `D.ink(g, pts, { fill, line, width, t, boil = 1.5, seed, smooth, closed, dots, grain })` | the basic prop: flat fill, heavy ink outline, boil; `dots` = halftone options inside it |
| `D.line(g, pts, { line, width, t, seed, smooth })` | an open inked line (a crease, a crack) |
| `D.rectPts(x, y, w, h, r = 0, n = 6)`, `D.ellipsePts(cx, cy, rx, ry, n = 28, rot = 0)` | outlines as points, for `D.ink` |
| `D.bbox(pts)` | `{ x, y, w, h }` of points |

**Type**
| Call | What it draws |
|---|---|
| `D.headline(g, t, text, { x, y, top, size = 120, font, color, shadow, dx, dy, maxW, lineH, align, upper, at, stagger, d, from, line, lead, until, emph, id, role })` | big type, letter by letter with a misregistered shadow. With `line: 'l3'` it follows that line's spoken words; `until` pops it out. Returns its box. To have it fully printed on the cover (frame 0), set `at` earlier than −(letters × stagger + 0.4) s |
| `D.text(g, str, x, y, { face, size, weight, align, baseline, color, alpha, shadow, dx, dy, stroke, strokeW, t, id, role })` | static type in a face: `head`, `display`, `sans`, `mono`, `hand`; `align` and `baseline` take the canvas values (`left`, `center`, `right`; `alphabetic`, `middle`, `top`) |
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

**The product, the HUD, the camera, transitions**
| Call | What it does |
|---|---|
| `D.evidence(g, t, P, { x, y, h = 760, rot, scale, at, enter: 'drop' \| 'slide', pad, margin, label, strip, note, backdrop, clip })` | the real photo as an evidence print, in `over`. It crops the photo to its non-transparent box and lays it on `backdrop` (a light tint of the paper by default). An uncut photo (`cutout.mjs --uncut`) is shown whole, background and all, which suits the print. Returns `{ x, y, w, h, rot, point(px, py), photo, strip }` |
| `D.hud(g, t, { caseNo, chip: [a, b], chipAt, date, dark, until })` | the HUD in the top band of the safe box; `until` folds it away in 0.15 s |
| `D.camera(keys, { shakes: [[t0, amp, dur]], pulse: G, when(t), amount = 0.006 })` | the camera with shakes (5 to 26 px) and a small zoom pulse on every beat of `G` |
| `D.dotWipe(g, t, at, color)` | the style's transition: dots cover the frame by `at` and clear after it (in `top`) |
| `D.flashAt(g, t, [[t0, amp, dur]])` | white flashes (in `top`); keep `amp` at 0.5 or less |

## 13. Patterns
**Holding the product without covering it:**
```js
K.hand(g, { ...grip, part: 'back' }); const rect = P.draw(g, { x, y, h, t }); K.hand(g, { ...grip, part: 'front' });
```
**Pointing at a detail on the label** (pixel 410, 820 of `product/main.png`), from screen space, with its label:
```js
let rect; K.view(g, cam, t, 1, () => { rect = P.draw(g, { x: 540, y: 1300, h: 700, t }); });
const [fx, fy] = K.toScreen(cam, t, rect.point(410, 820)), at = T.word('l5', 'date');
K.mark(g, fx, fy, 120, 50, K.p(t, at, 0.5));
K.label(g, 'packed on', { x: fx - 260, y: fy - 160, to: [fx - 100, fy - 30], t, at: at + 0.2 });
```
**One subject that changes:** keep its state as a function of t, and let every scene draw the same subject in it:
```js
const level = t => (t < T.word('l3', 'half') ? 1 : t < T.word('l6', 'empty') ? 0.5 : 0);
```
**A hit on the grid, with its sound:**
```js
const tHit = G.snap(T.word('l4', 'never'), 'nearest', G.beat / 4);
// hits: [{ t: tHit, name: 'stamp' }], cues: [{ t: tHit, sfx: 'stamp', gain: 1 }]
```
**Positions as functions of t:** `const at = t => (t < lift ? A : t > land ? B : lerp(...))`. No state between frames.
