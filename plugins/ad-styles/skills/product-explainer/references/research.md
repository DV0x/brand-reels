# Research: what to find, where, and when to stop

Budget: about 20 tool calls for the research (SKILL.md, step 1), and up to 5 more after the topic is chosen. Research is for finding a topic a
stranger cares about and the true facts to answer it. It is not a report. Stop when `research.md` has what's below.

## 1. The brand and its products
- `RUN site.mjs <url> --out <folder>`: product list (Shopify stores give all of it), prices, photo counts and sizes,
  fonts, colours, a sample of their copy. If it isn't Shopify, it lists product links; open the likely ones with WebFetch.
- Good products to explain: one with a mechanism, a habit, a misunderstanding, a number, or a "how do I use it" question
  behind it. Skip gifts, bundles, merch and variants of the same thing.
- Note each candidate's best photo (size, plain background or not).

## 2. Their voice (WebFetch 2 or 3 of their own pages: About, FAQ, one product page)
Write a voice card:
- 8 to 10 lines copied exactly from their pages, with the page they came from.
- Three words for how they sound, and one they never do (e.g. "warm, wry, reassuring; never loud").
- Who they talk to and how: "you" or "we", formal or casual, Hindi words or not, emoji or not, British or US spelling.
- Fonts (site.json `fonts`; note any Google Font, it can be downloaded into `<film>/fonts/`) and colours (site.json
  `colors`, plus the packaging's own colours from the photo).
- How their own videos move, if you see them (calm, bouncy, clinical): this sets the motion setting (warm, playful, crisp).

## 3. What customers say (the most important part)
Collect 10 to 20 lines in customers' own words, each with where it came from. Look for:
- **Questions** they ask ("can I use it with...", "how long does it last", "why does it...").
- **Complaints and confusions** about the product type, not just this brand ("tastes bitter", "breaks me out", "goes flat").
- **Habits** around the product type (where they keep it, how they use it, what they do wrong).
- **The words they use** for things ("face wash", not "facial cleanser"; "tan", not "hyperpigmentation").

Where:
- `site.mjs --product` prints reviews if the page has them.
- WebSearch: `"<brand> <product>" reviews`, `<product type> mistakes`, `<product type> reddit`, `<problem> why`.
- Marketplace pages (Amazon, Flipkart, Nykaa) often block fetches; search results still show snippets.
- Ask the user: "What do customers ask you or complain about most?"

## 4. Facts we can use
Every claim the film will make, with its source: the brand's own pages first (FAQ, product page, the pack), then a
reputable source for general facts. Write the exact wording they use for numbers, percentages and promises. If two of
their pages disagree, use neither number and flag it.

## 5. Topics (2 or 3)
Each topic links a stranger's problem or habit to a fact this brand can answer with. Write the ones that pass
`copy.md` (zero-interest test, alone test) and score them:

| Topic | The viewer's moment | The hook line | The brand fact that answers it | Stranger stops? | Can we show it? | This brand's? |

Recommend one. The best topics come from section 3, not from the brand's About page.

## research.md layout
```
# <Brand>: research (<date>)
## Products worth explaining
## Their voice
## What customers say (verbatim, with sources)
## Facts we can use (claim -> source)
## Topics
```
