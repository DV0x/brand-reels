# Tools: every command, its options, exit codes and fixes

When to use each command is in SKILL.md and [research.md](research.md). If a command or an option is not here, it does
not exist: never open a script's code.

## Contents
1. Running a script (the launcher)
2. site.mjs: the brand's website and the product's photos
3. reviews.mjs: the product's reviews, read and counted
4. ads.mjs: Meta's Ad Library
5. reddit.mjs: Reddit
6. The web: WebSearch and WebFetch
7. Keys
8. Exit codes
9. Credits, limits and pictures

## 1. Running a script (the launcher)
`<skill>` below is this skill's folder: the folder that holds `SKILL.md` (in Claude Code, `${CLAUDE_SKILL_DIR}`). The
launcher sits two levels up, in the plugin's `runtime/` folder.

- macOS and Linux: `bash "<skill>/../../runtime/run.sh" "<skill>/scripts/<script>.mjs" <args>`
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "<skill>/../../runtime/run.ps1" "<skill>/scripts/<script>.mjs" <args>`

In the guides, `RUN <script> <args>` means that command. It uses the computer's own Node.js when it is version 18 or
newer; otherwise the first run downloads a portable copy (checked against a pinned SHA-256) into `~/.code-video`, and
later runs reuse it. It needs no admin rights. Don't install anything yourself. Every script prints its usage with
`--help`.

| Launcher error | Fix |
|---|---|
| `unsupported platform` or `musl Linux` (exit 3) | this computer has no pinned build: tell the user (macOS, Linux with glibc and Windows work) |
| `download failed` (exit 4) | no internet, or the network blocks it: check, then run again |
| `checksum mismatch` (exit 5) | the download was changed or broken; nothing was installed. Run again; if it repeats, tell the user |

**Where the scripts save,** so every run looks the same:

| What | Where |
|---|---|
| the site skim | `<brand>/site.json` |
| the product's photos and page data | `<brand>/<product>/data/product/` |
| the product's reviews | `<brand>/<product>/data/reviews.json` |
| which page runs a brand's ads; ad searches | `<brand>/<product>/data/ads/` |
| one page's ads and their pictures | `<brand>/<product>/data/ads/<page name>/` (`ads.json`, `pics/`) |
| Reddit posts and threads | `<brand>/<product>/data/reddit/` |

## 2. site.mjs: the brand's website and the product's photos
| Command | What it does |
|---|---|
| `RUN site.mjs <url> --out <brand>` | writes `<brand>/site.json` and prints a summary: products (a Shopify store gives all of them), prices, photo counts and sizes, fonts, colours, the logo's address, some of the brand's own copy |
| `RUN site.mjs <url> --product <handle \| n \| url> --out <brand>/<product>/data/product` | that product's photos at full size, `product.json` (title, price, description), and any reviews printed on the page |

Shopify stores are read from `/products.json`; other sites from the page's product data (JSON-LD) and `og:image`. The
script often misses the ingredients, the claims and the FAQ: open the product page itself with WebFetch. Look at the
photos with the Read tool, because many brands print their claims only inside them.

| Error | Fix |
|---|---|
| `no product "<x>"` (exit 2) | use a handle or a number from the list the first command printed |
| `could not read that product page` (exit 1) | open the page with WebFetch, and ask the user for photos if you need them |
| `could not open <site>` (exit 1) | the site didn't answer, or turned this computer away (the message says which): open it with WebFetch. With a Bright Data key (section 7), the scripts get its pages themselves |
| the summary lists no products | not a Shopify store: open the likely product pages with WebFetch |

## 3. reviews.mjs: the product's reviews, read and counted
| Command | What it does |
|---|---|
| `RUN reviews.mjs <product page url> --out <brand>/<product>/data` | finds the shop's review app on the page (Judge.me, Loox, Nector's review list, Yotpo, Okendo, HealthKart's own system as on hkvitals.com, or the reviews of a shop built on Farzi, as on plixlife.com; when a page carries several apps, the one whose review box is on the page), reads every review to the end, saves `reviews.json`, and prints the apps found, how many were read (and how many the app reports), the average, the stars, the dates and the newest three. A product with no reviews yet ends normally and says so. `--max n` stops at n reviews (default 5,000) |
| `RUN reviews.mjs count <reviews.json> "<word\|word>" ["<word\|word>" ...]` | for each group of words: how many reviews use any of them, split by stars, with 3 example lines (`--examples n`). A word matches at the start of a word, so `bloat` also counts "bloating"; a phrase matches with any spacing |
| `RUN reviews.mjs read <reviews.json>` | prints the reviews themselves. Filters: `--stars 1-3` (or `5`), `--search "<word\|word>"`. Then `--sample n` (a random n; the same `--seed` gives the same sample) or `--newest n`. `--chars n` cuts each review (default 600) |

A count is a review count: a review that says "light" three times counts once in that group. Read a few hits of a
count before you trust it: a word can mean something else ("light" the colour; "not heavy" said of the price).

| Error | Fix |
|---|---|
| `this page uses <app>` or `no review app this script knows` (exit 1) | read the reviews the page itself shows (WebFetch), and search the web for the product's reviews on marketplaces (Amazon, and the country's own: Nykaa or Flipkart in India): the snippets show customers' words. Say in `BRIEF.md` that the shop's own reviews could not be counted. Ali Reviews, Ryviu, Trustify and Amazon reviews shown through Buy with Amazon are named, not read |
| `this product has no reviews yet` (exit 0) | not an error: run it on the shop's product with the most reviews (often its best seller), or use the marketplaces' reviews |
| `could not open the product page` (exit 1) | the same fallback as the first row |
| `turned this computer away` (exit 1) | with a Bright Data key (section 7) the script gets the page itself; without one, the same fallback as the first row. In `LEARNINGS.md`, write that the shop turned *this computer* away: from another computer it may open |
| `not the Shopify product id` (exit 1) | give the product's own page, with `/products/<name>` in its address |
| `found <app>, but not … in the page`, `<app> did not hand out …`, `<app> counts N reviews … but handed out none` (exit 1) | the same fallback as the first row |
| `Bright Data refused the key` or `Check BRIGHTDATA_ZONE` (exit 1) | ask the user for the right key or zone name |
| `Bright Data could not fetch it either` (exit 1) | the same fallback as the first row |
| `no file at <path>` (exit 2) | run the first command first |

## 4. ads.mjs: Meta's Ad Library
Live ads only, in one country (`--country`, default `IN`). Every command prints the credits it used and what is left.

| Command | What it does |
|---|---|
| `RUN ads.mjs page "<brand name>" --site <web address> --out <brand>/<product>/data/ads` | which Facebook page runs a brand's ads, for the brand and for each rival. It reads the site's own Facebook and Instagram links, searches pages by name, and searches every live ad for the web address. The evidence, strongest first: the page's ads link to the site; the site links to the page; a handle matches the web address; the exact name. **Never likes:** a big page with the same name is often a stranger. Prints `CONFIRMED` or `NOT CONFIRMED` and saves `page-<name>.json`. 2 credits; up to 5 when it must read pages' own ads or search the name |
| `RUN ads.mjs pull <page id> --out <brand>/<product>/data/ads/<page name>` | the page's live ads: Meta's total for the page, then up to 30 ads, most seen first. Each with its days running, format, copies and words, the link, and its picture(s) if it is a still ad, saved small in `pics/`. Saves `ads.json`. 1 credit |
| `RUN ads.mjs search "<words>" --out <brand>/<product>/data/ads` | live ads from any page that use the words (the product type, a claim, a want), grouped by page: to find rivals the user didn't name. `--exact` for an exact phrase. 1 credit |

Options for `pull`: `--sort newest` (newest first; the default, most seen first, shows what the brand pays most to
show), `--more n` (n more pages of 10 ads, 1 credit each), `--stills` (still pictures only), `--pictures n` (pictures
kept per ad, default 4), `--country XX`.

**Reading an ad's numbers.**
- **Days running,** in bands: a test (under 7 days), settling (7 to 13), kept (14 to 29), a survivor (30 to 59), a
  long-runner (60 and more). A brand keeps paying for an ad that sells, so survivors and long-runners are the nearest
  thing to its sales numbers. A new ad says only that the brand is testing it.
- **Copies:** the same ad running several times at once. Two or more means the brand is pushing it.
- **Format:** single image, image set (one ad, several pictures; Meta picks one for each person), carousel, video,
  video set, catalog (the shop's product feed, with no words of its own).

| Error | Fix |
|---|---|
| `NOT CONFIRMED` (exit 0) | try the brand's short name, or the name buyers use; ask the user which page runs their ads (step 2). Never pick a page by likes |
| `ScrapeCreators' credit is empty` (exit 1) | tell the user to top it up; nothing else reads the Ad Library |
| `ScrapeCreators refused the key` (exit 1) | the key is wrong or expired: ask the user for a new one |
| `no SCRAPECREATORS_API_KEY` (exit 1) | section 7 |
| `No live ads read` (exit 0) | the page shows nothing live in this country; the brand may advertise from another page (`page`) |

## 5. reddit.mjs: Reddit
Run it first: it finds the user's Reddit app keys by itself (section 7). Only if it says there are none, use WebSearch
(`site:reddit.com <words>`) and WebFetch.

| Command | What it does |
|---|---|
| `RUN reddit.mjs search "<words>" --out <brand>/<product>/data/reddit` | posts that match, with points, comment counts and dates. `--sub <community>` searches inside one community; `--sort relevance\|top\|new\|comments`; `--time all\|year\|month\|week`; `--max n` (default 25) |
| `RUN reddit.mjs thread <link or post id> --out <brand>/<product>/data/reddit` | one post and its comments, best first, with the hidden "load more" comments opened. `--max n` comments (default 200), `--chars n` per comment (default 500) |
| `RUN reddit.mjs sub <community>` | whether a community exists, and how many members it has: check before you search inside one you only remember |

Reddit shapes a hook; it is never printed as a customer's words (SKILL.md, rules).

| Error | Fix |
|---|---|
| `no Reddit keys` (exit 1) | use WebSearch and WebFetch instead, or ask the user for a `.env` path that holds them |
| `Reddit refused the request (HTTP 401 or 403)` (exit 1) | the keys are wrong: ask the user, or use web search |

## 6. The web: WebSearch and WebFetch
Claude Code's own tools, not scripts. **WebFetch:** the product page itself (ingredients, claims, FAQ), the brand's
About and FAQ pages, a Reddit thread when there are no keys. **WebSearch:** marketplace reviews of the product
(`"<brand> <product>" reviews`, Amazon and the country's own marketplaces), what people ask about the product type,
Reddit when there are no keys. A search result's snippet is a lead: open the page before you count it as evidence.

## 7. Keys
| Key | Used by | Needed? |
|---|---|---|
| `SCRAPECREATORS_API_KEY` | `ads.mjs` | yes: without it, no ads can be read |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | `reddit.mjs` | optional |
| `BRIGHTDATA_API_KEY`, `BRIGHTDATA_ZONE`, `BRIGHTDATA_COUNTRY` | `site.mjs`, `reviews.mjs` | optional: only used when a shop turns this computer away |

A script looks for a key in this order: `--key-file <path>` (a `.env` file the user names), the environment, a `.env`
file in the folder you run from. Ask the user once, in step 2, for the key or the path; never search their computer or
other projects for keys, and never print one.

With the Bright Data key and zone, when a shop's own site answers with an error that walls use or a "checking your
browser" page, the script asks Bright Data for the same page: a paid service that fetches it through ordinary home
connections. Only the shop's own pages go that way, never review apps or other services. At most 60 requests a run (a
blocked shop needs about 10); the free allowance is 5,000 a month. The saved files say `"via": "bright data"`. It
fetches as if from India unless `BRIGHTDATA_COUNTRY` names another country (two letters, such as `us` or `gb`): set it,
like the zone, for a shop outside India.

## 8. Exit codes
| Code | Meaning |
|---|---|
| 0 | done |
| 1 | failed: the message says why and how to fix it |
| 2 | wrong call: a missing or wrong argument, or a file not made yet; the usage line follows |
| 3, 4, 5 | the launcher only: platform, download, checksum (section 1) |

Read the error, fix the cause and run again. Go back to the user only for something only they can give (a key, a
top-up, a decision).

## 9. Credits, limits and pictures
- **Ad Library credits:** `page` 2 to 5, `pull` 1 (and 1 per `--more`), `search` 1. One product with 3 to 5 rivals
  uses about 15 to 30.
- **Ad pictures die:** the Ad Library's picture links stop working after about 48 hours, so `pull` saves the pictures
  at once, small (about 600 px). Pull again for fresh ones; the saved files stay.
- **Pictures fill your memory:** every picture you look at stays in your context. Look at the long-running still ads
  first, a few at a time, and write what you saw into `research.md` as you go.
- **Reddit** allows 1,000 calls in 10 minutes; the script waits when Reddit says it is close.
- **Reviews** are read once per product; a big one takes a minute or two. Judge.me hands out about 990 from each end,
  so a product with more than 1,980 misses the middle (the summary says how many); Loox gives 10 or 20 a page.
