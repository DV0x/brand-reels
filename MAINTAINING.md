If you are making a film for a user, go back to SKILL.md: nothing here applies.

# Maintaining Ad Styles

**For the repository owner only.** This file is outside the plugin folder, so an agent making a film never reads it.

## The layout
| Part | Where | Who reads it |
|---|---|---|
| The plugin | `plugins/ad-styles/` (runtime, `check-setup`, `product-explainer`) | users install it; the agent reads it |
| The user's work | `<brand>/<film>/` in the user's own folder | the agent writes it |
| The owner side | this file, `style-template/`, `.github/`, the READMEs | the owner only |

The repository root is a plugin marketplace (`.claude-plugin/marketplace.json`, name `dv0x`) with one plugin,
`plugins/ad-styles`. Every style is a folder inside the `product-explainer` skill, so a new style reaches every user on
their next update.

## Add a style
A style is "tested" when one film in it has been approved by the user. Only tested styles are in the menu in
`SKILL.md`; the others stay as drafts. The test film is never shipped: the skill has no example films.

1. **The style file.** Start from `style-template/STYLE.md`. If lemo-opuscar has the style
   (`~/projects/lemo-test/lemo-opuscar/styles/<slug>/STYLE.md`), copy its text word for word, keep its named
   references ("grammar only, never copy"), and add only notes marked **For 9:16 reels** (the template lists them),
   plus our section 12. Check that every line and number of its sections 1 to 9 and 11 survives. No story in the file.
2. **The drawing kit.** `styles/<slug>/engine.mjs`: the style's parts as pure functions of t (paper or ground, marks,
   type, captions, transitions, the product treatment), with no story, scene list or defaults. Bundle its fonts in
   `styles/<slug>/fonts/` with their licence files (OFL or similar). Add every call and option to `film-api.md` in a
   section of its own: the agent must never need to open `engine.mjs`.
3. **One test film,** made in a work folder outside this repository, by the skill's own workflow.
   - The user approves a style frame before the film is built, then the finished film (watched with sound).
   - The machine checks pass: `render.mjs check` PASS; `out/report.json` with 0 decode errors, 0 frozen stretches,
     loudness −14 LUFS ±1; length 25 to 35 s.
   - Turn each number that worked into a rule in the style file (in a marked note if lemo's text has a different one).
4. **The menu,** by hand: move the style from the drafts line to the table in `SKILL.md` ("The styles"), and add it to
   the style table in `README.md`.
5. **The notices:** add the style's fonts and any adapted text or code to `plugins/ad-styles/THIRD-PARTY-NOTICES.md`.
6. **Size:** no videos or test films in the repository. A plugin is limited to 200 MB and 5,000 files.

## Add a benchmark entry
`plugins/ad-styles/skills/product-explainer/references/benchmarks.md` is the bar for every film. An entry must be real
and elite, with its numbers checked at the source:
- **The bar:** 5M+ views; or 10 times the account's followers and 1M+ views; or a Cannes Lions Grand Prix or Gold; or a
  reported business result (sales, revenue, a product change).
- **Sources** linked at the end of the file, with the date checked. A number from an award entry or the brand itself is
  marked "brand's own figure".
- **At most 2 entries per account.** Never a test run of ours, never our own film.
- Write the hook or the film's beats in our own words (no copied scripts), and the grammar it teaches.
- Add the entry's number to the technique table in `references/copy.md` ("Techniques"): that table is the only list of
  techniques.

## Test the skill with a new agent
Do this after any change to the guides or the tools, before a release.
1. In a new, empty folder, start a new Claude Code chat and install the plugin from this folder:
   `/plugin marketplace add ~/projects/ad-styles`, then `/plugin install ad-styles@dv0x`.
2. The owner asks for a reel for a brand the skill has not seen, as a real user would, answers the one round of
   questions and approves the script. The agent works to the end alone, with no help from another chat.
3. **It passes when:**
   1. the machine checks pass;
   2. the owner says the film is good or better;
   3. the agent's context stays under 400,000 tokens;
   4. its hooks and script reuse no words or subject from `benchmarks.md`;
   5. its problem list has nothing that stops the work;
   6. the film is 25 to 35 s.
4. Then read its `REVIEW.md`, `DELIVERY.md` and brand folder, measure its tokens, fix the skill, and commit.

## Release
1. **Version:** raise `version` in `plugins/ad-styles/.claude-plugin/plugin.json` on every release (patch for fixes,
   minor for a new style or a new skill). Apps detect updates by version. Never change the plugin name (`ad-styles`)
   or the marketplace name (`dv0x`): users' installs are keyed on them.
2. **Validate:** `claude plugin validate plugins/ad-styles` and `claude plugin validate .`
3. **Push** the branch, and wait for the `check-setup` workflow (`.github/workflows/check-setup.yml`) to pass on macOS,
   Windows and Linux. Then merge to `main`. Users with automatic sync get it by themselves.

## Runtime pins
`runtime/run.sh` and `runtime/run.ps1` pin exact versions and SHA-256 hashes: Node.js 22.23.3, ffmpeg-static b6.1.1,
@napi-rs/canvas 1.0.9. To upgrade one: download each platform's file, compute `shasum -a 256`, check canvas tarballs
against npm's `dist.integrity`, update **both** launchers and the version in `render.mjs`'s cache fallback
(`canvas-<ver>`), and let CI confirm every OS. Rendering never uses a browser, the network or npm installs: the canvas
API and ffmpeg only, and every frame is a pure function of time.
