# Ad Styles

Make scroll-stopping video ads entirely in code, with no image or video generation. Each style is a skill. Describe your product and offer, and Claude writes the ad and renders a 9:16 video with sound on your own computer.

## Use it

- Ask Claude to **"check my ad-styles setup"** first. The `check-setup` skill runs a one-time setup and renders a 3-second test clip.
- Then ask for a skill by what it does. `product-explainer`: "make an explainer reel for <brand website>". It makes a
  reel of 30 to 35 s. Its tested style is Halftone Dossier; 22 more styles are drafts you can ask for by name.

## How it works

- `runtime/run.sh` (macOS/Linux) and `runtime/run.ps1` (Windows) make sure Node.js, ffmpeg and the Skia canvas engine are available.
- Anything missing is downloaded once into `~/.code-video`, pinned and SHA-256-verified, with no admin rights needed.
- Every style skill reuses that runtime.

## Data

- **Local rendering:** everything renders on your computer, and nothing you make is uploaded.
- **Network:**
  - the one-time downloads from nodejs.org, github.com (ffmpeg-static) and registry.npmjs.org
  - `product-explainer` reads the brand site you give it, runs web searches through your Claude app for research, and, if you want a voiceover, sends the script to Cartesia with your own key

## Licenses

- This plugin: MIT
- @napi-rs/canvas: MIT
- Node.js: MIT
- ffmpeg-static builds: GPL (downloaded, not redistributed)
- Fonts: SIL OFL 1.1
