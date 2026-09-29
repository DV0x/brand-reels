# Ad Styles

Make scroll-stopping video ads entirely in code, with no image or video generation. Each style is a skill. Describe your product and offer, and Claude writes the ad and renders a 9:16 video with sound on your own computer.

## Use it

- Ask Claude to **"check my ad-styles setup"** first. The `check-setup` skill runs a one-time setup and renders a 3-second test clip.
- Then ask for a style by name once styles are published.

## How it works

- `runtime/run.sh` (macOS/Linux) and `runtime/run.ps1` (Windows) make sure Node.js, ffmpeg and the Skia canvas engine are available.
- Anything missing is downloaded once into `~/.code-video`, pinned and SHA-256-verified, with no admin rights needed.
- Every style skill reuses that runtime.

## Data

- **Local only:** everything renders on your computer, and nothing you make is uploaded.
- **Network:** limited to the one-time downloads from nodejs.org, github.com (ffmpeg-static) and registry.npmjs.org.

## Licenses

- This plugin: MIT
- @napi-rs/canvas: MIT
- Node.js: MIT
- ffmpeg-static builds: GPL (downloaded, not redistributed)
- Fonts: SIL OFL 1.1
