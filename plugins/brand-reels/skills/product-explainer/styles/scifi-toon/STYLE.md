# Sci-fi Sitcom Toon

> Adult-animation sci-fi sitcom: thick boiling outlines, flat colour, a duo whose reactions don't match, a glowing portal,
> and one palette per world. The film is a dialogue with a running joke. **Its power for a brand:** it puts a product's
> problem into two people arguing, so a fact lands as the last line of the argument.
>
> References (grammar only, never copy): late-night adult-animation sci-fi sitcoms (dialogue-driven comedy, reaction
> close-ups, boiling line). Never copy or name a show's characters, designs, catchphrases or logos.
>
> Adapted from lemo-opuscar `styles/scifi-toon/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
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
- **The look:** uniform thick dark outlines that boil, flat fills with hard-edged shadow shapes (no gradients), big white eyes
  with tiny pupils, elastic mouths, grotesque-but-cute creatures, sci-fi hardware treated as household junk.
- **The comedy is dialogue:** talk that feels improvised, interruptions, awkward pauses, reaction shots, escalation, and a
  last-second reversal.
- **The engine:** a tiny, mundane goal pursued with absurdly large sci-fi means. Whoever could solve anything uses it for
  something petty, and someone else pays the emotional price.

Not a kids' cartoon (dry humour, long pauses). Not anime (no sparkly eyes). Not a vector explainer (the lines boil).

**Copyright red lines (non-negotiable):** never reproduce an existing show's characters, silhouettes, colour pairings, names,
catchphrases, burp gags, logos or portal device. Do not pair a spiky-haired scientist in a lab coat with a young sidekick.
Invent your own cast, props and portal.

## 2. Materials and rendering
Canvas 2D in this skill's runtime; everything is a function of t.
- **Line:** a near-black with a purple cast, about 7 px for characters and props, 4 to 6 px for background detail, round joins.
  Width is constant in screen space: transform points to screen first, then stroke with an identity transform. A close-up is
  redrawn at the same weight, never scaled up.
- **Boil:** resample every outline in screen space (about 7 px steps) and displace along the normal with low-frequency noise,
  amplitude about 1.7 px; cycle 3 boil drawings on twos. Everything boils, held poses and backgrounds too.
- **Fill:** flat colours only. Shadows are hard-edged darker shapes clipped inside the fill (one per form, away from the
  light). Glows are 1 or 2 flat translucent rings. Skies are flat colour bands.
- **Faces:** big white eyes (touching in 3/4 view), 4 to 5 px pupils, heavy lids for deadpan, eye bags; parametric mouths
  (open, width, curl, skew) with interior, teeth, tongue; brows carry the emotion. **Cast:** silhouettes read in solid black;
  one absurd costume idea per lead. **Creatures:** one per world, disgusting and adorable, non-verbal, face visible.
- **The portal** (the only thing that glows): a lumpy rim with a thick outline (polar noise radius), a vertical oval (x-scale
  about 0.74), 5 rotating spiral arms in two tones, a pale core, orbiting sparks, drips, and a flat translucent wash over the
  scene while it is open. It opens with a gentle overshoot (about 12%, back ease 0.3 s).
- **World tag:** a retro-terminal readout, typed in, coloured per world.

## 3. Colour logic
- **One palette per world, 3 to 5 colours,** as different as possible from the previous world in hue and value, so a colour
  change alone says "we jumped".
- Line colour and eye white never change. The glow colour belongs to the portal only.
- A deliberately bland palette (beige, brown) is itself a joke: use it for the world that is "suspiciously normal".
- **Take the pack's colours for the calm world where the product appears;** the portal glow uses a hue the pack does not.

## 4. Type and captions
Fonts (SIL OFL), downloaded by the font script: **Baloo 2 800** (captions), **Bungee 400** (titles), **VT323 400** (world tag).
- **Captions look like the cartoon's own:** Baloo 2 800 at 56 px, white with an 11 px black outline, in the caption lane (bottom
  edge y 1236, left edge x 120, at most 660 px wide, two lines). A **speaker pill** (the character's colour, boiling outline,
  name at 40 px) sits above the first line. Words light up as spoken (unspoken at 45%); the keyword takes the speaker's colour.
  Overlapping lines stack; the older one dims to 70%.
- **Timing:** narration holds at least max(1.8 s, speech + 0.6 s). Rapid dialogue: max(audio + 0.35 s, 0.9 s + letters ÷ 17).
  Clip captions at world changes and before a silent beat, so the silence plays on a clean screen.
- **Title:** Bungee, 110 to 140 px, one to three lines of about 9 characters, cream with a hard offset shadow and a thick ink
  outline, popped in on twos on a musical hit. Avoid acid green, slime drips and wobbly bubble lettering together: that reads
  as one specific show.
- **World tag:** VT323 at 44 px, typed in at x 120, y 300 to 360, clear of faces. Faces stay above y 1080, out of the caption lane.

## 5. Motion quality
- **Characters on twos** (every second frame, 15 fps): poses, mouths, blinks, walk cycles, boil. The camera, portal swirl,
  flying props and wipes move every frame.
- **Acting over moving:** held poses with small changes (an eye twitch, pupils sliding, a gulp, sweat drops). Idle life:
  breathing (±1% squash), a nod driven by speech loudness. Anticipation, then action, before every gesture.
- **Squash and stretch:** a landing squashes with a decaying cosine (about 22%); a body stretches while flying out of a portal;
  "sucked in" = scale toward the portal centre while stretching.
- **Lip-sync from the voice file:** per drawing frame, compute RMS (mouth open) and spectral centroid (wide vs round) in Node.
  Exaggerate screams (mouth × 1.5 to 1.9).
- **Nervous jitter:** a random offset of 3 to 6 px per drawing frame plus trembling pupils; it grows with panic.
- **In a cold pause nothing moves but the boil.**

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Medium two-shot | the relationship; who reacts how | dialogue; a standoff; a deal |
| Hard cut to a close-up | an interruption, a face breaking | a cut-off line; a realisation; a lie |
| Insert extreme close-up of an object | the absurd detail | a reveal; the problem itself; the wrong result |
| Reaction close-up | the laugh lives on the face | after every absurd image |
| Tight close-up and a short shake on one word | panic | the key word; an alarm; a scream |
| Rush zoom into the portal, swirl wipe | leaving a world | any jump between places, times or versions |
| Same framing repeated across worlds | only the world changes | a montage; a comparison; a list |
| Very slow push-in on a still two-shot | a cold silence | the pause after a reversal; a confession |
| Wide with the device and both leads | the whole situation at once | a callback; a trap; a fresh start |
| Over-the-shoulder onto a screen | reading bad news | a message; a readout |
| Whip pan between two faces | an overlapping argument | a fight; a bet; a double take |

Every absurd image is followed by a reaction close-up. Transitions go through the portal (swirl wipes) or hard cuts. No dissolves.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | sky bands or the world's ceiling; no words (the app's header) |
| World tag | y 280 to 360, x 120 | the typed terminal readout |
| Cast | y 410 to 1810, full width | the duo side by side, each 770 to 1150 px tall, or one face close-up; faces above y 1350; the portal beside them at the same height |
| Caption lane | bottom y 1560, x 120 to 780 | speaker pill and outlined caption |
| Floor | y 1580 to 1920 | the ground, legs, creature feet; no words (the app's caption and buttons) |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Synthesised score:** a theremin-like lead (sine plus a little 2nd and 3rd harmonic, legato portamento about 70 ms, vibrato
  fading in about 150 ms after each onset, spring reverb) over analog bass, a square-wave arpeggio and a retro drum machine.
  Minor modes and chromatic lines suit the main theme.
- **A cue per world (options):** surf guitar; polka accordion; toy-piano lullaby; elevator bossa (Karplus-Strong nylon guitar);
  brushed swing with vibes; tuba and slide whistle; warm Rhodes with a vocal "aah"; tremolo strings for panic.
- **Techniques (options):** a cue's first beat is the cut; a tempo that snaps cuts to a grid; the rule of three turning into a
  machine gun (the same stinger, shorter each time).
- **Silence is the punchline:** hard-cut the music, reverb tails included, on a reveal and in a cold pause. Leave room tone only
  (fluorescent hum, a clock tick, a fridge).
- **Foley (synthesised):** portal open (sub boom, down-swept noise, rising swirl), hum, close "fwump", a swirl whoosh per wipe,
  pop and boing, wet glorp and squish, slurp, chomp, blink "blip", click-beep, kazoo sting, squeaky toy.
- **Voices:** contrasting. Low, flat, slow for the deadpan lead (light saturation, a 180 Hz bump); higher and faster for the
  nervous one (presence boost). A creature may say one or two words, pitched up. Music ducks about 7 dB under dialogue. Keep
  bass notes above 40 Hz: below it is rumble on phones.
- **Our presets:** closest is `dossier` (drum kit and pluck at 120 BPM, no theremin). Preset to build: `sitcom`, theremin-like
  lead, analog bass, square arpeggio, retro drum machine, 110 to 130 BPM, with a cue swap per world. **Effects:** pop, boing,
  plop, whoosh, rise, sparkle, thud, snap, click, tick, type, chime, ding.

## 8. Native moves
A menu: use the ones the story needs.
- **Parallel worlds.** Each jump is a new palette, cue and creature. *Fits:* five worlds of the "healthy" snack; one morning
  with five shampoos; your skin in five climates.
- **Duo contrast.** Deadpan against panic: the joke is the gap. *Fits:* a label-reading and a non-reading flatmate; a skincare
  sceptic and an enthusiast; a coffee snob and a sachet drinker.
- **Rule of three, then machine gun.** Two slow wrong answers, then one-second worlds on the beat with the same rejection
  word. *Fits:* three failed protein bars; five wrong detergents for one stain; four bad moisturisers.
- **The suspiciously normal world.** The pattern breaks; the calm is the joke. *Fits:* the plain ingredient list that works; a
  quiet kitchen where the real product just sits; the calm shelf after chaos.
- **Dead-air reversal.** A long silence after the twist, then one line that shows a character's values. *Fits:* the price per
  serving; the real sugar number on a label; "same factory" as the pricey brand.
- **Hardware as junk.** World-bending tech used for a petty chore. *Fits:* a time machine to check an expiry date; a rocket to
  deliver a tea bag; a scanner to read a shampoo label.
- **Callback button.** The last line repeats the first, so the story loops. *Fits:* a brand tagline; a morning routine; a
  customer's running complaint.

## 9. Pitfalls of the medium
- Text-to-speech reads hyphen stutters as words: write syllables ("buh, buh-broken"), respell mangled words, pick names that
  survive a low voice. Speech-to-text mishears very short clips unless they are padded with about 0.6 s of silence.
- A real interruption: generate the interrupted line longer than needed and cut the audio where the other voice comes in.
- A springy overshoot swallows the actors: use a gentle back ease. Food and liquids need cues (surface detail, drips, steam).
- Square-wave cymbals alias into harsh fizz: use band-passed noise plus a little FM. A cut cue whose reverb tail is not cut
  is not silence.
- A face, creature or the product card behind furniture or in the caption lane is lost: move it.
- A contact sheet sampled at 1 fps can be offset by up to 0.5 s: don't misread a shot boundary.

## 10. Engine
No engine yet. Before any frame, write these primitives in the project (in `film.mjs` or a `style.mjs` next to it), test each
on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (2D) |
|---|---|---|
| `boil(path, w)` | a constant-width boiling line | resample at about 7 px in screen space, displace ±1.7 px along the normal with low-frequency noise, 3 drawings on twos; stroke with an identity transform |
| `flat(path, fill, shadow)` | a flat fill with a hard shadow shape | fill, then the offset shadow path clipped inside; no gradients |
| `face(o)`, `limb`, `hand` | eyes, mouths, noodle limbs, hands | parametric eyes (white, 4 to 5 px pupil, lid, bag), mouth with interior, brows |
| `portal(t, open)`, `swirl(c, p)` | the glowing device and its wipe | polar-noise rim, x-scale 0.74, 5 spiral arms every frame, core, sparks, drips, flat wash, back ease about 12%; the wipe is a growing spiral band clipped to the frame |
| `lipsync(wav)` | mouth open and wide from the voice | RMS and spectral centroid per drawing frame, in Node |
| `caption(words, who)`, `tag(str)` | outlined caption with speaker pill; typed world tag | 22 px stroke under the fill; pill with boiling outline; word light-up |
| `productCard(P)` | the real photo as a hand-held card | white card, 7 px boiling outline, hard shadow; the photo inside is not boiled |

The source is plain 2D canvas: no effect needs a rewrite.

## 11. Variation space
You decide the premise, the cast, the worlds, the jokes, the opening, the ending, the camera path, the pacing and the palettes.
Far from a plain errand:
- **Structures:** one world, many clocks (the duo stays home and a device skips them through times of day, each worse); the job
  interview (a panel interviews candidates from other worlds); the tech-support call (a split frame, top and bottom, one voice
  guiding the other through a disaster).
- **Openings:** mid-disaster (the portal is already open); the instruction manual (a terminal readout explains the device
  first); the wrong world (we start in the absurd world and see home later).
- **Endings:** stuck elsewhere (the device breaks and they settle in, happily); the audience (a creature watches the film and
  rates it); the cost (a quiet last shot of what the errand cost someone, no joke).

## 12. The product and brand fit
- **The product:** the real photo handed between characters as a cut-out card (white card, 7 px outline, hard shadow). The
  photo inside is never boiled, outlined or shaded, and fingers stay off its label. Show it big once: held to the camera in a
  reaction close-up.
- **Brand fit:** quirky brands that answer customer doubt: snacks, skincare, home and kitchen. Avoid it for sincere, clinical
  or luxury brands, and never as a joke about a medical claim.
