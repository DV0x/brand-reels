# Swiss Motion

> Pure type and flat blocks on a modular grid, in motion: paper, black ink, a very light grey and one signal colour.
> Every element snaps to the grid, every move lands on a beat, and nothing bounces. **Its power for a brand:** it makes a
> formula, a price or a percentage look exact, so a claim reads like a rule.
>
> References (grammar only, never copy): mid-century Swiss and Dutch posters for the grid, flush-left type and scale
> contrast; identity systems in motion for snaps on the beat. Never copy a historical poster's layout or use Helvetica
> or Akzidenz files.
>
> Adapted from lemo-opuscar `styles/swiss-motion/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **Pure 2D graphic design on a grid:** flat paper, black type and bars, a very light grey and **one** saturated signal
  colour.
- **Every element snaps to the grid, every move lands on a beat, nothing bounces.**
- **Rigour with one exception.** The frame obeys a system, so the one element that doesn't becomes the character (in a
  reel: the product, or the one number that breaks the pattern).
- **Extreme scale contrast:** a giant numeral beside tiny technical notes.

Not a keynote (no gradients, glow or device renders). Not kinetic typography (words don't fly or bounce). Not data
visualisation (bars have mass as graphic form, not as charted quantities). Not Halftone Dossier (no dots or stamps).

## 2. Materials and rendering
Everything below is plain Canvas 2D in this skill's runtime (Node and Skia: no browser, DOM, CSS or SVG filters). Every
element is a pure function of t.
- **Frame grid (1080 × 1920):** 4 text columns in the safe box, 168 px wide with 32 px gutters (a 200 px pitch from
  x 120), and a 24 px baseline. Lines are 1 px and run to the frame edges. Columns outside the safe box carry bars and
  bleeds, never words. The frame can act as a stacked spread: a programme page above (numeral, rule text, notes), the
  artifact below.
- **Artifact grid** comes from the content: what columns and rows *mean* is a design decision. Choose modules that give
  elements mass (bars at least 90 px wide). Too many thin columns look like a chart.
- **Surfaces:** page, paper, ink, signal, and grid lines in two or three light greys. No gradients, shadows, particles,
  grain, vignette or blur.
- **Bars and blocks** are flat rects. Consecutive cells of one unit merge into one bar, overdrawn 1 px at the seams.
  Light-grey bars under the black ones give depth without a second colour.

## 3. Colour logic
- **Paper, ink, greys and one signal colour.** Only one thing carries the signal colour, so it is the protagonist and the
  only thing allowed to be inexact. Overprint is allowed (black type on the signal).
- The signal can be red, orange, ultramarine or green. **Take it from the pack's accent colour**, then never add a second.
- Examples: page `#EAE9E5`, paper `#FFFFFF`, ink `#111111`, signal `#E30613`; or `#F2F0EA` / `#141414` / `#FF5A00`.
  Grid lines `#CFCEC9` on the page, `#E2E1DC` on paper.

## 4. Type and captions
One family for the whole film: **Archivo** (SIL OFL), weights 400, 500 and 800.
- **Headlines:** Archivo 800, lowercase allowed, 96 to 150 px, flush left on a column line (x 120, 320, 520 or 720),
  tracking -2%. One to three lines, 2 to 5 words (at 96 px a line holds about 13 characters).
- **Giant numerals:** Archivo 800, 700 to 1100 px for one digit, optically flush left (subtract the left bearing). Two or
  three digits fit the 768 px safe width at 420 to 560 px. A numeral may bleed off an edge.
- **Notes:** Archivo 500, 36 to 40 px, a 1 px rule above (counts, module sizes). Pure texture may be 28 px.
- **Captions are part of the layout, not a bar.** They sit in the caption lane (bottom edge y 1236, left edge x 120, at
  most 660 px wide) as a flush-left block: a 2 px ink rule, an optional grey lead-in (Archivo 500, 40 px), then the
  statement in Archivo 500 at 60 px with the keyword in 800. The words light up as they are spoken: unspoken words at 45%
  ink, and each word wipes up out of a clip rect at its word time.
- **Reading time:** every headline or statement holds at least max(1.8 s, its spoken line + 0.6 s), and about
  (letters ÷ 15 + 1.5) s after it lands.

## 5. Motion quality
- **Two curves only:** cubic-bezier(.7, 0, .2, 1) for snaps; linear for lines being drawn, playheads and the exception.
  No overshoot, spring or bounce.
- **Durations are note values** (at 120 BPM: 1/8 = 0.25 s, 1/16 = 0.125 s). A snap starts one note value early and
  **lands on the beat**.
- **Entrances are wipes or clip-reveals, never fades.** Words rise out of a clip rect from below the baseline (1/16) and
  leave upward (1/8). Lines grow along their length. Big numerals climb in **4 eased steps**, one module at a time.
- **Deletions are knife cuts:** a 2 px line crosses the element in 1/16, then it collapses to its midline in 1/8.
- **Ripples are ordered by distance** from their cause: units re-flow two at a time on sixteenths, nearest first.
- **The exception moves differently:** linear, unsnapped, pausing 1/8 mid-flight, growing as it travels. A readout beside
  it can turn from `col 5.00 row 0.00 · on grid` to a red `off grid`.
- **Smooth 30 fps, no stepping.** Put discrete onsets (a colour change, a hit) on whole frames. At 120 BPM a 1/16 note is
  3.75 frames, so round it the same way every time.

## 6. Camera grammar and the 9:16 page
A 2D camera over a flat page. It moves only with the precise ease and only on beats. A vocabulary, not a route; the
opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked stacked spread | cause (top) → effect (bottom) | a rule applied; a before/after |
| Hard pan or scroll by one page or row | the next step in a system | a sequence; a catalogue; a timeline |
| Rotate 90° and stop | the same thing read another way | a poster as a score; a chart as a map |
| Pull out to a wall of artifacts | one programme, many outputs | a brand system; a product range |
| Push into one module | detail; the unit of the system | a letter; one data point |
| Grid extends past the page | the system is bigger than the artifact | scale; a break from constraints |
| Split frame into equal cells | parallel cases | options; variants |
| Vertical scroll through a column | reading; a list | a spec sheet; a timetable |

Everything sits on the grid. The signal element sits off-grid only while it is the exception. Transitions are wipes,
knife cuts, camera moves and re-flows. No dissolves.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame. Words and key details keep to x 120 to 888,
y 260 to 1580, and left of x 780 below y 1100):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | grid lines, the top of a bar or numeral, a block of signal colour; no words |
| Programme row | y 270 to 410 | rule number and notes at x 120 (Archivo 500, 40 px, 1 px rule above); a counter at x 888 |
| Headline | y 440 to 740, x 120 to 888 | one lowercase headline on a column line, 1 to 2 lines |
| Hero | y 770 to 1580, bleeding past it | a giant numeral, a bar block or the product block. Main shot: from y 440, 780 to 1000 px tall (40 to 52%), the headline cut to one line |
| Caption lane | bottom at y 1560, x 120 to 780 | the flush-left statement block |
| Bottom bleed | y 1580 to 1920 | the lower part of the artifact, grid lines; no words |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music with a grid of its own:** a steady pulse whose subdivisions give the snap durations: a motorik kit and bass,
  minimal techno, marimba or vibraphone patterns, a piano ostinato, a drum machine with a glockenspiel. One instrument
  added per new rule is a clear build. Picture and music can share one data file (a column sets the pitch, a row the
  onset), so a graphic can be the score.
- **Foley follows the materials of print**, dry and close, no reverb: letterpress clack, ruling-pen "tss", guillotine
  snick, paper slap, numeral thunk, block snap, felt thump, rubber stamp. The exception can be the only element that
  sings (a sine glide that follows its position).
- **Silence:** a hard stop of everything on a downbeat, so the next snap reads as an event. Drop the drums for the exception.
- **Voice:** cool and crisp, rule-like sentences. **Mix:** voice 6 dB above the music, music ducked about 10 dB, -14 LUFS.
- **Our presets:** closest is `dossier` (120 BPM, marimba pluck: `groove` is the pulse, `sneak` the exception bar, `drop`
  the silence). Effects: `click`, `tick`, `snap`, `swish`, `thud`, `paper`, `stamp`, `type`. Preset to build: `motorik`
  (straight kick and snare, hats, eighth-note bass, saw arpeggio, glockenspiel, 110 to 125 BPM).

## 8. Native moves
A menu: use the ones the story needs.
- **The grid means something.** Columns and rows become a quantity. *Fits:* a serum's 10 ingredients as 10 columns sized
  by percentage; 30 days of a routine as 30 cells; a coffee's 7 flavour notes as 7 bars.
- **Snap = beat.** Every arrival is a percussion hit. *Fits:* a supplement's feature list; recipe steps; a sale countdown.
- **Programme.** Rules applied one by one to one artifact, then to many. *Fits:* a label redesign; a range of shades; a
  set of flavour tins.
- **Extreme scale contrast.** A giant element as the chapter card. *Fits:* "0 g" added sugar; "99%" natural; a price.
- **The exception.** One element breaks the grid. *Fits:* the one different ingredient; the hero product in a range; your
  pack among competitors.
- **Knife cut.** A line deletes an element. *Fits:* palm oil struck off an ingredient list; a step cut from a routine; a
  fee taken off a price.
- **Re-flow.** Everything rearranges around a change, nearest first. *Fits:* a routine shrinking from ten steps to three;
  a range gaining a flavour; a price list after one fee goes.

## 9. Pitfalls of the medium
- Too many thin columns look like a chart → fewer, wider modules.
- A "better" composition that isn't obviously better → one strong diagonal, a larger signal element, bleeds, type over
  colour. Merely tilting is not enough.
- Merged bars show seams after rotation → overdraw 1 px. `letterSpacing` changes `measureText` → measure after setting
  the font.
- Onsets between frames flicker → whole frames. The photo stretched to a module, or type over its label → keep its aspect
  ratio and build the module around it.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test
each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `snap(t, at, dur)`, `steps(...)` | the precise ease; the stepped climb | cubic-bezier(.7,0,.2,1) by 8 Newton steps; `steps` eases each step on its own |
| `grid(g, cam, o)` | 4 columns of 168 px, 32 px gutters, 24 px baseline | 1 px lines in `#CFCEC9`, one Path2D; each line grows along its length (linear) |
| `clipWord(g, str, x, y, o)` | a word rising from below the baseline, leaving upward | `clip()` to the line box; y offset = (1 − p) × line height |
| `numeral(g, str, o)` | a giant numeral, optically flush left | shift by `actualBoundingBoxLeft`; 4 eased steps of a clip height |
| `bars(g, cells, o)` | flat bars of merged cells (at least 90 px) and the grey second voice | merge neighbours; overdraw 1 px; grey first |
| `knife(g, rect, t, at)` | a deletion | a 2 px line across in 1/16, then `scale(1, s)` about the midline in 1/8 |
| `exception(g, path, t, o)` | the signal element, its readout, the re-flow around it | linear lerp, 1/8 pause; readout Archivo 500 36 px; neighbours sorted by distance, two per sixteenth |
| `photoBlock(g, P, cell, t)` | the product photo as one clean block | paper-white, snapped to whole modules, no shadow; photo at its own aspect |

## 11. Variation space
You decide the system, what the grid means, the exception (or none), the signal colour, the opening and the ending.
Far from the original demo:
- **Structures:** a timetable (a 24-row grid of hours fills with the topic's day, one row per beat); an alphabet (A to Z,
  each letter a module of the topic); a comparison (two systems on a split page until one element crosses the gutter).
- **Openings:** a single dot, then the grid grows from it; the finished artifact, then dismantled into its rules.
- **Endings:** the empty grid after every element is cut away; one word flush left in the corner.

## 12. The product and brand fit
- **The product:** the real photo as one clean block on the grid (`photoBlock`): paper-white, snapped to modules, no
  shadow. It is never stretched, tinted or covered, and type never runs over its label. Show it big once (the end card).
- **Brand fit:** formula-first, label-honest brands (skincare actives, supplements, type-only packs). Avoid warm,
  handmade or festive brands.
