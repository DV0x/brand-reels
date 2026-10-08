# Paper-cut (Sanjhi)

> Sanjhi paper-cutting from Mathura, brought to life: paper cut with scissors from folded sheets, symmetric stencil-like
> patterns, and light that gets in through the cuts. The cut is the drawing. **Its power for a brand:** one cut becomes
> many and the pattern becomes light, so a festive gift, a craft or a family recipe is shown as made by hand and lit
> from within.
>
> References (grammar only, never copy): Sanjhi stencil cutting of Mathura and Vrindavan (folded symmetric cuts, lattice
> and petal patterns, stencils for floor patterns in coloured powder); jaali lattice screens that throw patterned light;
> jointed cut-paper animation. Krishna-era motifs (lotus, peacock feather, kadamba blossom, vine, arch) are pattern
> language only: no religious figures. Copy no maker's real stencil.
>
> Adapted from lemo-opuscar `styles/papercut-red/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
> skill's runtime, and adapted to Sanjhi paper-cutting. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

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
Every visible thing is **a piece of paper cut with scissors** and laid flat on another sheet. There is no painting, no
gradient shading and no outline stroke. Detail, volume and expression come only from **what was cut away.** A saturated
hero paper carries the story; grounds are paper too (light paper by day, deep dyed paper by night). People, if any, are
jointed cut-outs (pieces pinned at rivets) animated in hard 12 fps steps; never a deity. The paper is **front-lit and
opaque.** Backlight is a special event, saved for the moment that needs it.

Not shadow puppetry (no screen, no translucent hide, no rods). Not flat vector art (no strokes, no gradients). Not a
silhouette film (every shape's interior is cut).

## 2. Materials and rendering
Plain Canvas 2D (Node and Skia). A piece is a polygon with holes.
- **Paper grain:** a neutral-grey texture in `soft-light` inside each piece (mottling ±7% at about 130 px, fibres,
  specks), then the piece's alpha restored with `destination-in`, so holes stay holes.
- **The cut piece:** a polyline with a slight low-frequency wobble (about 0.35 px, hand-cut; straight segments plus wobble,
  never smoothing), a 1 px light rim upper-left and a dark rim lower-right (the cut face), a tight shadow on the layer
  below (offset 2.6 / 3.6 px, blur 5 px, about 38%), and on figure pieces a thin slit 3.5 px inside the outline (it
  separates same-colour overlaps). Folded stacks show 2 to 6 offset darker edges.
- **Sanjhi cutting vocabulary:** sawtooth rows, scalloped edges, lotus petals, feather eyes, leaf chains, vine swirls,
  punched dots, diamond jaali lattices, arches, tapered slits. All made by code.
- **No floating islands.** A closed ring cut drops its centre: leave bridges (an eye is two crescents plus a pupil
  hole). Faces never morph: expressions are swappable face pieces.
- **The mandala rosette** is one wedge (45° for 8×) mirrored (D4); other folds give 2×, 4×, 6×. Rings alternate
  positive cut (the band cut away) and negative cut (lines cut out of a field). Faint fold creases stay.
- **Light:** front-lit scenes use the paper as is. Night: frame × lightmap plus warm pools, then **backlit** pieces (holes
  at full light), a low two-level bloom, and the hole mask projected onto the ground with `lighter`.

## 3. Colour logic
- **Hero paper:** one saturated colour from the pack. Default kumkum red (about `#C42B1E`); marigold or peacock green
  also work. Depth and role come from **paper tones one step apart,** not shading: near pieces one step brighter, far
  pieces one step darker, a heavy object one step deeper.
- **Ground and hero are different paper families.** At night all background layers are one dark dyed family (indigo,
  maroon) and only the pieces that matter keep the hero colour.
- **Gold foil** is an accent for one late moment (a sun, a title, a coin), never a second main colour.

## 4. Type and captions
Fonts (SIL OFL): bundled **Fraunces** (800 headlines, 700 captions, 600 labels); **Stardos Stencil 700** (fetched) for
text cut as holes, which needs bridges.
- **Headlines are cut letters:** pieces in the hero paper whose counters are real holes, popping in letter by letter on
  12 fps steps. Fraunces 800, 104 to 140 px, one to three lines, left at x 120 (about 10 letters a line at 120 px).
- **Captions are a paper strip in the world:** a banner deeper than the picture's reds so cream text holds (about
  `#8E1B14`), sawtooth edges, swallow-tail ends, a paper shadow. Fraunces 700 at 56 px in cream, the **keyword in
  marigold** (about `#F2B230`). Words light up as they are spoken (unspoken at 45%). It drops in on two 12 fps steps.
  Bottom edge y 1236, left edge x 120, at most 660 px wide, two lines.
- **Labels:** Fraunces 600, 40 px. Small credits are printed ink, 36 px or more.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.7 s), and about (letters ÷ 15 + 1.5) s
  after it lands. Strips never overlap.

## 5. Motion quality
- **People step at 12 fps** (pose sampled at `floor(t·12)/12`). **Camera, light, weather and flying pieces move on
  ones** (30 fps). Rigs pin pieces at rivets. Hard poses, tiny eases, one-frame overshoots (a "pop" is 1.15× for one
  step). Weight comes from size and camera shake.
- **Folding:** the flap is split into about 16 strips. Each is compressed by cos θ and enlarged along the fold by
  1 + 0.28·height (fake perspective), darkened as it stands up, in a lighter back colour past 90°, with a growing
  shadow and a crease after. About 0.5 s per fold, each on a hit.
- **Cutting:** the pattern is revealed through a mask of circles (r about 62 px) along the scissor path; the offcut drops
  once the edge is passed. Blades open and close on a beat subdivision (a snip every 0.25 s at 120 BPM). Scraps flutter.
- **Unfolding:** unfolds about 0.25 s apart, each flap swinging flat with ease-out (the "pa!" snap), then a scale bump
  and a warm flash on the accent.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route; the opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Extreme close-up tracking the scissor tip | making; craft | a beginning of work; a precise act |
| Flat front view, locked | the cut-out as an emblem | a title; a statement |
| Slow pan across paper layers (parallax) | a world laid out | a village; a route; a timeline |
| Low wide, a shape standing up from the ground layer | scale, threat | a rival; a deadline arriving |
| Top-down tabletop | the craft as plot | folding, cutting, assembling |
| Push toward a lit piece, pull back to many | one act spreading | influence; a network lighting up |
| Page turn or sheet peel | time or place changing | day to night; before and after |
| Pull back to an object in a room | the film was a thing someone made | a gift; a tradition |
| Rotation around a rosette's centre | order, repetition | a cycle; a team |

Layers stay parallel to the screen; depth comes from parallax and paper tones. Transitions are paper actions. No dissolves.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | ground paper, a sawtooth border strip, hanging cut flags; no words |
| Headline | y 270 to 740, x 120 to 888 | cut-letter headline in the hero paper |
| Stage | y 520 to 1580, full width | one cut panel or rosette, 770 px or more tall; the product behind the cut layer (never a border) |
| Caption strip | bottom at y 1560, x 120 to 780 | the banner strip |
| Bottom bleed | y 1580 to 1920 | the table or ground layer, scraps, a lit pool; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Foley follows the material:** scissors (a metallic shear sweep 2.5 to 9 kHz, a short ring, a fibre crack); folds (a
  swish, a crease tap); unfold (a sharp snap); cardboard thuds, paper peel, a palm pat, a match strike, powder (a soft hiss).
- **Instruments:** a bright folk ensemble, not piano and strings: santoor (tremolo, broken chords, glissandi), sitar or
  sarangi (glides), bansuri, a tanpura drone, dholak, manjira, small bells. Pentatonic modes (for example Bhoopali).
- **Options:** one snip is one beat subdivision; a rising santoor run, one note per thing that appears; a dholak
  heartbeat; one deep brass gong saved for one accent; total silence for a held breath.
- **Voice:** a warm storyteller, few lines. Music ducks about 9 dB and foley about 3 dB under it; spell Hindi names for
  the voice checker. −14 LUFS, no film grain (the paper fibres are the texture).
- **Our kit:** closest preset `bright` (108 BPM, claps). Preset to build: `braj`, santoor and sitar pluck, bansuri, dholak,
  manjira; 100 to 120 BPM. Effects: `snap` (unfold), `paper` and `crinkle` (cut, peel), `swish` (fold), `click` and `tick`
  (snips), `thud` (steps), `rise` (a santoor run), `sparkle` and `pour` (powder), `chime`, `whoosh` (a sheet flying off).

## 8. Native moves
A menu: use the ones the story needs.
- **Fold, cut, unfold.** Fold a sheet 2, 4 or 8 times; one cut becomes many; the unfold lands on a strong beat.
  *Fits:* one recipe becoming a whole range; one seed becoming a field; one box design printed in a thousand.
- **Holes are light.** A cut-out lit from behind glows, every hole shines, and the pattern is projected onto the world.
  *Fits:* diyas behind a cut gift-box lid; jewellery glowing behind a jaali doorway; a scented candle's lantern.
- **Symmetry replicates.** A mirrored motif peels off and multiplies. *Fits:* one kiosk becoming eight cities; eight
  spices as eight petals; a referral spreading.
- **Scraps have a future.** The bits that fall while cutting come back later (snow, confetti, stars). *Fits:* leftover
  fabric as a patchwork bag; recycled packaging; whole-fruit use.
- **Everything is one flat sheet.** Shapes share cuts, so a ridge can stand up and be a creature. *Fits:* hills that are
  a tea leaf's motif; a map that is the box's pattern; a zoom out to the made object.
- **Mirrored pair.** Two figures cut from one folded sheet. *Fits:* his and hers gifts; twin flavours; with and without
  the product on one sheet.
- **Stencil lift.** Cut paper laid on the floor, powder sifted through, the stencil lifted: a crisp pattern. *Fits:*
  haldi or kumkum spelling a logo; Holi colours; a rangoli of a recipe's ingredients.

## 9. Pitfalls of the medium
- **Same colour for ground and hero** reads as one blob: use another paper family, near and far tones, inset contours.
- **Darkening a layer through the light map** also darkens what covers it: tint the layer itself (multiply, then
  restore alpha).
- **A flat cos-squashed flap** reads as a sliding card: use strips with fake perspective, darken as it stands, show the
  back colour.
- **The cut reveal shows the uncut stack through the holes:** put stack thickness inside the "uncut" mask only.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it),
test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `paperTex(family)` | paper with grain | grey grain tile in `soft-light` inside each piece; mottle ±7% at about 130 px; alpha restored with `destination-in`; cached |
| `piece(path, holes, o)` | one cut piece | wobbled polyline (0.35 px), even-odd holes, inset slit 1.5 px at 3.5 px, rims 1 px, tight shadow (2.6 / 3.6 px, blur 5 px, 38%) |
| `motif(kind, ...)` | the cutting vocabulary | sawtooth, scallop, petal, feather eye, leaf chain, swirl, dots, jaali, arch, always with bridges |
| `wedge(fold, draw)` | folded symmetry | one wedge (45° for 8×) mirrored (D4) with `scale(-1, 1)` and rotations; alternate positive and negative rings |
| `fold(sheet, t)` | fold and unfold | 16 strips, each squashed by cos θ, enlarged by 1 + 0.28·height, darkened as it stands; 0.5 s per fold |
| `scissors(path, t)` | the cut | mask of circles r about 62 px along the path; blades open and close each beat subdivision; offcut drops |
| `lightmap`, `project` | night, backlight, projected pattern | frame × lightmap (ambient about rgb(214, 214, 236)) plus warm pools; backlit = light × transmission in `multiply`; bloom 10 and 40 px at 0.55; hole mask sheared, added with `lighter` |
| `powder(piece)` | the stencil lift | seeded 2 to 4 px powder dots sifting through the holes and settling into the pattern; the stencil lifts with a snap |
| `strip(text)` | the caption banner | deeper red strip, sawtooth edges, swallow-tail ends, pasted in two 12 fps steps |
| `stage(photo)` | the product | a panel with an aperture; the real photo behind the cut layer; label area free of holes and shadow |

## 11. Variation space
You decide the structure, the cast (or none), the paper families, the opening, the ending, the camera and the pacing.
- **Structures:** a year of twelve cuts (a calendar wheel, a wedge per month); an assembly line (a product built piece by
  piece from cut parts); a letter (a folded message unfolding panel by panel).
- **Openings:** a finished rosette, then one piece falls out and walks away; an empty ground, one fold crease appears; a
  row of cut motifs already swaying.
- **Endings:** refold (the world folds into a small square handed over); scraps settle into a new pattern; backlit only
  (the lights go off except behind one cut piece, which projects the last image on the wall).

## 12. The product and brand fit
- **The product:** the real photo sits behind the cut paper, in an aperture with 24 px of clearance and no piece over it,
  rim-lit from behind (`stage`). One panel is the stage, never a decorative border. Never redrawn, filtered or covered;
  its label stays readable.
- **Brand fit:** festive gifting, sweets, spices, jewellery, ethnic wear, home décor, candles. Avoid it for clinical or
  tech products, fine print, or a story that needs real food photography.
