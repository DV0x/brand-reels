// engine.mjs: the Halftone Dossier style (STYLE.md). A film gets it as K.style when script.json says
// "style": "halftone-dossier". It draws every element in the style: paper, halftone dots, inked props, headlines with
// misregistered shadows, rough-ink stamps, the caption bar, the HUD, dot wipes, flashes, and the evidence print that
// carries the real product photo. There is no film builder: each film writes its own scenes from its treatment
// (templates/film.mjs) and calls these parts. Nothing is drawn unless the film asks for it.
// Adapted from lemo-opuscar styles/halftone-dossier (MIT, (c) 2026 LemoLab), rewritten for Canvas 2D in Node at 9:16.
// Every function is a pure function of t. Units are pixels of the 1080 x 1920 frame.

export const INKS = {
  paper: '#F4ECDD',     // the sheet
  ink: '#1D2340',       // every outline, body text, the caption bar
  spot: '#2E55D6',      // the main spot ink: big fields, tables
  spot2: '#56C29E',     // a small second spot ink
  overprint: '#FF5A87', // misregistration shadows, caption shadow
  highlight: '#FFC628', // keywords and numerals
  stamp: '#E8384F',     // stamps and alarms only
  night: '#18203F', night2: '#2A3568',   // secret scenes: a dark-ink ground and its dots
  cream: '#FFF4E2',     // text on dark, bellies, light faces
  card: '#FFFDF7',      // evidence prints and index cards
};
export const FONTS = { head: 'Alfa Slab One', display: 'Bagel Fat One', sans: 'Archivo Black', mono: 'JetBrains Mono', hand: 'Caveat' };

export default function dossier(K) {
  const { W, H, SAFE, LANE, T, clamp, lerp, seg, rng, hash2, fbm, rgba, mix, spline, poly, roundRect, circle, Path2D, DOMMatrix } = K;
  const TAU = Math.PI * 2;
  const C = { ...INKS };
  const F = FONTS;
  const font = (fam, size, w = 400) => `${w} ${Math.round(size)}px "${fam}"`;
  // The 9:16 page (STYLE.md, section 6), from the placement's safe box (K.SAFE) and caption lane (K.LANE). Words keep to
  // the safe box; the picture fills the frame. Organic: HUD 262-370, headline from 406, hero 620-1420, caption to 1560.
  const ZONE = { hudTop: SAFE.y0 + 2, hudBottom: SAFE.y0 + 110, headTop: SAFE.y0 + 146, heroTop: SAFE.y0 + 360, heroBottom: LANE.y1 - 140, captionTop: LANE.y1 - 90, captionBottom: LANE.y1 + 10 };
  const mctx = K.canvas(8, 8).getContext('2d');
  const measure = (str, f) => { mctx.font = f; return mctx.measureText(str).width; };

  // ---------------------------------------------------------------- motion (the style's overshoot and slams)
  const E = {
    out: p => 1 - (1 - clamp(p)) ** 3,
    in: p => clamp(p) ** 3,
    io: p => { p = clamp(p); return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; },
    back: p => { p = clamp(p); const c = 1.9; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; },
  };
  // 0 before `at`, then a back-eased 0 -> 1 with overshoot
  const pop = (t, at, d = 0.35) => (t < at ? 0 : E.back(seg(t, at, at + d)));
  // a value that rises from `from` to `to`, overshooting a little
  const rise = (t, at, from, to, d = 0.4) => lerp(from, to, t < at ? 0 : E.back(seg(t, at, at + d)));
  // a stamp's scale: 2.6x -> 1x in 0.09 s ending at `at`, then a small damped bounce; 0 before
  const slam = (t, at) => { if (t < at - 0.09) return 0; const p = seg(t, at - 0.09, at), a = Math.max(0, t - at); return lerp(2.6, 1, E.in(p)) * (1 + 0.05 * Math.sin(a * 30) * Math.exp(-a * 9)); };
  // a landing squash that keeps volume: scale(1/sq, sq)
  const squash = (t, at, k = 0.18) => { if (t < at) return 1; const a = t - at; return 1 - k * Math.exp(-a * 7) * Math.cos(a * 21); };
  const ev = at => (K.event ? K.event(at) : at);

  // ---------------------------------------------------------------- paper and grain (the finish)
  let paperCanvas = null;
  const paperTex = () => {
    if (paperCanvas) return paperCanvas;
    const c = K.canvas(W, H), g = c.getContext('2d'), r = rng(3);
    const sw = 54, sh = 96, small = K.canvas(sw, sh), sg = small.getContext('2d'), sim = sg.createImageData(sw, sh);
    for (let i = 0; i < sim.data.length; i += 4) { const v = 242 + r() * 13; sim.data[i] = sim.data[i + 1] = sim.data[i + 2] = v; sim.data[i + 3] = 255; }
    sg.putImageData(sim, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(small, 0, 0, W, H);
    const im = g.getImageData(0, 0, W, H), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 26; d[i] = clamp(d[i] + n, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n - 4, 0, 255); }
    g.putImageData(im, 0, 0);
    const gr = g.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1260); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(120,100,80,0.35)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(140,120,100,0.18)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, H * 0.5); g.lineTo(W, H * 0.5 + 2); g.stroke();
    paperCanvas = c; return c;
  };
  // dust on the print: paper-coloured and ink specks, reseeded every 2 frames
  const grain = (g, t) => {
    const r = rng(1000 + Math.floor(t * 15));
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    const a = new Path2D(), b = new Path2D();
    for (let i = 0; i < 520; i++) { const x = r() * W, y = r() * H, s = 0.6 + r() * 1.8; a.moveTo(x + s, y); a.arc(x, y, s, 0, TAU); }
    for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, s = 0.6 + r() * 1.3; b.moveTo(x + s, y); b.arc(x, y, s, 0, TAU); }
    g.fillStyle = 'rgba(255,248,235,0.75)'; g.fill(a); g.fillStyle = rgba(C.ink, 0.25); g.fill(b); g.restore();
  };
  // the medium's finish over the printed world: the paper multiplies everything, then dust
  const finish = (g, t) => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(paperTex(), 0, 0); g.restore(); grain(g, t); };

  // ---------------------------------------------------------------- halftone
  // A rotated grid of dots drawn as one path. field(x, y) -> 0..1 sets each dot's size: r = field * step * k
  // (around k 0.7 the dots merge into solid ink). blend 'multiply' overprints it on what is below.
  // With o.cache (a string key), the dots are drawn once into an offscreen canvas and reused: a field that doesn't change
  // within a card costs one drawImage per frame. Animated fields can cache steps: cache: `bloom:${Math.round(k * 12)}`.
  const dotCache = new Map();
  const dotPath = (o, ox = 0, oy = 0) => {
    const { x = 0, y = 0, w = W, h = H, step = 22, angle = 15, field = () => 1, k = 0.68, min = 0.05 } = o;
    const a = (angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), cx = x + w / 2, cy = y + h / 2, n = Math.ceil(Math.hypot(w, h) / step / 2) + 2;
    const p = new Path2D(); let any = false, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const u = i * step, v = j * step, px = cx + u * ca - v * sa, py = cy + u * sa + v * ca;
      if (px < x - step || px > x + w + step || py < y - step || py > y + h + step) continue;
      const s = clamp(field(px, py)); if (s < min) continue;
      const r = s * step * k; p.moveTo(px + r - ox, py - oy); p.arc(px - ox, py - oy, r, 0, TAU); any = true;
      if (px - r < x0) x0 = px - r; if (py - r < y0) y0 = py - r; if (px + r > x1) x1 = px + r; if (py + r > y1) y1 = py + r;
    }
    return { p, any, box: [Math.floor(x0) - 1, Math.floor(y0) - 1, Math.ceil(x1) + 1, Math.ceil(y1) + 1] };
  };
  const halftone = (g, o = {}) => {
    const { color = C.spot, blend = null, alpha = 1 } = o;
    if (o.cache) {
      const key = `${o.cache}|${color}`;
      let hit = dotCache.get(key);
      if (!hit) {
        const probe = dotPath(o);
        if (!probe.any) hit = { empty: true };
        else {
          const [bx0, by0, bx1, by1] = probe.box, cw = Math.max(1, bx1 - bx0), ch = Math.max(1, by1 - by0), c = K.canvas(cw, ch), cg = c.getContext('2d');
          cg.fillStyle = color; cg.fill(dotPath(o, bx0, by0).p); hit = { c, x: bx0, y: by0 };
        }
        dotCache.set(key, hit);
        // keep memory flat over a long render: frames arrive roughly in order, so old cards' fields can go
        if (dotCache.size > 14) dotCache.delete(dotCache.keys().next().value);
      }
      if (hit.empty) return;
      g.save(); if (blend) g.globalCompositeOperation = blend; g.globalAlpha *= alpha; g.drawImage(hit.c, hit.x, hit.y); g.restore();
      return;
    }
    const { p, any } = dotPath(o);
    if (!any) return;
    g.save(); if (blend) g.globalCompositeOperation = blend; g.globalAlpha *= alpha; g.fillStyle = color; g.fill(p); g.restore();
  };
  // density fields
  const radial = (cx, cy, R, pw = 1.2, gain = 1) => (x, y) => gain * Math.pow(clamp(1 - Math.hypot(x - cx, y - cy) / R), pw);
  const edge = (R = 1, pw = 1.6, gain = 1.3) => (x, y) => gain * Math.pow(clamp(Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2)) / R - 0.35), pw);
  const ramp = (x0, y0, x1, y1, a = 0.25, b = 1) => { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1; return (x, y) => lerp(a, b, clamp(((x - x0) * dx + (y - y0) * dy) / L2)); };
  const max = (...fs) => (x, y) => Math.max(...fs.map(f => f(x, y)));
  const scaled = (f, k) => (x, y) => k * f(x, y);
  // a flat fill, overprinted with a darker halftone clipped to the shape
  const dotFill = (g, path, o = {}) => {
    if (o.fill) { g.fillStyle = o.fill; g.fill(path); }
    if (o.dot) { g.save(); g.clip(path); halftone(g, { ...(o.box || {}), step: o.step ?? 20, angle: o.angle ?? 25, color: o.dot, field: o.field || (() => 0.6), k: o.k ?? 0.7, blend: o.blend ?? null }); g.restore(); }
  };

  // ---------------------------------------------------------------- inked props
  const speckTiles = [];
  const speckTile = i => {
    if (!speckTiles[i]) { const s = 160, c = K.canvas(s, s), cg = c.getContext('2d'), r = rng(31 + i * 7); cg.fillStyle = C.paper; for (let k = 0; k < 70; k++) { cg.beginPath(); cg.arc(r() * s, r() * s, 0.5 + r() * 1.4, 0, TAU); cg.fill(); } speckTiles[i] = c; }
    return speckTiles[i];
  };
  const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
  // The basic prop: a flat fill, optional dots inside, a little ink starvation, and a heavy ink outline that boils at
  // 10 fps. pts is a closed outline (smooth: true for curves). Returns the Path2D.
  const ink = (g, pts, o = {}) => {
    const t = o.t ?? 0, P = o.boil === 0 ? pts : K.boil(pts, t, o.boil ?? 1.5, o.seed ?? 1, 10);
    const closed = o.closed !== false, path = o.smooth ? spline(P, closed, 0.5) : poly(P, closed);
    if (o.fill && closed) { g.fillStyle = o.fill; g.fill(path); }
    if (o.dots && closed) { g.save(); g.clip(path); halftone(g, { ...bbox(P), ...o.dots }); g.restore(); }
    if (o.fill && closed && o.grain !== false) {
      const b = bbox(P); g.save(); g.clip(path); g.globalAlpha *= 0.55; g.fillStyle = g.createPattern(speckTile(Math.floor(t * 10) % 4), 'repeat'); g.fillRect(b.x, b.y, b.w, b.h); g.restore();
    }
    if (o.line !== null) { g.strokeStyle = o.line ?? C.ink; g.lineWidth = o.width ?? 7; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(path); }
    return path;
  };
  // an open inked line (a crease, a string, a crack), boiling
  const line = (g, pts, o = {}) => ink(g, pts, { ...o, closed: false, fill: null, smooth: o.smooth ?? true });
  // a rounded rectangle as an outline of points, for ink()
  const rectPts = (x, y, w, h, r = 0, n = 6) => {
    if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const out = [], arc = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return out;
  };
  const ellipsePts = (cx, cy, rx, ry, n = 28, rot = 0) => { const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return out; };

  // ---------------------------------------------------------------- type
  // A headline: each glyph drops in and squashes, with a misregistered shadow (+8/+8 in the overprint ink, multiplied).
  // With o.line, words pop as the voice says them; otherwise from o.at with o.stagger per glyph. *emphasis* takes
  // o.emph (default: the spot ink). Returns its box.
  const layoutWords = (toks, f, maxW) => {
    const space = measure(' ', f), lines = []; let cur = [], w = 0;
    for (const tk of toks) { const tw = measure(tk.w, f); if (cur.length && w + space + tw > maxW) { lines.push({ toks: cur, w }); cur = []; w = 0; } w += (cur.length ? space : 0) + tw; cur.push({ ...tk, tw }); }
    if (cur.length) lines.push({ toks: cur, w });
    return { lines, space };
  };
  const headline = (g, t, text, o = {}) => {
    const size = o.size ?? 120, f = font(o.font ?? F.head, size), color = o.color ?? C.ink, sh = o.shadow === undefined ? C.overprint : o.shadow;
    const dx = o.dx ?? 8, dy = o.dy ?? 8, x = o.x ?? SAFE.x0, y = o.y ?? (o.top ?? ZONE.headTop) + size * 0.8, maxW = o.maxW ?? (SAFE.x1 - SAFE.x0), lh = size * (o.lineH ?? 1.04);
    const toks = K.parseMarkup(o.upper ? String(text).toUpperCase() : text), { lines, space } = layoutWords(toks, f, maxW);
    let times = null;
    if (o.line) { const tl = T.line(o.line); times = K.align(toks, tl.words || [], tl.start, tl.end).map(z => z.a - (o.lead ?? 0.06)); }
    const until = o.until ?? 1e9, out = clamp((t - until) / 0.15);
    if (out >= 1) return null;
    g.save(); g.font = f; g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    let wi = 0, ci = 0, bx0 = 1e9, bx1 = -1e9, shown = false;
    lines.forEach((ln, li) => {
      let cx = o.align === 'center' ? x - ln.w / 2 : o.align === 'right' ? x - ln.w : x;
      bx0 = Math.min(bx0, cx); bx1 = Math.max(bx1, cx + ln.w);
      const by = y + li * lh;
      for (const tk of ln.toks) {
        const w0 = times ? times[wi] : (o.at ?? 0) + ci * (o.stagger ?? 0.05);
        if (times) ev(w0); else if (ci === 0) ev(w0);
        let gx = cx;
        for (const ch of [...tk.w]) {
          const cw = measure(ch, f), s = times ? w0 + (gx - cx) / Math.max(1, tk.tw) * 0.12 : (o.at ?? 0) + ci * (o.stagger ?? 0.05);
          ci++;
          if (t >= s) {
            shown = true;
            const p = seg(t, s, s + (o.d ?? 0.38)), hh = size * 0.35, sc = E.back(p) * (1 - E.in(out)), sq = 1 + 0.25 * Math.sin(p * Math.PI) * (1 - p);
            g.save(); g.translate(gx + cw / 2, by + (o.from ?? 60) * (1 - E.out(p))); g.translate(0, -hh); g.scale(sc / sq, sc * sq); g.translate(0, hh);
            if (sh) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = sh; g.fillText(ch, dx, dy); g.restore(); }
            g.fillStyle = tk.emph ? (o.emph ?? C.spot) : color; g.fillText(ch, 0, 0); g.restore();
          }
          gx += cw;
        }
        cx += tk.tw + space; wi++;
      }
    });
    g.restore();
    const box = [bx0, y - size * 0.8, bx1, y + (lines.length - 1) * lh + size * 0.25];
    if (shown && o.check !== false) K.noteText('head:' + (o.id || text), { text: toks.map(k => k.w).join(' '), role: o.role || 'headline', size, box: screenBox(g, box), t, spoken: o.line ? T.end(o.line) - T.at(o.line) : null });
    return { x0: box[0], y0: box[1], x1: box[2], y1: box[3], lines: lines.length };
  };
  // the box in screen pixels (the current transform may be a camera)
  const screenBox = (g, [x0, y0, x1, y1]) => {
    const m = g.getTransform(), ps = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    return [Math.min(...ps.map(p => p[0])), Math.min(...ps.map(p => p[1])), Math.max(...ps.map(p => p[0])), Math.max(...ps.map(p => p[1]))];
  };
  // static text in one of the style's faces: role head | display | sans | mono | hand
  const text = (g, str, x, y, o = {}) => {
    const fam = { head: F.head, display: F.display, sans: F.sans, mono: F.mono, hand: F.hand }[o.face || 'sans'] || o.face;
    const size = o.size ?? 44, f = font(fam, size, o.weight ?? (o.face === 'mono' ? 800 : o.face === 'hand' ? 700 : 400));
    g.save(); g.font = f; g.textAlign = o.align || 'left'; g.textBaseline = o.baseline || 'alphabetic'; g.globalAlpha *= o.alpha ?? 1;
    if (o.shadow) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = o.shadow; g.fillText(str, x + (o.dx ?? 5), y + (o.dy ?? 5)); g.restore(); }
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.strokeW ?? size * 0.14; g.lineJoin = 'round'; g.strokeText(str, x, y); }
    g.fillStyle = o.color ?? C.ink; g.fillText(str, x, y);
    const w = g.measureText(str).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    g.restore();
    if (o.t != null && o.role !== 'texture') K.noteText(o.id || 'text:' + str, { text: str, role: o.role || (size >= 72 ? 'headline' : 'label'), size, box: screenBox(g, [x0, y - size * 0.8, x0 + w, y + size * 0.25]), t: o.t });
    return { w, x0, x1: x0 + w };
  };
  // a giant halftone-filled numeral that bleeds off the right edge (right edge at o.x, baseline o.y); cached
  const numCache = new Map();
  const numeral = (g, str, o = {}) => {
    const size = o.size ?? 820, fill = o.fill ?? C.highlight, dot = o.dot ?? mix(C.highlight, C.stamp, 0.42), angle = o.angle ?? 25, key = [str, size, fill, dot, angle].join('|');
    let c = numCache.get(key);
    if (!c) {
      const f = font(F.display, size), tw = measure(str, f);
      c = K.canvas(tw + 60, size * 1.3); const cg = c.getContext('2d');
      cg.font = f; cg.textBaseline = 'alphabetic'; cg.fillStyle = fill; cg.fillText(str, 30, size * 1.05);
      cg.globalCompositeOperation = 'source-atop';
      halftone(cg, { x: 0, y: 0, w: c.width, h: c.height, step: 20, angle, color: dot, field: (x, y) => 0.25 + 0.75 * clamp((y - size * 0.2) / (size * 0.85)), k: 0.7 });
      numCache.set(key, c);
    }
    const t = o.t ?? 0, s = o.at != null ? pop(t, ev(o.at), 0.45) : 1; if (s <= 0) return null;
    const x1 = o.x ?? W + 60, y = o.y ?? 1240, cx = x1 - c.width / 2, cy = y - size * 1.05 + c.height / 2;
    g.save(); g.translate(cx, cy + (1 - Math.min(1, s)) * 140); g.rotate(o.rot ?? 0); g.scale(s, s); g.globalAlpha *= o.alpha ?? 1; g.drawImage(c, -c.width / 2, -c.height / 2); g.restore();
    return { w: c.width, h: c.height };
  };

  // ---------------------------------------------------------------- stamps (rough ink, cached), redaction
  const stampCache = new Map();
  const stampArt = (str, size, color) => {
    const key = [str, size, color].join('|');
    if (stampCache.has(key)) return stampCache.get(key);
    const rows = String(str).split('\n'), f = font(F.sans, size), tw = Math.max(...rows.map(r => measure(r, f)));
    const padX = size * 0.42, padY = size * 0.26, border = Math.max(6, size * 0.065), w = tw + padX * 2, h = rows.length * size * 1.02 + padY * 2, M = 24;
    const src = K.canvas(w + M * 2, h + M * 2), sg = src.getContext('2d');
    sg.strokeStyle = color; sg.lineWidth = border; sg.stroke(roundRect(M, M, w, h, size * 0.14));
    sg.lineWidth = border * 0.35; sg.stroke(roundRect(M + border * 1.8, M + border * 1.8, w - border * 3.6, h - border * 3.6, size * 0.07));
    sg.fillStyle = color; sg.font = f; sg.textAlign = 'center'; sg.textBaseline = 'alphabetic';
    rows.forEach((r, i) => sg.fillText(r, M + w / 2, M + padY + size * 0.86 + i * size * 1.02));
    // rough ink: displace by low-frequency noise (about +-3.5 px), then let a fine mottle eat the ink
    const W2 = src.width, H2 = src.height, a = sg.getImageData(0, 0, W2, H2).data, out = sg.createImageData(W2, H2), o = out.data, sd = str.length * 13 + size;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const nx = Math.round(x + (fbm(x * 0.04, y * 0.04, 3, sd) - 0.5) * 7), ny = Math.round(y + (fbm(x * 0.04 + 31, y * 0.04 + 17, 3, sd) - 0.5) * 7);
      if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2) continue;
      const si = (ny * W2 + nx) * 4, di = (y * W2 + x) * 4;
      const mottle = clamp((0.64 - fbm(x * 0.5, y * 0.5, 2, sd + 5) - 0.05 * (fbm(x * 0.07, y * 0.07, 2, sd + 9) - 0.5)) / 0.1);
      o[di] = a[si]; o[di + 1] = a[si + 1]; o[di + 2] = a[si + 2]; o[di + 3] = a[si + 3] * mottle;
    }
    const c = K.canvas(W2, H2); c.getContext('2d').putImageData(out, 0, 0);
    const art = { c, w: W2, h: H2 }; stampCache.set(key, art); return art;
  };
  // a stamp that slams at `at` (2.6x -> 1x in 0.09 s, then settles), printed in multiply at 93%
  const stamp = (g, t, str, o = {}) => {
    const at = o.at ?? 0; ev(at); if (t < at - 0.09 || t > (o.until ?? 1e9)) return null;
    const size = o.size ?? 96, color = o.color ?? C.stamp, art = stampArt(str, size, color), s = slam(t, at), p = seg(t, at - 0.09, at);
    g.save(); g.globalCompositeOperation = o.blend ?? 'multiply'; g.globalAlpha *= p < 1 ? 0.3 + 0.7 * p : (o.alpha ?? 0.93);
    g.translate(o.x ?? W / 2, o.y ?? 900); g.rotate(((o.rot ?? -8) * Math.PI) / 180); g.scale(s, s); g.drawImage(art.c, -art.w / 2, -art.h / 2); g.restore();
    if (t >= at) K.noteText('stamp:' + str, { text: str.replace(/\n/g, ' '), role: 'stamp', size, box: screenBox(g, [(o.x ?? W / 2) - art.w / 2, (o.y ?? 900) - art.h / 2, (o.x ?? W / 2) + art.w / 2, (o.y ?? 900) + art.h / 2]), t });
    return art;
  };
  // a black bar printed over a box [x, y, w, h], drawn on from the left at `at`, lifted off at `lift`
  const redact = (g, t, box, o = {}) => {
    const [x, y, w, h] = box, at = o.at ?? -1, lift = o.lift ?? 1e9; ev(at); if (Number.isFinite(lift) && lift < 1e8) ev(lift);
    if (t < at) return;
    const pr = E.out(seg(t, at, at + 0.14)), lp = seg(t, lift, lift + 0.35); if (lp >= 1) return;
    const r = rng(Math.round(x * 3 + y)), pts = [];
    for (let i = 0; i <= 10; i++) pts.push([x + (w * pr * i) / 10, y + (r() - 0.5) * 4]);
    for (let i = 10; i >= 0; i--) pts.push([x + (w * pr * i) / 10, y + h + (r() - 0.5) * 4]);
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-0.25 * E.in(lp)); g.translate(-(x + w / 2) - 30 * E.in(lp), -(y + h / 2) - 220 * E.in(lp)); g.globalAlpha *= 1 - E.in(lp);
    ink(g, pts, { fill: o.color ?? C.ink, line: null, boil: 0, t });
    g.restore();
  };

  // ---------------------------------------------------------------- props
  const burst = (g, x, y, r, o = {}) => {
    const t = o.t ?? 0, s = o.at != null ? pop(t, ev(o.at), 0.32) : 1; if (s <= 0) return;
    const n = o.points ?? 24, pts = [];
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU + (o.rot ?? 0), rr = (i % 2 ? r * (o.inner ?? 0.74) : r) * (1 + (hash2(i, 7, 3) - 0.5) * 0.12); pts.push([x + Math.cos(a) * rr * s, y + Math.sin(a) * rr * s]); }
    ink(g, pts, { fill: o.fill ?? C.highlight, t, seed: 11, width: 7 });
    if (o.text) text(g, o.text, x, y + r * 0.18 * s, { face: o.face ?? 'hand', size: (o.size ?? r * 0.5) * s, color: o.color ?? C.stamp, align: 'center', role: 'texture' });
  };
  const bubble = (g, str, o = {}) => {
    const t = o.t ?? 0, s = o.at != null ? pop(t, ev(o.at), 0.3) : 1; if (s <= 0) return;
    const size = o.size ?? 54, f = font(F[o.face || 'hand'] || o.face, size, 700), w = (o.w ?? measure(str, f) + size * 1.2), h = o.h ?? size * 1.9, x = o.x ?? W / 2, y = o.y ?? 700, tail = o.tail ?? [-w * 0.2, h * 0.9];
    g.save(); g.translate(x, y); g.scale(s, s);
    ink(g, [[-w * 0.12, h * 0.3], [tail[0], tail[1]], [w * 0.08, h * 0.32]], { fill: C.cream, t, seed: 4, width: 6 });
    ink(g, rectPts(-w / 2, -h / 2, w, h, h * 0.3), { fill: C.cream, t, seed: 5, width: 6 });
    g.fillStyle = C.cream; g.fill(roundRect(-w * 0.13, h * 0.2, w * 0.24, h * 0.24, 4));
    g.restore();
    text(g, str, x, y + size * 0.34 * s, { face: o.face || 'hand', size: size * s, color: C.ink, align: 'center', t, role: o.role || 'label' });
  };
  const note = (g, str, o = {}) => {
    const t = o.t ?? 0, s = o.at != null ? pop(t, ev(o.at), 0.32) : 1; if (s <= 0) return;
    const w = o.w ?? 300, h = o.h ?? 260, x = o.x ?? W / 2, y = o.y ?? 800;
    g.save(); g.translate(x, y); g.rotate(((o.rot ?? -4) * Math.PI) / 180); g.scale(s, s);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rgba(C.ink, 0.22); g.fill(poly([[-w / 2 + 12, -h / 2 + 14], [w / 2 + 12, -h / 2 + 14], [w / 2 + 12, h / 2 + 14], [-w / 2 + 12, h / 2 + 14]])); g.restore();
    ink(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2 - 34], [w / 2 - 40, h / 2], [-w / 2, h / 2]], { fill: o.color ?? C.highlight, t, seed: 21, width: 6 });
    const lines = String(str).split('\n'), sz = o.size ?? 54;
    lines.forEach((ln, i) => text(g, ln, 0, -((lines.length - 1) * sz * 1.05) / 2 + i * sz * 1.05 + sz * 0.3, { face: 'hand', size: sz, color: C.ink, align: 'center', t, role: o.role || 'label', id: 'note:' + str + i }));
    g.restore();
  };
  // a manila exhibit tag; o.to = where its string goes
  const tag = (g, str, o = {}) => {
    const t = o.t ?? 0, s = o.at != null ? pop(t, ev(o.at), 0.32) : 1; if (s <= 0) return;
    const x = o.x ?? 700, y = o.y ?? 900, size = o.size ?? 40, f = font(F.mono, size, 800), w = measure(str, f) + size * 1.6, h = size * 1.9;
    if (o.to) line(g, [[x - w / 2 + size * 0.5, y], [lerp(x, o.to[0], 0.5), lerp(y, o.to[1], 0.5) + 30], o.to], { t, width: 4, line: C.ink, seed: 33 });
    g.save(); g.translate(x, y); g.rotate(((o.rot ?? 6) * Math.PI) / 180); g.scale(s, s);
    ink(g, [[-w / 2 + h * 0.4, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + h * 0.4, h / 2], [-w / 2, 0]], { fill: o.fill ?? '#E9CF8E', t, seed: 23, width: 5 });
    g.fillStyle = C.paper; g.fill(circle(-w / 2 + h * 0.42, 0, h * 0.13)); g.strokeStyle = C.ink; g.lineWidth = 4; g.stroke(circle(-w / 2 + h * 0.42, 0, h * 0.13));
    g.restore();
    text(g, str, x + h * 0.25 * s, y + size * 0.34 * s, { face: 'mono', size: size * s, color: C.ink, align: 'center', t, role: o.role || 'label' });
  };
  const folder = (g, o = {}) => {
    const x = o.x ?? 120, y = o.y ?? 1300, w = o.w ?? 840, h = o.h ?? 520, t = o.t ?? 0, col = o.color ?? '#E9C46A';
    ink(g, [[x, y + 40], [x + w * 0.06, y], [x + w * 0.34, y], [x + w * 0.38, y + 40], [x + w, y + 40], [x + w, y + h], [x, y + h]], { fill: mix(col, C.ink, 0.12), t, seed: 41 });
    ink(g, [[x - 10, y + 70], [x + w + 10, y + 70], [x + w + 24, y + h], [x - 24, y + h]], { fill: col, t, seed: 43, dots: o.dots ? { color: mix(col, C.stamp, 0.35), step: 22, angle: 20, field: ramp(0, y + 70, 0, y + h, 0.1, 0.55), k: 0.68 } : null });
    if (o.label) { ink(g, rectPts(x + w * 0.08, y + 120, w * 0.56, 120, 6), { fill: C.card, t, seed: 45, width: 5 }); text(g, o.label, x + w * 0.08 + 26, y + 196, { face: 'mono', size: 40, color: C.ink, t, role: 'label' }); }
  };
  // a mugshot height chart: ruled lines with heights, behind a subject
  const chart = (g, o = {}) => {
    const x0 = o.x0 ?? 70, x1 = o.x1 ?? W - 70, y0 = o.y0 ?? 560, step = o.step ?? 92, n = o.n ?? 9, top = o.from ?? 160;
    g.save(); g.strokeStyle = C.ink; g.globalAlpha *= 0.45;
    for (let i = 0; i < n; i++) { const y = y0 + i * step; g.lineWidth = i % 2 ? 2 : 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    g.restore();
    const by = o.by ?? 10, unit = o.unit ?? '';
    for (let i = 0; i < n; i += 2) { const y = y0 + i * step, s = `${top - i * by}${i === 0 ? unit : ''}`; text(g, s, x0 + 10, y - 10, { face: 'mono', size: 26, color: C.ink, alpha: 0.7, role: 'texture' }); text(g, s, x1 - 10, y - 10, { face: 'mono', size: 26, color: C.ink, alpha: 0.7, align: 'right', role: 'texture' }); }
  };
  // a name plate held under a subject: rows of [text, size, colour?]
  const plate = (g, rows, o = {}) => {
    const t = o.t ?? 0, x = o.x ?? W / 2, y0 = o.y ?? 1100, yy = o.at != null ? rise(t, ev(o.at), y0 + 600, y0, 0.4) : y0; if (o.at != null && t < o.at) return;
    const w = o.w ?? 640, h = rows.reduce((s, r) => s + r[1] * 1.25, 0) + 50;
    g.save(); g.translate(x, yy); g.rotate(((o.rot ?? -1.5) * Math.PI) / 180);
    g.fillStyle = C.ink; g.fill(roundRect(-w / 2, -h / 2, w, h, 10));
    let y = -h / 2 + 25; for (const [s, size, col] of rows) { y += size * 1.0; text(g, s, 0, y, { face: 'mono', size, color: col ?? C.cream, align: 'center', t, role: size >= 36 ? 'label' : 'texture' }); y += size * 0.25; }
    g.restore();
  };
  const pin = (g, x, y, o = {}) => { g.fillStyle = rgba(C.ink, 0.25); g.fill(circle(x + 5, y + 6, 15)); g.fillStyle = o.color ?? C.stamp; g.fill(circle(x, y, 15)); g.strokeStyle = C.ink; g.lineWidth = 5; g.stroke(circle(x, y, 15)); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill(circle(x - 5, y - 5, 4)); };
  const string = (g, pts, prog, o = {}) => K.drawOn(g, pts, prog, { width: o.width ?? 5, color: o.color ?? C.stamp, smooth: true });
  // a hand-drawn marker ring, in the stamp ink, multiplied
  const ring = (g, cx, cy, rx, ry, prog, o = {}) => K.mark(g, cx, cy, rx, ry, prog, { color: o.color ?? C.stamp, width: o.width ?? 10, seed: o.seed ?? 3, alpha: 0.95 });
  const paperclip = (g, x, y, s = 1, rot = 0.12) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    const p = new Path2D(); p.moveTo(-14, 70); p.lineTo(-14, -40); p.arc(0, -40, 14, Math.PI, 0); p.lineTo(14, 52); p.arc(0, 52, 9, 0, Math.PI); p.lineTo(-5, -26); p.arc(4, -26, 9, Math.PI, 0); p.lineTo(13, 40);
    g.strokeStyle = C.ink; g.lineWidth = 9; g.stroke(p); g.strokeStyle = '#C9CDD6'; g.lineWidth = 4.5; g.stroke(p); g.restore();
  };

  // ---------------------------------------------------------------- the real product: an evidence print
  // The photo is never printed, dotted or boiled. It sits on the file as a print with a white border, a flat offset
  // shadow in ink, a paperclip and a handwritten exhibit label. Draw it in the film's `over` layer.
  const alphaBoxes = new Map();
  const alphaBox = P => {
    if (alphaBoxes.has(P.name)) return alphaBoxes.get(P.name);
    const c = K.canvas(P.w, P.h), cg = c.getContext('2d'); cg.drawImage(P.img, 0, 0); const d = cg.getImageData(0, 0, P.w, P.h).data;
    let x0 = P.w, y0 = P.h, x1 = 0, y1 = 0;
    for (let y = 0; y < P.h; y += 2) for (let x = 0; x < P.w; x += 2) if (d[(y * P.w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const b = x1 > x0 ? { x0, y0, x1: x1 + 1, y1: y1 + 1 } : { x0: 0, y0: 0, x1: P.w, y1: P.h }; alphaBoxes.set(P.name, b); return b;
  };
  const evidence = (g, t, P, o = {}) => {
    const at = o.at ?? -1; if (t < at) return null; ev(at);
    const b = alphaBox(P), pw = b.x1 - b.x0, ph = b.y1 - b.y0, h = o.h ?? 760, w = (pw * h) / ph;
    const pad = o.pad ?? h * 0.05, m = o.margin ?? Math.max(22, h * 0.045), strip = typeof o.label === 'string' ? (o.strip ?? Math.max(78, h * 0.12)) : m;   // a hand-written tag only when the film gives one
    const ww = w + pad * 2, wh = h + pad * 2, cw = ww + m * 2, ch = wh + m + strip;
    let x = o.x ?? W / 2, y = o.y ?? 960, rot = ((o.rot ?? -3) * Math.PI) / 180, s = o.scale ?? 1;
    const enter = o.enter ?? 'drop', d = 0.45;
    if (enter === 'drop') { const p = seg(t, at, at + d); y = lerp(y - 1500, y, E.back(p)); rot += (1 - E.out(p)) * 0.5; s *= squash(t, at + d * 0.55, 0.05); }
    else if (enter === 'slide') { const p = seg(t, at, at + d); x = lerp(x + 1200, x, E.back(p)); rot += (1 - E.out(p)) * -0.3; }
    else if (enter === 'pop') s *= pop(t, at, 0.4);
    if (s <= 0) return null;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    const cx0 = -cw / 2, cy0 = -ch / 2;
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rgba(C.ink, 0.3); g.fill(roundRect(cx0 + 16, cy0 + 20, cw, ch, 6)); g.restore();
    g.fillStyle = C.card; g.fill(roundRect(cx0, cy0, cw, ch, 6)); g.strokeStyle = C.ink; g.lineWidth = 5; g.stroke(roundRect(cx0, cy0, cw, ch, 6));
    const wx = cx0 + m, wy = cy0 + m;
    g.fillStyle = o.backdrop ?? mix(C.paper, C.spot, 0.1); g.fillRect(wx, wy, ww, wh);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(P.img, b.x0, b.y0, pw, ph, wx + pad, wy + pad, w, h);
    g.strokeStyle = rgba(C.ink, 0.55); g.lineWidth = 2.5; g.strokeRect(wx, wy, ww, wh);
    if (typeof o.label === 'string') {
      text(g, o.label, cx0 + m + 6, cy0 + m + wh + strip * 0.66, { face: 'hand', size: Math.min(64, strip * 0.62), color: C.ink, role: 'texture' });
      if (o.note) text(g, o.note, cx0 + cw - m, cy0 + m + wh + strip * 0.62, { face: 'mono', size: Math.min(30, strip * 0.32), color: rgba(C.ink, 0.8), align: 'right', role: 'texture' });
    }
    if (o.clip !== false) paperclip(g, cx0 + cw * 0.22, cy0 - 6, Math.max(0.8, h / 760));
    g.restore();
    // upscale check: the photo drawn bigger than it was taken goes soft
    const tm = g.getTransform(), drawn = h * s * Math.hypot(tm.a, tm.b), key = P.name + ':evidence';   // through the camera's zoom
    if (drawn > ph * 1.1 && P.name !== 'placeholder' && !K.qa.upscale.some(q => q.key === key)) K.qa.upscale.push({ key, t: +t.toFixed(2), product: P.name, drawnPx: Math.round(drawn), photoPx: ph, x: +(drawn / ph).toFixed(2) });
    const m2 = new DOMMatrix().translate(x, y).rotate((rot * 180) / Math.PI).scale(s, s);
    const point = (u, v) => { const px = wx + pad + ((u - b.x0) / pw) * w, py = wy + pad + ((v - b.y0) / ph) * h; return [m2.a * px + m2.c * py + m2.e, m2.b * px + m2.d * py + m2.f]; };
    return { x, y, w: cw * s, h: ch * s, rot, point, photo: { x: wx + pad, y: wy + pad, w, h }, strip: { x: cx0 + m, y: cy0 + m + wh, w: cw - m * 2, h: strip } };   // photo and strip: in the print's own frame
  };

  // ---------------------------------------------------------------- captions: the caption bar
  // A dark-ink pill with an overprint-ink offset shadow; Archivo Black 56 px in paper colour; the keyword in the
  // highlight ink; words light up as they are spoken. It pops in when a new phrase starts after a pause.
  const CAP = { size: 56, padX: 30, padY: 20 };
  const captionRender = (g, cap, t, { prev, next }) => {
    if (next && next.a - cap.b < 0.25 && t >= next.a - 0.12) return;   // the next phrase has taken over the bar
    const size = CAP.size, f = font(F.sans, size), maxW = LANE.maxW - CAP.padX * 2, { lines, space } = layoutWords(cap.toks, f, maxW);
    const rows = lines.slice(0, 2), lh = size * 1.18, w = Math.max(...rows.map(r => r.w)) + CAP.padX * 2, h = rows.length * lh + CAP.padY * 2 - (lh - size) * 0.6;
    const cont = prev && cap.a - prev.b < 0.25, leaving = !(next && next.a - cap.b < 0.25);
    const p = seg(t, cap.a - 0.12, cap.a + 0.3), q = leaving ? seg(t, cap.b - 0.1, cap.b) : 0;
    const ty = cont ? 8 * (1 - E.out(seg(t, cap.a - 0.06, cap.a + 0.12))) : 40 * (1 - E.out(p)), sc = cont ? 1 : lerp(0.8, 1, E.back(p)), rot = cont ? -0.6 : -1.2 * (1 - p) - 0.6;
    const alpha = (cont ? 1 : clamp((t - (cap.a - 0.12)) / 0.08)) * (1 - q);
    if (alpha <= 0) return;
    const x0 = LANE.x, y1 = LANE.y1 + 10;
    g.save(); g.globalAlpha *= alpha; g.translate(x0 + w / 2, y1 - h / 2 + ty + 30 * E.in(q)); g.rotate((rot * Math.PI) / 180); g.scale(sc, sc);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = C.overprint; g.fill(roundRect(-w / 2 + 8, -h / 2 + 8, w, h, 14)); g.restore();
    g.fillStyle = C.ink; g.fill(roundRect(-w / 2, -h / 2, w, h, 14));
    g.font = f; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    let i = 0;
    rows.forEach((ln, li) => {
      let x = -w / 2 + CAP.padX; const y = -h / 2 + CAP.padY + size * 0.82 + li * lh;
      for (const tk of ln.toks) {
        const tm = cap.times?.[i++], said = !tm || t >= tm.a - 0.04;
        g.globalAlpha = alpha * (said ? 1 : 0.45); g.fillStyle = tk.emph ? C.highlight : C.cream; g.fillText(tk.w, x, y); x += tk.tw + space;
      }
    });
    g.restore();
  };

  // ---------------------------------------------------------------- the HUD (screen space)
  // o.until: the HUD leaves with the style's pop (folds flat in 0.15 s), like a headline's until
  const hud = (g, t, o = {}) => {
    const dark = !!o.dark, inkC = dark ? C.cream : C.ink;
    if (o.until != null) ev(o.until);
    const out = o.until != null ? clamp((t - o.until) / 0.15) : 0, kOut = 1 - E.in(out);
    if (out >= 1) return;
    const fold = (yc, fn) => { g.save(); g.translate(0, yc); g.scale(1, Math.max(0.01, kOut)); g.translate(0, -yc); fn(); g.restore(); };
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    if (o.caseNo) fold(SAFE.y0 + 28, () => { g.font = font(F.mono, 28, 800); g.fillStyle = inkC; g.fillText(o.caseNo, SAFE.x0, SAFE.y0 + 38); });
    if (o.chip) {
      const [a, b] = o.chip, size = 40; g.font = font(F.mono, size, 800);
      const wa = g.measureText(a).width, wb = b ? g.measureText(b).width : 0, pad = 16, ch = 58, y = SAFE.y0 + 52, w = wa + (b ? wb + pad : 0) + pad * 2;
      const k = (o.chipAt != null ? E.back(seg(t, o.chipAt, o.chipAt + 0.25)) : 1) * kOut;
      g.save(); g.translate(SAFE.x0, y); g.scale(1, Math.max(0.01, k));
      g.fillStyle = dark ? C.cream : C.ink; g.fill(roundRect(0, 0, w, ch, 8));
      g.fillStyle = dark ? C.ink : C.highlight; g.fillText(a, pad, ch * 0.72);
      if (b) { g.fillStyle = dark ? C.ink : C.cream; g.fillText(b, pad * 2 + wa, ch * 0.72); }
      g.restore();
      K.noteText('chip:' + a + (b || ''), { text: `${a} ${b || ''}`, role: 'label', size, box: [SAFE.x0, y, SAFE.x0 + w, y + ch], t });
    }
    if (o.date) fold(SAFE.y0 + 27, () => {
      g.font = font(F.mono, 30, 800); const dw = g.measureText(o.date).width, bw = dw + 76, bx = SAFE.x1 - bw, by = SAFE.y0 + 2;
      g.strokeStyle = inkC; g.lineWidth = 4; g.stroke(roundRect(bx, by, bw, 50, 8));
      g.globalAlpha = Math.floor(t * 2) % 2 ? 0.25 : 1; g.fillStyle = C.stamp; g.fill(circle(bx + 26, by + 25, 9)); g.globalAlpha = 1;
      g.fillStyle = inkC; g.fillText(o.date, bx + 48, by + 36);
    });
    g.restore();
  };

  // ---------------------------------------------------------------- transitions (screen space, the top layer)
  // A dot wipe: an 80 px grid of circles covers the frame by the cut and clears after it, with a diagonal delay.
  const dotWipe = (g, t, at, color) => {
    if (t < at - 0.24 || t > at + 0.26) return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = color; const p = new Path2D(); const S = 80;
    for (let y = 0; y <= H + S; y += S) for (let x = 0; x <= W + S; x += S) {
      const delay = clamp(x / W * 0.6 + y / H * 0.4), pc = clamp((t - (at - 0.22 + delay * 0.1)) / 0.12), pu = clamp((t - (at + 0.02 + delay * 0.1)) / 0.12);
      const r = 62 * E.out(pc) * (1 - E.in(pu)); if (r < 0.5) continue; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU);
    }
    g.fill(p); g.restore();
  };
  const flashAt = (g, t, list) => {
    let a = 0; for (const [t0, amp = 0.5, dur = 0.3] of list) if (t >= t0 && t < t0 + dur) a = Math.max(a, amp * (1 - (t - t0) / dur) ** 2);
    if (a > 0.003) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore(); }
  };

  // ---------------------------------------------------------------- the camera: keys + shakes + an optional beat pulse
  // keys: K.camera keys [{ t, x, y, z, e }]. shakes: [[t0, amp px, dur s]] with quadratic decay (5 to 26 px).
  // pulse: a beat grid (K.grid) for the style's ~0.6% zoom pulse on every beat, and when(t) to switch it off.
  const camera = (keys, { shakes: shakes0 = [], pulse = null, when = () => true, amount = 0.006 } = {}) => {
    // shakes: [[t0, amp, dur]] or [{ at, amp, dur }] (the kit's form); both work
    const shakes = shakes0.map(s => (Array.isArray(s) ? s : [s.at, s.amp, s.dur ?? 0.3])); shakes.forEach(s => ev(s[0]));
    const base = K.camera(keys && keys.length ? keys : [{ t: 0, x: W / 2, y: H / 2, z: 1 }]);
    return {
      at(t) {
        const c = base.at(t);
        for (const [t0, amp, dur = 0.3] of shakes) if (t >= t0 && t < t0 + dur) { const k = 1 - (t - t0) / dur; c.x += (amp * k * k * Math.sin(t * 91 + t0)) / c.z; c.y += (amp * k * k * Math.cos(t * 77 + t0 * 3)) / c.z; }
        if (pulse && when(t)) c.z *= 1 + amount * Math.exp(-(((t - pulse.offset) % pulse.beat + pulse.beat) % pulse.beat) / 0.07);
        return c;
      },
    };
  };

  const D = {
    C, F, E, INKS, FONTS, font, measure,
    inks(o = {}) { Object.assign(C, o); return C; },
    pop, rise, slam, squash,
    paperTex, grain, finish,
    halftone, radial, edge, ramp, max, scaled, dotFill,
    ink, line, rectPts, ellipsePts, bbox,
    headline, text, numeral,
    stamp, redact,
    burst, bubble, note, tag, folder, chart, plate, pin, string, ring, paperclip, ZONE,
    evidence, captionRender, hud, dotWipe, flashAt, camera,
    // the style's caption bar for the film object: return { captions: D.captions, ... }
    captions: { render: captionRender, layer: 'over', size: CAP.size },   // above the product, so a print never hides them
  };
  return D;
}
