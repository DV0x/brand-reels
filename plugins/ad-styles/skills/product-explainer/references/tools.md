# Tools: every command, its options, exit codes and fixes

How the pieces fit is in [film-api.md](film-api.md); when to use each command is in SKILL.md and
[directing.md](directing.md).

## Contents
1. Running a script (the launcher)
2. site.mjs: the brand's website
3. cutout.mjs: the product photo
4. fonts.mjs: a style's fonts
5. voice.mjs: the voiceover and the film's clock
6. render.mjs: frames, sheets, the checks and the video
7. Exit codes
8. Disk, memory and time

## 1. Running a script (the launcher)
`<skill>` below is this skill's folder: the folder that holds `SKILL.md` (in Claude Code, `${CLAUDE_SKILL_DIR}`). The
launcher sits two levels up, in the plugin's `runtime/` folder, because the check-setup skill shares it.

- macOS and Linux: `bash "<skill>/../../runtime/run.sh" "<skill>/scripts/<script>.mjs" <args>`
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "<skill>/../../runtime/run.ps1" "<skill>/scripts/<script>.mjs" <args>`

In the guides, `RUN <script> <args>` means that command. The first run downloads portable Node, ffmpeg and the canvas
engine (about 60 MB, checked against pinned SHA-256 sums) into `~/.code-video`; later runs reuse them. It needs no admin
rights. Don't install anything yourself. Every script prints its usage with `--help`.

| Launcher error | Fix |
|---|---|
| `unsupported platform` or `musl Linux` (exit 3) | this computer has no pinned build: tell the user (macOS, Linux with glibc and Windows work) |
| `download failed` (exit 4) | no internet, or the network blocks it: check, then run again |
| `checksum mismatch` (exit 5) | the download was changed or broken; nothing was installed. Run again; if it repeats, tell the user |

Env: `CODE_VIDEO_HOME` (the cache folder), `CODE_VIDEO_FORCE_PORTABLE=1` (ignore a system Node or ffmpeg),
`CODE_VIDEO_FFMPEG` (a specific ffmpeg).

## 2. site.mjs: the brand's website
| Command | What it does |
|---|---|
| `RUN site.mjs <url> --out <brand>` | writes `<brand>/site.json` and prints a summary: products, prices, photo sizes, fonts, colours, the logo's address, some of the brand's own copy |
| `RUN site.mjs <url> --product <handle \| n \| url> --out <film>/product/raw` | that product's photos at full size, `product.json`, and any reviews on the page |

Shopify stores are read from `/products.json`; other sites from the page's product data (JSON-LD) and `og:image`.

| Error | Fix |
|---|---|
| `no product "<x>"` (exit 2) | use a handle or a number from the list the first command printed |
| `could not read that product page` (exit 1) | open the page with WebFetch and save the photos by hand, or ask the brand for a photo |
| the summary lists no products | not a Shopify store: open the likely product pages with WebFetch |

## 3. cutout.mjs: the product photo
`RUN cutout.mjs <photo> --out <film>/product/main.png [--tol n] [--crop x0,y0,x1,y1] [--shadows remove] [--box] [--uncut]`

Cuts the product out of a plain background. Prints a report (the background, the product's height in pixels, the
`closeUps` line: how big it can be drawn) and saves `<out>-check.jpg` (the cut-out on red and on near-black). Look at the
check image every time. What each report line means and what to do: [product.md](product.md), section 2.

| Option | Use |
|---|---|
| `--crop x0,y0,x1,y1` | keep only that part of the photo (pixels of the original): to drop an attached shadow |
| `--tol n` | how different from the background a pixel must be to stay. Without it, the tool picks one from how even the background is (16 to 60) and prints it as `tolerance`; lower keeps light label edges |
| `--box` | a flat, boxy pack shot straight on, whose label is close to the background's colour: keeps the whole rectangle |
| `--shadows remove` | last resort for a shadow under the product; check that the label survived |
| `--uncut` | no cut-out: saves the `--crop` part of the photo as it is, background and all. Use it when no tolerance keeps the label whole and the floor out (a white pack on light grey); the film shows it as a framed print or card |

| Error | Fix |
|---|---|
| `nothing left after cutting out the background` (exit 1) | try `--tol 12`, or a photo on a plain background |
| the check image shows the label eaten, or the floor kept, at every `--tol` | `--uncut` with `--crop` around the product (product.md, section 2) |
| `no file at <path>` (exit 2) | download the photos first with `site.mjs --product` |

## 4. fonts.mjs: the brand's fonts
`RUN fonts.mjs "<Family>:<weights>" ... --out <film>/fonts`, e.g. `"Archivo:400,800,400i"` (an `i` is the italic).
Downloads Google Fonts (SIL OFL) as static TrueType files with their licences, named `Family_Name-700.ttf`. Use it for
the brand's fonts, or their Google stand-ins (the design card); a style kit then puts them on its type roles
(`D.fonts`). A style with a drawing kit bundles its own default fonts. A font file the brand sends goes in the same
folder, named the same way.

| Error | Fix |
|---|---|
| `x <family>: HTTP 400` (exit 1) | check the family name and weights on fonts.google.com |
| `no --out folder` / `no font given` (exit 2) | give both |

## 5. voice.mjs: the voiceover and the film's clock
| Command | What it does |
|---|---|
| `RUN voice.mjs --voices "<words>"` | lists Cartesia voices whose name, description, accent and language hold every word ("indian", "indian female", "hindi"); "english" also matches the code `en`, "female" also matches "woman". `[emotive]` marks a voice tagged Emotive. Needs the API key |
| `RUN voice.mjs --audition "<the hook, as it is said>" --voices <id1>,<id2>,<id3> --out <brand>/audition` | one short take per voice (`1-<name>.wav`, `2-…`), for the user to hear in step 2 and pick one. `<break time="400ms"/>` in the text makes a pause |
| `RUN voice.mjs <film> [--words] [--key-file <.env>]` | records the whole script in one take into `vo/voice.wav` and `vo/timing.json` (every line's start, end and words). The lines' `pause`, `speed` and `emotion` marks become Cartesia tags; a line with `at` waits for the grid (silence added before it). `--words` prints every word's time |
| `RUN voice.mjs <film> --lines [--only l3]` | the older way, for films made before v0.4: each line recorded alone and placed by `lead`, `gap`, `pause` and `at` (`"take": "lines"` in `script.json` does the same); `--only` remakes one line |

The key comes from `--key-file`, the `CARTESIA_API_KEY` variable, or `<film>/.env`. Ask the user for it (SKILL.md, step
2); never search their disk or other projects for keys or `.env` files. The take is cached by its whole
text and marks: a change to any word or mark records it again (a few cents); a change to `at` or `anchor` costs
nothing. The text goes to Cartesia's servers.

| Error | Fix |
|---|---|
| `no Cartesia API key` (exit 1) | ask the user once for a key or a `.env` path; without one, render with `--estimate` (no voice) |
| `Cartesia 401` or `403` (exit 1) | the key is wrong or expired: ask for a new one |
| `script.json has no voice.id` (exit 1) | pick one with `--voices` and set `voice.id` |
| `no script.json in <folder>` (exit 2) | give the film's folder; start from `templates/script.json` |
| `no spoken words matched line(s) l4` (exit 1) | the voice read the line very differently from its text: check its `say`, run again; if it repeats, use `--lines` |
| `l3 lands at 6.08 s, 0.25 s after its "at"` (a warning) | a pause can only grow: move `at` to a later beat, or cut words before the line |
| `--only works with --lines` (exit 2) | in one take, run it without `--only`: an unchanged script costs nothing |
| `the voice … is not tagged Emotive` (a warning) | the `emotion` marks are left out: drop them, pick an emotive voice, or set `voice.emotive: true` |

## 6. render.mjs: frames, sheets, the checks and the video
`RUN render.mjs <film> <mode> [options]`. Add `--estimate` to any mode to time the lines from the text before the voice
exists, and `--debug` to draw the safe box and the caption lane.

| Mode | What it makes |
|---|---|
| `frame <t> [<t> ...] [--crop x,y,w,h]` | one PNG per time in `out/frames/`; `--crop` also saves that part at 100% |
| `contact [--every 1]` | `out/contact.jpg`: the whole film, one frame every second, six to a row |
| `strip <from> <to> [--step 0.2]` | `out/strips/`: one key action, frame by frame |
| `sheet` | `out/sheet.jpg`: one finished frame per voice line, with its words |
| `check` | the machine checks (below); `out/check.json`; prints PASS or FIX and every issue |
| `video [--workers n] [--from a --to b] [--fps 30]` | the MP4 with sound, its `.srt`, `out/cover.jpg` (frame 0) and `out/report.json` |

**The checks** (`check`; how to read them: directing.md, section 11). Issues make it FIX (exit 1); warnings print as
`[film]` and don't fail it.

| Check | Fails when |
|---|---|
| Size | a caption under 56 px, a headline under 72, a label or stamp under 40, a note under 36 (texture is exempt) |
| Safe zone | a word outside the placement's safe box (craft.md, section 3) |
| Reading time | a text tied to a spoken line (a statement, or a headline drawn with `line`) leaves before that line's end + 0.6 s (at least 1.8 s on screen); any other headline, label or note leaves before letters ÷ 15 + 1.5 s (at most 4.5 s needed). Text still on screen at the film's end is exempt |
| Touching | two different headlines, labels or notes overlap, or come within 6 px, on 3 or more sampled frames; or a label's pointer line (`K.label`, or a kit's tag) crosses or comes within 6 px of another text (its own label, and a text it points into, are left out) |
| Contrast | under 4.5:1 for text under 72 px, under 3:1 for larger |
| Still moments | two frames 0.3 s apart in the middle of a line or the end card are the same |
| Product size | the photo drawn bigger than it was taken |
| Hits on the beat | a declared hit more than half a frame off the music grid |
| Warnings | the film is under 30 s or over 35 s; more than 5 hard cuts; nothing new for more than 4 s; more than 4 statements; timing estimated; the end looks like the start (the closest of 3 frames in the last 3 s and 3 in the first 3 s differ by under 0.06 on block means: on a Reel that loops, it reads as a restart) |

The check draws every layer except the medium and the finish (`draw`, captions, `over`, `top`). It samples the film
at 6 frames a second, and at every frame (30 fps) from 0.1 s before to 0.5 s after each hit, cue, shot change, camera
shake and animation start, so a word that leaves the safe box during a fast move is caught here and not after the
video.

**The video report** (`out/report.json`): the length, the checks above, `decodeErrors` (must be 0), `frozen` (stretches
of 0.4 s or more with no change; must be 0), `lufs` (target −14, within 1) and `truePeak`, `audioLevels` (the music and
effects against the voice) and `audioWarnings`.

| Error | Fix |
|---|---|
| `no vo/timing.json` (exit 1) | make the voice (`voice.mjs`), or add `--estimate` |
| `no film.mjs` (exit 1) | copy `templates/film.mjs` into the film folder |
| `film.draw failed at t=7.200 s: ...` (exit 1) | the error in your film at that time: render `frame 7.2` while you fix it |
| `word "x" not found in line l3` (exit 1) | `T.word` must use a word of that line as the voice says it; check `voice.mjs --words` |
| `"style": "x" is not a style` (exit 1) | use a folder name under `styles/` |
| `only 1.2 GB free on the disk` / `stopped at frame 600` (exit 1) | section 8 |
| `unknown mode`, missing times, no `script.json` (exit 2) | the usage line printed with the error |

## 7. Exit codes
| Code | Meaning |
|---|---|
| 0 | done (`check`: PASS) |
| 1 | failed: the message says why and how to fix it (`check`: FIX, with the issues) |
| 2 | wrong call: a missing or wrong argument, or a folder without `script.json`; the usage line follows |
| 3, 4, 5 | the launcher only: platform, download, checksum (section 1) |

Read the error, fix the cause and run again. Go back to the user only for something only they can give (a key, a
photo, a decision).

## 8. Disk, memory and time
- **The disk guard:** `video` refuses to start under 1.5 GB free, and stops when free space falls under 1.0 GB (on
  macOS a render that runs out of memory makes the system swap to the disk). Fix: close apps, then run again with
  `--workers 1`.
- **Workers:** by default one worker per 8 GB of memory (1 on an 8 GB machine, at most 6). Each holds a full frame and
  the film.
- **Time:** `check` takes one to a few minutes for a 30-second film; `video` a few minutes; `frame`, `strip` and `contact`
  seconds. Look at small images: a contact sheet is enough for a full pass; crop to 100% only where you need detail.
- **Space:** `out/frames/` and `out/strips/` can be deleted once reviewed, with absolute paths:
  `rm -r "<film>/out/frames" "<film>/out/strips"`.
- **Words in the bands:** a picture may run into the top and bottom bands, and so may text that is part of it and
  carries no meaning (the numbers of a ruler, marked `role: 'texture'`, which the safe-box check skips). Words that
  carry the fact stay inside the safe box.
