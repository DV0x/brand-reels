---
name: check-setup
description: Checks that Ad Styles can render video on this computer, and runs the one-time setup if needed. Use when the user asks to check their ad-styles setup, test that ad-styles works, set up ad-styles, or when a style skill fails to render.
---

# Check ad-styles setup

This skill renders a 3-second, 1080×1920 test clip with sound, in the comic-print style. It proves that this computer can run every Ad Styles skill. It uses Node.js, a canvas engine (Skia) and ffmpeg. It needs no browser and no image generation.

## Steps

1. **Pick the output folder.** Use the folder the user shared or selected for this task. If there isn't one, use the current working directory.

2. **Run the render through the plugin's launcher.** Choose the launcher for this operating system. `${CLAUDE_SKILL_DIR}` is this skill's base directory.

   - **macOS or Linux:**

     ```bash
     bash "${CLAUDE_SKILL_DIR}/../../runtime/run.sh" "${CLAUDE_SKILL_DIR}/scripts/render.mjs" --out "<output folder>"
     ```

   - **Windows** (PowerShell):

     ```powershell
     powershell -NoProfile -ExecutionPolicy Bypass -File "${CLAUDE_SKILL_DIR}\..\..\runtime\run.ps1" "${CLAUDE_SKILL_DIR}\scripts\render.mjs" --out "<output folder>"
     ```

     If your shell tool on Windows is Git Bash, the macOS/Linux command also works. `run.sh` hands over to `run.ps1` by itself.

   Rules for either launcher:
   - Use a **10-minute timeout**.
   - **The first run on a computer may download** a portable Node.js, ffmpeg and the canvas engine into `~/.code-video` (`%USERPROFILE%\.code-video` on Windows):
     - about 60–70 MB, one time only
     - no admin rights needed
     - every file is checksum-verified
   - Tell the user it's a one-time setup while it runs. Later runs start instantly.
   - **Don't install anything yourself** with brew, npm, winget, choco or pip. The launcher handles setup.

3. **Report the result to the user** from the printed summary:
   - **PASS** or **FAIL**
   - where it rendered (the `platform-arch` string)
   - ms per frame and total time
   - whether the one-time setup ran
   - the output files:
     - `smoke-test.mp4`
     - `smoke-contact-sheet.png`
     - `smoke-report.json`

4. **Look at the contact sheet.** Open `smoke-contact-sheet.png` to confirm the frames aren't blank. Describe what's in them. There should be:
   - a pink halftone background
   - "THIS AD IS CODE." stacked in comic letters
   - a yellow KAPOW burst
   - a paper card saying where the clip was rendered

5. **If it fails:**
   - Quote the lines starting with `[code-video] ERROR` and the contents of `smoke-report.json`, if it exists.
   - Common causes:
     - no internet on the first run
     - a network that blocks nodejs.org, github.com or registry.npmjs.org
     - an unsupported platform. Supported: macOS (Apple Silicon or Intel), Windows 10/11 64-bit, and glibc Linux (arm64/x64).
     - on Windows, a company laptop that blocks scripts or downloads
   - Don't work around it by installing packages.

## What a PASS means

A PASS means the full style pipeline works on this computer:
- the canvas drawing API
- the compositing modes used for print effects
- bundled fonts
- the pure-JS sound synthesis
- the ffmpeg encode

`smoke-report.json` → `features` lists each probe, and `runtime` shows which Node, ffmpeg and canvas binary were used.
