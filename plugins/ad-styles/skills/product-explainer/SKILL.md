---
name: product-explainer
description: Makes 25-45 second vertical explainer reels (Instagram Reels, TikTok, YouTube Shorts) for a D2C brand's product, drawn entirely in code in one of 23 film styles (halftone case file, mid-century cartoon, Swiss motion, data story, isometric, silkscreen, risograph, engraving, block print, paper-cut, watercolor, whiteboard, pixel RPG and more), with the real product photo, a voiceover timed word by word, captions, music and sound. It researches the brand and its customers, writes a hook and script built on a fact the viewer doesn't know, directs the film from a written treatment, and renders the MP4 on this computer. Use it whenever someone wants a reel, an explainer, a short video or a video ad for a product or brand, gives a brand website or product link and wants content from it, or names one of these styles, even if they never say "explainer".
---

# Product explainer

One finished 1080 x 1920 reel with sound, made from a brand's website. Every frame is drawn in code on this computer:
no image generation, no stock footage. The real product photo is cut out and placed inside the style; its label is
never redrawn.

**The film is for the brand's customer**, scrolling with zero interest. Its spine is **a pain the viewer feels → a
hidden fact behind it → the product as the answer**, and it should be worth sending to a friend: the fact fits in one
sentence.

**You are the director.** The style (`styles/<style>/STYLE.md`) fixes the look; the story, the shots, the timing and the
music are made fresh for each film, from a written treatment, before anything is drawn. A film is judged on sound,
rhythm, camera and directing, in that order; good frames are only the start (references/directing.md).

**What's needed:** the brand's website. A Cartesia API key for the voiceover (without one, the film is text-led with
music), or the brand's own recording. A product photo on a plain background (the site usually has one).

## Commands
Every script runs through the plugin's launcher, which sets up Node, ffmpeg and the canvas engine once (about 60 MB,
no admin rights). Don't install anything yourself.
- macOS / Linux: `bash "${CLAUDE_SKILL_DIR}/../../runtime/run.sh" "${CLAUDE_SKILL_DIR}/scripts/<script>.mjs" <args>`
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "${CLAUDE_SKILL_DIR}/../../runtime/run.ps1" "${CLAUDE_SKILL_DIR}/scripts/<script>.mjs" <args>`

Below, `RUN <script> <args>` means that command.

| Script | What it does |
|---|---|
| `site.mjs <url> --out <folder>` | Products, prices, photo sizes, fonts, colours and some of the brand's own copy, into `site.json` |
| `site.mjs <url> --product <handle\|n\|url> --out <project>/product/raw` | That product's photos at full size, its description, any reviews on the page |
| `cutout.mjs <photo> --out <project>/product/main.png [--crop x0,y0,x1,y1] [--box]` | Cuts the product out of a plain background; saves a check image and a report |
| `fonts.mjs "<Family>:<weights>" ... --out <project>/fonts` | Downloads a style's Google Fonts (SIL OFL) as files the renderer can use |
| `voice.mjs --voices "<words>"` | Lists Cartesia voices ("indian english", "hindi", "warm female") |
| `voice.mjs <project> [--words] [--key-file <.env>]` | The voiceover and the film's clock (`vo/timing.json`), with each line placed on the music grid; `--words` prints word times |
| `render.mjs <project> frame <t> [<t>...] [--crop x,y,w,h]` | Single frames as PNG; `--crop` also saves a 100% crop |
| `render.mjs <project> contact [--every 1]` | The whole film on one sheet, one frame every second |
| `render.mjs <project> strip <from> <to> [--step 0.2]` | One key action, frame by frame |
| `render.mjs <project> sheet` | One finished frame per voice line with its words (the sheet a user approves) |
| `render.mjs <project> check` | The machine checks: text size, safe zone, reading time, contrast, still moments, hits on the beat |
| `render.mjs <project> video` | The MP4 with sound, subtitles (`.srt`), a cover frame and `out/report.json` |

Add `--estimate` to `render.mjs` to time the lines from the text before the voice exists, and `--debug` to see the
safe zone.

## The workflow
Copy this checklist into your reply and tick it off. There are two approvals: the script (always) and the look (when
the user wants to see it first).

```
Explainer progress:
- [ ] 1. Website and research (research.md)
- [ ] 2. One round of questions: product, topic, style, see the look first?, photo, voice
- [ ] 3. Script as text (APPROVAL 1)
- [ ] 4. Product cut-out and voice takes
- [ ] 5. Treatment, before any drawing: benchmark, three structures, shots, cue map, sounds
- [ ] 6. Style frames and design review rounds (APPROVAL 2 if asked)
- [ ] 7. The film: lines on the grid, every scene, the score, a sound per action
- [ ] 8. Review loop: checks, two contact sheets, strips, the video
- [ ] 9. Deliver
```

**1. Website and research** (about 20 tool calls; read [references/research.md](references/research.md)). Ask for the
website and where to save the work if you don't have them. `RUN site.mjs <url> --out <brand>-research`, read two or
three of their pages, and find what customers say and the facts they don't know. Write `research.md`.

**2. Questions** (one round; AskUserQuestion if available). Ask:
- **Which product**, if several fit (your pick first).
- **Which topic**: 2 or 3 options, each a viewer's pain or habit, its hook, and the hidden fact the product answers.
  Write them by [references/copy.md](references/copy.md); show only hooks that pass its tests. The bar is
  [references/benchmarks.md](references/benchmarks.md): pick 1 or 2 entries before you write.
- **Which style**: recommend 2 or 3 from the menu below, one reason each. The style sets the look, not the story.
- **The look first:** do they want to see three finished style frames before the film? (Recommend yes for a first film.)
- **The product photo:** the site's (say its size), or a current one they send.
- **The voice:** a Cartesia voice you'll suggest, or their own recording.
- **A post or an ad:** a post by default; an ad keeps words out of the bottom 35% (`"placement"` in `script.json`).
Also ask, in one line: "What do customers ask you or complain about most?" Then decide every other gap yourself.

**3. The script, as text** (APPROVAL 1). Write it by [references/copy.md](references/copy.md): the hook's four beats, a
table `# | voice | on screen | beat note`, a facts list with sources, the story shape you used (PAS by default), and the
length. Run copy.md's self-check first. Don't draw anything before the OK.

**4. Product and voice.** Read [references/product.md](references/product.md). Cut the photo out and look at the check
image. Pick a voice that fits the brand (`voice.mjs --voices`), set it in `script.json`, `RUN voice.mjs <project>
--words`: the takes and every word's time, which the cue map needs. No key: ask once for a key or a `.env` path;
otherwise render with `--estimate`.

**5. Treatment, before any drawing.** Read [references/directing.md](references/directing.md) and the style's
`STYLE.md` in full. Write `TREATMENT.md`: a benchmark (what to learn, what not to take), three candidate structures and
the pick with reasons, the logline and arc, the shot list with a reason for every shot, a second-by-second beat sheet,
the cue map (tempo, where each line sits on the grid), the sound table, the caption design, and where the product
appears. Start from the topic's fact: the first idea a style suggests is usually its cliché.

**6. Style frames and design review.** Set `"style"` in `script.json`, get any fonts the style doesn't bundle
(`fonts.mjs`; a style with a drawing kit bundles its own), and copy
`templates/film.mjs` to `<project>/film.mjs`. Write its timeline from the cue map, then finish three scenes first: the
signature shot, the product's shot and one more. A style with a drawing kit (`engine.mjs`, its STYLE.md section 10)
gives you its parts; a rules-only style needs its primitives built first ([references/craft.md](references/craft.md),
section 6). Render the three frames, check them against craft.md's checklist and the STYLE.md, fix and render again,
and write each round in `REVIEW.md` until a round finds nothing. If the user asked to see the look, show the frames
with their lines now (APPROVAL 2). API: [references/film-api.md](references/film-api.md).

**7. The film.** Place each voice line on the grid in `script.json` (`at` and `anchor`) and run `voice.mjs` again
(voiced lines cost nothing). Write every scene in the treatment: each action on its spoken word or the grid, never a
typed time; one subject that changes rather than a new scene per line; nothing on screen the treatment didn't ask for.
Compose the score from the cue map (`music.score`), declare the big hits (`hits`), and give every visible action a
sound. How: [references/film-api.md](references/film-api.md) (placing lines, the score, the kit); why:
[references/directing.md](references/directing.md) sections 6 to 9 (sound, rhythm, camera, performance).

**8. Review loop** ([references/directing.md](references/directing.md) section 11; the checklist is
[references/craft.md](references/craft.md) section 8). `RUN render.mjs <project> check` and fix every issue until it
prints PASS. Then `contact` (one frame per second) and look at every frame against the checklist; `strip` every key action at 0.2 s; fix and repeat, at least
two full passes, each written in `REVIEW.md`. Then `RUN render.mjs <project> video` (a few minutes), read
`out/report.json` (loudness, frozen frames, decode errors) and pull 4 or 5 frames from the MP4. You can't hear the film:
say so, and ask the user to watch it once with sound.

**9. Deliver:** the MP4 path, length and size; the subtitles, cover, `TREATMENT.md` and `REVIEW.md`; one line on what
the film does; a post caption in the brand's voice; anything you weren't sure of (a claim, the photo's age, a
pronunciation). If the user isn't the brand, say the post should be labelled as a concept or spec video. Don't post
anything yourself.

## The styles
Each folder holds `STYLE.md`: the style's look with numbers (materials, colour, type and captions, motion, camera and
the 9:16 page, sound, native moves, pitfalls, its drawing kit, variation space, the product and brand fit). It has no
story: that comes from your treatment. Read only the one you use.

| Style | Best for | Status |
|---|---|---|
| [Halftone Dossier](styles/halftone-dossier/STYLE.md) | myth-busting, label honesty, hidden facts | drawing kit |
| [Mid-century Cartoon](styles/midcentury-toon/STYLE.md) | how to use it, rituals, step by step | rules |
| [Swiss Motion](styles/swiss-motion/STYLE.md) | formulas, percentages, prices as a poster | rules |
| [Data Storytelling](styles/dataviz/STYLE.md) | one number or chart that changes | rules |
| [Isometric Infographic](styles/iso-infographic/STYLE.md) | process, supply chain, scale | rules |
| [Silkscreen Poster](styles/silkscreen-poster/STYLE.md) | drops, variants, origin | rules |
| [Risograph](styles/risograph/STYLE.md) | blends, flavour drops, zine energy | rules |
| [Copperplate Engraving](styles/engraving/STYLE.md) | the active ingredient as a specimen | rules |
| [Sci-fi Hologram HUD](styles/hologram-hud/STYLE.md) | specs, layers, what's inside | rules |
| [Dark Tech Keynote](styles/dark-keynote/STYLE.md) | one big number, launches | rules |
| [Living Screencast](styles/living-screencast/STYLE.md) | the brand's own site or app, reviews | rules |
| [1930s Rubber Hose](styles/rubber-hose/STYLE.md) | a problem as a villain, slapstick | rules |
| [Sci-fi Sitcom Toon](styles/scifi-toon/STYLE.md) | characters, dialogue, a running joke | rules |
| [60s Spy Titles](styles/spy-titles/STYLE.md) | teasers, secret recipes, restocks | rules |
| [Art Deco](styles/art-deco/STYLE.md) | premium launches, gifting | rules |
| [One-line Drawing](styles/one-line/STYLE.md) | the problem turning into the product | rules |
| [Watercolor](styles/watercolor/STYLE.md) | botanicals, softness, seasons | rules |
| [Whiteboard](styles/whiteboard/STYLE.md) | the science behind one claim, myth vs fact | rules |
| [Block Print](styles/block-print/STYLE.md) | origin, craft, festive series | rules |
| [Paper-cut (Sanjhi)](styles/papercut/STYLE.md) | festivals and gifting | rules |
| [Pictogram Motion](styles/pictogram-motion/STYLE.md) | one product, many uses; diet labels | rules |
| [16-bit Pixel RPG](styles/pixel-rpg/STYLE.md) | results over time, routines as quests | rules |
| [Glass Product (3D)](styles/glass-product/STYLE.md) | what's inside a bottle | not available yet |

"Drawing kit" styles have tested code for the style's parts (texture, type, props, captions, transitions, the product
treatment); every film still writes its own scenes from its treatment. "Rules" styles are built from their `STYLE.md`
in the project; expect more time on the first film. Glass needs a 3D renderer this runtime doesn't have: say so and
offer Dark Tech Keynote or Hologram HUD.

## References
- [references/research.md](references/research.md): what to find, where, and when to stop
- [references/copy.md](references/copy.md): topics, the hook, story shapes (PAS, BAB, FAB), the script format
- [references/benchmarks.md](references/benchmarks.md): elite hooks and brand films, checked, with sources: the bar
- [references/directing.md](references/directing.md): the method: benchmark, story, treatment, style frames, sound, rhythm, camera, the review loop
- [references/craft.md](references/craft.md): the design rules every style shares, and how to build a style's primitives
- [references/product.md](references/product.md): getting, cutting out and placing the product photo
- [references/film-api.md](references/film-api.md): `script.json` (lines on the grid), `film.mjs`, a style's kit, the score, the kit

## Rules, with the reason for each
- **Write for the stranger scrolling past.** They know nothing about the brand and owe it nothing, so every line must
  earn the next second (copy.md).
- **Build the film on a true fact the viewer doesn't know.** Facts are what make people stop and share; a slogan isn't
  one. Every claim needs a source in `research.md`, and only facts from the script's facts list go on screen.
- **The story comes from the topic, the look from the style.** A style's familiar structure is its cliché; a film that
  started from its fact beat one that replayed the style's demo (directing.md, section 1).
- **Write the treatment before drawing anything.** A plan with a benchmark and three compared structures finds the one
  picture that carries the film; drawing first finds the first idea.
- **Nothing on screen that the treatment didn't ask for.** Empty ground is part of the design; texture and props added
  to fill space read as clutter on a phone (craft.md).
- **Draw every element in the style.** A filter over a scene reads as clip-art; the style's rules say how each shape,
  word and transition is made (STYLE.md, craft.md).
- **The product is the real photo,** cut out and placed by the style's product rule. Generated or redrawn labels come out
  garbled, and the label must stay readable and uncovered.
- **The music grid comes first, the voice sits on it, and every action is timed to a word or a beat.** A film timed by
  hand drifts from its voice and feels like a slideshow (directing.md).
- **Review in rounds, in writing,** until a round finds nothing. The checks catch readability, not design; only looking
  at every frame does (directing.md, section 11).
- **Get the script approved before drawing.** Changing words after the art is built wastes most of the work.
