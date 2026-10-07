# Writing the film: script.json, film.mjs and the kit

## The project folder
```
<brand>-<product>-explainer/
  research.md        what step 2 found
  script.json        the words (format below)
  SHOTS.md           the shot list (story.md)
  film.mjs           the film (start from templates/film.mjs)
  product/raw/       downloaded photos         product/main.png   the cut-out (plus back.png etc.)
  images/            other pictures the film may draw, e.g. logo.png (loaded as K.images.logo)
  fonts/             optional brand fonts, Family_Name-700.ttf
  vo/                the voice (voice.mjs)  out/  sheet.jpg, frames/, the MP4, report.json
```

## script.json
```json
{
  "brand": "Brand", "product": "Product name", "slug": "brand-product-explainer",
  "voice": { "provider": "cartesia", "id": "<voice id>", "model": "sonic-3.6", "language": "en", "speed": 1.0 },
  "lead": 0.4, "gap": 0.35, "tail": 2.6,
  "lines": [
    { "id": "l1", "text": "Coffee in the fridge soaks up the smell of your food.", "show": "statement" },
    { "id": "l2", "text": "Coffee soaks up smells so well, people use it to *clear* fridge smells.", "pause": 0.2 },
    { "id": "l6", "text": "It costs ₹499.", "say": "It costs four hundred and ninety-nine rupees." }
  ]
}
```
- `show`: `caption` (default), `statement` (drawn big by the film with `K.statement`; no caption), or `none`.
- `*asterisks*` mark emphasis in captions and statements. They're removed before the voice reads the line.
- `say` is what the voice reads, when it differs from what's shown.
- `pause` adds silence after a line; `gap` is the normal silence between lines; `tail` is the end card's time after the last line.
- Line ids are what the film times things to. Keep them stable once the film is written.

## film.mjs
```js
export default function film(K) {
  const { T, W, H } = K;            // W 1080, H 1920
  const P = K.product('main');      // the cut-out (a placeholder bottle until product/main.png exists)
  // set up here: cameras, cached backgrounds, positions as functions of t
  return {
    look: 'painted',                // the medium (references/craft.md): painted | silkscreen | a custom one | t => name
    media: { focus: [{ x: 540, y: 900, r: 360 }] },   // the medium's options (below)
    motion: 'warm',                 // warm | playful | crisp
    music: 'warm',                  // warm | bright | calm | none
    background: '#EFE6D6',          // the world is cleared to this each frame
    captions: { font: 'Jost', size: 54, color: '#FFF8EC', style: 'shadow', emph: { family: 'Fraunces', italic: true, weight: 500 } },
    shots: [{ name: 'Fridge opens', from: 0, to: T.at('l3'), cut: true }, ...],   // camera setups: names and the cut count
    beats: { l3: 4.2 },             // optional: the moment the sheet shows for a line (default: as the line ends)
    cues: [{ t: T.word('l1', 'fridge'), sfx: 'door' }, ...],                       // one sound per action
    draw(g, t) { /* the world: everything but the product and the words; the medium remakes it */ },
    over(g, t) { /* the crisp layer: the product photo, hands in front of it, statements, labels, marks, stamps */ },
  };
}
```
- `captions.font` also becomes the default font of `K.text` and `K.label`.
- `shots[].cut: false` means the camera travels into the shot (not a cut). The QA counts hard cuts from `shots`.
- `musicEnd` (seconds) sets where the music resolves (default `T.endCard`).

## The medium: `look` and `media`
| look | What it does | `media` options |
|---|---|---|
| `'painted'` | underpainting, then about 35,000 colour-sampled bristle strokes along the forms, re-laid at 10 fps, canvas weave | `focus: [{x, y, r}]` (finer strokes there), `density` (1), `size` (1), `flow(x, y)` (stroke angle away from edges), `weave` (0.4), `grain` |
| `'silkscreen'` | each ink its own plate, halftone fixed to the paper, plates off register, uneven ink, paper fibre | `inks: ['#..', ...]` (required, 4 to 8, lightest first), `paper`, `screen` (dot cell, 7 px), `register` (1.6 px), `grain` |
| a custom medium | `media.custom = { riso(g, ref, t, o) { ... } }`, then `look: 'riso'`: read `ref` (the world as drawn) and remake the frame on `g` by the medium's physical steps. With `o.layer`, leave clear what `ref` leaves clear. | yours |
| `t => name` | a different medium per world or shot, switching on a cut | |
| `'none'` | debugging only: a flat render the QA flags as not for delivery | |

**Mixing media inside a frame:** `K.medium(g, 'silkscreen', t, { inks: [...] }, lg => drawTheCallout(lg))` draws into a
clear layer, remakes it in that medium and composites it over `g`. Call it from `draw` or `over` with no transform set
(it works in screen space; use `K.view` inside `fn` for world positions).

**What goes where:** anything the medium should make goes in `draw`. The product photo goes in `over`, and so does
anything that has to sit in front of it (the front part of a hand holding it). Words, labels, marks and stamps go in
`over` so they stay sharp. Use the same camera in both (`K.view(g, cam, t, 1, ...)`).

## Time: `K.T`
- `T.at('l3')` and `T.end('l3')` give a line's start and end (with an optional offset: `T.at('l3', 0.2)`).
- `T.word('l3', 'cupboard')` gives when a word starts; `T.word('l3', 'it', 2)` the second "it"; `T.wordEnd(...)` when it
  ends. Time actions to words, not to guesses.
- `T.dur` is the whole film, and `T.endCard` is just after the last line ends.

## Motion helpers (all are pure functions of t)
| Helper | Returns |
|---|---|
| `K.p(t, at, dur?, ease?)` | eased progress from 0 to 1 (ease: `'warm'`, `'inOut'`, `'out'`, `'outBack'`, `'linear'`...) |
| `K.settle(t, at, dur?, over?)` | 0 to a little past 1 and back to 1: for arrivals and pops |
| `K.move(t, at, from, to, dur?)` | a value or [x, y] moving with a settle |
| `K.wobble(t, at, amp, freq, decay)` | a damped rock after a landing |
| `K.fade(t, a, b, fin, fout)` | 0 to 1 to 0 over a window |
| `K.wave(t, period, amp, phase)` | idle life |
| `K.twos(t, 12)` | time on twos, for a hand-made boil |
| `K.M` | the motion setting: `{ ease, dur, over, stagger }` |

## The camera
```js
const cam = K.camera([{ t: 0, x: 540, y: 960, z: 1 }, { t: T.at('l2'), x: 700, y: 900, z: 1.2, e: 'warm' }], { shakes: [{ at: 3.1, dur: 0.25, amp: 8 }] });
K.view(g, cam, t, 0.85, () => drawFarWall(g, t));   // depth < 1: further away, moves less
K.view(g, cam, t, 1, () => drawRoom(g, t));
K.view(g, cam, t, 1.2, () => drawForeground(g, t)); // depth > 1: a foreground, moves more
const s = K.toScreen(cam, t, [worldX, worldY]);     // where a world point is on screen (for labels and circles)
```
A key's `e` is the ease into it. Draw far layers bigger than the frame, so camera moves never show an edge.

## Drawing kit
| Call | What it draws |
|---|---|
| `P.draw(g, { x, y, h, t, at, enter, rot, scale, alpha, border, tape, shadow, paper })` | the product cut-out card; x, y = middle of its base; returns `rect` with `rect.point(px, py)` (a photo pixel to the drawing's coordinates) |
| `K.hand(g, { x, y, rot, scale, pose, part, flip, skin, sleeve, t })` | a hand: pose `point`, `open`, `hold`, `pinch`; part `all`, `back`, `front`; x, y = wrist, rot 0 = fingers up |
| `K.statement(g, t, id, { x, y, size, font, color, align, maxW, until, all })` | a line's words, appearing as the voice says them |
| `K.text(g, str, x, y, { size, font, weight, color, align, maxW, alpha, t })` | static text (`*emphasis*` works) |
| `K.label(g, str, { x, y, to, t, at, until, size, bg, color })` | a pill label that pops in, with a line drawn to `to` |
| `K.stamp(g, str, x, y, t, at, { size, color, rot, until })` | an inked rubber stamp landing at `at` |
| `K.mark(g, cx, cy, rx, ry, prog, { color, width })` | a hand-drawn circle, drawn on as prog goes 0 to 1 |
| `K.arrow(g, from, to, prog, { bend, color, width, t, bob })` | an arrow that draws on, then bobs |
| `K.strike`, `K.tick`, `K.drawOn(g, pts, prog, opts)` | a strike-through, a tick, any line drawn on |
| `K.wisps(g, x, y, t, { n, h, w, color, alpha, strength })` | steam, smell, heat, scent rising |
| `K.sparkle(g, x, y, t, at)` | a small twinkle |
| `K.counter(t, at, dur, from, to, { decimals })` | a number counting up, as text |
| `K.contact(g, x, y, rx, ry, alpha)` | a soft contact shadow under something |
| `K.shape(g, pts, color, { t, boil, smooth, stroke })` | a filled shape from points, optionally boiling on twos |
| `K.wipe(g, prog, fn, { shape: 'circle', cx, cy })` | reveals fn's drawing through a growing circle or edge |
| `K.cache(key, w, h, (g) => ...)` | draws something once and returns the canvas: use it for static backgrounds |
| `K.medium(g, name, t, opts, (lg) => ...)` | a layer made in its own medium, composited over g (mixed media) |
| `K.spline`, `K.poly`, `K.circle`, `K.ellipse`, `K.roundRect`, `K.ribbon` | Path2D builders |
| `K.rng(seed)`, `K.noise`, `K.fbm`, `K.jitter(color, r, amt)`, `K.mix`, `K.shade(color, k)`, `K.rgba` | randomness and colour |

## Patterns
**Shots inside one film:**
```js
draw(g, t) {
  if (t >= cardAt) return endCardGround(g, t);   // the one hard cut, into the end card
  K.view(g, cam, t, 1, () => room(g, t));
},
over(g, t) {
  if (t >= cardAt) return endCardProduct(g, t);
  let rect; K.view(g, cam, t, 1, () => { rect = P.draw(g, { ... }); });
  notes(g, t, rect);                             // screen-space labels, after the product
},
```
**Holding the product without covering it:**
```js
K.hand(g, { ...grip, part: 'back' }); const rect = P.draw(g, {...}); K.hand(g, { ...grip, part: 'front' });
```
**Pointing at a detail on the label** (pixel 410, 820 in `product/main.png`), from screen space:
```js
let rect; K.view(g, cam, t, 1, () => { rect = P.draw(g, {...}); });
const f = K.toScreen(cam, t, rect.point(410, 820)); K.mark(g, f[0], f[1], 120, 50, K.p(t, T.word('l5', 'date'), 0.5));
```
**Positions as functions of t:** `const at = t => t < lift ? A : t > land ? B : lerp(...)`. No state between frames.

## Checking while building
- `RUN render.mjs <project> frame 1.2 4.8 9 --estimate` (before the voice) or without `--estimate` (after it): look at
  the PNGs.
- `RUN render.mjs <project> frame 4.8 --crop 300,600,540,540`: also saves that part at 100%, to check the hero's
  detail and the medium up close (`references/craft.md`, section 6).
- `RUN render.mjs <project> sheet`: the contact sheet, one finished frame per beat, and the QA (event gaps, cuts,
  statements, text outside the safe zone, the product drawn bigger than its photo, a missing medium). Clear every
  warning.
- Errors name the time: `film.draw failed at t=7.200 s: ...`.
