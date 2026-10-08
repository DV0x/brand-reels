# Living Screencast

> A walkthrough on the brand's real website or app, where a small pixel mascot lives inside the screen and acts out what the
> software does. **Its power for a brand:** it shows the real shop, quiz, cart or review wall at work, with a character that
> makes every step easy to follow.
>
> References (grammar only, never copy): auto-zooming screen-recording tools (cursor smoothing, click push-ins, a window on a
> wallpaper); operating-system guided tours (calm, one feature per sentence); language-app mascots (squash, stretch,
> anticipation); fast-cut browser launch films (tone).
>
> Adapted from lemo-opuscar `styles/living-screencast/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **The stage is the brand's real screen.** Screenshots of the real site or app are photos: placed as they are, never
  redrawn, re-typeset, filtered or covered. The camera moves over them.
- **A mascot of big square pixels lives on that screen:** a hard-edged low-res sprite on a sharp hi-res page is the look.
- **The mascot is the software** (it runs along the rows it reads, stomps the button when it checks). **The cursor is the
  user.** Two actors, never a hand. Every mascot action brings the next real capture.

Not a dark tech keynote (no invented UI), not a pixel-art game (only the mascot and its props are pixels), not a plain screen
recording (camera, mascot and pacing are directed).

## 2. Materials and rendering
Canvas 2D in this skill's runtime (Node and Skia: no browser, no DOM). The UI is photos, so an anchor table replaces DOM measuring.
- **Captures:** PNG screenshots at 2 to 3× density, one per state (empty cart, item added, menu open, dark theme); a long page
  is one tall capture that scrolls. Every label and price is the real one.
- **Anchor table:** per capture, named rectangles in capture pixels (button, row, card, badge, price), measured once at 100%.
  The mascot's floor is the top edge of one, read every frame. No hand-placed coordinates.
- **Pixel grid is sacred:** mascot, props (pencil, "!", sparkles, heart, dust) and trails share one cell size, 8 to 12 frame
  px. Draw each pose once into a small canvas, then `drawImage` with smoothing off at a whole-number scale. It scales with the
  camera and snaps to half cells.
- **Window on wallpaper** (pull-backs only): a flat wallpaper and a soft shadow (dark rounded rect, `blur(20px)`, alpha 0.25).
- **Depth only where it serves attention:** rack focus = the capture clipped to the unread pane, drawn with `blur(6px)`;
  spotlight = a dark layer with a round `destination-out` hole. Never blur text to be read.
- **Motion blur on whips only:** draw the finished frame 9 times along the whip (length = camera speed × 1/60 s) at 1/k alpha,
  then the HUD sharp.

## 3. Colour logic
- **The product's own colours rule,** in its real light and dark themes: the picture is the capture.
- **The mascot** keeps the brand's mascot colour, or one saturated hue no UI element uses (check every capture), so it finds the eye.
- **Overlays** (chapter pill, key HUD, captions) are neutral frosted glass plus at most one accent taken from the product.
- **A theme switch can be a story event** if the brand has a real dark theme: the whole film changes state.

## 4. Type and captions
Fonts: **Inter** 700 (captions, pill; bundled), **JetBrains Mono** 700 (keys, tag), **Fraunces** 700 (slogan; bundled). The
page's own type is the product's, inside the captures.
- **Information layers only:** a chapter pill (01 to 04), a key HUD, the caption pill, an optional "▶▶ 4×" tag.
- **Captions are a frosted-glass pill:** the finished frame under it, blurred 18 px, a 14% tint (white over dark captures, ink
  over light), a 1.5 px highlight stroke. Inter 700 at 56 px, the **keyword in the product's accent**, words lighting up as
  spoken (unspoken at 45%). Bottom at y 1236, left edge x 120, at most 660 px wide; never over the discussed element or under
  the mascot.
- **Pill and key labels:** 40 px. **Real UI text** to be read (a price) is pushed in until it is at least 36 px tall. **A title
  is diegetic:** the page's own heading or logo. **End-card slogan:** Fraunces 700, 96 to 112 px, up to 3 lines, left at x 120.
- **Reading time:** every caption, pill and chip holds at least max(1.8 s, its spoken line + 0.6 s).

## 5. Motion quality
- **30 fps.** The UI moves on ones; the mascot is stepped to its pixel grid.
- **Mascot acting:** a jump has an anticipation crouch (0.14 s, squash 0.28), a stretch on take-off, tucked legs, a landing
  squash with a damped bounce and dust. Idle: a tiny squash on each beat, irregular blinks. Walk: 9 steps a second.
- **Eyes carry the acting:** neutral, left, right, up, down, wide, happy, shut, blink. Arms: down, up (cheer), wave.
- **Cursor:** spring-eased paths (about 0.35 s), a small push on click, never teleports.
- **State swaps:** after the click, the next capture replaces the old in 0.12 s, or a pixel wipe covers it. Never a dissolve.
  Add no animation the real product doesn't have.

## 6. Camera grammar and the 9:16 page
A recording-software camera: one take, zoom at least 1, cuts only under chapter transitions. A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Push-in to the cursor or caret | "this is where it happens" | typing; choosing an option |
| Slow drift at rest | the app is alive while we listen | narration; waiting |
| Whip-pan between panes (with blur) | cause here, effect there | add to cart, cart count |
| Push-in plus vignette freeze | the one promise to remember | a guarantee; a price |
| Rack focus between panes | attention moves, nothing else does | reviews read, cart waits |
| Pull back to the full window | the whole workflow in view | a summary; before and after |
| Follow the mascot along a list | the software working through items | scanning reviews |
| Split-window reframe | two things at once | comparing two plans |

Transitions: chapter pill wipes, pixel wipes, a theme reveal circle; never dissolves.

**The 9:16 page** (1080 × 1920; the capture fills the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | the top of the capture (browser bar, header); picture only |
| HUD row | y 270 to 380 | chapter pill at x 120; key HUD or time-lapse tag right-aligned at x 888 |
| Action | y 410 to 1290, x 120 to 888 | the discussed element, the mascot on its top edge, the cursor |
| Hero | y 320 to 1420, full width | the part of the screen in play, about 800 px (42%) tall in its main shot |
| Caption lane | bottom at y 1560, x 120 to 780 | the frosted caption pill, one or two lines |
| Bottom bleed | y 1580 to 1920 | the lower screen, wallpaper in pull-backs; picture only |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Two resolutions in the music:** a hi-fi layer (piano, bass, brushed kit, glockenspiel) is the world; a chiptune square or
  pulse voice is the mascot. They trade, duet or merge.
- **Options:** a low-passed "night" band for a dark theme; a tom fill and crash at chapter seams; drums dropping out to build
  tension; the mascot's notes on words it lands on; a stereo split for split screens.
- **Foley:** keyboard (a thock plus a click, timing jitter), trackpad clicks, pane swishes, popup pops, chimes, a shutter;
  mascot steps, jumps and landings in 8-bit. **Silence:** a short drop to room tone before the key promise. **Voice:** calm,
  one feature per line; keep effects off word onsets.
- **In this skill:** closest preset `bright` (108 BPM, claps). Preset to build: `screencast`: soft piano and glockenspiel pluck,
  upright-style bass, brushed kit with snaps, a pulse-wave chip voice for the mascot, 100 to 110 BPM. Effects: `type`, `click`,
  `swish`, `pop`, `chime`, `shutter`, `whoosh`, `boing`, `plop`, `tick`, `sparkle`.

## 8. Native moves
A menu: use the ones the walkthrough needs.
- **Match-cut origin.** The mascot climbs out of something already on screen. *Fits:* a logo mark; a box builder's cube icon; a
  quiz spinner.
- **Diegetic title.** The page's own heading is the title; the mascot lands on it. *Fits:* a store's home banner; a "welcome
  back" page; an order-confirmed page.
- **Moving floor.** The mascot rides a progress bar, tracking line or flying thumbnail. *Fits:* a free-shipping bar; a delivery
  tracker; a quiz progress bar.
- **Time-lapse with a tag.** Long work at N× with a flashing tag and rack focus. *Fits:* a long ingredient list; filling a 30-item box; order tracking.
- **Spotlight freeze.** Push in and vignette the one badge that holds the promise. *Fits:* "no added sugar"; "free returns";
  "cancel anytime".
- **The film changes state.** A toggle's effect takes over the whole film. *Fits:* a real dark theme; a "subscribe and save"
  switch repricing every card; a language switch.
- **Cell division.** A new window splits the screen and the mascot splits with a pixel burst. *Fits:* three flavours added to
  one box; two plans side by side; a gift to two addresses.
- **Cursor and mascot as characters.** The cursor pets, pokes or drags the mascot, and it reacts. *Fits:* approving a routine;
  removing a cart item; a thank-you page.
- **Karaoke-ball words.** The mascot hops word to word as they are spoken. *Fits:* a slogan; three routine steps; three plan names.

## 9. Pitfalls of the medium
- **Invented features or renamed modes:** check every button, price and mode against the live site.
- **The mascot floats or drifts off its element:** read the anchor table every frame; stand only on top edges.
- **The mascot covers text or sits under a caption:** keep a text-free lane for it.
- **Blur on text, or zoom below 1:** rack-focus only unread panes; zoom at least 1.
- **A hand, arm or finger on screen:** the cursor is the user.
- **Motion blur on a transformed layer smears the sprite:** blur the finished frame, on whips only.
- **A keypress or pop on a product name masks it:** keep foley off word onsets; check the mix with speech-to-text.
- **A soft capture, stale prices or personal data:** capture at 2 to 3×, recapture on the day, use a test account. **A cursor or
  mascot over a label:** point from beside it.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each on
a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `stage(t, cam)` | the capture under the camera | `drawImage` with a camera transform (zoom ≥ 1, spring-eased); a long page scrolls as one tall image |
| `anchors` | the mascot's floors | `{ capture: { name: {x,y,w,h} } }`; `floor(name, t)` gives the top edge in frame px |
| `mascot(pose, t)` | sprite and props | poses cached as small canvases, whole-number scale, smoothing off, position snapped to half cells |
| `cursor(path, t)` | the user | an arrow about 56 px tall, spring-eased; a push to 0.85× and a ring on click |
| `glass(rect, r)` | pill, chip, key caps | clip a rounded rect, draw the finished frame blurred 18 px, tint, 1.5 px stroke |
| `whip(frame, v)` | whip blur | 9 offset copies at 1/k alpha; the HUD is drawn after |
| `focus(rect)` | rack focus, spotlight | clipped 6 px blur; a dark layer with a round `destination-out` hole |
| `wipe(t, kind)` | pixel wipe, theme circle | a grid of 54 px squares growing to full cover and shrinking (about 0.4 s, diagonal delay), or a clip circle from the toggle; swap the capture while covered |
| `hopTo(word)` | karaoke hop | an arc between word top edges, landing at each word's spoken time |

## 11. Variation space
You decide the features and their order, the mascot (the brand's own, or an original pixel character), the story, the opening,
the ending, the camera path, the chapters and the music. Far from the original demo:
- **Structures:** a hunt (the mascot chases one fact through a long product page); a day of one customer (morning to evening
  in one app); a race (two windows, the old way and the new, the mascot winning on the right).
- **Openings:** mid-task (a half-filled box, the mascot already pushing); the notification (a toast lands, the mascot is
  inside); empty state (a blank cart, a blinking caret, the mascot drops from the menu bar).
- **Endings:** the mascot sleeps on the finished item as the window dims; the app closes, the mascot left on the dock; a real share.

## 12. The product and brand fit
- **The product:** its real images already sit in the capture; leave them as they are. The mascot stands beside or on the
  image's frame, never over its label. Push in until the label is readable once; show the pack big on the end card.
- **Brand fit:** brands whose site or app is the experience: subscriptions, box builders, quiz-led routines, review-heavy shops.
  Avoid weak or cluttered sites, craft or luxury brands, and cases without clean captures.
