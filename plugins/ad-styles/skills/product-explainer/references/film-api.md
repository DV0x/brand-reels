# Writing the film: script.json, film.mjs, the kit and a style's drawing kit

## Contents
- The project folder
- script.json (and placing the voice on the grid)
- film.mjs and the frame's layers
- A style's drawing kit (K.style)
- The score: music.score(S)
- Time: K.T and the beat grid
- Motion helpers
- The camera
- The drawing kit
- Text, roles and the checks
- Patterns
- Checking while building

## The project folder
```
<brand>-<product>-explainer/
  research.md        what step 1 found
  script.json        the words, the style, and where each line sits on the music grid (format below)
  TREATMENT.md       the treatment (directing.md, section 4)
  REVIEW.md          every review round: what you saw, what you changed (directing.md, sections 5 and 11)
  film.mjs           the film, from templates/film.mjs and the treatment
  style.mjs          a rules-only style's primitives, if you built them (craft.md, section 6)
  product/raw/       downloaded photos         product/main.png   the cut-out (plus back.png etc.)
  images/            other pictures the film may draw, e.g. logo.png (loaded as K.images.logo)
  fonts/             the style's fonts (fonts.mjs), Family_Name-700.ttf
  vo/                the voice (voice.mjs)  out/  frames/, contact.jpg, strips/, check.json, the MP4, .srt, cover.jpg, report.json
```

## script.json
```json
{
  "brand": "Brand", "product": "Product name", "slug": "brand-product-explainer",
  "style": "halftone-dossier", "placement": "organic",
  "voice": { "provider": "cartesia", "id": "<voice id>", "model": "sonic-3.6", "language": "en", "speed": 1.0 },
  "lead": 0.4, "gap": 0.35, "tail": 2.8, "duration": 35.0,
  "lines": [
    { "id": "l1", "text": "70% dark chocolate.", "say": "Seventy percent dark chocolate.", "at": 0.5, "anchor": "Seventy" },
    { "id": "l2", "text": "You buy it because it's the *\"healthy\"* one.", "at": 4.5, "anchor": "healthy" },
    { "id": "l6", "text": "It costs ₹499.", "say": "It costs four hundred and ninety-nine rupees.", "pause": 0.2 }
  ]
}
```
- `style`: a folder under `styles/`. Its fonts are loaded and its drawing kit, if it has one, is handed to the film as
  `K.style`.
- `placement`: `organic` (the default, a post) or `ad` (a paid ad, Meta's safe zone). It sets where words may go and
  where the caption lane sits (`K.SAFE`, `K.LANE`; craft.md section 3). The picture always fills the frame.
- `show`: `caption` (default), `statement` (drawn big by the film as a headline; no caption), or `none`.
- `*asterisks*` mark emphasis in captions and headlines; they're removed before the voice reads the line.
- `say` is what the voice reads when it differs from what's shown (spell numbers out for the voice; captions keep
  digits).
- **Placing the voice on the music grid:** a line with `at` starts at that time; with `anchor` too, that word starts at
  `at` (`"word#2"` for its second time in the line). Lines without `at` follow the one before (after `gap` and their
  `pause`). Re-run `voice.mjs` after changing them: lines already voiced cost nothing. `voice.mjs <project> --words`
  prints every word's time inside its take, to plan the cue map. `duration` fixes the film's length (else the last
  line's end + `tail`).
- Line ids are what the film times things to. Keep them stable once the film is written.

## film.mjs and the frame's layers
Start from `templates/film.mjs`: an empty skeleton with the timeline, the shot list, the camera, the scenes, the hits,
the cues and the score in the right places. Its shape:
```js
export default function film(K) {
  const { T, W, H } = K;
  const D = K.style;                // the style's drawing kit (or undefined)
  const P = K.product('main');      // the cut-out (a placeholder bottle until product/main.png exists)
  const G = K.grid(90, 0.5);        // the music grid: every cut and hit lands on it
  const SHOTS = [{ name: 'the front', from: 0, to: T.at('l3'), cut: true }, ...];
  const SCENES = { 'the front': { draw(g, t) { }, over(g, t) { }, top(g, t) { } }, ... };
  return {
    background: D.C.paper,          // the world is cleared to this each frame
    draw(g, t) { },                 // 1. the world, drawn in the style
    captions: D.captions,           // 2. the style's caption renderer; layer 'print' draws them into the world
    finish: D.finish,               // 3. the medium's finish over the world (paper, grain); or look: 'painted'
    over(g, t) { },                 // 4. above the finish: the real product photo and anything in front of it
    top(g, t) { },                  // 5. transitions and flashes, over everything
    motion: 'playful',              // warm | playful | crisp (the kit's default overshoot)
    shots: SHOTS,                   // [{ name, from, to, cut: true | 'wipe' | false }]; 'wipe' = the style's transition
    hits: [{ t, name }],            // the big hits; the check verifies they land on the grid
    cues: [{ t, sfx, gain, pan, dur }],                          // one sound per action
    music: { bpm: 90, offset: 0.5, end: T.endCard, score(S) { } }, // the film's own score (below)
    beats: { l3: 4.2 },             // optional: the moment the per-line sheet shows for a line
  };
}
```
- **Layers, in order:** `draw` → printed captions → the pass (`look`) or `finish` → `over` → captions → `top`. The
  product photo goes in `over`, so no medium, paper or dot ever lands on it.
- `look` names a paint-over pass for painterly styles (`'painted'`, `'silkscreen'`, or one in `media.custom`; craft.md
  section 7). With a `style` in script.json the default is `'direct'`: the style draws in its medium itself.
- `music`: the film's own score, `{ bpm, offset, score(S), silences: [[a, b]], end }`. A preset name (`warm`,
  `bright`, `calm`, `dossier`, `none`) is only for a first draft.
- Effects for `cues`: pop, click, tick, whoosh, swish, thud, stamp, stampbig, paper, tape, marker, flip, crinkle, chime,
  ding, steam, door, pour, sparkle, rise, snap, shutter, type, boing, plop. `gain` 0.3 to 1.2, `pan` −1 to 1.

## A style's drawing kit (K.style)
A style with a kit has `styles/<style>/engine.mjs`: the style's parts (paper, texture, type, props, stamps, the caption
bar, transitions, the product treatment), each a pure function of t. It is a kit, not a film: it draws nothing unless
a scene calls it, and it has no story, scene list or defaults. Its `STYLE.md` section 10 lists the calls. The pattern,
from the Halftone Dossier:
```js
const D = K.style;
D.inks({ paper: '#F3EBDD', ink: '#2A1A14', highlight: '#F2B830', stamp: '#E2403A', overprint: '#6B4FD8' });
const tStamp = hit(G.snap(T.word('l4', 'checked'), 'nearest', G.beat / 4), 'stamp');   // a hit, on the grid
const cam = D.camera([{ t: 0, x: 540, y: 960, z: 1.1 }, { t: 1.2, x: 540, y: 960, z: 1, e: 'out' }],
  { shakes: [[tStamp, 16, 0.3]], pulse: G });
const SCENES = {
  label: {
    draw(g, t) { D.numeral(g, '3', { x: 160, y: 1050, size: 760, at: T.word('l3', 'three'), t }); },
    top(g, t) { D.stamp(g, t, 'CHECKED', { x: 640, y: 900, size: 96, at: tStamp, rot: -8 }); },
  },
};
```
A rules-only style has no kit yet: build its primitives first (craft.md, section 6).

## The score: music.score(S)
`score(S)` runs once, before the mix, and writes the music with the style's instruments. Times are seconds; `S.at(bar,
beat)` gives a time on the grid (`bar` from 0 at `offset`); notes are MIDI numbers (60 = C4) or names (`'F2'`, `'Bb3'`).

| Call | What it plays |
|---|---|
| `S.kick(t, g)`, `S.snare(t, g)`, `S.clap(t, g)`, `S.hat(t, g)`, `S.snap(t, g)` | the synth kit; `g` is a gain around 1 |
| `S.roll(t, dur, g)`, `S.sweep(t, dur, g, down)` | a snare roll that speeds up; a rising (or falling) sweep |
| `S.bass(t, note, len, g)` | a square-ish bass note |
| `S.marimba(t, note, g, pan)`, `S.bell(t, note, g, pan)` | a marimba-like pluck; a music-box bell |
| `S.pad(t, [notes], len, g)` | a soft chord |
| `S.pluck(t, note, g, { decay, bright, dur, pan })`, `S.pizz(t, note, g, pan)` | a plucked string; a short pizzicato |
| `S.tone(t, note, dur, g, { wave: 'sine' \| 'triangle' \| 'square', attack, release, pan })` | a plain synth voice |
| `S.room(from, to, g)`, `S.hum(from, to, hz, g)`, `S.noise(t, dur, lo, hi, g, pan)` | a room-tone bed and a faint hum (both play on through silences); filtered noise |
| `S.silence(a, b)` | empties the music between a and b, so the next hit lands alone |

Write it section by section from the cue map (directing.md, sections 4 and 6), for example a call bar on the marimba
and an answer bar that stays empty until the story's answer arrives. Keep the low end in check: no pad notes below
MIDI 48, and give the bass its harmonics (the kit's bass already has them).

## Time: K.T and the beat grid
- `T.at('l3')` and `T.end('l3')`: a line's start and end (with an optional offset: `T.at('l3', 0.2)`).
- `T.word('l3', 'cupboard')`: when a word starts; `T.word('l3', 'it', 2)` the second "it"; `T.wordEnd(...)` when it ends.
  Time actions to words, never to guesses.
- `T.dur` is the whole film; `T.endCard` is just after the last line ends.
- `K.grid(bpm, offset)` returns `{ bpm, offset, beat, bar, snap(t, 'nearest' | 'next' | 'prev', unit), barIndex(t),
  barStart(n) }`. `G.snap(t, 'nearest', G.beat / 4)` puts a hit on the nearest 16th note.

## Motion helpers
| Helper | Returns |
|---|---|
| `K.p(t, at, dur?, ease?)` | eased progress 0 to 1 (`'warm'`, `'inOut'`, `'out'`, `'outBack'`, `'linear'`...) |
| `K.settle(t, at, dur?, over?)` | 0 to a little past 1 and back to 1: for arrivals |
| `K.move(t, at, from, to, dur?)` | a value or [x, y] moving with a settle |
| `K.wobble(t, at, amp, freq, decay)` | a damped rock after a landing |
| `K.fade(t, a, b, fin, fout)` | 0 to 1 to 0 over a window (use for idle life, not for entrances) |
| `K.wave(t, period, amp, phase)` | idle life |
| `K.twos(t, 12)` | time on twos, for a hand-made boil |
| `K.boil(pts, t, amp, seed, fps)` | a point list that jitters a little, reseeded fps times a second |

## The camera
```js
const cam = K.camera([{ t: 0, x: 540, y: 960, z: 1 }, { t: T.at('l2'), x: 700, y: 900, z: 1.2, e: 'inOut' }], { shakes: [{ at: 3.1, dur: 0.25, amp: 8 }] });
K.view(g, cam, t, 1, () => drawRoom(g, t));       // depth < 1 moves less (far), > 1 more (foreground)
const s = K.toScreen(cam, t, [worldX, worldY]);   // where a world point is on screen
```
A key's `e` is the ease into it. Draw far layers bigger than the frame, so moves never show an edge.

## The drawing kit
| Call | What it draws |
|---|---|
| `P.draw(g, { x, y, h, t, at, enter, rot, scale, border, tape, shadow })` | the product as a cut-out paper card; returns `rect.point(px, py)` |
| `K.hand(g, { x, y, rot, scale, pose, part, flip, skin, sleeve, t })` | a hand: pose `point`, `open`, `hold`, `pinch`; part `back` / `front` around a held product |
| `K.statement(g, t, id, { x, y, size, font, color, maxW })`, `K.text(...)`, `K.label(...)`, `K.stamp(...)` | generic type (styles with a kit use their own) |
| `K.mark`, `K.arrow`, `K.strike`, `K.tick`, `K.drawOn(g, pts, prog, opts)` | marks that draw on |
| `K.wisps`, `K.sparkle`, `K.counter`, `K.contact`, `K.wipe` | steam and scent, a twinkle, a counting number, a contact shadow, a reveal |
| `K.shape(g, pts, color, { t, boil, smooth, stroke })` | a filled shape from points |
| `K.cache(key, w, h, fn)`, `K.canvas(w, h)` | draw something once; an offscreen canvas |
| `K.medium(g, name, t, opts, fn)` | a layer made in a paint-over pass, composited over g |
| `K.spline`, `K.poly`, `K.circle`, `K.ellipse`, `K.roundRect`, `K.ribbon` | Path2D builders |
| `K.rng(seed)`, `K.noise`, `K.fbm`, `K.jitter`, `K.mix`, `K.shade`, `K.rgba` | randomness and colour |

## Text, roles and the checks
Every text a film draws should be registered for the checks: `K.noteText(id, { text, role, size, box: [x0, y0, x1, y1],
t })`. The kit's and the style kits' text calls do it already. Roles set the minimum size: `caption` 56, `headline` 72,
`label` 40, `stamp` 40, `note` 36; `texture` (case numbers, rulers, words that are part of a prop) is exempt. The first
and last time a text is seen give its reading time.

## Patterns
**Holding the product without covering it:**
```js
K.hand(g, { ...grip, part: 'back' }); const rect = P.draw(g, {...}); K.hand(g, { ...grip, part: 'front' });
```
**Pointing at a detail on the label** (pixel 410, 820 in `product/main.png`), from screen space:
```js
let rect; K.view(g, cam, t, 1, () => { rect = P.draw(g, {...}); });
const f = K.toScreen(cam, t, rect.point(410, 820)); K.mark(g, f[0], f[1], 120, 50, K.p(t, T.word('l5', 'date'), 0.5));
```
**One subject that changes:** keep its state as a function of t (`const level = t => t < T.word('l3', 'half') ? 1 :
t < T.word('l6', 'empty') ? 0.5 : 0`), and let every scene draw the same subject in its current state.

**Positions as functions of t:** `const at = t => t < lift ? A : t > land ? B : lerp(...)`. No state between frames.

## Checking while building
- `RUN render.mjs <project> frame 1.2 4.8 9`: single frames (PNG); `--crop x,y,w,h` also saves that part at 100%.
- `RUN render.mjs <project> contact` (or `--every 0.5`): the whole film on one sheet, one frame per second.
- `RUN render.mjs <project> strip 11.0 12.2` (or `--step 0.1`): one key action, frame by frame.
- `RUN render.mjs <project> sheet`: one finished frame per voice line with its words: the sheet the user approves.
- `RUN render.mjs <project> check`: the machine checks (directing.md, section 11). Fix and repeat until PASS.
- `--estimate` times the lines from the text before the voice exists. Errors name the time: `film.draw failed at
  t=7.200 s: ...`.
