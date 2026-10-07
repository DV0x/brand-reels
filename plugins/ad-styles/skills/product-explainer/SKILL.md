---
name: product-explainer
description: Makes a 25-45 second vertical explainer video (Instagram Reels, TikTok, YouTube Shorts) for a D2C brand's product, drawn entirely in code with the real product photo cut in, a voiceover, captions, music and sound. Use when someone asks for an explainer video or reel for a product or brand, a video that explains how or why a product works, or gives a brand website or product link and wants a video for it.
---

# Product explainer

Makes one finished 1080 x 1920 explainer with sound, from a brand's website. Everything is drawn in code on this computer:
no image generation, no stock footage. The real product photo is cut out and pasted into the drawn world, and its label is
never redrawn.

**What's needed:** the brand's website. A Cartesia API key for the voiceover (without one, the film is text-led with music).
A product photo on a plain background (the site usually has one).

**The flow has six steps and two approvals: the script (always) and the contact sheet (if the user wants it).**

## Commands
All scripts run through the plugin's launcher, which sets up Node, ffmpeg and the canvas engine once (about 60 MB, no admin
rights). Never install anything yourself.
- macOS / Linux: `bash "${CLAUDE_SKILL_DIR}/../../runtime/run.sh" "${CLAUDE_SKILL_DIR}/scripts/<script>.mjs" <args>`
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "${CLAUDE_SKILL_DIR}\..\..\runtime\run.ps1" "${CLAUDE_SKILL_DIR}\scripts\<script>.mjs" <args>`

Below, `RUN <script> <args>` means that command.

| Script | What it does |
|---|---|
| `site.mjs <url> --out <project>` | Products, prices, photo sizes, fonts, colours and some of the brand's own copy, into `site.json` |
| `site.mjs <url> --product <handle\|n\|url> --out <project>/product/raw` | That product's photos at full size, its description, any reviews printed on the page |
| `cutout.mjs <photo> --out <project>/product/main.png [--crop x0,y0,x1,y1] [--box]` | Cuts the product out of a plain background (`--box` for flat, boxy packs); saves a check image and a report |
| `voice.mjs --voices "<words>"` | Lists Cartesia voices (e.g. "indian english", "hindi", "warm female") |
| `voice.mjs <project> [--key-file <.env>]` | The voiceover and the film's clock (`vo/timing.json`), one word timestamp per word |
| `render.mjs <project> frame <t> [<t>...] [--crop x,y,w,h]` | Single frames as PNG, to look at while building; `--crop` also saves a 100% crop |
| `render.mjs <project> sheet` | The contact sheet (one finished frame per beat, with its voice and on-screen words) plus QA |
| `render.mjs <project> video` | The MP4 with sound, plus `out/report.json` |

Add `--estimate` to `render.mjs` to time the lines from the text before the voice exists. Add `--debug` to see the safe zone.

## Step 1. The website
Ask for the brand's website (or a product link) if you don't have it, and where to save the work (default: the current
folder). Make the project folder `<brand>-<product>-explainer/` once the product is known; until then work in `<brand>-research/`.

## Step 2. Research (about 20 tool calls, no more)
Read `references/research.md` first. In short:
1. `RUN site.mjs <url> --out <folder>` for the products, fonts, colours and a first sample of their words.
2. Read two or three of their own pages with WebFetch (About, FAQ, a product page) for their voice and their facts.
3. Find what customers actually say: reviews (marketplaces, the product page, Google), questions, complaints, habits,
   in their words. WebSearch "<brand> <product> reviews", "<product type> problem", Reddit threads.
4. Write `research.md`: products worth explaining, their voice card, customer language with sources, usable facts with
   sources, and 2 or 3 topic ideas.

## Step 3. Questions (one round)
Use AskUserQuestion if it's available, otherwise a short numbered list. Ask:
- **Which product** (if several fit), with your recommendation first.
- **Which topic**, 2 or 3 options. Each one is the viewer's problem or habit, its hook (first frame, on-screen text, and
  the voice's four beats), and the brand fact that answers it. Write them by `references/copy.md` and show only hooks that pass its tests. Recommend one.
- **The contact sheet:** do they want to see one before the video renders? (Recommend yes for the first video.)
- **The product photo:** use the one from the site (say its size), or will they send a current one on a plain background?
Also invite, in one line: "What do customers ask you or complain about most?" Their DMs beat any review site.
If the topic they pick needs more customer language, do up to 5 more searches on it.

## Step 4. The script, as text (approval 1)
Write it by `references/copy.md` and plan the film by `references/story.md`. Show the user:
1. **The hook, 0 to about 9 s:** the first frame's action, the on-screen text, and the voice's four beats (subject, setup,
   turn, rehook).
2. **A table:** `# | voice | on screen | what happens` (what happens is the action, not a description of a poster).
3. **Length** in words and seconds, and the claim sources.

Run the self-check in `copy.md` before showing it. Wait for an OK or edits. Don't draw anything before the OK.

## Step 5. Build
1. **Project:** copy `${CLAUDE_SKILL_DIR}/templates/film.mjs` and `templates/script.json` into the project folder. Fill
   `script.json` (format in `references/film-api.md`).
2. **Product:** `RUN site.mjs <url> --product <handle> --out <project>/product/raw`, pick the front packshot on a plain
   background, then `RUN cutout.mjs <photo> --out <project>/product/main.png`. Read the report and LOOK at the check image.
   Fix what it flags (`references/product.md`). Never use a cut-out you haven't looked at.
3. **Voice:** pick a voice that fits the brand and audience (`voice.mjs --voices ...`), set `voice.id`, then
   `RUN voice.mjs <project>`. No key: ask once for a key or a `.env` path; if there's none, say the film will be text-led
   and render with `--estimate`.
4. **Film:** read `references/craft.md` first, all of it. Choose the medium from the brand's world and write down how
   it's physically made and where the light is. Write `film.mjs` with the kit (`references/film-api.md`): the world in
   `draw`, made in the medium (`look`), and the product and words in `over`, crisp. The picture fills the whole frame.
   **Build the hardest beat to final first** and check it on 100% crops (`frame <t> --crop`) against the bar in
   `craft.md`. Then build the rest shot by shot, rendering frames at key moments and looking at them. Fix crowding,
   unreadable text, a product too small or covered, anything static, anything that looks like clip-art.
5. **QA:** `RUN render.mjs <project> sheet` (one finished frame per beat). Clear every warning it prints: event gaps,
   hard cuts, text outside the safe zone, an upscaled product, a missing medium. Then go through the checklist at the
   end of `craft.md` yourself. If any frame looks cheaper than the bar, fix it before anyone sees it.
6. **Contact sheet (approval 2, if they asked):** show `out/sheet.jpg` and describe the film in two lines. Wait for an OK
   or changes. If the medium isn't obvious from the brand, show the hardest beat in two media first and let them pick.

## Step 6. Render and deliver
`RUN render.mjs <project> video` (about 5 to 8 minutes for 30 s on a laptop: the medium repaints every frame). Read `out/report.json`. Look at 4 or 5 frames
from the MP4 (ffmpeg can pull them) and listen for problems the report can't catch. Then give the user:
- the MP4 path, length and size
- one line on what the film does
- a ready-to-paste post caption in the brand's voice (two short lines and a call to action)
- anything you weren't sure of (a claim, the photo's age, a pronunciation)

## Hard rules
- **The viewer has zero interest and zero context.** Every line is written for a stranger scrolling past
  (`references/copy.md`).
- **Not a slideshow:** one hero object, a world the camera travels through, 5 hard cuts or fewer, something new every 2 s
  (`references/story.md`).
- **Never clip-art:** every film is made in a medium, built the way that medium is physically made (`references/craft.md`).
  Any style can be used, and media can be mixed with a rule; flat fills with drop shadows can't.
- **The product is the real photo,** cut out, never repainted, never generated, never redrawn. Its label stays readable
  and uncovered.
- **Every claim comes from the brand's own pages** or a source you can name. No invented numbers, no health claims beyond
  theirs.
- **Never skip approval 1.** Never show a hook that fails the tests.
- **Spec work:** if the user isn't the brand, say the post should be labelled as a concept or spec video.
