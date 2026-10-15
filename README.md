# Brand Reels for Claude

**Explainer reels for your brand, made entirely in code.** No image generation, no video generation, no stock footage. Give Claude your website: it researches the brand, writes a script you approve, and renders a 30-to-35-second 9:16 reel with voice, captions, music and sound, in your brand's own colours, fonts and logo.

New styles are added to this plugin over time. **Install once, and every new style arrives in your Claude automatically.**

This repo also holds **Brand Ads**: research-driven hooks for still-image Meta ads, for skincare and supplement products ([below](#brand-ads-research-driven-hooks-for-still-image-meta-ads)).

---

## Install in 1 minute (Claude desktop app, Cowork)

1. Open the **Claude** desktop app, open the **Cowork** tab, then **Customize → Plugins** in the sidebar.
2. Click **Add marketplace** and paste:

   ```
   DV0x/brand-reels
   ```

3. Find **Brand Reels** in the list and click **Install**.
4. Turn on **Sync automatically**, so new styles show up on their own.
5. Start a **Cowork** task, connect a folder with the **+** button (Claude saves your reels there), and type:

   > **check my brand-reels setup**

   The first time, Claude runs a one-time setup (about a minute), then renders a 3-second test clip into your folder. When it says **PASS**, you're ready.

### Claude Code (terminal)

```bash
claude plugin marketplace add DV0x/brand-reels
claude plugin install brand-reels@dv0x
```

Then ask Claude to "check my brand-reels setup".

---

## Requirements

- A **paid Claude plan**, for Cowork or Claude Code.
- **macOS** (Apple Silicon or Intel) or **Windows 10/11** (64-bit). Linux (glibc, x64/arm64) works too.
- An internet connection for the first run.

### What the one-time setup does

The first run downloads the three tools the styles need into a folder in your home directory:
- **Mac:** `~/.code-video`
- **Windows:** `%USERPROFILE%\.code-video`

| Tool | Source |
|---|---|
| Node.js 22 | nodejs.org (official build) |
| ffmpeg 6 | github.com/eugeneware/ffmpeg-static |
| Skia canvas engine (`@napi-rs/canvas`) | registry.npmjs.org |

More about it:
- **Size:** about 60–70 MB, downloaded once.
- **No admin password**, and it doesn't install anything system-wide.
- **Every download is checked against a pinned SHA-256 checksum** before use.
- **Reuses your tools:** if you already have Node.js 18+ or ffmpeg with H.264 support, it uses yours.
- **To remove it:** delete that folder.

---

## Styles

| Skill | What it makes | Status |
|---|---|---|
| `product-explainer` | An explainer reel of 30 to 35 s for a D2C product, from the brand's website: research, a script you approve, 2 or 3 voices to hear and choose from, then the video in the brand's own colours, fonts and logo, with the voice recorded in one take, captions, music and sound | New |

Ask for it in plain words: "make an explainer reel for <brand website>". If you have a logo, brand fonts or a style
guide, share them: the film uses them. **The style gives the techniques; your brand gives the colours, fonts and end
card.**

| Film style (inside `product-explainer`) | Best for | Status |
|---|---|---|
| Halftone Dossier: a retro print case file | myth-busting, label honesty, hidden facts | **Tested** |
| 22 more (mid-century cartoon, Swiss motion, data storytelling, risograph, watercolor, pixel RPG and others) | | Drafts: ask for one by name; Claude says it is not tested yet |

`check-setup` is included too. It verifies your computer can render.

---

## Privacy

- **Rendering runs entirely on your computer.** Your scripts, products and videos are not uploaded anywhere by this plugin.
- **Network access:**
  - the one-time setup downloads from the three sources above
  - `product-explainer` reads the brand website you give it (pages, product data and photos)
  - `product-explainer` runs web searches through your Claude app to research the brand and what its customers say
  - `product-explainer` sends the voiceover script (and the hook, for the 2 or 3 voices you hear first) to Cartesia, using your own Cartesia API key, if you choose a voiceover

## Brand Ads: research-driven hooks for still-image Meta ads

Give Claude a skincare or supplement product link. Before writing a word, it reads the product's reviews and counts what buyers want, checks which ads rivals have kept paying for in Meta's Ad Library, and reads what people ask on Reddit. Then it writes hooks in different shapes, each with its evidence, and shows you the best 2 or 3 angles to approve.

- **Every hook shows its evidence:** how many reviews share the want, the buyers' own words, and which rivals run the angle.
- **It never invents a customer.** Quotes are word for word from the brand's own reviews; claims and numbers exactly as the brand publishes them.
- **Checked against Meta's rules and the country's own ad rules** (in India, ASCI and FSSAI).
- **You approve twice:** a few questions first, then the hooks. Your folder gets `research.md`, `HOOKS.md` and `BRIEF.md`.
- **Hooks only for now;** pictures come in a later version.

### Install (Claude Code)

```bash
claude plugin marketplace add DV0x/brand-reels
claude plugin install brand-ads@dv0x
```

Then share a product link: "make ad hooks for <link>".

### What it needs

- A **ScrapeCreators API key**, to read Meta's Ad Library (required). A run uses about 15 to 30 credits.
- Optional: **Reddit app keys** (without them, Reddit is read through web search), and a **Bright Data** key and zone, for shops that turn scripts away.
- Put the keys in a `.env` file in your work folder.
- It reads reviews from Judge.me, Loox, Yotpo, Okendo, Nector, HealthKart's own sites and shops built on Farzi. Elsewhere it uses the reviews shown on the page and marketplace reviews.
- Tested in Claude Code, not yet in Cowork. With Claude Code's sandbox switched on, the scripts can't reach the internet.

### Privacy

It reads the product's pages and public reviews; Meta's Ad Library through ScrapeCreators (your key); Reddit (your keys, if given); and Bright Data only when a shop turns it away and you've given a key. It sends nothing about your brand anywhere else.

---

## Licenses

- This plugin: MIT
- `@napi-rs/canvas`: MIT
- Node.js: MIT
- ffmpeg-static builds: GPL. They are downloaded to your computer, not redistributed here.
- Fonts: SIL Open Font License 1.1 (see each skill's `assets/fonts/`)
