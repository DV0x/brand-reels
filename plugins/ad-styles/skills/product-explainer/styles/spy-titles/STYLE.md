# 60s Spy Titles

> A cut-paper, four-ink opening title sequence for a film that never existed: silhouettes move through sets built out of the
> credits themselves, every brass stab is a cut, and the title is assembled from the pieces. **Its power for a brand:** it makes
> a launch a mission, with the product as the thing everyone chases and its name as the reveal.
>
> References (grammar only, never copy): late-1950s and 1960s graphic title design (flat opaque inks, abstraction to
> silhouettes, type as structure); modern cut-paper chase titles (lateral tracking through graphic sets). No real title's logo,
> lettering, characters or shots; no gun-barrel shot, pistol or tuxedo agent.
>
> Adapted from lemo-opuscar `styles/spy-titles/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **Flat, opaque inks on paper:** four colours, no gradients. **Hand-cut edges** on every shape; pieces layered with cut gaps
  and small paper shadows.
- **Abstraction down to silhouettes:** figures in profile, all acting in outline and timing.
- **Typography is the picture's structure:** credits are architecture, props and vehicles. **Music cuts the picture:** brass
  stabs are edit points.
- **A title sequence is a story in itself:** one goal, a few locations, one reveal. Here the product is the goal and its name
  is the reveal.

Not flat vector motion graphics (the edges are cut, the paper is physical), not a halftone print style (no dots), not a Swiss grid
(diagonals, jaunty type, play), not a spy parody (no gadgets, no weapons).

## 2. Materials and rendering
Canvas 2D in this skill's runtime (Node and Skia: no browser, no SVG filters). The source is plain Canvas 2D too.
- **Scissor-cut edges:** every polygon is resampled every 9 to 10 px and displaced along its normal by low-frequency noise
  (1.2 to 2.2 px, larger for bigger shapes) plus a rare 1 to 2 px notch. **Cut the edge once in the piece's local space and
  cache it** as a `Path2D`, so a moving cutout keeps its edge. Screen-space edges crawl.
- **Paper layering:** pieces are separated by a 2.4 px cut gap in the ground colour and cast a small paper shadow (offset 2.5
  and 3.5 px, `blur(2.5px)`, alpha 0.3). Whole figures get the gap as an outline, so a black figure reads in front of a black letter.
- **Paper texture:** one full-frame texture multiplied on top (mottling plus faint fibres, built once), a sparse "ink void"
  speckle screened on dark ink, faint squeegee streaks. Film grain of about 6 is added at the mux.
- **Silhouette figures:** tall stylised adults (about 7 heads); identity from hat, coat cut, shoes and **one colour accent** that
  doubles as a motion indicator (a tie or scarf streaming back). Pieces merge into one outline with thin 1.7 px slits at
  shoulder, elbow, hip and knee. No faces except an eye slit in close-ups.
- **The object of the chase** sits on a black backing (an ink keyline) so it reads on any ground; it is the brightest thing in frame.
- **Type:** a condensed display face for credits, outlines extracted (opentype.js to `Path2D`) and re-cut per letter (edge noise,
  ±0.8° rotation, ±1.5 px baseline jitter). The title is custom cut glyphs (straight cuts and arcs, uneven weights, staggered
  baselines), never a real title's lettering.

## 3. Colour logic
- **Four inks:** ink black, paper cream, one hot colour, one warm secondary. Darker "shadow paper" variants only for depth.
- **One dominant ground colour per scene,** changing with the location. The hot colour is for one accent on the hero and for
  danger; the secondary marks the object of the chase.
- **Background props go in a darker version of the ground,** never in black, or they read as letters.
- **Take the four inks from the pack.** Examples: ink `#161a22` / bone `#ece6d6` / teal `#1f8a8a` / orange `#f07a28`; black /
  pale pink `#f3d6cc` / cobalt `#2a46b8` / lemon `#f0d23a`.

## 4. Type and captions
Fonts (SIL OFL, downloaded by the font script): **League Gothic** 400 (credits) and **League Spartan** 600 (captions, labels).
- **Credits live in the set,** never in the caption lane: one line per location, readable in full at some moment, set as 1 to 3
  lines of at most 12 characters at 120 to 150 px. Credits are product facts, roles and the brand's name, never real people.
- **The title:** the custom cut glyphs, 100 to 150 px, one to three lines, jaunty baselines.
- **Captions are a paper strip:** scissor-cut ends, tilted −1°, a small glyph from the film as a bullet, League Spartan 600 at
  56 px. A light strip with ink text on dark scenes, a dark strip with cream text on light ones. Words light up as spoken
  (unspoken at 45%); the keyword sits on a cut slip of the secondary ink. Bottom at y 1236, left edge x 120, at most 660 px wide.
- **Reading time:** every credit and strip holds at least max(1.8 s, its spoken line + 0.6 s); a credit holds about (letters ÷ 15
  + 1.5) s after it lands.

## 5. Motion quality
- **Puppets on twos** (a new pose every 2nd frame, 15 fps): figures, hands, letters landing, vehicles. **Camera, credit slides and
  grid growth on ones:** a stepped camera judders.
- **Run cycles** of about 8 drawings, one step per beat, a strong lean (about 0.3 rad), the accent flying back at about 65°.
  Walks: one step per beat, coats swinging.
- **Credits slide in along grid lines and stop dead on the beat** (ease-out, 0.2 s). Letters land with a paper slap.
- **Stop-time:** at a stab the whole picture (background scroll included) freezes for two beats in total silence, then resumes.
- **Shattering:** a scene is sliced into strips along a cut line that slide off alternately along the diagonal, while title
  glyphs fly in along it and land on consecutive 16th notes.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. Graphic, flat, decisive. Strong diagonals (about 30°), big flat grounds, figures small against type.

| Move | What it expresses | Can serve |
|---|---|---|
| Wide on a full credit line, then truck in | reading, then action | any location built from type |
| Lateral tracking, one screen direction | pursuit; momentum | a chase; a delivery |
| Hard cut on a brass stab | punch; a new location | montage; a reveal |
| Graphic match cut (same shape, same place) | rhyme; acceleration | wheel, coin, pupil, moon |
| Locked single shape on a flat ground | mystery; an icon | a cold open; a logo |
| Silhouette against a giant circle | the hero moment | a catch; a triumph |
| Diagonal split into a grid | fragmentation; many at once | a team; a conspiracy |
| Vertical pan down a column of type | descent; a list | a roster; a countdown |
| Push into a letter until it fills the frame | a letter becomes a place | a door; a tunnel |

Match cuts keep circle centres and sizes identical across the cut. No dissolves. In portrait the pursuit runs down a column of
type, or across a line that opens wide enough to read and then trucks in.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | the ground colour, the top of a diagonal or a letter; no words |
| Credit set | y 280 to 910, x 120 to 888 | the credit line that is the location, 1 to 3 lines, readable in full at some moment |
| Action | y 630 to 1490, full width | silhouettes, the chase, the object on its black backing; in the hero moment a figure or the product 770 to 1150 px tall against a giant circle |
| Caption strip | bottom at y 1560, x 120 to 780 | the paper strip |
| Bottom bleed | y 1580 to 1920 | the ground, the base of the set, the diagonal seams; picture only |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **1960s spy big band:** staccato trumpets and trombones in octaves with a crash (the stab), surf-guitar twang through a spring
  reverb, walking upright bass, brushes, bongos, vibraphone, organ stabs, harpsichord. Minor keys, chromatic lines, dotted
  rhythms. Original motifs only: avoid the crawl and ending chord of the best-known spy theme.
- **Stabs are edit points:** place staccato brass about 8 ms early so the sample's peak hits the frame. **Options:** a cut
  interval that shrinks as a chase accelerates; stop-time silence; a big chord for the title, then a short button.
- **Foley follows the material:** paper (a cut "shh", slides, card slaps for letters, blind flips, a tear), metal (keys, locks),
  tape (click, hiss); environments only hinted (a jet pass, train wheels, roulette ticks).
- **Silence:** true zero, reverb tails included. **Voice:** a briefing through a tape chain (band-pass 220 to 5,200 Hz, soft
  saturation, slow wow, rising hiss), a few very short lines; with no voice chain, keep it clean and use the `tape` effect.
- **In this skill:** no preset fits; `dossier` (120 BPM) is the nearest kit. Preset to build: `spy`: staccato brass stabs with
  a crash, surf-guitar twang with spring reverb, walking upright bass, brushes, bongos, vibraphone, minor key, 120 to 135 BPM.
  Effects: `paper`, `swish` (cuts), `flip`, `crinkle` (tear), `click`, `tick`, `tape`, `whoosh`, `thud`, `ding`.

## 8. Native moves
A menu: use the ones the story needs.
- **Type is the set.** Each location is one credit line that is its architecture (letters as pillars, words as carriages).
  *Fits:* a flavour list as a skyline; an ingredient list as pillars; a size chart as stairs.
- **Credits are rhythm.** Credits land on beats; stabs are cuts. *Fits:* four supplement features; a flavour line-up; a gift box's contents.
- **Graphic match cuts.** Shape rhymes, the interval shrinking as tension rises. *Fits:* a coffee bean, a clock face, a full moon;
  a jar lid, a plate, the sun; a bottle cap, a coin, a planet.
- **The diagonal grid.** A diagonal cut multiplies into a grid; the pieces later fly back to assemble something. *Fits:* a gift
  box built from fragments; a sampler pack forming flavour by flavour; a launch pack assembling.
- **Silhouette puppets.** Profile cut-outs whose acting is outline and timing. *Fits:* a courier on a deadline; a heist for a
  secret recipe; a detective hunting one ingredient.
- **Stop-time gag.** Freeze on a stab, silence, resume. *Fits:* the last jar selling out; a double take at a price; a craving frozen mid-reach.
- **The object of the chase is the title.** What everyone pursues is assembled last. *Fits:* a new flavour's name; a back-in-stock drop; a festive edition's name.

## 9. Pitfalls of the medium
- **Every internal piece outlined with a gap looks like a mannequin diagram:** merge pieces in an offscreen layer, cut only
  joint slits, outline the whole figure.
- **A `clear()` that resets the transform silently kills the camera:** keep the camera matrix.
- **A figure fully hidden behind a letter reads as "nobody there":** let hat, nose and accent stick out. A stiff streamer reads
  as a tongue: use a multi-segment ribbon with a travelling sine.
- **A credit only ever seen partially is uncomfortable:** always open wide on the full line.
- **Black background props read as letters:** use a darker ground. **An object in its ground's ink vanishes:** black backing.
- **A round prop dropped into a word covers its neighbours:** lay the word out around a gap. **Flat inks plus grain make huge
  files at a low CRF:** a higher CRF looks the same.
- **Paper over the photo's label:** gap, shadow and strip never cross it. **Spy clichés:** no pistol, gun-barrel circle or tuxedo.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each on
a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `inks`, `paperTexture()` | the four inks, the sheet | a flat-fill table; a texture built once in ImageData (mottling, fibres, streaks), drawn with `multiply`; ink-void speckle with `screen` |
| `cutPath(poly, seed)` | a scissor-cut shape | resample every 9 to 10 px, push along the normal by noise (1.2 to 2.2 px) plus a notch; cache a `Path2D` in local space |
| `piece(path, ink, ground)` | one layer of paper | stroke 2.4 px of the ground colour as the gap, fill the ink; shadow = the path in black, alpha 0.3, offset (2.5, 3.5), `blur(2.5px)` |
| `figure(rig, pose, t)` | a silhouette | parts into an offscreen layer; 1.7 px joint slits with `destination-out`; 8 offset copies as the outline; the accent ribbon is a sine |
| `cutText`, `titleGlyphs` | credit lines, the custom title | League Gothic outlines (opentype.js) to `Path2D`, per-letter noise, ±0.8°, ±1.5 px jitter, cached; the title from straight cuts and arcs, uneven weights, staggered baselines |
| `diagGrid(t)` | the 30° split and shatter | clip polygons along a 30° line; strips slide off alternately; glyphs land on consecutive 16ths |
| `stopTime(t0, beats)` | the freeze | a time warp `tEff(t)` for every layer except the audio, which goes silent for two beats |
| `strip(text, t)` | the caption | a cut-edge paper strip tilted −1°, a glyph bullet, League Spartan 600 at 56 px; the keyword on a slip of the secondary ink |
| `photoPrint(P)` | the real photo | a pasted print on a black backing with the gap and shadow; the photo itself is untouched |

Puppets step on twos by quantising their own clock (`floor(t × 15) / 15`); the camera uses the real t.

## 11. Variation space
You decide what is pursued, by whom, the locations (as credits), the inks, the opening and the ending. Far from the original demo:
- **Structures:** no chase, a countdown (ten credits, ten locations, a bomb-clock number built from type); a heist in reverse
  (the object is returned, location by location); two agents, one frame (split diagonally, until they meet).
- **Openings:** a full-frame title that shatters into the sequence; a telephone rings in a single cut-out room; the hero
  already falling through a column of type.
- **Endings:** the title never assembles (one piece missing, the hero walking off with it); a slow pull-out showing every
  location was one giant credit page; a stop-time freeze on the final stab, held.

## 12. The product and brand fit
- **The product:** a silhouette first (traced from the cut-out, flat ink on its black backing), then the real photo pasted over
  it at the reveal. The photo keeps its own colours and clean edges; the gap and shadow may sit around it, never over its
  label. Hold it at least 1.5 s on the title card.
- **Brand fit:** launches, drops, restocks and secret recipes for bold brands (coffee, sauces, streetwear). Avoid it for calm or
  wellness brands and for messages with many facts: the form carries one goal and one reveal.
