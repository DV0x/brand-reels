---
name: product-explainer
description: Makes 30-to-35-second vertical explainer reels (Reels, TikTok, Shorts) for a D2C brand's product, drawn entirely in code, with the real product photo, a timed voiceover, captions, music and sound. It researches the brand, writes a script on a fact the viewer doesn't know, gets it approved, directs the film and renders the MP4 locally. The tested style is Halftone Dossier (a print case file); draft styles can be asked for by name (mid-century cartoon, Swiss motion, data storytelling, isometric infographic, silkscreen poster, risograph, copperplate engraving, hologram HUD, dark keynote, living screencast, rubber hose, sci-fi toon, spy titles, art deco, one-line drawing, watercolor, whiteboard, block print, paper-cut, pictogram motion, pixel RPG). Use it whenever someone wants a reel, an explainer, a short video or a video ad for a product or brand, shares a brand website or product link, or names one of these styles, even if they never say "explainer". Not for editing or converting existing video files.
---

# Product explainer

One finished 1080 × 1920 reel of 30 to 35 seconds, with sound, made from a brand's website. Every frame is drawn in
code on this computer: no image generation, no stock footage. The real product photo is cut out and placed inside the
style; its label is never redrawn. **Needed:** the website; a Cartesia API key for the voice (without one the film is
text-led) or the brand's recording; a product photo on a plain background (the site usually has one).

| The request | Go to |
|---|---|
| A reel for a brand or product (the normal case) | **The workflow** below |
| "Which styles are there?" | **The styles** below |
| Research, customer words, facts | [references/research.md](references/research.md) |
| Topic, hook, script, the 30-second time map | [references/copy.md](references/copy.md), the bar in [references/benchmarks.md](references/benchmarks.md) |
| The product photo | [references/product.md](references/product.md) |
| Directing: treatment, sound, rhythm, camera, review, delivery, changes | [references/directing.md](references/directing.md), design rules in [references/craft.md](references/craft.md) |
| Building the film: every call and option | [references/film-api.md](references/film-api.md) |
| Commands, options, exit codes, errors | [references/tools.md](references/tools.md) |

**The film is for the brand's customer**, scrolling with zero interest. Its spine is **a pain the viewer feels → a
hidden fact behind it → the product as the answer**, and the fact fits in one sentence they would send a friend.

**You write the script; the user approves it. Then you are the director.** The style's `STYLE.md` fixes the look;
the story, shots, timing, music and sound are made fresh for each film from a written treatment, before anything is
drawn. A film is judged on sound, rhythm, camera and directing, in that order.

## Where files go
In the folder the user started from (ask once if they want another place):
- `<brand>/`: `BRAND.md` and `LEARNINGS.md` (the brand's memory, from `templates/`), `research.md`, `site.json`.
- `<brand>/<film>/`: one folder per film: `script.json`, `BRIEF.md`, `TREATMENT.md`, `film.mjs`, `REVIEW.md`,
  `CREDITS.md`, `DELIVERY.md`, `product/`, `vo/`, `out/` (film-api.md, section 1).

Scripts run through the plugin's launcher: `RUN <script> <args>` in the guides (tools.md, section 1). Don't install
anything yourself.

## The workflow
Copy this checklist into your reply and tick it off. You stop for the user only for the questions and the script
approval, and for the look only if they asked to see it.

```
Explainer progress:
- [ ] 1. Brand folder and research
- [ ] 2. One round of questions
- [ ] 3. The script as text (APPROVAL), then BRIEF.md
- [ ] 4. Product cut-out and voice
- [ ] 5. Treatment, before any drawing
- [ ] 6. Style frames and design review (show them only if asked)
- [ ] 7. The film: lines on the grid, every scene, the score, a sound per action
- [ ] 8. Review loop: checks, contact sheets, strips, the video
- [ ] 9. Deliver, and update the brand's memory
```

1. **Brand folder and research.** If `<brand>/BRAND.md` exists, read it and `LEARNINGS.md` first; a new brand starts
   both from the templates. `RUN site.mjs <url> --out <brand>`, the likely product's page and photos, then customers'
   words and facts (research.md). The film folder is made after the topic is chosen, named after it.
2. **One round of questions** (AskUserQuestion if available; skip what the brand folder or the request answers):
   - **Which product**, if several fit (your pick first).
   - **Which topic:** 2 or 3, each a viewer's pain or habit, its hook and the hidden fact (copy.md; pick 1 or 2
     benchmark entries before you write hooks). Show only hooks that pass copy.md's tests.
   - **Which style:** recommend from the menu below, with one reason.
   - **See the look first?** Three finished style frames before the film (recommend yes for a first film).
   - **The product photo:** the site's (say its size), or a current one they send.
   - **The voice:** their Cartesia API key (or a `.env` path), so you can list voices and suggest one; or their own
     recording. **A post or an ad** (post by default). **Are they the brand?** If not, the film is a concept film.
   - In one line: "What do customers ask you or complain about most?" Then decide every other gap yourself.
3. **The script, as text (APPROVAL).** Write it by copy.md: 30 to 35 s and about 70 words on the time map, the hook's four
   beats, the table `# | voice | on screen | beat note`, the facts list with sources, the shape (PAS by default). Run
   copy.md's self-check first. After the OK, save `BRIEF.md` from `templates/BRIEF.md`: from here you work alone.
4. **Product and voice** (product.md, tools.md). Cut the photo out and look at the check image. Pick a voice, set
   it in `script.json`, `RUN voice.mjs <film> --words`. No key: ask once; otherwise render with `--estimate`.
5. **Treatment, before any drawing.** Read directing.md and the style's `STYLE.md` in full. Write `TREATMENT.md`:
   benchmark, three structures and the pick, shots, beat sheet, cue map, sound table, captions, the product.
6. **Style frames.** Copy `templates/film.mjs`, write the timeline, finish three scenes (the signature shot, the
   product's shot, one more), review them in written rounds in `REVIEW.md` (directing.md, section 5). Show them only
   if the user asked to see the look, and wait for the OK.
7. **The film.** Place the lines on the grid, re-run `voice.mjs`, write every scene of the treatment, the score and
   a sound per action (film-api.md for every call; directing.md sections 6 to 9 for why).
8. **Review loop** (directing.md, section 11): `check` until PASS, contact sheets and strips in written rounds until a
   round finds nothing, then `video` and its report. You can't hear the film: say so.
9. **Deliver** (directing.md, section 12): `CREDITS.md`, `DELIVERY.md` (with what you could not do, and why), the
   lessons in `LEARNINGS.md`, the film in `BRAND.md`. Changes later happen in a new chat (directing.md, section 13).

## The styles
| Style | Best for | Status |
|---|---|---|
| [Halftone Dossier](styles/halftone-dossier/STYLE.md) | myth-busting, label honesty, hidden facts | **tested**, with a drawing kit |

**Drafts** (not tested yet): a user may ask for one by name. Say it is not tested yet, then build its primitives from its
`STYLE.md` (craft.md, section 6) and expect more time. Folders under `styles/`: `midcentury-toon`, `swiss-motion`,
`dataviz`, `iso-infographic`, `silkscreen-poster`, `risograph`, `engraving`, `hologram-hud`, `dark-keynote`,
`living-screencast`, `rubber-hose`, `scifi-toon`, `spy-titles`, `art-deco`, `one-line`, `watercolor`, `whiteboard`,
`block-print`, `papercut`, `pictogram-motion`, `pixel-rpg`. `glass-product` needs a 3D renderer this runtime doesn't
have: offer Halftone Dossier or a draft instead. Read only the style you use.

## Rules, with the reason for each
- **A true fact the viewer doesn't know,** sourced in `research.md`: facts make people stop and share.
- **About 30 seconds, never padded:** cut words; never speed up the voice or stretch pauses (copy.md).
- **The script approved before drawing:** changing words after the art is built wastes most of the work.
- **The story from the topic, the look from the style:** a style's familiar structure is its cliché.
- **The real product photo,** never redrawn: generated labels come out garbled.
- **Every action on a word or a beat;** nothing on screen the treatment didn't ask for (filler is clutter on a phone).
- **Tools fail loudly:** read the error, fix the cause, run again (tools.md, section 7).
