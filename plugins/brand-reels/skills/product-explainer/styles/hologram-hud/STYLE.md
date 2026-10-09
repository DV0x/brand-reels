# Sci-fi Hologram HUD

> An object is scanned into a glowing wireframe on a projector pad. Target boxes lock onto its parts, each part opens in a
> local exploded view, and its number rolls into the real value. The film may light up, once, into a solid hologram. **Its
> power for a brand:** it makes a spec feel true, because the number is computed on screen beside the part that earns it.
>
> References (grammar only, never copy): superhero-film heads-up displays (target boxes, callouts, rolling numbers, layered
> depth); sci-fi film interfaces (one colour, hairlines, space); CAD exploded views.
>
> Adapted from lemo-opuscar `styles/hologram-hud/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **The subject is a line wireframe made of light** above a round projector pad on a near-black stage, never a rendered
  object. It reads as scanned data: a scan plane grows the model, parts pull apart along their assembly axes.
- **Three depth layers always:** a background dot grid (slow parallax), the subject with its pad, and the foreground HUD
  (corner brackets, rulers that parallax faster, status text).
- **The real photo is the one thing not made of light:** a clean, flat card on the pad (section 12).

Not a type-driven keynote (Dark Tech Keynote), not a drafting sheet, not a product render (Glass Product). The subject stays a
wireframe; it may gain translucent faces once, and the lines stay on top.

## 2. Materials and rendering
Canvas 2D in this skill's runtime (Node and Skia: no WebGL). The 3D projection is plain JavaScript.
- **Stage:** near-black tinted by the hue (`hsl(hue+12, 70%, 2.4%)`), a radial lift behind the subject, a fading 48 px dot grid
  (parallax 0.2), a strong vignette (0.5).
- **Projector pad** in true perspective: rings at radius 0.7, 1.05 (bright), 1.12 (dashed), 1.45, 2.1; 120 ticks (every 10th
  long); 24 faint rays; turning at 0.12 rad/s.
- **Wireframe:** `lighter` strokes of 1.3 px in 7 alpha levels set by depth fog (near bright, far about 25%). Two glow passes:
  the lines on a ¼-res and an ⅛-res canvas, blurred 3 and 4 px, added back at ×0.85 and ×0.7. **Hot edges** (near-white,
  `hsl(hue, 70%, 92%)`) only for what matters now: the scan front, `hot` pieces when opened, a light wave, a pinged part.
- **Real CAD topology:** tubes are rings plus longitudinal lines, and every part is physically connected.
- **Solid hologram (once):** quads as 2D polygons with alpha `0.3 + 0.7 × (1 − facing)^1.6`, masked by an interlace (2 px
  full, 2 px at 38%, scrolling 1 px a frame; a cached pattern with `destination-in`, offset `% patternHeight`). Lines thicken
  ×1.5 then ease to ×1.12; a light wave climbs the model. The **beam** is one path of three subpaths with faint rays and dust.
- **HUD furniture:** corner brackets (46 px) at the safe box's corners, rulers on the side edges, `SUBJECT // MODE` top left, a
  status line top right.
- **Text never sits on the wireframe:** each block has its own plate (`rgba(1,8,12,.72)`, 1 px border at 28%, 10 px corner ticks).

## 3. Colour logic
- **One cold hue plus one warm accent,** both parameters, taken from the pack (mint and orange, violet and lime, ice-blue and
  red). The hue carries lines, HUD and fills.
- **The accent is spent on locked values only:** a number turns accent at the frame it becomes true. Nothing else uses it.
- **White is heat:** near-white edges and one-frame flashes mark what is active. Everything at rest sits in the hue's alpha levels.
- **One object may keep its own colour** (a brand mark), never for decoration.

## 4. Type and captions
Fonts (SIL OFL, downloaded by the font script): **Rajdhani** 300 / 500 / 600 and **Share Tech Mono** 400. All caps.
- **Name and values:** Rajdhani 300, wide tracking. The name is 96 to 140 px on one line (up to 10 characters, else two lines);
  values 110 to 150 px. **Labels:** Rajdhani 600, 40 px, tracking 2 to 3 px; details Rajdhani 500, 36 px. **Status line:**
  Share Tech Mono 36 px; coordinates and counters (texture) 22 px.
- **Numbers are monospaced** (each glyph in a fixed cell) so rolls never jitter; the decimal point is a small square.
- **Captions are the HUD plate:** a dark plate with corner brackets and four voiceprint bars moving with the speech, Rajdhani
  500 at 56 px, near-white. Words light up as spoken (unspoken at 45% of the hue); the keyword is white, underlined in the
  hue. Bottom at y 1236, left edge x 120, at most 660 px wide.
- **The title is part of the scene:** the name rolls in like a value, then code, category and tagline. No title card.
- **Reading time:** every plate or card holds at least max(1.8 s, its spoken line + 0.6 s); a value holds 2.5 s before it docks.

## 5. Motion quality
- **Everything moves on ones at 30 fps;** only glyph scrambling steps every frame.
- **Target lock:** the box starts at 1.9× the rest-pose bounds, rotated 45°, at 30% alpha; it snaps to fit in about 0.22 s
  (cubic ease-out) and flashes white for 3 frames on the downbeat.
- **Explode** along each piece's assembly axis: the shell slides along its own axis, the contents stay and glow. Open over a
  beat or two, close in 0.5 s.
- **Leader:** anchor ring, diagonal, horizontal, in about 0.5 s. **Rolling value:** 0.5 s (1 s for the first); characters lock
  right to left and turn accent on the downbeat with a flash. **Chip dock:** a finished value slides into the rail.
- **The camera follows the box:** cubic in-out, 0.5 s, starting 0.45 s before the next lock; real motion blur only inside the
  whip (5 sub-frames over 1/60 s); the HUD stays sharp.
- **No cuts or fades inside the scene:** only the scan plane and a loupe iris. One glitch of at most 3 frames, once.

## 6. Camera grammar and the 9:16 page
An orbit camera (yaw, pitch, distance, narrow fov) with a screen position for the target. A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| High 3/4, slow orbit craning down | examination; the scan plane reads as an ellipse | a scan-in |
| Top-down plan view | layout, order | a parts inventory |
| Eye-level profile, locked | the object as it stands in use | before and after |
| Push-in, then drift, 3/4 | this part matters | the key spec; a flaw |
| Whip following the target box | attention jumps to the next part | a list of parts |
| Orbit around a part's own axis | axial structure reads only in rotation | rotors, stacks, lenses |
| Dolly along a long part (vertical in 9:16) | length, a path | a beam; a cable run |
| Pull back plus loupe (frame in frame) | where (wide) and what (loupe) | small parts |
| Crane to eye level or back up | status change | a transformation |
| Turntable 360° | every side | a whole object |
| Nearly static, slow dolly | reading time without a dead frame | a spec sheet |

The subject, or the locked part, is at least ⅓ of the frame height (640 px) at every key moment.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Bleeds | y 0 to 260 and y 1580 to 1920 | dot grid, rulers, the pad's rims and floor glow; no words |
| HUD row, chips | y 270 to 470 | `SUBJECT // MODE` at x 120, status line right-aligned at x 888; docked chips below, step min(240, 768 ÷ n) px |
| Spec card | y 490 to 810, x 120 to 888 | one plate: label, value, unit, detail; leaders end here |
| Subject (hero) | y 830 to 1630, full width | the wireframe or photo card; the part in play stays above y 1320; in its main shot (no card) it grows to 770 to 1150 px tall. A loupe (a 340 px circle, x 548 to 888, y 850 to 1320) shows a small part |
| Caption plate | bottom at y 1560, x 120 to 780 | the HUD plate |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music first, on a grid** (a bar is one information beat); locks land on downbeats. **Synth palette:** a saw or square
  arpeggio with ping-pong delay (scooped 1 to 4 kHz for the voice), a square pulse, 8th-note bass, hats and claps, detuned pads.
- **Density follows information.** Pick two or three: half-time for reading; one beat of true digital silence; a drop for the
  biggest change; a layer added per part; a key change.
- **Foley follows the material:** light = sine and FM blips in the key; machines = servo slides, pneumatic puffs, hydraulic hiss,
  metal tinks (0.4 s before the whip lands); a lock = thump, clack, two-tone beep; rolls tick at frame rate.
- **Voice:** calm, confident; duck music and foley with a held envelope (no pumping); lock hits escape for 0.2 s.
- **In this skill:** closest preset `dossier` (120 BPM synth kit): `groove` for locks, `sneak` for half-time, `build` into
  ignition, `drop` for the silence. Preset to build: `hud`: saw arpeggio with ping-pong delay, square pulse, 8th bass, hats and
  claps, detuned pads, an 808 drop, 110 to 125 BPM. Effects: `tick`, `click`, `thud`, `ding`, `chime`, `rise`, `whoosh`,
  `steam`, `snap`, `sparkle`.

## 8. Native moves
Each move serves information, not story. A menu: use the ones the film needs.
- **Scan growth = "this is real data."** *Fits:* a mattress; a protein tub; a running shoe.
- **Target lock = "look here now."** The box may frame a claim printed on the photo. *Fits:* "20 g protein"; "no palm oil"; a bag's zip pocket.
- **Local explode = "why the number is true."** *Fits:* mattress layers; a shoe sole; a serum's dropper, glass and formula.
- **Rolling digits = the payoff beat.** *Fits:* grams of protein; a price per serving; an SPF number.
- **Chip accumulation = reading time.** *Fits:* a supplement's five claims; a shoe's specs; a water bottle's features.
- **Loupe = two scales at once.** *Fits:* a hair-oil pump head; stitching on a bag strap; a coffee pouch's one-way valve.
- **Solid hologram and beam = "the whole is ready."** Once, if at all. *Fits:* a new flavour reveal; a finished gift kit; a new formula.

## 9. Pitfalls of the medium
- **Target boxes balloon:** build from the rest pose, skip `internal` pieces, set long attachments to `box: false`.
- **A long diagonal leader points at the wrong part:** put the ring on the part body and flash the part.
- **Two parallel boxes don't read as an explode:** the shell slides on its axis; the contents stay and glow.
- **A part built from generic boxes doesn't read as that part:** give it its own silhouette.
- **Foley masks the voice; a UI blip breaks a silence:** duck foley too, hold the duck through word gaps, check cues against silences.
- **A whip written inside the next segment plays as a hard cut:** start it in the previous one.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each on
a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `stage`, `pad`, `project(cam)` | background, pad, orbit camera | gradients and projected polylines (section 2); yaw, pitch, distance, fov 0.6, a screen position for the target |
| `wire(model, cam, opts)` | the wireframe | `lighter` 1.3 px strokes, 7 alpha levels, ¼-res and ⅛-res glow canvases, hot edges |
| `scan(y)` | scan growth and erase | skip lines above the plane; on the photo the front is a clip edge with a hot line beside it |
| `lock(bbox, k)`, `leader` | target box and leader | bracket box 1.9×, 45°, 30% alpha, snaps in 0.22 s, 3-frame flash; ring, diagonal, horizontal |
| `roll(str, k)` | rolling number | each glyph in a fixed cell; scramble per frame; lock right to left; accent plus flash |
| `plate(x, y, w, h)` | text and caption plates | near-black fill, 28% border, corner ticks; the caption adds brackets and 4 voiceprint bars |
| `explode(piece, k)` | local explode | the shell moves along its own axis, hot contents stay; open 1 beat, close 0.5 s |
| `solid(model, k)` | solid hologram, beam | Fresnel polygons, interlace mask, light wave, one-path beam (section 2) |
| `photoCard(P, k)` | the real photo | a frontal flat card drawn clean under the scan clip; a shell of its outline stands 6% outside it |

The source already projects its own wireframe onto a 2D canvas, so it ports without WebGL. Models are plain data: parts of
pieces (vertices, edges, quads, explode vector, flags `internal`, `hot`, `box: false`) with anchors, normalised on load.

## 11. Variation space
You decide the object, its model, the parts and their order, the opening, the ending, the camera path, the colours and the
music. The use cases set the order and the time held:

| Use case | Information order | Hold per layer | Length |
|---|---|---|---|
| Spec walkthrough | name, one spec per part, weight or price, CTA | title 5 s; value 2.5 s, then docked; sheet 3 s | 30 to 40 s |
| Loop screen | name, 3 to 5 specs, CTA; captions only; last frame = first | 3 s a spec | 25 s |
| Teardown | part, what it does, one number | 4 to 6 s a part | 40 to 45 s |
| Upgrade | part, old value (dim), new value (accent) | 3 s an upgrade | 25 to 30 s |
| Assembly order | step number, part name; parts snap home | one bar a part | 25 to 40 s |

Far from the original demo:
- **Structures:** a loop screen cycling five claims; a teardown one layer deeper per shot; an upgrade where every number rolls.
- **Openings:** a part first (one component locked, the rest scans out); a flat outline that extrudes into the wireframe; a plan view.
- **Endings:** one value at eye level while the wireframe dims; knolling (parts fly into a labelled layout); power-down.

## 12. The product and brand fit
- **The product:** the real photo is a flat card on the pad, always frontal (never tilted with the orbit), drawn clean. The scan
  front reveals it; a wireframe shell of its outline stands just outside it. A target box may frame a label claim with a thin
  outline and no fill; leaders end beside the label.
- **Brand fit:** spec-led, formula-first brands, gadgets, mattresses, shoes, supplements. Avoid it for warm, handmade or heritage
  brands and for products with nothing inside to open (a plain tee).
