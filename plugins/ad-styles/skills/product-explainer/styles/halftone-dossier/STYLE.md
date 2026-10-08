# Halftone Dossier

> A retro print case file: cream archive paper, overprinted halftone dots in a few flat inks, huge heavy headlines with
> misregistered shadows, rubber stamps that slam, and thick-outlined props. The film is a file that is read out one
> exhibit at a time. **Its power for a brand:** a fact looks like evidence the viewer can inspect, and a verdict lands
> like a stamp.
>
> References (grammar only, never copy): Ben-Day-dot pop-art printing for dot density as shading; riso and offset
> overprint zines for multiply layers and misregistration; police mugshot height charts and case-file folders for the
> framing device; variety-show telop captions for the keyword-highlight caption bar.
>
> Adapted from lemo-opuscar `styles/halftone-dossier/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
> skill's runtime. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

**Status: drawing kit built** (`engine.mjs`, section 10): paper, dots, type, props, stamps, the caption bar, the HUD,
transitions and the evidence print, all in the style. There is no ready-made film. Every film writes its own scenes from
its treatment (references/directing.md), and nothing appears unless a scene asks for it. Don't draw dossier elements
with the generic kit.

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
- **The whole film is paper.** A warm cream sheet with low-frequency mottling, fine grain, a vignette and a fold. Dark
  scenes are printed on it too, never glowing.
- **Shading is never a gradient.** It is halftone dots whose size follows a density field. Two or three dot layers at
  different screen angles overprint (multiply). That is the "printed" feel.
- **Bureaucratic apparatus:** case numbers, file chips, numbered exhibits, height charts, name plates, stamps. Their
  seriousness is the frame; the subject can be grave or trivial.
- **Loud but readable:** one idea per 2 to 4 s card, one big headline, one exhibit or gag, one caption line.

Not Risograph (no grainy two-ink riso texture as the whole look, no zine collage). Not Swiss Motion (no grid-driven
kinetic type on white). Not a game show (no candy sets). Dots, paper and stamps are visible in every frame.

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia, no browser, no SVG filters). The engine
already does all of it.
- **Paper** (built once, multiplied over the printed world): a low-resolution random tile upscaled for mottling,
  per-pixel noise of about ±13 with a slight warm bias, a radial vignette, and a faint fold across the middle of the
  page.
- **Grain** (per frame, on top of everything): a few hundred paper-coloured specks and fewer ink specks, reseeded every
  2 frames. It is dust on the print, not film grain.
- **Halftone:** a rotated grid of circles drawn as one path. Step 20 to 26 px, a different screen angle per layer, and
  radius = density × step × k with k 0.6 to 0.72 (around 0.7 the dots merge into solid ink). Density fields: radial
  (halos, blooms, corner glows), edge (dots crowding the frame border), linear ramps ("lit from above"). The second
  layer is multiplied, so the inks overprint.
- **Halftone-filled numerals and shapes:** a flat fill, overprinted with a darker halftone clipped to the shape. Giant
  numerals bleed off the frame.
- **Line boil** (props and characters only, never text, dots or captions): outline points jitter by about 1.5 px,
  reseeded 10 times a second, and fine ink specks eat a little of every fill.
- **Props:** chunky shapes with a heavy ink outline (6 to 8 px), flat fills, a lighter face or belly area. Starbursts,
  speech bubbles, sticky notes, folders, tags, height charts, magnifiers: all flat fill plus ink outline.
- **Stamps:** a double rounded rectangle and bold text in rough ink (a coarse speck mask and a jittered edge), about
  93% opacity, tilted ±10°.
- **The real product photo** is never printed, dotted or boiled. It is pinned to the file as an evidence print that
  sits on top of the paper (section 12).

## 3. Colour logic
- **A paper ground, one dark ink, and four or five flat spot inks.** The dark ink (navy, black-violet, black-brown or
  deep green) carries every outline, body text and the caption bar, and is the fade-out colour.
- One ink is the **overprint shadow** (misregistration offsets, caption shadows). One is the **highlight** for keywords
  and numerals. One warm red is reserved for stamps and alarms.
- Flat inks only. No gradients, no transparency ramps: tone comes from dot size and overprint.
- **Night or "secret" scenes** switch to a dark-ink ground with a lighter dot layer of the same family, still multiplied
  by the paper.
- **Take the spot inks from the product's pack.** The highlight is the pack's accent; one spot ink is its main colour.
- Example palettes from the original: cream / navy / cobalt / hot pink / yellow / red; manila / sepia-black / teal /
  mustard / vermilion; off-white / forest green / tomato / sky / ochre.

## 4. Type and captions
Fonts are bundled in `fonts/` (SIL OFL): **Alfa Slab One** (headlines), **Bagel Fat One** (names, big numbers),
**Archivo Black** (captions, stamps), **JetBrains Mono 800** (case numbers, dates, rulers), and the skill's **Caveat**
(hand interjections).
- **Headlines:** Alfa Slab One, 96 to 150 px, one to three lines, left-aligned at x 120, with a **misregistration
  shadow** (+8/+8 px in the overprint ink, multiplied). Keep a headline to 2 to 5 words.
- **Display numerals:** Bagel Fat One. Giant exhibit numerals 700 to 900 px bleed off the right edge.
- **Interjections:** Caveat 700, paper fill with a thick ink stroke and an offset shadow.
- **Data and HUD:** JetBrains Mono 800. The case number is texture (28 px); the chapter chip carries meaning (34 px).
- **Captions are a caption bar:** a dark-ink rounded pill with an overprint-ink offset shadow, paper-coloured Archivo
  Black at 56 px, the **keyword in the highlight ink**. The words light up as they are spoken (unspoken words at 45%).
  It sits at the bottom of the safe box (bottom edge at y 1236, left edge x 120, at most 660 px wide).
- **Statement lines** (`"show": "statement"` in script.json) are the card's headline instead of a caption.
- **Reading time:** every headline holds at least max(1.8 s, its spoken line + 0.6 s), and about
  (letters ÷ 15 + 1.5) s after it lands.
- Latin runs long: 1 to 2-word stamps (GUILTY, CLEARED, CLOSED), a 0.02 to 0.04 s per-character stagger.

## 5. Motion quality
- 30 fps transforms; **line boil at 10 fps** on props, so the drawing breathes while positions stay smooth.
- **Everything enters with overshoot** (back ease, 0.3 to 0.45 s): rising from below the frame or scaling from 0.
  Nothing fades in.
- **Per-character pop** for headlines: each glyph drops 30 to 100 px and squashes in, stagger 0.02 to 0.08 s. A
  headline tied to a line pops word by word as the voice says it.
- **Stamp slam:** about 0.09 s from 2.6× to 1× (ease in), then a small damped bounce. Camera shake, a flash and the
  stamp sound land on the same frame.
- **Squash landings** keep their volume (`scale(1/sq, sq)` with a damped cosine).
- **Idle life:** breathing (±2% y-scale), sway, blinks at set times, twinkles, a blinking REC dot, a clock colon.
- **Dot wipe transitions:** an 80 px grid of circles grows to full cover and shrinks back over about 0.44 s, with a
  diagonal delay; the scene switches while the frame is covered. Each cut can take its own wipe colour. A hard cut is
  the contrast tool, on a big hit only. No dissolves.

## 6. Camera grammar and the 9:16 page
A 2D camera over a flat, frontal page. A vocabulary, not a route; the opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked frontal with a small beat pulse (about 0.6%) | the page as a poster, grooving | a title; a list; an accusation |
| Slow push-in (1 to 1.05–1.08) | scrutiny, rising tension | a profile; a summary before a verdict |
| Shake with quadratic decay (5 to 26 px) | impact | a stamp; a crash; a landing |
| Flash frames (white overlay up to 0.5, then 0) | being photographed, a revelation | a mugshot; a verdict; evidence found |
| Pan across a pinned board | connection between exhibits | a timeline; suspects; a chain of events |
| Snap zoom into a halftone detail until the dots are huge | "look closer" | a fingerprint; a signature; a number |
| Page turn or folder slide | next file, next chapter | a second case; a flashback |
| Pull back to reveal the whole desk | the file is one among many | scale; "this happens every day" |

Compose like a printed page: one big subject, a headline only when the beat needs one, the caption bar, the HUD in the
corners, and paper around them. Empty paper around the subject is design; an empty bottom third is not.

**The 9:16 page** (1080 × 1920, organic placement; the picture covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top band | y 0 to 260 | paper, and the picture when it runs up; no words (the app's header) |
| HUD row | y 262 to 370 | case number and chapter chip at x 120; REC dot and date right-aligned at x 888 |
| Headline | y 406 to 700, x 120 to 888 | one headline, left-aligned, only when the beat needs one |
| Hero | y 560 to 1440, full width | the one subject, at least 640 px tall at key moments (an exhibit, the evidence print, a giant numeral bleeding off an edge); it may run past the frame's edges and into the bottom band |
| Caption bar | bottom at y 1560, x 120 to 780 | the caption pill, just above the app's own caption |
| Bottom band | y 1580 to 1920 | the picture continues: paper, the lower part of a big subject; no words (the app's caption, username and buttons) |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music:** an original score, composed from the treatment's cue map (`music.score`, references/film-api.md), in this
  palette: synth kick, snare, clap, hat; a square-ish 8th-note bass; a soft pad; a **marimba-like pluck** (a
  fundamental and a partial about 4× above) for the melody; finger snaps for sneaking; a music-box bell for tenderness.
  The score has the story's shape. Pick 75, 90 or 150 BPM so its 16th notes land on whole frames (directing.md,
  section 7). The `dossier` preset (120 BPM; sections intro, groove, sneak, build, drop, outro) is only for a first draft.
- **Foley follows the print and the gag:** `stamp` (pitch-dropping boom and click; `stampbig` adds a crackle),
  `shutter` for a flash, `paper` and `flip` for slides and folders, `type` for typed or chip text, `whoosh` into every
  wipe, a soft `pop` per headline word, `boing` and `plop` for props that land, `crinkle` for wrappers, `pour` for
  grains.
- **Silence before the stamp:** empty the music just before a verdict so the stamp lands alone. Other options: a snare
  roll and a rising sweep into a reveal; stripping to bass and snaps for a secret scene; a bell arpeggio as a tag; a
  single sustained pad under a sad exhibit.
- **Voice:** the brand's voice reads the script; the cards and captions carry the rest. Dry, deadpan, never breathless.
- **Mix:** effects ahead of the music on impacts; the voice loudest; −14 LUFS, true peak ≤ −1 dB (the renderer does it).

## 8. Native moves
A menu: use the ones your story needs, or none. The first idea this style suggests (a mugshot, three exhibits, a
verdict) is its cliché; check it against your topic before you use it.
- **The accusation frame.** A topic becomes "the case of X": list its counts. *Fits content like:* a cognitive bias on
  trial; a city's traffic problem; a plant that won't stop growing.
- **Numbered exhibits.** Each beat gets a giant halftone numeral behind it. *Fits content like:* five causes of a
  blackout; three clauses of a contract; the stages of a recall.
- **The stamp.** A verdict is a physical slam. *Fits content like:* APPROVED on a grant; EXPIRED on a policy; VERIFIED
  on a rumour check.
- **The mugshot.** A frontal subject, a height chart, a name plate, a flash. *Fits content like:* a new species; a
  product teardown; the "suspect" in a bug report.
- **Evidence board.** Exhibits pinned and linked with string, then shaken. *Fits content like:* a supply chain; a family
  tree; a heist's timeline.
- **Dot density = emotion.** Dots swell into a halo, crowd the edges for tension, bloom radially for joy. *Fits content
  like:* a record broken; a deadline closing in; a reunion.
- **Redaction.** Black bars print over words and lift one by one. *Fits content like:* a leaked memo; a surprise party
  plan; spoilers.

## 9. Pitfalls of the medium
- **Boil on text or dots** turns them to mush: boil props only.
- **Dots too small** (a step under about 14 px) alias into moiré after encoding.
- **Too many inks** lose the print feel: five at most, plus paper.
- **A 100% white flash** reads as a dropped frame: cap it at 0.5.
- **A dot wipe short of full cover** at the cut shows the switch: the circles must reach the grid cell's diagonal.
- **An element visible before its cue:** everything is a function of t; check t < start returns nothing.
- **Gradients and blurred shadows** break the print: tone is dots, shadows are flat offset ink.
- **Headlines over 5 words** don't fit the 768 px safe width at 96 px: cut words, don't shrink below 96 px.
- **The evidence print covering the caption bar or a headline:** keep the hero zone clear of the text zones.
- **Filling the frame:** a dot field on every scene, a folder across the bottom, props in the empty bands. It reads as
  clutter ("too much dots, no design language", our first test film). One dot field per frame at most, with a job: a
  halo behind the subject, tension at the edges, a bloom for joy, the fill of a numeral.
- **A new scene for every line:** an animated slideshow. Let one subject carry the film and change.

## 10. Engine
`engine.mjs` is loaded for any project whose `script.json` says `"style": "halftone-dossier"`; the film gets it as
`K.style` (here `D`). It is a kit of parts, not a film: write the film from `templates/film.mjs` and your treatment, and
call only the parts your scenes need. The comment above each call in `engine.mjs` lists all its options.

| Call | What it draws |
|---|---|
| `D.inks({...})` | sets the palette roles: `paper, ink, overprint, highlight, stamp, spot, spot2, night, night2, cream, card` |
| `D.finish` | the paper (multiplied) and the dust: use it as the film's `finish` |
| `D.captions` | the caption bar: use it as the film's `captions` |
| `D.hud(g, t, { caseNo, chip: [a, b], chipAt, date, dark })` | the HUD: case number, chapter chip, REC dot and date |
| `D.camera(keys, { shakes: [[t0, amp, dur]], pulse: K.grid(bpm, offset), when })` | a camera with shakes and the style's beat pulse |
| `D.halftone(g, { x, y, w, h, step, angle, color, field, k, blend, cache })` | a dot field; `field(x, y)` returns 0..1 |
| `D.radial(cx, cy, R, pw)`, `D.edge(R, pw)`, `D.ramp(x0, y0, x1, y1, a, b)` | density fields |
| `D.dotFill(g, path, { fill, dot, step, angle, field })` | a flat fill overprinted with a halftone clipped to the shape |
| `D.numeral(g, str, { x, y, size, fill, dot, t, at })` | a giant halftone-filled numeral that pops in |
| `D.headline(g, t, text, { x, y, size, at, line, stagger, color, shadow, maxW })` | per-character pop with a misregistered shadow; with `line`, word by word as spoken |
| `D.text(g, str, x, y, { face, size, color, role })` | plain style type (mono, sans, hand) |
| `D.ink(g, pts, { fill, line, width, t, seed, smooth, dots })` | the basic prop: flat fill, heavy ink outline, boil, ink specks |
| `D.stamp(g, t, str, { x, y, size, at, rot, color })` | a rough-ink stamp that slams at `at` |
| `D.redact(g, t, box, { at, lift })` | a printed black bar that lifts at `lift` |
| `D.burst`, `D.bubble`, `D.note`, `D.tag`, `D.folder`, `D.chart`, `D.plate`, `D.pin`, `D.string`, `D.ring`, `D.paperclip` | starburst, speech bubble, sticky note, exhibit tag, case folder, height chart, name plate, pin, evidence string, marker ring, paperclip |
| `D.evidence(g, t, P, { x, y, h, rot, at, label })` | the real product photo as an evidence print with a paperclip and a tag (draw it in `over`) |
| `D.dotWipe(g, t, at, color)`, `D.flashAt(g, t, [[t0, amp, dur]])` | the style's transition and flash (draw them in `top`) |
| `D.pop`, `D.rise`, `D.slam`, `D.squash` | motion curves with the style's overshoot |

## 11. Variation space
You decide what the file is about, its counts or exhibits, the props (or characters), the inks within the colour
logic, the tone (farce or grave), the opening, the ending and the length (30 s for three exhibits, about 45 s for
five).

Far from the original demo:
- **Structures:** a declassified report whose pages are unredacted one by one; a missing-ingredient file that works
  backwards from the label; an insurance claim where each exhibit contradicts the claimant's statement.
- **Openings:** the evidence bag (one object on a dark-ink ground, the file assembles around it); a fingerprint in huge
  dots that resolves into the product as we pull back; the phone call (a caption bar alone on paper, the file drops in
  after).
- **Endings:** the file goes into a drawer full of identical files; a redacted final page (the answer stays blacked
  out); the stamp misses (it lands on the table, the suspect walks free).

## 12. The product and brand fit
- **The product:** the real photo pinned to the file as evidence (`D.evidence`): an instant-print border, a paperclip,
  an exhibit tag, a flat offset shadow in ink. It is never dotted, printed over or boiled, and a circle or arrow may
  point at its label but never covers it. Show it big at least once (the end card).
- **Brand fit:** label-honest, cheeky or myth-busting brands. Avoid it for
  calm luxury or wellness rituals, where the loud print fights the brand.
