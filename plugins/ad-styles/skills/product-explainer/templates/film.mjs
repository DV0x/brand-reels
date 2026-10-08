// film.mjs: the film, written from TREATMENT.md. Copy this file into the project as film.mjs.
// It is an empty skeleton, not a story: there are no scenes, props or words in it, and nothing appears on screen
// unless one of your scenes draws it. Read references/directing.md (the method) and references/film-api.md (the API).
//
// The order of work:
//   1. The timeline, from the treatment's cue map: the music grid, the lines placed on it (script.json "at" and
//      "anchor", then voice.mjs), the shots, the hits.
//   2. The style frames: finish the 3 scenes the treatment names first (one is the signature shot) and review them.
//   3. The other scenes.
//   4. The score, from the cue map, in the style's sound palette.
//   5. A sound for every visible action.
export default function film(K) {
  const { T, W, H } = K;
  const D = K.style;                  // the style's drawing kit, if it has one (STYLE.md section 10); else your style.mjs
  const P = K.product('main');        // the real product photo (product/main.png); draw it in a scene's over()

  // ---------------------------------------------------------------- 1. the timeline: one source of truth
  // The music grid comes first. Every cut, big hit and caption lands on it; the voice lines are placed on it in
  // script.json. Times come from words (T.word, T.at, T.end) or the grid (G.barStart), never from typed guesses.
  const G = K.grid(120, 0);           // TODO: the treatment's tempo and first downbeat (seconds)
  const on16 = t => G.snap(t, 'nearest', G.beat / 4);   // a hit lands on the 16th note nearest its word

  // The shot list, in order. cut: true is a hard cut (the contrast tool, rare); 'wipe' is the style's own transition;
  // false continues the camera.
  const SHOTS = [
    // { name: 'shot 1', from: 0, to: T.at('l3'), cut: true },
  ];
  const hits = [];                    // every big hit, checked against the grid: hit(t, 'stamp')
  const cues = [];                    // one sound per visible action: cue(t, 'paper', 0.8)
  const hit = (t, name = '') => { hits.push({ t, name }); return t; };
  const cue = (t, sfx, gain = 1, o = {}) => { cues.push({ t, sfx, gain, ...o }); return t; };

  // ---------------------------------------------------------------- 2. the camera: one world -> screen function
  // Keys from the shot list (with D, D.camera adds shakes and the style's beat pulse). Anything that follows a subject
  // goes through K.toScreen(cam, t, [x, y]).
  const cam = K.camera([{ t: 0, x: W / 2, y: H / 2, z: 1 }]);

  // ---------------------------------------------------------------- 3. the scenes: only what the treatment lists
  // One entry per shot name. draw() is the world in the style; over() is the real product and anything in front of it
  // (no medium or texture lands on it); top() is transitions and flashes. Register sounds and hits here, at setup.
  const SCENES = {
    // 'shot 1': { draw(g, t) { }, over(g, t) { }, top(g, t) { } },
  };
  const shotAt = t => SHOTS.find(s => t >= s.from && t < s.to) || SHOTS[SHOTS.length - 1];
  const sceneAt = t => (shotAt(t) && SCENES[shotAt(t).name]) || {};

  return {
    background: D ? D.C.paper : '#F3EBDD',
    captions: D ? D.captions : undefined,    // the style's caption design (else the kit's default)
    finish: D ? D.finish : undefined,        // the medium over the world: paper, dust
    motion: 'playful',
    draw(g, t) { const sc = sceneAt(t); K.view(g, cam, t, 1, () => sc.draw?.(g, t)); },
    over(g, t) { const sc = sceneAt(t); K.view(g, cam, t, 1, () => sc.over?.(g, t)); },
    top(g, t) { sceneAt(t).top?.(g, t); },
    shots: SHOTS,
    hits,
    cues,
    // ---------------------------------------------------------------- 4. the score, composed from the cue map
    music: {
      bpm: G.bpm, offset: G.offset, end: T.endCard,
      score(S) {
        // Write it section by section from the treatment's cue map, in the style's sound palette (STYLE.md section 7):
        // S.at(bar, beat) gives a time on the grid; notes are MIDI numbers or names ('F2', 'C4').
        // S.silence(a, b) empties the music before a big hit, so the hit lands alone.
      },
    },
  };
}
