# 1930s Rubber Hose

> Black-and-white hand-inked cartoons from the early sound era, where every object is alive and swings to a hot jazz band,
> printed on a worn film strip with flicker, scratches and dust. **Its power for a brand:** it turns a product and its
> problem into living characters, with slapstick that needs no explaining.
>
> References (grammar only, never copy): early-sound-era black-and-white cartoon shorts ("the whole world dances", surreal
> transformation, the bouncing-ball singalong, ink-and-pen framing gags); modern hand-inked revivals (a big-band finish). No
> existing character, name, silhouette, design, melody or logo is copied. If the hero is an object, the whole object is the
> body: no human torso under an object's head.
>
> Adapted from lemo-opuscar `styles/rubber-hose/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **Characters** have rubber-hose limbs (equal-width tubes, no elbows, no knees), white four-finger gloves, pie eyes (black
  oval pupils with a wedge cut out), huge round shoes, and bodies that squash and stretch like balloons.
- **The world is alive:** furniture, machines, plants and walls breathe with the music, on soft grey watercolour backgrounds
  behind flat white, grey and ink characters.
- **The film is a worn print:** flicker, scratches, dust, gate weave, vignette. It fills the whole 1080 × 1920 frame (no
  pillarbox gate).

Not a 1950s flat cartoon (no limited animation, no colour, no graphic backgrounds). Not a silent film: the synchronised music
is the engine. Not a retro filter over modern animation (no joints, no rendered shading). No period caricature of any group.

## 2. Materials and rendering
Canvas 2D in this skill's runtime; everything is a function of t.
- **Characters:** flat fills and one hard-edged form-shadow band (light grey) on the side away from an upper-left light. The
  ink outline is constant in screen space: transform points first, then stroke (about 6 px). Boil ±1.2 px, three drawings
  cycling on twos.
- **Limbs:** noodle tubes of constant width (character height ÷ 20), one smooth bend, round caps: wide ink stroke, then colour.
- **Gloves:** palm, 3 fat fingers, thumb, a flared cuff with a fold line, 3 stitch lines. Stroke all parts thick first, then
  fill all: one union outline.
- **Eyes, mouths, shoes:** pie eyes (white oval, black pupil 64% × 74% of the eye with a wedge cut toward the upper right; a
  blink is a body-colour lid with a lid line); mouths (smile with cheek ticks, grin, "O", wavy, pucker, tongue out); big black
  oval shoes with a white toe glint.
- **Object characters:** the face sits on the body; a secondary feature carries the mood (steam, a flame, a tilting
  lampshade, a spring). A box is a 3D shape seen slightly from above (about 0.26 rad), the face mapped on with `setTransform`.
- **Backgrounds:** painted once into a cached canvas at 1.25 to 1.5× (push-ins stay crisp): flat wash, soft blotches (±5%),
  edge darkening, a thin dark-grey outline, paper grain. They never boil. Motifs: wallpaper, panelling, checker floors, brick.
- **Film damage** (a composite pass over the grey picture): gate weave ±1.2 px with a rare 3 to 6 px jump; flicker ±4%; 0 to 3
  drifting vertical scratches; 3 to 8 dust specks a frame; an occasional hair; a vignette from 0 to 62% black at the corners;
  a 3 px jump on every cut; 0.5 px blur; light grain (about ±6 of 255), reseeded each frame.
- **The photo is drawn after this pass:** it shares the weave (position only) and gets no scratches, flicker, blur, grain or
  contrast boost.

## 3. Colour logic
- **Strictly greyscale:** about 6 grey steps plus a character white. No hue anywhere, not even in the film damage. Luminance:
  ink 5%, dark 23%, dark-mid 41%, mid 60%, light 78%, paper 94%, character white 99%.
- **Characters own the extremes:** their whites and blacks are brighter and darker than anything behind them. Backgrounds live
  in the middle greys (walls near mid grey, furniture one or two steps darker). Add a mild contrast boost (about 1.1 to 1.15)
  in the final composite: old prints are rich black and bright white, never flat grey.
- Form shadow is one light-grey band, never a gradient. Pick one temperature for the ramp (warm paper greys, cool silver
  greys, or a faint sepia) and keep it.
- **The one exception is the real product photo,** in full colour (section 12).

## 4. Type and captions
Fonts (SIL OFL), downloaded by the font script: **Shrikhand 400** (titles), **Limelight 400** (sub-lines), **IM Fell English
SC 400** (captions).
- **Titles:** Shrikhand, 110 to 150 px, white face, ink outline (14% of the cap height), ink drop shadow down-right, one to three
  lines of about 11 characters. Letters hop in a travelling wave on the beat.
- **Sub-lines:** Limelight caps, 44 to 56 px, wide tracking.
- **Captions are a period title card:** a near-black plate with a white double-rule border and dot-and-ring corners, IM Fell
  English SC at 56 px in paper white, drawn in the scene layer so it weaves and flickers with the film. It pops on and off, no
  fades. Bottom edge y 1236, left edge x 120, at most 660 px wide. Words light up as spoken (unspoken at 45%); the keyword
  hops (scale 1.15 for 0.25 s on its beat) and gets a double underline. One card may span two short voice clips.
- **Reading time:** hold at least max(1.8 s, spoken line + 0.6 s).

## 5. Motion quality
- **Characters on twos** (every second frame, 15 fps); the camera moves every frame. A stepped camera reads as judder.
- **Tempo grid:** pick a tempo where one beat is an even whole number of frames, so each beat lands on a drawing of the twos.
  At 30 fps: 12 frames = 150 BPM, 16 = 112.5 BPM, 20 = 90 BPM.
- **Breathing:** every idle object scales by `cos(2π · beats)`: stretch on the beat, squash on the off-beat, sampled on twos,
  amplitude 5 to 7%, all props in phase. A peak of joy triples it and squashes the whole background round the floor line (about 2.5%).
- **Walk:** one step per beat with a body bob (sad: smaller steps, limp arms). **Run:** legs as a windmill, forward lean, speed lines.
- **Anticipation, hold, action:** crouch (squash to about 0.8), hold while the band stops, then snap; impacts squash and
  spring back exponentially. Held frames are acting: each glance on an eighth note with a woodblock tick reads as thinking.
- **Freeze on a band stop:** everything freezes, background breathing included.

## 6. Camera grammar and the 9:16 page
A theatre camera: mostly locked, moving only to follow a runner or land a gag.

| Move | What it expresses | Can serve |
|---|---|---|
| Stage-wide, locked, eye level | a proscenium: the set is a stage | a place; a group number; a routine |
| Hard cut to a face close-up | the reaction is the joke | a surprise; a taste; a realisation |
| Trucking pan beside a runner, eased | pursuit, momentum | a chase; a race; a delivery |
| Medium follow shot (character 1/4 to 1/3 of the height) | every step is a note | climbing, dancing, working |
| Tilt with a fall or a rise | gravity as rhythm | a tumble; a rocket; a lift |
| Slightly high angle, one unbroken shot | hazard and answer in one frame | a danger; a stretch; a rescue |
| Tabletop pan (flat characters before a model set) | the world is a real place | a street; a carousel; a factory floor |
| Pull-back from a close-up to a packed medium-full | one feeling spreads to everyone | a celebration; a crowd joining in |
| Iris in or out (a character can grab it) | the film is an object | a beginning; an ending; a gag cut |

Faces must read: no far-wide shot for a gag or a musical moment. The destination prop enters frame before the gag lands. Arcs
and leaps stay inside the frame. Transitions: iris, a hard cut on a beat, a title card rolling up like a window shade. No
dissolves. In portrait, favour tilts, climbs and falls; a trucking pan keeps the runner inside x 120 to 888.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | wallpaper, a hanging lamp, curtains; no words (the app's header) |
| Title card | y 330 to 830, x 120 to 888 | the Shrikhand title and Limelight sub-line (it rolls up before the set shows) |
| Hero | y 440 to 1810, full width | 770 to 1150 px tall in its main shot, face above y 1350, body and shoes running into the floor |
| Caption card | bottom y 1560, x 120 to 780 | the period title card |
| Floor | y 1580 to 1920 | checker floor, feet, shadows, dancing props; no words (the app's caption and buttons) |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Music:** a 1930s hot dance band: stride piano, clarinet, trumpet (open and plunger-muted "wah-wah"), trombone smears, tuba
  oom-pah, banjo on 2 and 4, snare with brushes and rolls, xylophone, woodblocks, slide whistle, cymbal, kazoo, washboard, pit
  organ. No string pads, no modern synths. One short original syncopated theme, restated in different arrangements.
- **Hit-for-hit scoring (options):** a band member answers a character (a trombone raspberry, a trumpet laugh); a hard stop
  (reverb tails too) before a gag; a stinger per gag; a slide whistle for every stretch or fall; a prop that is an
  instrument; a solo for tenderness; a key change for a lift.
- **Foley:** porcelain and glass = hard inharmonic partials and a tiny transient; wood = woodblock; metal = bells and
  clanks; springs = "boing"; water = filtered noise and rising blips; rubber = a sawtooth creak through a band-pass.
- **Voice:** a period character (radio announcer, vaudeville MC, crooner), few short lines, through a radio chain (high-pass
  260 Hz, low-pass 4.6 kHz, tanh saturation, a short room). Music ducks about 8 dB. **Optical pass** over everything:
  band-limit 110 Hz to 6.2 kHz, wow 0.6 Hz, flutter 7 Hz; under it hiss, crackle and a 24 Hz projector clatter, the only
  sound allowed inside a silence.
- **Our presets:** none fits; `bright` is closest for tempo. Preset to build: `hotjazz`, stride piano, clarinet, muted trumpet,
  trombone, tuba, banjo, brushed snare, woodblock, slide whistle, xylophone, 90 to 150 BPM on an even-frame beat.
  **Effects:** boing, plop, pop, thud, tick, whoosh, swish, rise, steam, pour, chime.

## 8. Native moves
A menu: use the ones the story needs.
- **Everything breathes on the beat.** The setting is a character; at the peak the whole world dances, walls included.
  *Fits:* a kitchen of swaying spice jars; a shelf of bouncing bottles; a dancing shoe wall.
- **Hit-for-hit scoring.** Every step is a note; a prop becomes an instrument. *Fits:* toothbrushes as a xylophone; granola
  landing on drum hits; beans dropping into a grinder on woodblock ticks.
- **Rubber-hose stretch.** Limbs reach any length in one unbroken shot. *Fits:* an arm to the last snack at the back of a
  shelf; a bottle's arm round a shirt to the stain; a shoe's leg to a far step.
- **Transformation.** Anything becomes something else mid-motion. *Fits:* a frizzy curl into a smooth wave; a steam cloud into
  a cup; a problem blob into a serum bottle.
- **The bouncing-ball singalong.** Lyrics on a title card, a ball hopping word to word on the beat. *Fits:* a tagline jingle; a
  three-step routine as a rhyme; care-label rules as a rhyme.
- **The film is a physical object.** Title cards roll up like shades; the iris is grabbed and pulled shut. *Fits:* a pack
  reveal; a "the end?" twist; a mascot escaping the cartoon.
- **The ink bottle.** A pen draws the hero, who argues with it. *Fits:* a mascot introduction; a making-of; a founder's sketch.

## 9. Pitfalls of the medium
- **Flat grey frames:** push backgrounds to mid grey, keep pure white and ink for characters, add the contrast boost.
- **Wide shots kill gags:** use medium shots, and a packed medium-full for crowds.
- "Sad" brows read as angry: define brows by inner and outer end (inner = near the nose), not left and right.
- A limb drawn behind the body is hidden by the silhouette (a handle, a tail): kick and reach outward past it. Check every
  shot's last frame for characters colliding with props.
- Smoke puffs in a row read as thought bubbles: scatter and grow them. Short voice clips make captions flash: merge lines.
- Film damage, flicker or the contrast boost over the photo turn it grey: draw the photo after the pass.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each
on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `ink(pts, w)` | constant-width outline with boil | transform points, then stroke with an identity transform; displace ±1.2 px along the normal, 3 drawings on twos |
| `hose(a, b, h)` | a noodle limb | cubic path, ink stroke at width + outline, then colour; width h ÷ 20, round caps |
| `glove`, `pieEyes`, `mouth` | gloves, pie eyes, mouths, shoes | union outline for the glove; pupil 64% × 74% with a wedge cut; parametric mouths |
| `breath(beat)` | idle breathing for every prop | scale 1 + A·cos(2π · beat) on twos, A 0.05 to 0.07; joy A × 3 and a 2.5% background squash at the floor line |
| `bg(room)` | a cached watercolour room | offscreen canvas at 1.4×: wash, blotches ±5%, edge darkening, outline, grain; never boils |
| `gate(t)` | the film-damage pass | weave, flicker, scratches, dust, hair, vignette, cut jump, grain, contrast: `ImageData` and composite ops |
| `titleCard`, `caption`, `iris(c, p)` | the hopping title, the period caption card, the iris (a glove can grab it) | per-letter hop max(0, sin(2π(beat − 0.12 i))); window-shade roll-up; plate with double rule and corners; circular clip to the farthest corner |
| `photoColour(P)` | the real photo as the only colour | drawn after `gate`: weave only, flat grey cast shadow |

The source is plain 2D canvas; its grain was an ffmpeg step, done here in the `gate` pass.

## 11. Variation space
You decide the location (or several), the cast, the structure, the opening, the ending, the camera path, the tempo and the
band's line-up. Far from a plain chase:
- **Structures:** a singalong (the bouncing ball carries the message while the set acts out each line); a talent show (objects
  take turns on a stage, the smallest wins); a relay (a thing passed hand to hand across a town, each hand-off a new
  instrument on the melody).
- **Openings:** out of the inkwell (a pen draws the hero); a curtain rise (the band tunes up, a baton starts the film); an iris
  on one eye (it blinks and widens to show whose eye it is).
- **Endings:** the card pulled over (a character drags "The End" in front of itself mid-gag); the film snaps (the frame
  burns, a gloved hand splices it for a last bow); the band packs up until one note remains.

## 12. The product and brand fit
- **The product:** the only thing in full colour in a black-and-white world, as the real photo. It sits in the set (a counter,
  a shelf, a billboard) with a flat grey shadow, is drawn after the film-damage pass, and is never redrawn, greyed, scratched
  or covered. Its label stays readable. Show it big at least once, in the final card.
- **Brand fit:** playful, family and humour-first brands: snacks, home care, footwear, kids. Avoid it for clinical, premium or
  sincere brands, and for medical claims told as jokes.
