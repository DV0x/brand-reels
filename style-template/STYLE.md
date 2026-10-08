# Style Name — Style Prompt

> One or two sentences: what the medium is and what it does on screen. No demo title, no story.
> References (grammar only): films, artists or traditions to learn the grammar from, and what to take from each. Never copy their characters, layouts, typefaces or music, and never name them in the film.

<!--
How to fill this template (delete this comment). Adapted from lemo-opuscar's styles/_template/STYLE.md (MIT).
- If lemo-opuscar has this style, copy its STYLE.md word for word (sections 1 to 11 and its named references), then
  add only the marked notes below and section 12. Check that every line and number of its sections 1-9 and 11 survives.
- This file holds only what stays true for EVERY film in this style: look, material, colour logic, type, motion
  quality, camera vocabulary, sound palette, the medium's native moves and pitfalls. 6–14 KB.
- No story, arc, beat-by-beat shot table, prescribed opening or ending, score arc, BPM or key, test-film durations,
  palette or props. This skill ships no example films: the test film and its notes stay in the owner's work folder.
- A number measured in the test film becomes a rule here ("the subject fills ≥ 1/3 of the frame").
- Write rules, not history. "Pitfalls" are pitfalls of the medium, not of one prop.
- Section numbers are fixed: other guides refer to them.

The marked notes (ours). Each is a blockquote that starts "> **For 9:16 reels: <topic>.**", placed at the end of its
section. Add only these, and only where lemo's text needs them:
  - section 4, the captions: the caption design, at least 56 px, on the caption lane (organic: bottom at y 1560 from
    x 120, at most 660 px wide; ad: y 1236); headline sizes for a 1080-wide frame; statements replace captions.
  - section 5, 30 fps: the render is 30 fps; the music grid lands on whole frames (75, 90 or 150 BPM).
  - section 6, the phone page: the picture fills 1080 × 1920; words keep to the safe box; the subject is at least a
    third of the frame height at key moments; the zone table (top band, HUD or title, headline, hero, caption, bottom
    band); no filler in the bands.
  - section 10, the drawing kit: replaces lemo's engine text; names engine.mjs, points to film-api.md (its own
    section), lists the bundled fonts.
  - section 11, the length: about 30 s (25 to 35), and how much of the style fits in it.
-->

## 1. Essence, and what it is not

What makes a frame read as this style in one glance (3–5 defining traits). Then the styles it is easily confused with and the line between them ("not a keynote, not a blueprint, not a product render").

## 2. Materials & rendering

The physical medium and how code imitates it: surfaces, marks, layers, edges, texture, light. Name the rendering model (layers, blend modes, noise, stepping of marks). Say which effects must be procedural and anchored to the world, and which live in screen space.

## 3. Colour logic

Rules, not a palette: how many hues, what the neutral ground is, what the accent is reserved for, how values are ordered, what may never be coloured. Give one example palette at most, marked as an example.

## 4. Type & subtitles

Typefaces (licence-free), roles (title, subtitle, micro data), sizes as ranges, how subtitles belong to the world of the style (inscription, caption, HUD plate…), reading-time rule: hold ≥ max(1.8 s, speech + 0.6 s).

> **For 9:16 reels: the captions.** …

## 5. Motion quality

Frame rate and stepping (on ones / twos, what boils), easing families, weight, jitter, how things appear and disappear. What never moves.

> **For 9:16 reels: 30 fps.** …

## 6. Camera grammar

A vocabulary, not a route: the moves this medium does well, what each expresses, and a few kinds of moment it can serve. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| e.g. slow lateral pan | … | a journey; a list; time passing |
| e.g. locked frame | … | a decision; a reveal; reading time |
| e.g. push-in | … | tension; the one detail that matters |

No row names the single move for an opening, a climax or an ending. Framing rules that always hold (subject size, safe areas, where text lives). Allowed and forbidden transitions.

> **For 9:16 reels: the phone page.** …

## 7. Sound palette

Instruments and timbres, articulations, tuning or mode families, foley materials (what the style's matter sounds like), ambience, silence as a tool (what it may contain, how it is cut), mix character (ducking, loudness −14 LUFS), voice character. A technique may be written as one option ("divide the beat to accelerate instead of changing tempo"). No score arc, no section sequence, no BPM or key.

## 8. Native moves

A menu of moments only this medium can do: use the ones your story needs. For each: what it is, how to build it, and **fits content like…** with three or more examples.

- **Move name.** What it does on screen. *Fits content like:* a …; a …; a ….

## 9. Pitfalls of the medium

Mistakes that come from the medium itself, each with its fix.

## 10. Engine

> **For 9:16 reels: our drawing kit.** `engine.mjs`, loaded as `K.style` when `script.json` names this style. Every call
> and option: film-api.md, section <n>. Fonts bundled in `fonts/`: …

## 11. Variation space

What the agent decides for each film (structure, characters, opening, ending, camera path, pacing, palette within the colour logic). Then, one line each: **three structures**, **three openings** and **three endings**, to show the range.

> **For 9:16 reels: the length.** …

## 12. The product and brand fit

- **The product:** how the real product photo appears in this style (cut out, never redrawn or filtered, in the `over`
  layer, label uncovered, shown big at least once, never bigger than its photo).
- **Brand fit:** the brands and messages it suits, and the ones where it fights the brand.
