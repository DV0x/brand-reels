// film.mjs: a worked example of the kit. Copy it into a project, then rewrite the world and the action for the real story.
// The story and the words here are placeholders that show how the pieces fit together. Never reuse them.
//
// The shape to keep: one hero object (the product) that something happens to, one continuous world the camera travels
// through, something new every 1.5 to 2 s, every action with a sound cue, statements built into the scene, and a
// hard cut only into the end card.
// Two layers: draw() is the world, which the medium (look) remakes; over() is the crisp layer: the product photo, the
// hands in front of it, the words and marks. The medium never touches over(). See references/craft.md.
export default function film(K) {
  const { T, W, H } = K;
  const C = {
    wall: '#EADFCB', tile: '#E2D3B8', grout: '#D2C0A0', counter: '#B88A5E', counterTop: '#D3AC80', shelf: '#9C6E45',
    stove: '#3A393E', steel: '#A3A8AD', flame: '#F2A23A', cup: '#7D998C', cupDark: '#46574F', ink: '#2A211A', red: '#C8322B', cream: '#FFF8EC',
  };
  const P = K.product('main');
  const t2 = T.at('l2'), t3 = T.at('l3'), t4 = T.at('l4'), t5 = T.at('l5'), cardAt = t5 - 0.15;

  // the camera: a world wider than the frame, travelled through rather than cut
  const cam = K.camera([
    { t: 0, x: 560, y: 900, z: 1.04 },
    { t: t2 + 0.3, x: 560, y: 930, z: 1.13, e: 'warm' },
    { t: t3 + 0.35, x: 560, y: 930, z: 1.13 },
    { t: t3 + 1.7, x: 1640, y: 960, z: 1.02, e: 'inOut' },
    { t: t4 + 0.1, x: 1640, y: 960, z: 1.02 },
    { t: t4 + 0.9, x: 1660, y: 1010, z: 1.32, e: 'warm' },
  ]);

  // where the product is: on the shelf by the stove, carried across, then on the cupboard shelf
  const lift = t3 + 0.35, land = t3 + 1.7;
  const prodAt = t => {
    if (t < lift) return [560, 1090];
    if (t > land) return [1640, 1130];
    const k = K.ease.inOut(K.seg(t, lift, land));
    return [K.lerp(560, 1640, k), K.lerp(1090, 1130, k) - Math.sin(Math.PI * k) * 90];
  };

  // ---------- the world (static parts are drawn once and cached)
  const wall = K.cache('wall', 2600, 2400, g => {
    g.fillStyle = C.wall; g.fillRect(0, 0, 2600, 2400);
    const r = K.rng(4);
    for (let y = 520; y < 1180; y += 92) for (let x = 0; x < 2600; x += 92) { g.fillStyle = K.jitter(C.tile, r, 0.03); g.fillRect(x + 3, y + 3, 86, 86); }
    g.fillStyle = C.grout; g.fillRect(0, 1176, 2600, 6);
  });
  const stoveShelf = (g, t) => {
    g.fillStyle = C.shelf; g.fill(K.roundRect(330, 1090, 520, 34, 8));
    g.fillStyle = K.shade(C.shelf, -0.25); g.fillRect(345, 1124, 490, 10);
    // the stove below, its flame breathing
    g.fillStyle = C.stove; g.fill(K.roundRect(280, 1300, 640, 230, 18));
    g.fillStyle = C.steel; g.fillRect(300, 1290, 600, 18);
    for (const bx of [440, 760]) {
      const f = 0.85 + 0.15 * K.noise(t * 6, bx, 3);
      g.fillStyle = C.flame; g.fill(K.ellipse(bx, 1282, 70 * f, 12 * f));
      g.fillStyle = '#FFD27A'; g.fill(K.ellipse(bx, 1282, 40 * f, 6 * f));
    }
  };
  const cupboard = (g, t) => {
    g.fillStyle = C.cupDark; g.fill(K.roundRect(1380, 760, 520, 560, 14));
    g.fillStyle = K.shade(C.cupDark, -0.3); g.fillRect(1400, 1130, 480, 22);
    // the door, swung open
    const open = K.settle(t, t3 + 0.9, 0.6);
    g.save(); g.translate(1900, 760); g.scale(Math.max(0.12, 1 - 0.88 * open), 1);
    g.fillStyle = C.cup; g.fill(K.roundRect(-520, 0, 520, 560, 14));
    g.fillStyle = K.shade(C.cup, -0.15); g.fill(K.roundRect(-470, 40, 420, 480, 10));
    g.restore();
  };
  const counter = g => {
    g.fillStyle = C.counterTop; g.fillRect(-400, 1530, 3400, 40);
    g.fillStyle = C.counter; g.fillRect(-400, 1570, 3400, 900);
  };

  // ---------- the end card (a hard cut into it is the one cut we allow): the ground is painted, the product is not
  const endCardWorld = g => { g.fillStyle = C.cream; g.fillRect(0, 0, W, H); K.contact(g, W / 2, 1120, 240, 30, 0.28); };
  const endCard = (g, t) => {
    P.draw(g, { x: W / 2, y: 1120, h: 470, t, at: cardAt + 0.05, enter: 'pop', rot: -0.03 });
    K.statement(g, t, 'l5', { x: W / 2, y: 420, size: 92, align: 'center', font: 'Fraunces', color: C.ink });
    K.text(g, 'EXAMPLE BRAND', W / 2, 1212, { size: 44, weight: 700, align: 'center', color: C.ink, alpha: K.p(t, cardAt + 0.6, 0.4), t });
    K.sparkle(g, W / 2 + 170, 700, t, cardAt + 0.7);
  };

  return {
    look: 'painted',     // the medium: painted | silkscreen | one of your own in media.custom; or t => ... to switch
    media: { focus: [{ x: 560, y: 900, r: 380 }] },   // painted: finer strokes where the eye goes
    motion: 'warm',      // warm | playful | crisp (from the brand's voice)
    music: 'warm',       // warm | bright | calm | none
    background: C.wall,
    captions: { font: 'Jost', emph: { family: 'Fraunces', italic: true, weight: 500 } },
    // shots: for the contact sheet and the cut count. cut: false = the camera travels into it.
    shots: [
      { name: 'Hook: by the stove', from: 0, to: t2 },
      { name: 'The heat reaches it', from: t2, to: t3, cut: false },
      { name: 'Into the cupboard', from: t3, to: t4, cut: false },
      { name: 'The date on the jar', from: t4, to: cardAt, cut: false },
      { name: 'End card', from: cardAt, to: T.dur },
    ],
    // every action has a sound; the QA counts these as events
    cues: [
      { t: 0.55, sfx: 'thud' }, { t: t2 - 0.2, sfx: 'steam', dur: 3, gain: 0.9 },
      { t: T.word('l2', 'heat'), sfx: 'whoosh', gain: 0.6 }, { t: T.word('l2', 'changes'), sfx: 'crinkle', dur: 0.3, gain: 0.5 }, { t: T.word('l2', 'tastes') + 0.1, sfx: 'pop' },
      { t: t3 - 0.1, sfx: 'swish' }, { t: lift, sfx: 'click' }, { t: t3 + 0.5, sfx: 'whoosh', dur: 1 },
      { t: t3 + 0.9, sfx: 'door' }, { t: land, sfx: 'thud', gain: 0.8 },
      { t: T.word('l3', 'made'), sfx: 'pop' },
      { t: t4 + 0.9, sfx: 'marker' }, { t: T.word('l4', 'says'), sfx: 'stamp' }, { t: T.word('l4', 'packed'), sfx: 'tick' },
      { t: cardAt, sfx: 'paper' }, { t: cardAt + 0.7, sfx: 'sparkle', gain: 0.7 },
    ],
    draw(g, t) {
      if (t >= cardAt) return endCardWorld(g);
      // far: the wall moves a little less than the room
      K.view(g, cam, t, 0.85, () => g.drawImage(wall, -700, 0));
      // the room
      K.view(g, cam, t, 1, () => {
        stoveShelf(g, t); cupboard(g, t); counter(g);
        const [x, y] = prodAt(t);
        K.contact(g, x, y, 170, 18, 0.3);
        // heat from the stove, rising past the jar during line 2
        const heat = K.fade(t, t2 - 0.2, t3 + 0.6, 0.5, 0.6);
        K.wisps(g, 440, 1270, t, { n: 3, h: 520, w: 60, color: '#F6B66A', alpha: 0.5, strength: heat });
        K.wisps(g, 760, 1270, t, { n: 2, h: 460, w: 50, color: '#F6B66A', alpha: 0.45, strength: heat, seed: 7 });
      });
    },
    over(g, t) {
      if (t >= cardAt) return endCard(g, t);
      let rect = null;
      K.view(g, cam, t, 1, () => {
        const [x, y] = prodAt(t);
        // it shivers when the heat reaches it
        const shiver = K.p(t, T.word('l2', 'changes'), 0.15, 'linear') * (1 - K.p(t, T.word('l2', 'changes') + 0.6, 0.3, 'linear'));
        rect = P.draw(g, { x, y, h: 440, t, at: 0.15, enter: 'drop', rot: -0.025 + Math.sin(t * 40) * 0.012 * shiver });
        // a hand carries it across
        const handIn = K.p(t, t3 - 0.15, 0.45), handOut = K.p(t, land + 0.15, 0.5);
        if (handIn > 0 && handOut < 1) K.hand(g, { x: x + 250 + (1 - handIn) * 500 + handOut * 600, y: y - 140, rot: -1.45, pose: 'hold', t, scale: 1.25, sleeve: '#3E5C76' });
      });
      // screen-space notes over the room
      if (rect) {
        const s = K.toScreen(cam, t, [rect.x + 40, rect.y - 380]);
        K.label(g, 'Right above the stove', { x: 540, y: 1010, to: s, t, at: T.word('l2', 'tastes'), until: t3 + 0.2, size: 40, bg: C.cream, color: C.ink });
        K.label(g, 'Cool and dark', { x: 470, y: 640, to: K.toScreen(cam, t, [1500, 900]), t, at: T.word('l3', 'made'), until: t4 + 0.6, size: 40, bg: C.cream, color: C.ink });
        const f = K.toScreen(cam, t, rect.point(P.w * 0.5, P.h * 0.62));
        K.mark(g, f[0], f[1], 150, 70, K.p(t, t4 + 0.9, 0.5, 'out'), { color: C.red });
        K.stamp(g, 'PACKED ON', 540, 600, t, T.word('l4', 'says'), { size: 56, color: C.red, rot: -0.09 });
        K.tick(g, f[0] + 170, f[1] - 40, 60, K.p(t, T.word('l4', 'packed'), 0.3, 'out'));
      }
      K.statement(g, t, 'l1', { x: 120, y: 400, size: 92, maxW: 780, color: C.ink, until: t2 + 0.3 });
    },
  };
}
