# Releasing

The repository root is a **plugin marketplace** (`.claude-plugin/marketplace.json`, name `dv0x`). It lists one plugin, `plugins/ad-styles`.

Followers add the marketplace once. Every style is a skill inside that single plugin, so a new style reaches everyone on their next sync.

## Add a style

1. **Create the folder** `plugins/ad-styles/skills/<style-name>/` with these files:
   - `SKILL.md`: frontmatter `name: <style-name>` (it must match the folder) and a `description` written as the situations a user would be in.
   - `scripts/`: render code. It runs through the shared launcher, so never call `node` directly:
     - macOS/Linux: `bash "${CLAUDE_SKILL_DIR}/../../runtime/run.sh" "${CLAUDE_SKILL_DIR}/scripts/<entry>.mjs" ...`
     - Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File "${CLAUDE_SKILL_DIR}\..\..\runtime\run.ps1" "${CLAUDE_SKILL_DIR}\scripts\<entry>.mjs" ...`
   - `assets/`: fonts (OFL or similar, with their license files) and anything else the style bundles.
2. **Draw only with the canvas API** from `CODE_VIDEO_CANVAS_JS`, and encode with `CODE_VIDEO_FFMPEG`:
   - Don't use a browser, network or npm installs at render time.
   - Make every frame a pure function of time.
3. **Keep it small.** No videos in the repo. The marketplace archive limit is 512 MB, and a plugin is limited to 200 MB and 5,000 files.
4. **Add the style** to the Styles table in the root `README.md`.
5. **Add it to CI:** add a render step for the style to `.github/workflows/check-setup.yml`, or a new workflow, so it's tested on macOS, Windows and Linux.

## Bump the version

Apps detect updates by version. **Raise `version` in `plugins/ad-styles/.claude-plugin/plugin.json` on every release:**
- patch (0.1.x) for fixes
- minor (0.x.0) for a new style

Never change the plugin `name` (`ad-styles`) or the marketplace `name` (`dv0x`). Followers' installs are keyed on them.

## Validate and push

```bash
claude plugin validate plugins/ad-styles
claude plugin validate .
git add -A && git commit -m "Add <style-name> style" && git push
```

Wait for the **check-setup** workflow to go green on every OS before announcing the style. Followers with **Sync automatically** on get it by themselves. Others get it the next time they click **Check for updates**.

## Runtime pins

`runtime/run.sh` and `runtime/run.ps1` pin exact versions and SHA-256 hashes for:
- Node.js 22.23.3
- ffmpeg-static b6.1.1
- @napi-rs/canvas 1.0.9

To upgrade one:
1. Download each platform file.
2. Compute `shasum -a 256`.
3. Check canvas tarballs against npm's `dist.integrity`.
4. Update **both** launchers and the version in `render.mjs`'s cache fallback (`canvas-<ver>`).
5. Let CI confirm every OS.
