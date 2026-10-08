# Silkscreen Poster

> A poster printed on camera: opaque, hard-edged flat inks pulled one colour at a time through a screen, stepped bands
> instead of gradients, thin paper-white gaps where the registration slips. **Its power for a brand:** it shows a claim
> in the order it is made, one layer and one beat at a time, so a range, a drop or an origin becomes a poster series.
>
> References (grammar only, never copy): 1930s national-park screen prints (flat inks, stepped-band skies, a dark
> information band); modern travel-poster series (paper as a colour, one template re-inked per poster); the process
> itself (screen, squeegee, ink bead, split fountain, pinholes, off-register slivers).
>
> Adapted from lemo-opuscar `styles/silkscreen-poster/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **The film is a poster being printed.** Every colour is an opaque ink laid by its own pull. A later ink covers an
  earlier one completely.
- **No halftone, no fluorescent ink, no line work.** A shape's edge is where one flat ink stops.
- **Gradients are forbidden.** Skies and haze are stepped bands: a flat colour, thinning stripes, the next colour.
- **What makes it silkscreen, not flat vector art:** registration (every layer 1 to 3 px off; a knocked-out shape
  leaves a crescent of bare paper); an overprint edge (a multiply ghost about 2 px off under each ink); ink thickness
  (a light rim top-left, a dark rim bottom-right, fills only; a wet sheen that fades in 1 s); cream paper with fibres
  (mottle and pinholes in paper colour, on ink only).

Not Risograph (translucent overprint, halftone grain). Not Block Print (carved line, dye texture). Not low-poly.

## 2. Materials and rendering
Plain Canvas 2D in this skill's runtime (Node and Skia: no browser, no SVG filters, no WebGL).
- **One `Path2D` per ink layer,** filled in the current transform's units. Knock-outs are even-odd holes. A product is
  its silhouette first, then its flat colour areas, one layer each.
- **Ink pass** (offscreen ink canvas): offset the layer by its registration (1 to 3 px, fixed per shot), draw a ghost
  2 px off in `multiply` at about 30%, fill flat. **Rims are fills only:** clip to the path, fill light, then fill the
  path again 1.5 px down-right in the ink (the dark rim: the same trick, up-left). Never stroke: strokes draw inner
  lines on unioned paths.
- **Pull reveal:** a ragged squeegee front as a clip path with a 30 px drag tail. The blade, a round bead (lit half,
  dark underside, glints) and a sliver of handle ride on it. A split fountain puts several colours in one bead.
- **Screen:** a hinged frame with mesh, emulsion and tape. Its shadow is a ring (even-odd), never a full rectangle.
- **Poster template** (1080 × 1920): a 28 px paper border, an art area, a dark info band (name, number, rule, stats).
  The band's ink runs to the frame foot; its text stays in the safe box.
- **Texture budget:** a paper tile, mottle in `multiply` at about 55%, pinholes at about 75%, both `source-atop` so they
  show on ink only. More reads as Risograph.

## 3. Colour logic
- **One palette per poster, at most 6 inks,** by role: light sky, deep sky or bands, far, mid, near (darkest; also the
  info band) and one bright accent (sun, route, product, key number). A lit-face ink is optional.
- **Values step from far (light) to near (dark).** Depth is value, never blur. **The accent is rare.**
- **Paper is a colour:** the unprinted area is the brightest thing (water, snow, milk, a beam of light).
- **A series is one template with a new palette per item** (flavour, shade, season, region).
- **Text inks are chosen by contrast** (4.5:1; 3:1 for large type) against the ink beneath, never by a fixed key.
- **Take the inks from the pack:** the accent is the pack's accent, the near ink its darkest colour. Example (sky 1,
  sky 2, far, mid, near, accent): `#E8F0F2 #7FB3C8 #D9C7A3 #2F6E8E #173247 #E8553D`.

## 4. Type and captions
Fonts (SIL OFL, fetched by the font script): **Big Shoulders Display** (900 names, 800 values), **Outfit 600** (labels).
- **Headlines:** Big Shoulders Display 900, 120 to 160 px, one to three lines, left at x 120, auto-fit down to 100 px
  (about 12 letters a line at 150 px). 2 to 5 words. Printed into the sky, never over the product.
- **Labels:** Outfit 600 capitals, 40 px, tracked 0.3 em. **Values:** Big Shoulders Display 800, 72 to 96 px; at most 3
  stats in a row, inside x 120 to 780. The info band prints last, left to right.
- **Captions are a printed strip,** never a floating pill: a band pull in the near ink (6 px corners, registered 2 px
  off), Outfit 600 at 56 px in the ink that wins on contrast, the **keyword in the accent ink**. Words light up as they
  are spoken (unspoken at 45%). Bottom edge y 1236, left edge x 120, at most 660 px wide, two lines.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.6 s), and about (letters ÷ 15 + 1.5) s
  after its last item lands. Nothing fades: text is pulled in or stamped on a beat.

## 5. Motion quality
- **Pulls are linear and steady:** a squeegee does not ease. Accent inks start half a beat after the main ink.
- **One pull, one beat.** Info items print left to right on beat subdivisions (about 0.18 s each). Nothing fades.
- **Screen lift:** the frame hinges up (vertical squash, a growing ring shadow) in about 0.4 s.
- **Palette re-ink:** a wide squeegee crosses diagonally in about 0.35 s (blade tilted about −12°). The geometry is the
  same on both sides of the blade; only the inks change.
- **Loose layers:** planes slide by depth with 3 px paper gaps and 9 px thickness shadows at 28%, then **snap into
  register** on one hit: gaps and shadows go to zero on the sound's frame. Registration is fixed per shot.
- Transitions are the medium's: a pull, a foreground silhouette (full cover about 1 frame), a screen lift. No
  dissolves, no bare cuts.

## 6. Camera grammar and the 9:16 page
A 2D camera over a flat sheet, with a squeegee in frame when something prints. A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Truck with the squeegee, slight roll, frame edge in view | colour arriving | a hook; a split-fountain sky |
| Locked top-down full sheet | layers stacking | a poster building; a comparison |
| Fast pull-back as the screen lifts | a finished layer revealed | a scene complete; a title |
| Push and tilt to the info band | reading | facts; a date; a price |
| Truck through a foreground silhouette (leaf, lamp post) | passing to the next poster | poster-to-poster cuts |
| Crane through loose planes (parallax) | depth, a journey in the print | a route; a climb; a street |
| Slow dolly along a row of prints | a set, a range | a series wall; colourways |
| Push into the mesh until the weave shows | the craft | an intimate detail |
| Log-zoom pull-back to the wall or window | the poster in the world | a final lockup (hold 3 s or more) |

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | stepped sky bands, sun ring, paper border; no words |
| Header, headline | y 270 to 850, x 120 to 888 | a tracked-out label, one condensed headline, in the sky |
| Hero (scene shot) | y 280 to 1380, full width | the printed scene, the product as accent, 770 px or more tall |
| Info band (band shot) | y 830 to 1420, x 120 to 780 | after the camera tilts down: name, number, rule, up to 3 stats |
| Caption strip | bottom at y 1560, x 120 to 780 | the pulled strip |
| Bottom bleed | y 1580 to 1920 | near-ink foreground, table, border; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Acoustic, hand-played:** strummed or slide guitar, harmonica, upright bass, cajon or brushes, banjo, fiddle,
  accordion, harmonium, ukulele. Pick the family from the place or brand.
- **One pull, one hit.** Each ink lands on a musical event. Accelerate by subdividing the beat, not by changing tempo.
  A registration snap is a loud downbeat.
- **Foley by material:** squeegee on mesh (band-passed noise, 220 to 280 Hz grain; faster is brighter), wet ink squelch,
  screen clack, paper stamps, ticks for dashed routes, a wood-and-metal clamp.
- **Silence:** the music drops out for a beat before the key facts; the first sound after is a decisive gesture. Music
  ducks a few dB under foley; −14 LUFS.
- **Our kit:** closest preset `warm` (92 BPM plucked strings), one strum per pull. Effects: `swish` (pull), `plop`
  (bead), `stamp` (info item), `paper` (sheet, screen lift), `thud` (clack, clamp), `tape`, `tick` (route dashes),
  `snap` (registration snap), `whoosh` (re-ink blade).

## 8. Native moves
A menu: use the ones the story needs.
- **One ink, one beat.** Facts print last, when they are read. *Fits:* a cold brew's tasting notes; a serum's three
  actives; sizes and care for a shirt.
- **Split fountain.** Several inks in one pull fill the frame. *Fits:* a juice range; a lip-shade range; a gift hamper.
- **Palette re-ink.** The same poster in another palette is a variant. *Fits:* three kurta colourways; protein-bar
  flavours; day and night sleep supplements.
- **Registration slip, then snap.** Loose layers clamp into register before the key facts. *Fits:* a launch price; a
  restock date; a limited-edition count.
- **Paper as a colour.** The bare sheet is the brightest element. *Fits:* milk; a sunscreen's white; a salt crystal on
  a snack.
- **The route as a printed layer.** A dashed accent line, stamped segment by segment. *Fits:* a bean's trip from estate
  to cup; a 10-minute delivery; a three-step routine.
- **The series wall.** Every print hangs together as the final lockup. *Fits:* four flavours of one snack; the estates
  of one origin; a year of festive editions.

## 9. Pitfalls of the medium
- Stroke edge effects draw inner lines on unioned paths: fills only. A full-rectangle screen shadow muddies the print:
  use a ring. A jagged ink bead reads as a paper edge: keep it round.
- Cool shadow facets next to water read as water: put shadows in the near ink.
- Parallax alone reads as "the mountains are moving": show paper gaps and thickness while loose, snap with a sound.
- A silhouette wipe holds a dark blank: centre it on the switch so full cover lasts about 1 frame.
- A long banner is a sliver in 9:16: stack the title in 2 or 3 lines on a near-square block.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it),
test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `paperSheet` | cream stock | seeded tiles, cached once; mottle `multiply` 55%, pinholes 75%, both `source-atop` on the ink canvas |
| `ink(part, {color, reg, clip})` | one opaque ink layer from a `Path2D` | offset 1 to 3 px; ghost 2 px off in `multiply` 30%; flat fill; rims by clip and shifted fill |
| `bandSteps(box, n)` | the gradient substitute | n flat bands, stripes thinning (64, 40, 24, 12 px) before the next colour |
| `pull(box, dir, p)` | the ragged squeegee front | linear clip path, 30 px drag tail from seeded noise; returns the blade position |
| `squeegee(a, b, {beads})` | blade, round bead, handle sliver | rotated rectangle; bead = lit-half disc, dark underside, glints; split fountain = coloured segments |
| `screenFrame(box, lift)` | the hinged screen | cached mesh tile, tape, even-odd ring shadow; lift squashes it vertically |
| `pickInk(under, inks)` | text ink by contrast | WCAG ratio against the ink beneath |
| `poster(content, palette)` | border, art, info band | 28 px border; near-ink band, 6 px rule, stat columns sized by content |
| `pullStrip(text, words)` | the caption strip | band pull in the near ink; Outfit 600 56 px; keyword in the accent; unspoken words 45% |
| `rackPrint(photo)` | the product on a drying rack | the real photo as a sheet with a white edge, two pegs on a cord, a flat offset shadow |

## 11. Variation space
You decide the subject, scenes, palettes, camera path, opening, ending, instruments and length. Print order is grammar
for information: a **product drop** (layers, name, colourway ×3, price and date; 25 to 30 s); an **origin series**
(name, one fact, series wall; 2.5 s a poster, 30 to 40 s); an **event** (scene, headline, date, venue; 25 to 30 s).
- **Structures:** one poster, many runs (re-inked for four days); a street walk (each shop sign printed as we pass); a
  misprint story (registration drifts until the last pull lands true on the date).
- **Openings:** the empty screen (light through blank mesh); the accent first (a lone product on bare paper); the
  finished wall at night, then back to the table.
- **Endings:** the drying rack (prints swaying); the poster in use (on a bus shelter, rain starting); the last pull is
  paper (the squeegee runs dry, leaving a white silhouette).

## 12. The product and brand fit
- **The product:** a simple pack is printed in flat inks with its real label text typeset on top. The real photo hangs
  on the drying rack at the end (`rackPrint`). It is never redrawn, filtered or covered, and its label stays readable.
- **Brand fit:** origin, drops, ranges, festive editions; brands with a clear accent colour. Avoid it for skin or food
  texture, or more than one fact per beat.
