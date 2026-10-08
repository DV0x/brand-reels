# 16-bit Pixel RPG

> A short film that looks, sounds and behaves like a mid-90s console role-playing game: a tiny indexed-colour screen scaled up
> hard, text boxes that type, menus, item cards, save files and chip music with echo. **Its power for a brand:** it turns a
> product into an item and a result into stats, so a craving or a routine becomes a quest the viewer already knows how to read.
>
> References (grammar only, never copy): mid-90s console role-playing games (dialog boxes, menus, battles, overworlds, save
> points); the palette tricks of indexed hardware (swaps, step fades, cycling); the colour-depth history of consoles (4 shades,
> 8-bit, 16-bit). Never use an existing game's name, character, UI frame, font, logo, melody or sound.
>
> Adapted from lemo-opuscar `styles/pixel-rpg/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **180 × 320 native pixels,** scaled ×6 with nearest-neighbour to 1080 × 1920 (the source used 320 × 180). Everything, text
  included, lives in the framebuffer. The product photo is the one exception.
- **A limited, indexed palette.** Gradients are ordered dither, never blends.
- **Sprites** 36 to 56 px tall with a handful of frames; faces act in **portraits**.
- **Story told the way a game tells it:** dialog boxes, menus, status bars, battle messages, save files, item fanfares.
- **The product is an item:** its real photo sits in an item card at full resolution, because pixels can't hold a label.

Not HD-2D (no depth of field, bloom or real-time light), not CRT nostalgia (no scanlines, no grain), not a parody.

## 2. Materials and rendering
Canvas 2D in this skill's runtime (Node and Skia). The source already draws into an indexed array, so it ports as is.
- **Indexed framebuffer:** a `Uint8Array(180 × 320)` of palette indices, shown through a lookup table (index to RGB) written
  into an ImageData and drawn ×6 with `imageSmoothingEnabled = false`. A palette change swaps the table in one frame. Camera
  moves are whole pixels; each parallax layer rounds its own offset.
- **Master palette** of about 32 colours (a free palette such as ENDESGA-32), steered toward the pack's colours, plus
  **protected duplicates** of a few indices that no palette effect touches.
- **Colour-depth tables:** identity (16-bit); nearest of about 15 fixed colours in the style of an early 8-bit console (it
  needs a dark green and a dark brown); 4 shades by luminance thresholds (below 60, 115, 175 of 255), drawn natively at 90 × 160
  and doubled; a faded set (`lum^0.8` into about 7 blue-greys); subsets for a step-by-step collapse. Map by luminance, not rank.
- **Light is index stepping:** `LIGHT[]` and `DARK[]` tables move an index one step along its ramp; glows are Bayer-thresholded
  rings; firelight uses a warm remap (greens to browns to rust). **Dither:** 4 × 4 Bayer; light shafts as a flat 50% checker.
- **Sprites from a rig:** capsule limbs with 3-tone shading from an upper-left light, an inner line per part, a 1 px ink
  outline, hand-placed ASCII heads; lower eras drop the highlight tone. The hero gets a silhouette mark (the pack's colour).
  **Portraits** are 32 × 32, 3/4 view, a base face plus eye, brow and mouth overlays.
- **The real photo** goes in a hole: the item card reserves one index as transparent, and after the ×6 draw the photo is drawn
  into the hole at full resolution.

## 3. Colour logic
- **Palette is feeling.** Colour depth, fades and swaps are story tools. Change the whole palette by table, never by alpha.
- **Colour depth can stand for time:** older means fewer colours and lower resolution.
- **Protected indices** are exempt from every effect and become the thread through the film and the match cuts between eras.
  Use one or two (the pack's colour is the obvious one); more and they stop meaning anything.
- **Warm hues survive reductions:** keep orange, pink and plum in reduced subsets, or the first step turns a scene solid red.

## 4. Type and captions
Font (SIL OFL, downloaded by the font script): **Pixelify Sans** 600 (dialog, menus, numbers) and 700 (titles), drawn with
antialiasing off and the alpha thresholded at 50%. Never use a console's own font. No text under 7 native px (42 px on the frame).
- **The dialog box is the caption,** in the framebuffer: bottom at native y 206 (frame y 1236), left at x 20, 110 px wide (660
  px), three lines of 11 px, caps 8 px tall (48 px on the frame). A layered border (ink, white, silver), a dithered dark-blue
  fill, and the 32 × 32 portrait as a tab on its top-left corner.
- **It types with the voice:** each word starts typing at its spoken time and ends within 0.2 s (about 38 to 40 characters a
  second), so the caption lights up word by word; the keyword is typed in the item colour. ▼ blinks at 3 Hz when done. Skins
  follow the era (a light box for 4-colour, black with a white frame for 8-bit, blue for 16-bit).
- **Battle and system messages** go in a thin top window at y 296 to 420.
- **Titles:** Pixelify Sans 700 at 2× (about 132 px on the frame), an 8-neighbour ink outline, a row-by-row gradient,
  Bayer-dissolved in and out; one to three lines of at most 10 characters.
- **Reading time:** every box holds at least max(1.8 s, its spoken line + 0.6 s); the next box cuts the previous one.

## 5. Motion quality
- **30 fps.** Sprites step at 7.5 fps for walks (every 4th frame) and 10 fps for flames and blinks (every 3rd). Camera and
  parallax move on ones, in whole pixels; a walk of 30 native px a second is 1 px a frame.
- **Game-native acting:** a hop forward to act, a cast pose, knockback recoil, a kneel, a KO blink (10 fps on and off) then
  vanish; breath is shoulders up 1 px.
- **UI motion:** windows slide in over 0.3 s (ease-out, whole pixels). A hand cursor bobs 1 px at about 4 fps and stops when
  the character hesitates.
- **Transitions:** thumbnail expand with mosaic (block 10 to 1, 0.75 s); mosaic cross with a palette switch at the peak (1 to
  16 to 1, 0.8 s); the encounter swirl (polar twist, mosaic, Bayer dissolve to white, 0.8 s); screen shake 3, 2, 1 px over 10
  frames; palette step fades. Never alpha fades.

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. Game cameras are simple and legible. Characters stay above the dialog box.

| Move | What it expresses | Can serve |
|---|---|---|
| Side-scroll with parallax layers | journey; progress | a routine over days; a quest |
| Locked frame with UI on one third | a choice; a system speaking | a menu decision; a stats reveal |
| Battle side view (enemy, party, windows) | conflict as a system | a craving; a breakout |
| Top-down overworld pan | the whole world; where things are | a store map; a trip |
| Integer-pixel tilt up something tall | awe; scale | a tower; a door |
| Hold while the palette changes | loss or change without motion | a memory fading; nightfall |
| Back view at a threshold | resolve; the unknown ahead | a first day; a launch |
| Zoom by mosaic into a thumbnail | entering a memory or a file | a flashback; a save slot |

**The 9:16 page** (1080 × 1920 = 180 × 320 native × 6; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Sky and ceiling | y 0 to 260 (native 0 to 48) | far parallax, sky, ceiling beams; picture only |
| Message window | y 270 to 440, x 120 to 888 | battle and system messages, HP bars |
| Stage | y 460 to 1230 (native 72 to 165) | the world; the floor line at native y 140 or above; menus in its lower third |
| Item card (hero) | y 320 to 1420, x 120 to 888 | the item-get shot: the real photo in a window, at least 770 px tall |
| Dialog box | bottom at y 1560, x 120 to 780 | the caption |
| Floor and foreground | y 1580 to 1920 (native 208 to 320) | floor tiles, black foreground pillars (parallax 1.6×); picture only |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Chiptune voices:** pulse waves at 12.5, 25 and 50% duty, a 4-bit triangle bass, LFSR noise drums, wavetable leads,
  SNES-style echo (a few taps at 180 to 370 ms, feedback about 0.4, low-pass in the loop). Original melodies only.
- **Fidelity follows colour depth** (option): 4-colour = mono, 4-bit steps; 8-bit = mono; 16-bit = stereo with echo; a faded
  present = the same music muffled.
- **Techniques (options):** regional variations of one motif; one layer lost per palette step; the full band returning on a
  colour flood; an item-get fanfare as punctuation.
- **Foley,** bit-crushed to the era: cursor and select blips, text blips (pitch per speaker), footsteps with echo, magic
  shimmer, charge and blast, HP tick-down, KO blink, a bit-drop per palette step, save ticks. **One organic sound** (a breath)
  can make a character human once. **Silence:** true zero, echo tails included.
- **In this skill:** no preset fits; `dossier` (square bass, kit) is a stop-gap. Preset to build: `chip`: pulse waves at 12.5,
  25, 50% duty, a triangle bass, noise drums, a wavetable lead, a 3-tap echo, 100 to 140 BPM. Effects: `type` (text blips),
  `pop`, `click`, `tick`, `boing`, `plop`, `chime`, `ding`, `sparkle`, `rise`, `thud`, `whoosh`.

## 8. Native moves
A menu: use the ones the story needs.
- **Palette collapse and flood.** Colour depth drops a level per beat, or colour floods back. *Fits:* a shop that floods back on restock; coffee going stale; dull skin turning vivid.
- **Protected colour match cut.** One exempt colour links two eras in the same place. *Fits:* a pack colour across three redesigns; turmeric yellow in a grey kitchen; a jersey colour.
- **Save files as memory.** A list of files; NEW FILE refuses to overwrite. *Fits:* formula v1, v2, v3; day 1, 15 and 30 of a routine; a subscription's boxes.
- **Game UI as narration.** A greyed-out name, an item description, a stat screen. *Fits:* a supplement's stats; an ingredient
  as an item description; a price breakdown as a budget.
- **Level up.** Stats rise with a fanfare. *Fits:* a 30-day skincare quest; a protein bar as a power-up; a 12-week hair routine.
- **Encounter swirl.** A crash into danger. *Fits:* "4 PM CRAVING attacks!"; a breakout before a date; monsoon frizz.
- **Era shift.** The same characters redrawn in older hardware. *Fits:* a heritage brand's history; a family recipe across generations; a razor's evolution.

## 9. Pitfalls of the medium
- **Rank-based palette mapping crushes a scene to black:** map by luminance with a gamma.
- **Reduced subsets without warm hues turn a sunset solid red:** keep warm hues.
- **An 8-bit set without dark green or brown turns night grass blue; generic brightening near fire turns grass neon:** warm remap.
- **Post-quantising a full-colour scene to 4 shades is mud:** draw low eras natively at half resolution.
- **Pixel hair as a smooth dome reads as a helmet; alternating single pixels read as noise:** use 2 or 3 big spikes. Pale
  clothing reads as skin; hold props in the back hand.
- **A dark plank door reads as a jail:** panels, bevels, studs. **Negative modulo indexes `undefined`:** `((n % m) + m) % m`.
- **The dialog box covers the stage:** keep the floor line above it. **A photo scaled with nearest-neighbour or palette-mapped:**
  draw it after the ×6 draw. **Text under 7 native px** is unreadable on a phone.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each on
a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `fb`, `present()` | the screen | `Uint8Array(180 × 320)`; `present()` fills an ImageData through the lookup table, draws it ×6, smoothing off |
| `draw` set | rect, line, disc, blit, Bayer rect | writes indices; sprites are index arrays; the 4 × 4 Bayer threshold picks between two indices |
| `depth` tables | colour depths, collapse subsets | built from the master palette by luminance, gamma 0.8; protected indices skip every table |
| `font`, `dialog` | pixel text, dialog box, menus, title | Pixelify Sans mask blit; 3-layer border; dithered fill; word-timed typing; portrait tab; ▼ at 3 Hz |
| `rig` | sprites and portraits | capsule limbs, 3 tones, inner line, 1 px ink, ASCII heads; walk, hop, cast, hurt, kneel, KO |
| `scene` | parallax, tilt, index light | layers at 0.35×, 0.7×, 1×, 1.6×, each rounding its own offset; `LIGHT[]`, `DARK[]`; Bayer glow rings |
| `trans` | mosaic, swirl, shake, step fade | mosaic: each pixel takes its block's centre index; swirl: polar remap by index, mosaic, Bayer dissolve; fades by table |
| `itemCard(P)` | the real photo window | a native-pixel frame around a transparent-index hole; the photo drawn into it after the ×6 draw; text beside or below |

## 11. Variation space
You decide which game system the topic hides, the characters, the eras, the palette plan, the opening and the ending. Far from
the original demo:
- **Structures:** an overworld tour (a top-down map, each town a chapter entered by a door); a shop and an inventory (the story
  told through items bought, used and sold); a turn-based duel (each move is a scene of the topic).
- **Openings:** PRESS START with an attract-mode demo; a battle already in progress with HP low; a boot screen that fails to
  load and must be retried.
- **Endings:** GAME OVER answered by a choice (retry or give up) left open; credits scrolling over the overworld; the save
  screen where the last slot is written and the menu closes.

## 12. The product and brand fit
- **The product:** the real photo sits in the item card window at full resolution, because pixels can't hold a label. The frame
  is native pixels; the photo is never dithered, palette-mapped or nearest-neighbour scaled. The item name and stats go beside
  or below it, and the hand cursor points from beside. Show it big at the item-get shot.
- **Brand fit:** playful, young brands: snacks, energy, supplements, kids, gaming accessories. Avoid it for luxury, calm wellness
  or heritage-craft brands. Generic game grammar only: no named game's names, menus, monsters or music.
