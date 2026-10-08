# Ad Styles for Claude

**Scroll-stopping video ads made entirely in code.** No image generation, no video generation, no stock footage. Each style is a Claude skill: describe your product and offer, and Claude writes the ad and renders a 9:16 video with sound.

New styles are added to this plugin over time. **Install once, and every new style arrives in your Claude automatically.**

---

## Install in 1 minute (Claude desktop app, Cowork)

1. Open the **Claude** desktop app and go to **Customize → Plugins**.
2. Click **Add → Add marketplace** and paste:

   ```
   DV0x/ad-styles
   ```

3. Find **Ad Styles** in the list and click **Add**.
4. Turn on **Sync automatically**, so new styles show up on their own.
5. Start a **Cowork** task and type:

   > **check my ad-styles setup**

   The first time, Claude runs a one-time setup (about a minute), then renders a 3-second test clip into your folder. When it says **PASS**, you're ready.

### Claude Code (terminal)

```bash
claude plugin marketplace add DV0x/ad-styles
claude plugin install ad-styles@dv0x
```

Then ask Claude to "check my ad-styles setup".

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
| `product-explainer` | An explainer reel of about 30 s for a D2C product, from the brand's website: research, a script you approve, then the video with voice, captions, music and sound | New |

Ask for it in plain words: "make an explainer reel for <brand website>".

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
  - `product-explainer` sends the voiceover script to Cartesia, using your own Cartesia API key, if you choose a voiceover

## Licenses

- This plugin: MIT
- `@napi-rs/canvas`: MIT
- Node.js: MIT
- ffmpeg-static builds: GPL. They are downloaded to your computer, not redistributed here.
- Fonts: SIL Open Font License 1.1 (see each skill's `assets/fonts/`)
