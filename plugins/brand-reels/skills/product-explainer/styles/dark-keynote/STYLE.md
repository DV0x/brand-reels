# Dark Tech Keynote

> A launch film where the interface is the star: a near-black stage, a hairline grid, soft light, one brand accent and UI
> that moves with snap-grid precision. **Its power for a brand:** it turns one number or one action into a keynote moment:
> a launch, a spec, a quiz, an app flow.
>
> References (grammar only, never copy): dark-stage product reveals (light sweeps, one line per screen, the lone giant
> number); snap-grid motion in developer-tool launch films (1 px lines, one accent); minimalist process music (phasing,
> subtraction); fast insert cuts. Never use their names, interfaces, fonts, controls, melodies or logos.
>
> Adapted from lemo-opuscar `styles/dark-keynote/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
A keynote-grade film for **software** and sharp launches. The protagonist is the interface (a cursor, windows,
notifications, tiles, a number), or the real product photo standing on the stage. It lives on a dark stage lit by soft,
cool light, with **one brand accent** reserved for the most important element.

The style is **precision:** every element snaps to a grid, every motion lands on a beat, every sound belongs to one
designed family. Drama comes from contrast: disorder shown as generated UI, one decisive action, then empty space.

Not a glass product render (no drawn physical object). Not a screencast (no real OS or apps). Not a hologram HUD (no
scanlines). Not a chart film (one number, not a chart).

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia: no browser, DOM, CSS or SVG filters). Every
element is a pure function of t.
- **Stage:** a near-black base, a radial lift at the upper centre, one large cool glow at single-digit opacity
  off-centre, a 50 to 55% corner vignette (radial gradients). A hairline grid on a 48 px module: white at about 3%, every
  4th line at about 6%. No grain.
- **UI kit,** all original and drawn in code: rounded windows (a title bar with a small glyph and a title only; never
  traffic-light buttons, menu bars or docks), notification cards, file icons, thumbnails, list rows, tabs, badges, tiles.
- **Surfaces:** three steps of raised dark surface, a 1 px border (about 8% white), a 1 px inner top highlight, soft
  shadows (a cached, blurred copy; a plain offset shadow for hundreds of items).
- **Depth:** a 2.5D camera (`s = 1/(1/zoom − z)`); cards near the lens blur with magnification (`ctx.filter`). Rotations
  use strip-rendered perspective (rotY up to about 24°): cut the opaque surface into thin vertical strips, scale each,
  then light it in screen space.
- **Light is the reveal tool:** draw the surface at a few percent, then again through a soft-edged band mask
  (`destination-in` on a copy). Only pixels the light has passed turn on.

## 3. Colour logic
- **A cool neutral ladder only:** a near-black stage, three surface steps, text in three greys (primary, secondary,
  label). Neutrals are slightly blue, never warm brown (stage `#090B10`, text `#E6E9F0`, `#8B91A1`, `#5B6171`).
- **One accent,** saturated and luminous, with its own glow. It is reserved for what the product *is* or *does*: the
  protagonist, the call to action, confirmations, the key number. If two things are accent-coloured, one is wrong. Take it
  from the pack (examples: lime `#B7F34A`, electric violet `#8B7CFF`, signal orange `#FF7A1A`).
- **A problem colour** (usually a red) exists only while the problem exists. After the turn it never returns.

## 4. Type and captions
Fonts (SIL OFL): **Inter 600** (headlines, captions; bundled), **Inter Tight 600** (giant numbers, tracking about -4.5%),
**JetBrains Mono 500** (labels, filenames, status; small caps with wide tracking).
- **Headlines:** Inter 600, 96 to 120 px, one sentence per screen, one to three lines.
- **The big number gets its own screen:** Inter Tight 600, fitted to the 768 px width (one or two digits up to 1000 px,
  longer numbers 260 to 620 px). No caption over it: the number is the message.
- **Labels:** JetBrains Mono 500, 40 px. Text the cursor types in frame is not captioned a second time.
- **The caption is a UI toast** in the caption lane (bottom edge y 1236, left edge x 120, at most 660 px wide): a dark
  translucent pill (72% black, 88% over busy frames), a 1 px light border, a soft shadow, Inter 600 at 56 px, a small
  accent "speaking" dot. It enters with a 12 px rise and fade in 0.16 s. The words light up as they are spoken: unspoken
  words at 45%, spoken words in the primary grey.
- **Reading time:** every caption or headline holds at least max(1.8 s, its spoken line + 0.6 s), and about
  (letters ÷ 15 + 1.5) s after it lands.

## 5. Motion quality
- **30 fps on ones, no stepping, no boil:** this is precision, not craft.
- **Everything lands on the grid and on the beat.** Moves start a beat early and land on it. Easing is fast-out with one
  small overshoot (`back`, s ≈ 1.3) and an immediate settle. No floaty sine drift.
- **Spawns are short and typed** (drop and bounce, fling, slide-in, pop; 0.2 to 0.3 s), one motion per element type.
  Tension is a tremble of a few px.
- **Flights follow curved paths** with overshoot along the final tangent; same-type elements bend alike, never cross.
- **A living element can act:** squash, stretch, anticipation (at least 8 frames of wind-up), a 2-frame contact, spring
  follow-through. A cursor blink (0.5 s on, 0.5 s off) is a natural metronome.
- **Disappearing is designed** (retract one part per beat, a CRT-off squash into a point); nothing just fades. The stage
  and grid never move on their own; only the camera moves them.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. The opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked extreme close-up on a tiny UI element | intimacy, one thing alive | a single action; a status |
| Continuous pull-back, keyed per bar in log space | accumulation, scale growing from one point | spreading load; a growing network |
| Push-in through a frozen frame | time stopped, focus narrowing | the instant before a commit |
| Whip pull-out in one beat | cause and effect seen at once | a sync completing |
| Dive into a small UI element + match cut | going inside the detail | a counter that matters |
| Half-second inserts expanding from their source | overload | notification storms; choice overload |
| Near-locked frame while an object turns and light sweeps | the product as hero | a reveal; a new version |
| Slow lateral track across a UI plane | order read by the eye | a timeline; a pipeline |
| Top-down plan over the grid | system view, structure | a workflow map |
| Return to an earlier framing | rhyme: what changed | before/after; a loop closed |

Generous negative space, one focal element, the accent at the focal point. **Transitions = UI expand or collapse:** every
shot change is an element expanding into the frame or collapsing into one; no fades, no blank frames. An expansion on a
beat starts one frame early.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame. Words and key details keep to x 120 to 888,
y 260 to 1580, and left of x 780 below y 1100):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | stage glow, grid, the top of windows; no words |
| Label row | y 270 to 390 | JetBrains Mono label and a status dot at x 120; a status at x 888, right-aligned |
| Headline | y 440 to 960, x 120 to 888 | one sentence, or the giant number alone |
| Hero | y 440 to 1580 | the product window (turned up to 24°), the giant number, or the photo on the stage. Main shot: 780 to 1000 px tall (40 to 52%), left of x 780 below y 1100 |
| Caption lane | bottom at y 1560, x 120 to 780 | the toast |
| Bottom bleed | y 1580 to 1920 | stage, grid, floor glow; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Tuned percussion and pads:** marimba, vibraphone, glockenspiel, celesta, a pad or drone, a low sine pulse, a shaker. Clean and dry.
- **Music as a visible process:** phasing (two voices on one pattern, one drifting), additive build, subtractive process
  (notes removed until one is left), dividing the beat to accelerate. UI events can spawn on score notes.
- **Two sound families = story:** disorder is scattered (detuned by tens of cents, random pans, a different timbre per
  source); the product is one family (felt ticks, glass taps, one mode, centred).
- **Foley:** cursor tick, keys, notification glass, file plop, window whoosh, glitch accents, stacking thumps, a felt
  mallet and sine drop for a press, shimmer, digit grains, CRT-off. Ambience stays down while the voice speaks.
- **Silence:** digital zero on every track when the screen pauses; the first sound after it is the most important. **Mix:**
  music ducks 8 dB and foley 4 dB under the voice, -14 LUFS.
- **Our presets:** closest is `calm` (76 BPM pad); `dossier`'s `sneak` and `drop` give the near-silence and the freeze.
  Effects: `tick`, `click`, `ding`, `plop`, `whoosh`, `snap`, `thud`, `sparkle`, `type`. Preset to build: `keynote`
  (marimba and vibraphone phasing, glockenspiel, low sine pulse, pad, shaker, 100 to 125 BPM).

## 8. Native moves
A menu: use the ones the story needs.
- **Generated accumulation.** UI spawned by rule, faster and faster. *Fits:* 40 serums on a shelf; a marketplace page of
  1,000 results; unread order emails.
- **The snap grid.** A whole promise in one motion: everything flies into a grid. *Fits:* a build-your-box page filling a
  week; a meal-plan scheduler; a capsule wardrobe.
- **The living element.** A cursor or smallest live element is the protagonist. *Fits:* a subscribe toggle; a 30-day
  progress ring; a delivery dot.
- **Freeze.** Everything stops mid-air; the sound drops to digital zero. *Fits:* the second before "place order"; a sale
  clock at zero; a stale-coffee countdown.
- **Light reveal.** A soft band sweeps and only lit pixels turn on (soft front, glint at most 20%, about 1.3 s). *Fits:* a
  pack redesign; a new shade range; a pricing page.
- **Number from glyph noise.** Digits scramble and lock one per sixteenth note. *Fits:* "0 g" added sugar; 48-hour
  battery; 10,000 orders.
- **Type streams.** Elements fly along coloured curved trails to their own rows. *Fits:* ingredients sorted by role;
  orders routed by city; returns triaged.
- **Put-away.** The UI dismantles itself one part per beat until one element is left. *Fits:* a routine cut from ten steps
  to three; one-tap reorder; a quiz with no sign-up.

## 9. Pitfalls of the medium
- Strip perspective of a see-through canvas shows seams → project the *opaque* surface, then light it in screen space.
- A hard white glint reads as a sticker reflection → soft front, glint at most 20%.
- Nearest-slot snapping looks like flicker → typed destinations, curved paths, trails.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test
each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `stage(g, o)` | the stage: lift, one cool glow, vignette, 48 px hairline grid | radial gradients; glow about 8% alpha; grid 1 px, white 3%, every 4th line 6% |
| `litShape(g, path, o)` | any shape: lit dark surface or glowing accent fill | rim light by stroke; `accent` adds a glow via `lighter`; `sweep` moves a light band |
| `lightReveal(g, src, rect, p, o)` | the light reveal | `src` at 7%, then through a soft band mask (`destination-in`); trail 700 px, glint at most 20%, 1.3 s |
| `caret(g, x, y, h, o)` | the cursor: blink, squash, stretch | 0.5 s on, 0.5 s off; wind-up height ×1.35, width ×0.8 over 8 frames or more; press 2 frames at ×0.3 and ×2.4 |
| `scramble(g, text, x, y, t, locks)` | a number out of glyph noise | glyphs cycle at 30 fps with a 3-copy vertical smear; lock one per sixteenth with a damped bounce |
| `productStage(g, P, o)` | the real photo on the stage with a rim of light | glow and rim drawn behind and beside the cut-out; the sweep crosses the stage, never the label |

## 11. Variation space
You decide the product's verb, the protagonist, the problem image, the accent, the structure, the opening, the ending
and the score. Far from the original demo:
- **Structures:** a countdown (a release checklist ticking to "shipped"); side by side (two versions of a workflow in split
  screen, the old one drowning); a zoom ladder (a pixel, a component, a screen, a fleet of devices).
- **Openings:** the number first (a huge stat on black, its meaning revealed backwards); a plan view of an empty grid that
  fills slot by slot; a hard insert storm from frame one.
- **Endings:** one tile left, lit in the accent, on an empty grid; the product running quietly, no text; a shipped state
  (one confirmation toast, then darkness).

## 12. The product and brand fit
- **The product:** the real photo on the dark stage with a rim of light (`productStage`). The rim and glow sit behind and
  beside it; it is never redrawn, filtered or covered, and the sweep never crosses its label. Show it big once.
- **Brand fit:** electronics, apps, subscriptions, and supplements or skincare with a precise number. Avoid warm,
  rustic or festive brands.
