# Product photos

The product is the one thing in the film we can't draw. It's always the real photo, cut out. It is never repainted,
never redrawn and never generated (generated labels come out as gibberish).

## 1. Get the photo
- **Best:** the brand sends a current front photo on a plain background. A phone photo against a plain wall in daylight
  is enough; the label's print file is better still, because close-ups stay sharp. Ask for the back too if the story
  needs it.
- **Fallback:** `RUN site.mjs <url> --product <handle|n|url> --out <project>/product/raw` downloads every photo of the
  product at full size, with its size listed. Look at them and pick the plain-background front packshot. Infographics,
  lifestyle shots and model shots don't cut out cleanly.

## 2. Cut it out
`RUN cutout.mjs <project>/product/raw/img-01.jpg --out <project>/product/main.png`
Read the report, then **look at the check image** (`main-check.jpg`, the cut-out on red and on near-black). Then:
- **"a shadow on the floor is probably attached":** crop it away with `--crop x0,y0,x1,y1` (pixels of the original
  photo), keeping the whole product. Only if the shadow is under the product, try `--shadows remove`, and check that the
  label survived: it can eat light parts of a label that touch the edge.
- **"the background is not plain":** the cut-out will be rough. Ask for a plain-background photo, or use the photo
  uncut inside a framed card.
- **Bits of a light label eaten at the edge:** lower `--tol` (e.g. 12). Small nicks are hidden by the card's paper border.
- **"almost nothing was removed":** the product and background are too close in colour. Try `--tol 10`, or use a
  different photo.
- **"touches the edge":** the photo itself crops the product. Use another photo.
- **A flat, boxy pack shot straight on** (a bar, a carton, a sachet) whose label is close to the background's colour
  and touches its edge: the flood fill eats the label. Use `--box`, which keeps the pack's whole rectangle, with `--crop`
  to the pack's edge if a soft cast shadow is attached. Look at the check image: the label must be whole.
- A transparent PNG from the brand is just trimmed.

Other views go next to it (`product/back.png`, `product/open.png`) and are used as `K.product('back')`.

## 3. How big it can be shown
The report's `closeUps` line says how big the product can be drawn before it goes soft. Plan the shots to that: a
900 px tall product is fine at about half the frame's height, not in a tight close-up. The QA flags any frame where the
product is drawn bigger than its photo.

## 4. Details on the label
If the script points at a detail (a date, a percentage, an ingredient, a size):
- check that it's readable in the photo at the size it will be drawn
- check that it's current: an old date on a pack undercuts the film. Keep it too small to read, or ask for a new photo.
- find its position in the photo (pixels in the cut-out PNG) and use `rect.point(px, py)` to aim circles and labels at it.

## 5. Showing it
- **The cut-out card:** `P.draw(g, { x, y, h, t, at, enter })`, with x and y at the middle of its base.
  - `enter`: `drop`, `slide-left`, `slide-right`, `rise`, `pop` or `none`.
  - `border: false` and `tape: false` give a cleaner, blended-in look.
- **Hands hold it from the back:** draw `K.hand({ part: 'back' })`, then the product, then `K.hand({ part: 'front' })`.
  The fingers never cover the label.
- One true product at a time in the main action. The end card shows it big and clear.
