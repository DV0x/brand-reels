# Glass Product (3D)

> Launch-film product rendering in transparent and frosted glass: a dark-field studio, strip-light sweeps, dispersion,
> caustics, light travelling inside the object, and slow exploded views that snap shut on a downbeat. **Its power for a
> brand:** it shows what is inside, with light moving through the object, so the product looks like it has nothing to hide.
>
> References (grammar only, never copy): premium launch films (a sweep drawing a contour in the dark, slow orbits, macro rack
> focus, cuts on the beat, ultra-thin wide type); transparent-hardware adverts (internals as ornament); dark-field glass
> photography. Copy no silhouette, typeface or sound.
>
> Adapted from lemo-opuscar `styles/glass-product/STYLE.md` (MIT, © 2026 LemoLab) for 9:16 product reels and this
> skill's runtime. Licence: `THIRD-PARTY-NOTICES.md` at the plugin root.

**Status: not available yet.** It needs a 3D renderer with a GPU, which this skill's runtime doesn't have. If a user picks it, say so and offer Dark Tech Keynote or Hologram HUD.

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
- **A single hero object of glass, metal and light** floats in an infinite black studio. Long strips behind and beside it turn
  clear glass into a thin white outline with rainbow edges; the internals show through as in a display case.
- **Everything moves slowly and precisely;** every cut, sweep and pulse lands on the beat.
- **The object is the brand's own** (a simple bottle rebuilt in 3D, or the real pack in a glass case). Never reproduce another
  product's silhouette, name, logo, typeface or UI.

Not a white-cyclorama catalogue shot, not a wireframe HUD (Hologram HUD), not a keynote slide (Dark Tech Keynote): material and
light are the subject.

## 2. Materials and rendering
All of this needs the 3D path in section 10. The rules are written so the style can be built later.
- **Studio = a strip-light scene, not an HDRI.** Bake a tiny black scene of emissive planes to an environment map **every
  frame**: tall side strips behind, a wide far strip (horizon rim), a soft top box, a weak front card (off when concave glass
  faces the camera), a top-front key only when parts must be read one by one, an accent card driven by the pulses, and **the
  sweep**: a tall strip on an arc behind the camera. Its highlight, refraction and dispersion move physically; never paint a
  2D highlight.
- **Clear glass:** transmission 1, roughness about 0.015, IOR about 1.5, thickness sets the lensing, **dispersion on**, both
  faces rendered. **Frosted glass:** transmission about 0.85, roughness about 0.4, a milky tint, thick; on black it reads as
  dark plastic unless something bright is behind or inside it.
- **Metals** make transparency worth looking at: satin bands, chrome (roughness at least 0.14), brushed surfaces. **Anything
  inside transmissive glass must be opaque.**
- **Light guides:** dark polished opaque acrylic with a clearcoat and emissive **comet pulses** along one axis (a Gaussian head,
  an exponential tail, a white-hot core, hue drifting with age). Idle emission about 0.
- **Background and floor:** black with an optional dark-grey radial sweep; no horizon line. The floor is black gloss with a
  blurred mirror, a radial fade and procedural caustics (R, G, B radii offset, warped Voronoi filaments, event rings).
- **Post:** 2× supersampling; physical depth of field; bloom only above about 1.1; Neutral tone mapping (AgX washes accents to
  white); grain 0.

## 3. Colour logic
- **The world is neutral:** black, greys, the white of strip reflections, the metals' own tints.
- **One accent colour family, reserved for light** (emission, caustic rings, the dispersion line on UI), optionally drifting
  between two neighbouring hues: amber to rose; green to cyan; ice blue to soft violet. Pick it from what the product does.
- **Emitters that only illuminate** (inside frosted glass) stay cool-white and dim. **Dispersion rainbows** appear only at thick
  glass edges and in the caustic, never as a gradient on surfaces or type.

## 4. Type and captions
Font (SIL OFL, downloaded by the font script): **Inter Tight** at weights 200, 300 and 400.
- **Captions are a slab of frosted glass:** a rounded bar filled with the rendered frame, blurred (`filter = 'blur(18px)
  brightness(1.25)'`, in the Node compositor), a 10% cool-white tint, a 1.2 px highlight stroke and an accent line on top.
  Inter Tight 300 at 56 px, near-white, words lighting up as spoken (unspoken at 45%). Bottom at y 1236, left edge x 120, at
  most 660 px wide.
- **Titles:** Inter Tight 200, 100 to 140 px, very wide tracking (about 0.45 em), centred on x 504 (the safe box's centre) in the
  upper third, one line of up to 7 characters or up to 3 stacked lines. A diagonal glint sweeps across the letters in sync with
  the sweep light on the object. The name and slogan are title cards, not caption lines. **Kickers and credits:** Inter Tight
  400, 36 px, tracked caps.
- **Reading time:** every caption holds at least max(1.8 s, its spoken line + 0.6 s); a title holds about (letters ÷ 15 + 1.5) s.

## 5. Motion quality
- **Everything moves on ones at 30 fps,** eased: ease-in-out for orbits, ease-out for parts decelerating into a float, ease-in
  for a snap back.
- **The camera always drifts:** slow orbits or push-ins; never locked off, never handheld, except two frames of micro-shake on
  an impact.
- **Exploded view:** parts spread along the axis (about 2× product size), each with a small deterministic tilt (`sin(i·1.7)·0.32`,
  `cos(i·2.3)·0.28`) and a spin proportional to its offset. A long ease-out apart (3 s), a short drifting hover (0.75 s), then a
  very short ease-in snap (0.25 s) on a downbeat, with a push-in of about 40% over the next 0.9 s.
- **Objects lift out of cradles** tilted toward the camera and settle upright; lids stand behind as a backlit halo. **Pulses and
  sweeps are events on the beat grid** (at 120 BPM one beat is 15 frames).

## 6. Camera grammar and the 9:16 page
A vocabulary, not a route. One hero, centred or on a strong diagonal. Cut only on beats; a sweep through black is a transition.

| Move | What it expresses | Can serve |
|---|---|---|
| Sweep over a dark object, slow push | contour before content | an unknown thing; a before-state |
| Slow high 3/4 orbit | the whole object in one move | a mechanism opening |
| Macro, rack focus from surface to part inside | nothing to hide | an ingredient; a sensor |
| Side macro orbit | material contrast | layers; a seam |
| Exploded view, axis about 40° to the view, orbit | technical beauty, suspension | architecture; a pause |
| Straight-on front, slight push | declaration | a single number; a name |
| Top-down macro | a pattern at full size | channels; a circuit |
| Top-down on the floor | the effect leaving the object | range; spreading energy |
| Low orbit under the object | monument, weight | durability; a flagship |
| Slow pull-back into negative space | room for type | a claim; a question |

Never dissolves. Portrait suits exploded views: spread the parts along the vertical axis, tilted about 40° to the view.

**The 9:16 page** (1080 × 1920; the ground covers the whole frame, only words keep to the safe box):

| Zone | Where | What goes there |
|---|---|---|
| Top bleed | y 0 to 260 | the black studio, the top of a strip light or the sweep; no words |
| Title and kicker | y 280 to 630, centred on x 504 | the title in the upper third; a kicker above it |
| Hero | y 520 to 1580, centred on x 504 | the object, 770 to 1150 px tall in its main shot (an exploded view may span about 80% of the frame) |
| Caption slab | bottom at y 1560, x 120 to 780 | the frosted slab |
| Bottom bleed | y 1580 to 1920 | the floor: mirror, caustics, rings; the effect leaving the object; picture only |

**The bands.** The top band (y 0 to 260, behind the app's header) and the bottom band (y 1580 to 1920, under the app's caption, username and buttons) hold no words. The picture runs through them to the frame's edges: the ground, and the subject when it is big. Don't add filler there (props, dot fields or texture just to fill space), and don't leave the bottom third empty either: centre the composition on the safe box and make the subject big (at least 640 px tall at key moments). For a paid ad (`"placement": "ad"`), words keep above y 1248 instead (references/craft.md, section 3).

## 7. Sound palette
- **Minimal electronic, never piano and strings:** bowed-glass tones, granular crystal clouds, glass bells and FM plucks, a
  filtered tick grid, a warm pad, a sub drone, soft kicks and claps, 808 bass, risers, a high glass ding. Minor and modal colours.
- **Lock every pulse, sweep and snap to the score** (one cue map, one hit list). **Silence:** a short total silence (reverb tails cut too) before a release.
- **Foley follows the material:** glass shimmer for sweeps; glass-metal friction for covers; magnetic clicks (a sub-2 ms
  transient, 3 to 5 kHz resonances, a low thump); air puffs; a snap = a cluster of clicks plus an inharmonic glass chord.
- **Voice:** restrained, low, very few short lines; never a product name alone (give it a verb). Duck music about 12 dB and foley
  about 6 dB under it.
- **In this skill:** closest preset `calm` (76 BPM, pad), for the dark open only. Preset to build: `glass`: a sub drone, glass
  bells and FM plucks, a filtered tick grid, soft kicks and claps, an 808 drop, risers, 110 to 125 BPM. Effects: `sparkle`,
  `ding`, `chime` (glass), `click` (magnetic), `rise`, `whoosh` (sweeps), `snap`, `tick`, `steam` (puffs).

## 8. Native moves
Find the invisible thing the product does and make it visible as light inside glass. A menu: use the ones the story needs.
- **Transparency.** The inside is the hero. *Fits:* a serum's dropper and liquid; a jar of ghee or honey; a juice bottle.
- **Lensing.** A thick glass dome magnifies what is behind it. *Fits:* a water filter's dome; a perfume bottle's base; a spice jar's lid.
- **Dispersion.** A sweep crossing a thick edge becomes a spectrum. *Fits:* a perfume bottle's edge; a cut-glass tumbler; a skincare bottle's shoulder.
- **Light that travels inside.** Charge, flow or heat runs as light. *Fits:* a water purifier's flow; a kettle heating; an active moving through a cream.
- **Caustics.** An internal pulse becomes a ring over the floor. *Fits:* a perfume's trail; a water bottle's rings; a tumbler's light on the counter.
- **Exploded view and snap.** Parts float apart, then snap on a downbeat. *Fits:* a refillable deodorant; a modular lunchbox; a refillable atomiser.
- **Frost to clear.** A frosted shell clears and the inside appears. *Fits:* a serum bottle showing its formula; a candle's cost breakdown; a "no additives" jar.

## 9. Pitfalls of the medium
- **A manually updated mirror uses last frame's camera:** update the matrices first; the transmission pre-pass re-renders it, so
  no-op its `onBeforeRender` and update once per frame.
- **A coloured emitter inside frosted glass tints the whole object; idle glow under a lens dome becomes a pale blob; AgX turns
  accents white; frosted glass on black is black; mirror chrome becomes a white disc:** follow sections 2 and 3.
- **An exploded view seen perpendicular to its axis is edge-on lines:** axis about 40° to the camera.
- **Pure profiles read as simple shapes (mushrooms, pot lids):** use 3/4 views and lids upright behind.
- **Bass peaks without headroom push loudnorm into dynamic mode:** limit them in the mix.
- **Concave glass facing the camera prints the front card as a grey rectangle:** card off.
- **A refracted or swept label is unreadable:** keep the label on the outside face, frontal, with no highlight across it.

## 10. Engine
No engine yet, and this runtime can't host one. Before any frame, write these primitives in the project (in `film.mjs` or a
`style.mjs` next to it), test each on a 100% crop, then build the film from them. Never draw this style with the generic kit's shapes.

| Primitive | What it draws | How (future 3D path) |
|---|---|---|
| `studio` | the strip-light scene | emissive planes baked to an environment map each frame: side strips 22 × 170 mm ×3.2, horizon 260 × 14 ×1.4, top box 160 × 70 ×1.1, front card ×0.18, key 150 × 60 ×2.5 (exploded views only), sweep 26 × 240 on an arc behind the camera |
| `clearGlass`, `frostedGlass` | the glass | clear: transmission 1, roughness 0.015, IOR 1.52, thickness 3 to 4.5 mm, dispersion 5; frosted: transmission 0.82 to 0.9, roughness 0.4, thickness 7 to 14 mm, an emissive disc inside |
| `metals`, `guide` | metals, light guides | satin 0.16, chrome 0.14; clearcoat acrylic with a comet-pulse shader (head σ = w/2, tail 4w at 55%) |
| `floor` | mirror and caustics | black gloss reflector, 12-tap blur ×0.32, radial fade; R/G/B-offset caustic rings |
| `post` | camera and finish | 2× supersampling; depth of field aperture 700 to 900 (macro), 70 (exploded), 160 to 300 (wide); bloom 0.16 to 0.3 above 1.1; Neutral tone mapping |
| `productModel` | the hero | a lathed bottle profile with the label as a frontal, unrefracted decal; busy packs: the photo on a plane in a glass case |

**What a future 3D path needs.** A WebGL2 context on a real GPU (headless Chrome with the GPU on, or a native renderer); a
library with physical glass (three.js r163 or later, for dispersion); a frame stepper that renders a pure function of t at 2×
supersampling and writes 1080 × 1920 PNG frames; and a hand-off to this skill's Node compositor for the caption slab, titles,
sound and mux. None of this exists in the runtime, and a 2D rewrite is impossible: refraction and dispersion need a depth
buffer. A 2D fake is Dark Tech Keynote with a rim light.

## 11. Variation space
You decide the object, its internals, the accent, the structure, the opening, the ending, the camera path, the pacing and the
music. Far from the original demo:
- **Structures:** a line-up (three variants compared by what glows inside); a day in light (one object through morning, noon and
  night); a material stack (one layer removed per beat until the core stands alone).
- **Openings:** inside first (one internal part, the shell forms around it); caustic first (light on the floor, followed up to
  the object); silhouettes (several dark outlines, one begins to glow).
- **Endings:** floor only (the object leaves, its caustic keeps pulsing); cool down (emission fades to bare strip outlines); a
  held macro (no pull-back, one detail, the name small).

## 12. The product and brand fit
- **The product:** simple bottles are rebuilt as a lathed profile, with the real label as a decal on the outside face: frontal in
  the hero shot, never refracted, no sweep highlight across it, never redrawn. Busy packs stay the real photo on a plane inside a
  glass display case, with nothing crossing the label. The label is readable for at least 1.5 s in the hero shot.
- **Brand fit:** premium, formula-led brands in glass or clear liquid: skincare, fragrance, water, juice. Avoid it for textiles,
  snacks and loud, cheeky brands. Not available yet: offer Dark Tech Keynote or Hologram HUD.
