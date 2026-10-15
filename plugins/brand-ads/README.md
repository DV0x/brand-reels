# Brand Ads for Claude

**Research-driven hooks for still-image Meta ads, for skincare and supplement products.** Part of [DV0x/brand-reels](https://github.com/DV0x/brand-reels).

Give Claude a skincare or supplement product link. Before writing a word, it reads the product's reviews and counts what buyers want, checks which ads rivals have kept paying for in Meta's Ad Library, and reads what people ask on Reddit. Then it writes hooks in different shapes, each with its evidence, and shows you the best 2 or 3 angles to approve.

- **Every hook shows its evidence:** how many reviews share the want, the buyers' own words, and which rivals run the angle.
- **It never invents a customer.** Quotes are word for word from the brand's own reviews; claims and numbers exactly as the brand publishes them.
- **Checked against Meta's rules and the country's own ad rules** (in India, ASCI and FSSAI).
- **You approve twice:** a few questions first, then the hooks. Your folder gets `research.md`, `HOOKS.md` and `BRIEF.md`.
- **Hooks only for now;** pictures come in a later version.

## Install (Claude Code)

```bash
claude plugin marketplace add DV0x/brand-reels
claude plugin install brand-ads@dv0x
```

Then share a product link: "make ad hooks for <link>".

## What it needs

- A **ScrapeCreators API key**, to read Meta's Ad Library (required). A run uses about 15 to 30 credits.
- Optional: **Reddit app keys** (without them, Reddit is read through web search), and a **Bright Data** key and zone, for shops that turn scripts away.
- Put the keys in a `.env` file in your work folder.
- It reads reviews from Judge.me, Loox, Yotpo, Okendo, Nector, HealthKart's own sites and shops built on Farzi. Elsewhere it uses the reviews shown on the page and marketplace reviews.
- Tested in Claude Code, not yet in Cowork. With Claude Code's sandbox switched on, the scripts can't reach the internet.

## Privacy

It reads the product's pages and public reviews; Meta's Ad Library through ScrapeCreators (your key); Reddit (your keys, if given); and Bright Data only when a shop turns it away and you've given a key. It sends nothing about your brand anywhere else.

## License

MIT
