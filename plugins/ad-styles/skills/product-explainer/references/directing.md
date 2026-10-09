# Directing: from the approved script to a film

You are the director, not a tech demo. A film is judged in this order: **sound, rhythm, camera, directing**
(performance, staging, the emotional arc). Good-looking frames are only the starting point.

Adapted from lemo-opuscar's `DIRECTOR.md` (MIT, © 2026 LemoLab), the method behind their style films, with three changes
for this skill: the script is written and approved first (copy.md), the real product photo appears in the film, and the
frame is a phone (1080 × 1920). Licences: `THIRD-PARTY-NOTICES.md` at the plugin root.

## Contents
1. What is fixed and what is yours
2. Find a benchmark first
3. Shape the story
4. Write the treatment
5. Prove the look: style frames and design review
6. Sound is half the film
7. Rhythm: the music grid comes first
8. Camera and the 9:16 frame
9. Performance
10. The failures seen most
11. The review loop, before delivery
12. Deliver, and keep the brand's memory
13. Changes after delivery

## 1. What is fixed and what is yours
- **The style's `STYLE.md` is fixed:** its look, colour, type, motion, camera grammar, sound palette, native moves and
  pitfalls. Keep all of it.
- **The approved script's words are fixed.**
- **Everything else is yours to direct from the topic:** the staging, structure, subjects, settings, shots, timings,
  references, and how a number or a fact is shown.
- **There is no ready-made film.** Each film's scenes are written from its own treatment, into `templates/film.mjs`.
- **Never bend the topic toward a style's cliché.** The first idea a style suggests (a mugshot, three exhibits and a
  verdict in a case file; a recipe card in a cartoon) is usually its cliché. Start from the topic's fact and ask what
  picture makes that fact obvious.

## 2. Find a benchmark first
Before writing anything, pick one or two reference works (films, title sequences, ads, games) that set the bar for
**this style and this topic**. They are your choice, made for this film; [benchmarks.md](benchmarks.md) lists
checked, elite brand films and reels, so use one when it fits. Write down:
- **What to learn:** composition, pacing, camera grammar, colour logic, score structure.
- **What not to take:** characters, designs, melodies, specific shots, logos, fonts.

The benchmark lifts quality more than any rule below.

## 3. Shape the story
- **One subject, one goal, one turn.** In a product reel, the subject is usually the viewer's own thing or the product;
  the goal is the hidden fact; the turn is the product as the answer (copy.md: pain → hidden fact → product).
- **One subject that changes beats a new scene per line.** Let one thing carry the film and change with the story (a
  glass that fills, a label that gets marked up, a map that grows), across most of its lines.
- **Hook in the first 3 seconds.** Frame 0 is already a finished, composed frame: it is the cover in the feed. Every
  headline on it is fully printed at frame 0 (film-api.md, `D.headline`).
- **An ending that echoes.** Bookend the opening, reveal the scale, or let the viewer do the thing right the second time.
- **One native move:** a moment only this medium can do (STYLE.md section 8 lists the style's; pick or invent the one
  your story needs). Put it at the emotional peak.
- **The picture proves the fact:** a number of things is shown as that many things, not as a label with
  the number. Only facts from the
  script's facts list go on screen; an illustration is labelled as one.
- **Cut the extras.** One gag the audience reads at thumbnail size beats three they can't. If a beat needs explaining,
  remove it.

## 4. Write the treatment
Write `TREATMENT.md` in the film folder after the script is approved and `BRIEF.md` is saved, and before drawing
anything:
1. **Three candidate structures**, a few lines each (a single journey, a before and after, a countdown, a list that
   turns, a fill-in-the-blank...), then the one you chose and why. Choose the opening image, the ending and the shape of
   the score from the topic too. Say why you rejected the other two.
2. **Logline and arc:** one sentence, then setup → turn → ending.
3. **Benchmark:** learn / don't take (section 2).
4. **Shot list:** for every shot, the framing (wide, full, medium, close, insert), angle, camera move, duration, and
   **why** it is shot that way.
5. **Beat sheet,** second by second: the voice, the picture, the sound.
6. **Cue map:** the tempo, the bar grid, where each voice line is placed (its anchor word on the grid), the instruments
   per section, and the beat every cut, key action and caption lands on (section 7).
7. **Sound design table:** for each section, the ambience bed, the main foley and the music state.
8. **Caption and title design:** the type is part of the style.
9. **The product:** where the real photo appears, how big, what sits beside it, and that nothing covers its label.

## 5. Prove the look: style frames and design review
- **Three style frames from the film,** drawn with the film's real code, not a mock-up: one is the signature shot, one
  shows the product. Finish those scenes first, then render them (`render.mjs <film> frame <t>`).
- **Review them in rounds, and write each round in `REVIEW.md`:** what you saw, what you changed. Look at full size and
  at phone size. Fix and render again until a round finds nothing. Expect several rounds: labels touching, a stamp
  too pale, a prop that reads as something else.
- **Check every frame against the design checklist** (craft.md section 8) **and the STYLE.md** (materials, inks, type,
  pitfalls): one subject with empty ground around it, a clear order from top to bottom, colours with jobs, three text
  sizes at most, one texture field at most and only with a job, nothing the treatment didn't ask for, nothing touching
  or crowding, every shape reading as what it is.
- **If the user asked to see the look first,** show the frames with their lines and wait for the OK.
  Otherwise don't stop.

## 6. Sound is half the film
- **Every visible action has a sound,** matched to the material: paper, stamp, ink, glass, steel, a wrapper.
- **Three layers:** ambience (a room tone, a hum), foley (tied to actions) and music. The voice is the loudest; the
  music ducks under it.
- **At least two real silences,** or near-silences, before the turn and the emotional peak. The first sound after a
  silence should be one of the most important sounds in the film.
- **Sound as a transition, at least twice:** bring the next scene's sound in before the cut, or let the last scene's
  sound run over it.
- **Compose the score from the cue map** (`music.score`, film-api.md) in the style's sound palette (STYLE.md section 7):
  no generic piano and strings, and a preset only for a first draft. The score can carry the story's shape too: a
  motif that changes, thins out or completes at the turn.
- **Mastering is automatic:** −14 LUFS, true peak ≤ −1 dB.

## 7. Rhythm: the music grid comes first
- **Write the cue map before animating.** The picture locks to the grid, and the check verifies every declared hit
  (`hits`) lands on it.
- **Pick a tempo whose 16th notes fall on whole frames** at 30 fps: 75, 90 or 150 BPM (6, 5 or 3 frames per 16th).
- **Place the voice on the grid.** In `script.json`, give each line an `at` (seconds) and an `anchor` word that should
  land on the grid, then run `voice.mjs` again (cached lines cost nothing; `--words` prints every word's time inside its
  take, for planning). Leave gaps between lines so each caption can hold its line + 0.6 s.
- **Vary the pace:** alternate fast and slow, include one clear acceleration or deceleration, and give the audience one
  breath (a long take or a held pause). A film at one even speed has failed.
- **One action, one sound, one cut,** but don't cut on every beat. Leave time to see.
- **Pace for the viewer, not the clock:** a caption holds at least max(1.8 s, its spoken line + 0.6 s); text holds about
  (letters ÷ 15 + 1.5) s after it lands; gags and failures hold long enough to be understood. Make it fast with fewer
  words on screen, not by cutting before people finish reading.
- **Every action time comes from a word or the grid** (`T.word`, `G.snap`), never a typed guess, so a re-placed line
  re-times its scene.

## 8. Camera and the 9:16 frame
- **Every shot needs a reason** (the treatment says it). Use at least **four different camera moves** and real changes
  of framing: push, pull, pan, tilt, snap zoom, shake, a frame within a frame, a page turn.
- **One signature shot** people remember: a oner (one long move with no cut), a scale reveal, a transition made from
  the medium itself.
- **Transitions are made inside the medium,** as one consistent grammar (a dot wipe, a page turn, an ink pull). A hard
  cut is the contrast tool, on a big hit. No dissolves.
- **The subject fills at least a third of the frame height** at key moments, with clear staging and a readable
  silhouette.
- **One world → screen function.** Anything that follows a subject (a ring, a label, a zoom target) goes through the
  camera (`K.toScreen`), never hand-typed screen coordinates.
- **Compose the tall frame around one big subject,** like a printed page and not a filled one: at least a third of the
  frame's height at key moments, centred on the safe box, running into the bottom band when it is big. A clear order
  from top to bottom: the HUD or headline, the subject, the caption just above the app's own text. Words keep to the
  safe box (craft.md section 3); the picture uses the whole frame. Empty ground around the subject is design; a third
  of the frame left empty is not. Never add props, dot fields or texture just to fill space.

## 9. Performance
- **Anticipation, action, follow-through** on every meaningful move: a small wind-up, the move, a settle. Landings
  squash and keep their volume.
- **Motion continuity:** blend every pose with keys and easing; never switch a pose inside an `if`, except a deliberate
  one-frame comic pop. A rolling object turns by distance ÷ radius. A held object sits between the palms.
- **Check every expression and every key action at final size,** stepping through it at 0.2 s (`render.mjs strip`).

## 10. The failures seen most
- The subject too small, too far away, or pushed against the frame's edge.
- Too dark to read, or a colour on the same colour (gold text on gold dots).
- Captions or the app's buttons covering the subject or the product's label.
- A gag or a reveal too fast to understand.
- Blank frames in a transition; a wipe that doesn't fully cover at the cut.
- A timed effect (a ring, a zoom, a follow) that stops tracking its subject after the camera moves.
- **A new scene for every line:** an animated slideshow.
- **A filled frame:** a texture field on every scene, props in the empty bands, decoration along the bottom. On a phone
  it reads as clutter, with no design language.
- **A small subject in the top two-thirds and an empty bottom third:** the words' safe box treated as the picture's.
  Only words keep out of the bands.
- **A pointer with no label:** an arrow on a printed number makes the viewer guess why it is there. Every arrow, ring
  or bracket says, in a word or three, what it shows.
- **The style's apparatus with no job:** a case number or a file tag on every frame reads as decoration. Keep a tag
  only when it tells the viewer something (A TYPICAL BRAND: this is not a real one).
- **The style's cliché instead of the topic's idea:** a film that replays the style's familiar structure (a case
  file's mugshot, exhibits and verdict) loses to a film that starts from the fact.

## 11. The review loop, before delivery
**By script:** `RUN render.mjs <film> check`, fix every issue, and run it again until it prints PASS (exit 0). What each
check measures: [tools.md](tools.md), section 6. Treat its warnings as issues too: a film outside 30 to 35 s goes back
to the script, not to the timing. The video adds: a full decode with no errors, no frozen stretch of 0.4 s or more, and
loudness within 1 LU of −14.

**Small images first.** Review on contact sheets and strips (each frame is 270 × 480 there): that is enough to judge
story order, layout and motion. Open a full-size frame, or a 100% crop (`frame <t> --crop x,y,w,h`), only for a detail
you can't judge small: a label's edge, a thin line, the product's print. Every full-size image you look at stays in your
memory for the rest of the film.

**By eye, in rounds written in `REVIEW.md`:**
1. **Contact sheets of the whole film,** one frame per second (`render.mjs contact`), at least two full passes: story
   order, every text readable, nothing crowding, the design checklist on every frame.
2. **Strips at 0.2 s for every key action** (`render.mjs strip <from> <to>`): hops, stamps, landings, cuts, the hand-off
   of one shot to the next.
3. **After the video:** pull frames from the MP4, read `out/report.json`, and check that every row of the sound table is
   in the mix.
4. **Watch it once at full speed with sound.** If you can't, say so, and ask the user to watch it before it goes out.

The film is ready when a full round finds nothing to change.

## 12. Deliver, and keep the brand's memory
Write these in the film folder from the templates (`templates/CREDITS.md`, `templates/DELIVERY.md`):
- **`CREDITS.md`:** every font (family, licence, where from), the voice (Cartesia, the voice's name and id), the music
  and effects (made in code by this skill), the product photo (where it came from, and its date if known), any other
  picture, with its licence. Nothing goes in the film without a line here.
- **`DELIVERY.md`:** the MP4 path, its length and size, the cover and the subtitles; one line on what the film does; a
  post caption in the brand's voice; the benchmark you used; the check result and the loudness; **what you could not do,
  and why** (a shot you cut, a check you could not run, something you could not hear); anything you were not sure of (a
  claim, the photo's age, a pronunciation); and the one command that renders it again
  (`RUN render.mjs <film> video`). If the user is not the brand, say the post must be labelled as a concept or spec
  film. Don't post anything yourself.
- **The brand's memory** (in the brand folder, one level up): add this film's lessons to `LEARNINGS.md` (what worked,
  what the user changed, what to avoid next time; dated, short). Update `BRAND.md`: the facts used and their sources,
  the film made, its style and topic, and the user's verdict when you have it. The next film for this brand reads both
  first and skips the questions they answer.

Then tell the user where the film folder is, and ask them to watch the film once with sound before it goes out.

## 13. Changes after delivery
Changes happen in a **new chat**, so the old film's images and tool output don't fill the new agent's memory. The new
chat reads, in order: `BRIEF.md`, `TREATMENT.md`, the last round of `REVIEW.md`, `DELIVERY.md`, then the user's notes.
- Notes about the words go back to the script: show the changed lines for approval, update `BRIEF.md`, run `voice.mjs`
  again (only changed lines cost anything).
- Notes about the look, the timing or the sound are directing: change `film.mjs`, and write the round in `REVIEW.md`
  (the note, your reading of it, what you changed).
- A vague note gets your best reading, stated in one line when you show the result; ask only when two readings would
  lead to different films.
- **Keep the delivered version** before the first new render: copy the MP4, its `.srt`, `cover.jpg` and
  `report.json` with a `-v1` suffix (a render overwrites them).
- When shots or staging change, update `TREATMENT.md` too: the next chat reads it first.
- Run the whole review loop (section 11) again before the new delivery, and add the lessons to `LEARNINGS.md`.
