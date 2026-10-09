# Art Deco

> Black lacquer, engraved gold line and airbrushed geometry: a 1930s poster that moves. Every composition has a centre
> axis, transitions open or close along it, and light arrives as bulbs switching on one by one. **Its power for a brand:**
> it makes a launch feel like an event: doors split on the beat, and a counted sign lights one bulb per item.
>
> References (grammar only, never copy): airbrushed travel and liner posters (giant geometry, steep perspective, airbrush
> inside hard edges); skyscraper-crown ornament (setbacks, sunbursts, chevrons); overhead kaleidoscope dance numbers of
> old musicals; a gold line drawing itself on black; symphonic jazz. Never copy a poster layout, a real building, a
> character, a typeface design or a melody.
>
> Adapted from lemo-opuscar `styles/art-deco/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this skill's
> runtime. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

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
A world built from **gold keylines on warm black,** filled with **airbrushed hard-edged volumes,** organised around **one
vertical axis.** Ornament *is* the picture: sunbursts are backgrounds, stepped arches are frames, a dial is a progress
bar, a bulb marquee is a reveal. Motion is **mechanical and symmetrical:** things unfold from the centre, doors split
along the seam, lights switch on in counted order. Native register: glamour with a clock ticking (an event, a deadline, a
launch).

Not a gold-foil slideshow (things move and have volume). Not Art Nouveau (no whiplash curves, no flowers). Not a flat
vector poster (volumes are airbrushed and rimmed). Not a 60s spy title (no silhouettes on flat colour).

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia: no browser, DOM, CSS or SVG filters). Every
element is a pure function of t.
- **Ground:** warm lacquer black, never neutral grey-black; a night sky may drift toward deep emerald near the horizon.
- **Gold is a banded metal gradient** (dark, light, hot, light, dark): a `createLinearGradient` with 5 to 7 stops;
  animate a `sheen` offset along it for a light sweep.
- **The signature stroke (`gline`):** three strokes of one path: a dark engraved underline about 1.6 px wider than the
  line, the gold gradient line, a hairline highlight. Optional glow and a parallel twin (`double`). No black outlines.
- **Volumes:** hard edge plus airbrush (`airbrush`): clip to the shape and fill with a directional gradient from shade to
  light, one light direction (upper left), a thin gold rim on the lit side.
- **Motifs** (sunburst, stepped arch, fish-scale, chevrons, fan, four-point sparkle, speed lines, clock face, dial) are
  structural: a background, a frame, a transition. Never stickers.
- **Perspective is real:** one-point floors (mode-7: one textured strip per scanline) and two-point perspective through a
  pinhole camera `P(X, Y, Z)`, so dolly, tilt and pan change the perspective. A flat card on a quad is drawn in strips.
- **Characters are optional** in a reel. If one appears it is deco: about 7 heads tall, tapered body, faceted lacquer
  planes, gold rim.

## 3. Colour logic
- **Three constants:** **warm black ground, gold line and metal, ivory** (paper, gloves, light, type).
- **One saturated accent reserved for the protagonist,** here the pack colour. It is the only large saturated area, so the
  eye finds it in any wide shot. A cooler jewel tone may carry secondary surfaces, never competing in area.
- **The one-colour exception:** any single element can be drawn in its own colour through the same fill, keyline and glow
  (`color` option) while everything else stays gold.
- Always expand hex to six digits in code (three-digit hex breaks colour mixing). Triads (accent / jewel / metal):
  burgundy / emerald / gold; coral / sapphire / pale gold; jade / plum / rose gold.

## 4. Type and captions
Fonts (SIL OFL): **Limelight 400** (titles), **Poiret One 400** (plaques, sign skeletons), **Josefin Sans 600** (labels,
captions), **Italiana 400** (numerals).
- **Titles are architecture:** a stepped gold title bar over an arch or sunburst, Limelight 96 to 140 px, one to three
  lines, centred on x 540 and at most 696 px wide (so its right end stays inside x 888). Drawn on in gold, then a sheen
  sweep.
- **Numerals and labels:** Italiana 400 at 160 to 300 px for dials and medallions; Josefin Sans 600, 40 px, caps, 0.12 em
  tracking. Numbers carry the plot: dials, clock faces, floor medallions, badges.
- **The caption is a lacquer plaque** (about 88% black) with stepped ends like the title bar and a double gold keyline, in
  the caption lane (bottom edge y 1236, left edge x 120, 660 px wide), Josefin Sans 600 at 56 px in ivory. It **unfolds from
  its own centre** like every other title. The words light up as they are spoken: unspoken words at 45%, the keyword in gold.
- **Reading time:** every title or caption holds at least max(1.8 s, its spoken line + 0.6 s), and about
  (letters ÷ 15 + 1.5) s after it lands.

## 5. Motion quality
- **Characters (if any) step on twos (12 fps);** camera, light, bulbs, gold draw-on and sheen run on ones (30 fps).
- **Everything unfolds from the centre:** a point, then a hairline, then bars open symmetrically, then text rises, then
  wings and sparkle.
- **Draw-on follows the music:** a gold line grows at the speed of the phrase under it and lands on the hit.
- **Bulbs have an ignition overshoot** (about 1.6× flash settling in 0.18 s) and a relay "chunk". Once a sign is lit, a
  fast chase may run across it.
- **Mechanical easing:** doors, dials and hands move with a firm ease-in-out and a small settle; nothing floats.
  Performance beats get anticipation and escalate in threes (once, twice, mash).
- **What never moves:** the centre axis. Symmetry may rotate or open, but never drifts off-centre.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. The opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Symmetric split (two door leaves hinged at the edges; or a revolving-door wipe) | a threshold crossed | a new chapter; a reveal behind a façade |
| Leaves sliding shut over the live shot | a door closing on a moment | a decision made; the end of an era |
| Extreme low-angle tilt | scale and aspiration | a goal far above; a tower |
| Architectural section (pull out to a cutaway of the building) | progress through a structure | a process in stages |
| Overhead, mirrored and rotating | people become pattern | a team, a release, a system of parts |
| Push-in on a dial, medallion or clock | the number is the plot | a deadline; a count; a milestone |
| Match-cut on shape (circle to circle, ray to ray) | two places, one rhyme | jumping between departments or eras |
| Low oblique along a sign or marquee | light travelling letter by letter | a name revealed; a launch |
| Pull back from detail to skyline | where the moment sits in the world | aftermath; scale |

The centre axis is sacred; an asymmetric frame must resolve to it within the shot. At an emotional peak the protagonist
fills at least 1/3 of the frame height. Transitions: splits, revolves, arch openings, shape matches; no dissolves.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame. Words and key details keep to x 120 to 888,
y 260 to 1580, and left of x 780 below y 1100):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | sunburst rays, the crown of the arch, a stepped tower top; no words |
| Title bar | y 270 to 610, centred on x 540 | the stepped title bar, at most 696 px wide, over the arch or sunburst |
| Hero | y 440 to 1580 | the product in its gold frame, or a door, dial or sign, centred on x 540. Main shot: 780 to 1000 px tall (40 to 52%), at most 480 px wide below y 1100 |
| Caption lane | bottom at y 1560, x 120 to 780 | the lacquer plaque |
| Bottom bleed | y 1580 to 1920 | stepped plinth, a one-point floor, sunburst rays; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Symphonic jazz, not a big band:** stride piano, clarinet (trill, glissando), strings (tremolo, pizzicato), muted
  trumpet, walking pizzicato bass, brushes, tubular bells, harp, celesta. Rhythms: foxtrot, Charleston, a torch-song ballad.
- **Techniques:** one hit per unit of counted light; accelerate by dividing the beat; plant a theme in fragments so its
  full statement is a payoff.
- **Foley by material:** brass clicks, bronze clang, iron treads, marble heels, silver trays, wooden doors, paper
  flutter, a knife-switch "chunk", relay ticks, elevator ding.
- **Silence:** before the most important sound, drop to one small sound (a clock tick, wind) and cut back in with it alone.
  **Mix:** music ducked about 9 dB under the voice, -14 LUFS.
- **Our presets:** closest is `warm` (92 BPM plucked strings, a slow foxtrot). Effects: `ding`, `chime`, `tick`, `click`,
  `door`, `thud`, `sparkle`, `swish`, `rise`. Preset to build: `deco`: stride piano, pizzicato walking bass, brushes,
  clarinet and muted trumpet, tubular bells, harp glissando, 100 to 120 BPM foxtrot.

## 8. Native moves
A menu: use the ones the story needs.
- **Counted light.** A bulb sign lights one letter per beat or event, so the audience can count. *Fits:* a gift box with one
  bulb per item; a festive calendar; a limited-drop countdown.
- **Threshold doors.** Every scene change is a door split along the seam. *Fits:* the notes of a fragrance (top, heart,
  base); the tiers of a membership; the rooms of a home collection.
- **Machine kaleidoscope.** Objects become a mirrored, rotating pattern that locks into a symbol. *Fits:* eight shades
  turning into one sunburst; a spice range; a gift hamper.
- **Dials carry the plot.** A clock or gauge moves instead of narration. *Fits:* days to the next delivery; a refill level;
  minutes for a serum to absorb.
- **The architectural cutaway.** Pull out until a building is a section and the protagonist a coloured dot. *Fits:* an
  order through a warehouse tower; a tea blend through a factory; a parcel through a depot.
- **Sheen sweep / draw-on.** Light crosses a gold object on a hit; a gold line engraves itself. *Fits:* unveiling a limited
  bottle; a spice route from farm to port; a signature on a hand-made label.
- **The one colour.** One element keeps its own colour in a gold world. *Fits:* the new flavour among classics; the hero
  product on a shelf; the winning shade.

## 9. Pitfalls of the medium
- Bulb signs from glyph skeletons break on curves (G, S, R) → use the crossing-number junction test; weld chain ends
  within about 14 px.
- Fish-scale reads as brickwork → lower half-circles row by row, each overlapping the previous row, plus an inner arc.
- Door leaves over a flat "interior" read as a blank frame → draw only the leaves, closing over the live shot.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test
each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `gline(g, pts, o)` | the engraved gold keyline, drawn on by `part` 0 to 1 | three strokes (dark +1.6 px, gold, hairline highlight); draw-on with `setLineDash([len × part, len])` |
| `airbrush(g, path, o)` | a hard-edged airbrushed fill with a gold rim | `clip(path)`, linear gradient shade to light, rim stroke on the lit side |
| `sunburst`, `stepArch`, `fan`, `chevrons`, `fishScale`, `sparkle` | the structural motifs | wedges and rays as paths; fish-scale rows lowered half a circle each |
| `titleBar(g, text, cx, cy, o)` | the stepped title bar that unfolds from the centre | point, hairline, bars opening symmetrically, text rising, then sheen |
| `bulbSign(text)`, `litSequence(t, times)` | a word as bulbs, lit one per beat | rasterise, thin, trace chains, weld ends within 14 px, space bulbs evenly; ignition 1.6× over 0.18 s |
| `doors(g, live, p)`, `floor(g, cam, tex)` | the threshold split; a one-point perspective floor | two leaves of the outgoing frame, hinged at the edges, in strips; one textured strip per scanline |
| `productFrame(g, P, o)` | the real photo inside a gold-line frame or arch | `P.draw`, then `gline` around it, a sunburst behind, the sheen across the frame only |

## 11. Variation space
You decide the structure, the characters (or none), the settings, the opening, the ending, the camera path, the pacing, the
accent colour and what gets counted. Far from the original demo:
- **Structures:** the exhibition (five pavilions of a world's fair, one idea behind each door); the ocean liner (three
  decks from engine room to ballroom); the trophy night (the winner revealed in light).
- **Openings:** the machine room (gold gears build to the first beat); the engraved map (a gold route crosses a
  continent); the telegram (ticker tape types the premise).
- **Endings:** the lights go out (letters switch off until one bulb remains); the dawn (lacquer black warms to a pale
  sky); the poster (the last shot flattens into a printed poster).

## 12. The product and brand fit
- **The product:** the real photo in a gold-line frame (`productFrame`), at most 480 px wide below y 840 so it stays left of
  x 780. The frame, glow and sheen sit around it; it is never redrawn, filtered or covered, and its label stays readable.
- **Brand fit:** fragrance, tea, chocolate, jewellery, gifting and festive launches. Avoid rustic, playful or clinical brands.
