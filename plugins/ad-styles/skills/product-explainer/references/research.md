# Research: what to find, where, and when to stop

Budget: about 25 tool calls for the research (SKILL.md, step 1), and up to 5 more after the topic is chosen. Research is for finding a topic a
stranger cares about and the true facts to answer it. It is not a report. Stop when `research.md` has what's below.

## 1. The brand and its products
- `RUN site.mjs <url> --out <folder>`: product list (Shopify stores give all of it), prices, photo counts and sizes,
  fonts, colours, the logo, a sample of their copy. If it isn't Shopify, it lists product links; open the likely ones with WebFetch.
- Good products to explain: one with a mechanism, a habit, a misunderstanding, a number, or a "how do I use it" question
  behind it. Skip gifts, bundles, merch and variants of the same thing.
- Note each candidate's best photo (size, plain background or not).
- **For the likely product:** `RUN site.mjs <url> --product <handle> --out <brand>/products/<handle>` saves its photos
  (the film folder comes later, after the topic). Then WebFetch the product page itself: `site.mjs` often misses the
  ingredients, the claims and the FAQ, and the reviews it prints may be titles only.
- **Look at the product's other photos** (the infographics, with the Read tool): many brands print their claims
  (pH, actives, "no tight feel") only inside them.
- **Sold out or unavailable** on the brand's own site: say so in the questions. The film still works as an explainer,
  but it never says "buy now", and `DELIVERY.md` notes the date you saw it.

## 2. Their voice (WebFetch 2 or 3 of their own pages: About, FAQ, one product page)
Write a voice card:
- 8 to 10 lines copied exactly from their pages, with the page they came from.
- Three words for how they sound, and one they never do (e.g. "warm, wry, reassuring; never loud").
- Who they talk to and how: "you" or "we", formal or casual, Hindi words or not, emoji or not, British or US spelling.

## 3. Their look: the design card
The film wears the brand's look: **the style gives the techniques; the brand gives the colours, the fonts and the end
card** (craft.md, section 2). Without this card every brand's film looks the same. Build it from what you already have:
`site.json` (`fonts`, `colors`, `logo`), the pack photo, the pages you opened for the voice, and the home page's main
image (look at the pictures with the Read tool). What the user sends in step 2 (a logo, font files, a style guide)
replaces your reading.
- **Fonts:** the family of their headlines, of their body text and of their numbers (site.json `fonts`, and the
  lettering on the pack). A Google Font downloads with `fonts.mjs`. A paid or custom face is not free: name the closest
  Google font of the same kind (geometric, grotesk, humanist, slab, serif, rounded) and width, and write "stand-in for
  <their font>" (the film's `CREDITS.md` and `DELIVERY.md` say so). A font file the brand sends goes in the film's
  `fonts/` folder, named `Family_Name-700.ttf`.
- **Colours:** 3 to 5 hex values, each with a job (ground, text, accent, a second accent), from site.json `colors` and
  the pack. The pack's colours come first: they are what a customer knows on a shelf.
- **The logo:** the file (site.json `logo`, or one the user sends), saved as `<brand>/logo.png`, with a transparent
  background if there is one. It is used as it is: never redrawn, recoloured or stretched. With no clean file, the logo
  appears only as printed on the pack.
- **Layout habits:** space (airy or packed), case (capitals or sentence case), alignment, corners (sharp or round),
  lines and frames, how they show the product (a pack on white, in a hand, on a model, a flat lay).
- **Motion,** if you see their videos: calm, bouncy or clinical. It sets the motion setting (warm, playful, crisp).
- **3 do's and 3 don'ts** for a film in their look (do: "a lot of white, black type, the pack big"; don't: "a second
  accent colour, round cartoon type, a busy background").

## 4. What customers say (the most important part)
Collect 10 to 20 lines in customers' own words, each with where it came from. Look for:
- **Questions** they ask ("can I use it with...", "how long does it last", "why does it...").
- **Complaints and confusions** about the product type, not just this brand ("tastes bitter", "breaks me out", "goes flat").
- **Habits** around the product type (where they keep it, how they use it, what they do wrong).
- **The words they use** for things ("face wash", not "facial cleanser"; "tan", not "hyperpigmentation").

Where:
- `site.mjs --product` prints reviews if the page has them.
- WebSearch: `"<brand> <product>" reviews`, `<product type> mistakes`, `<product type> reddit`, `<problem> why`.
- Marketplace pages (Amazon, Flipkart, Nykaa) hold most real reviews; they often block fetches, but search results
  still show snippets. The brand site's own review widget is often titles only.
- Ask the user: "What do customers ask you or complain about most?"

## 5. Facts we can use
Every claim the film will make, with its source: the brand's own pages first (FAQ, product page, the pack), then a
reputable source for general facts. Write the exact wording they use for numbers, percentages and promises. If two of
their pages disagree, use neither number and flag it.

## 6. Topics (2 or 3)
Each topic links a stranger's problem or habit to a fact this brand can answer with. Write the ones that pass
`copy.md` (zero-interest test, alone test) and score them:

| Topic | The viewer's moment | The hook line | The brand fact that answers it | Stranger stops? | Can we show it? | This brand's? |

Recommend one. The best topics come from section 4, not from the brand's About page.

## research.md layout
```
# <Brand>: research (<date>)
## Products worth explaining
## Their voice
## Their look (the design card)
## What customers say (verbatim, with sources)
## Facts we can use (claim -> source)
## Topics
```
