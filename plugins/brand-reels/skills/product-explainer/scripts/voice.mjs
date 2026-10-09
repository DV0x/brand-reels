#!/usr/bin/env node
// voice.mjs: the voiceover, with a timestamp for every word, from Cartesia (needs a Cartesia API key).
//   voice.mjs <project>                 -> the whole script in ONE take: <project>/vo/voice.wav and vo/timing.json
//   voice.mjs <project> --words         -> also print every word's time (to choose the tempo and the hits)
//   voice.mjs <project> --lines         -> the older way: each line recorded alone (also "voice": { "take": "lines" })
//   voice.mjs <project> --lines --only l3   -> remake one line (lines mode only)
//   voice.mjs --voices [words]          -> list voices, e.g. --voices "indian english" or --voices hindi
//   voice.mjs --audition "<hook lines>" --voices <id1>,<id2>,<id3> [--out <dir>]
//                                       -> one short take per voice, for the user to hear before choosing
// The key comes from --key-file <.env>, the CARTESIA_API_KEY environment variable, or <project>/.env.
// script.json: { voice: { id, model, language, speed, take?, emotive? }, lead, tail, gap?, duration?,
//   lines: [{ id, text, say?, pause?, speed?, emotion?, how?, at?, anchor? }] }
//   One take (the default): the lines are joined into one transcript, so the voice flows from line to line. How a
//   line is said becomes Cartesia tags: "pause" (seconds before the line) -> <break time="..ms"/>, "speed" (0.6 to
//   1.5) -> <speed ratio=".."/>, "emotion" -> <emotion value=".."/> (only for voices tagged Emotive). "say" may hold
//   a <break time="300ms"/> inside a line. The take's word times are split back into lines, so vo/timing.json keeps
//   its format. A line with "at" lands on the music grid: its start, or its "anchor" word ("word#2" for the second
//   one), moves to "at" seconds by a longer pause before it (silence added at the line's start, never removed). The
//   take is cached by its whole transcript: changing any word, mark or the voice records it again; "at" does not.
//   Lines mode: each line is its own take, placed by lead, gap, pause and at/anchor, cached line by line.
//   text is what the captions show (*emphasis* allowed); say, if given, is what the voice reads (e.g. "₹499" -> "four
//   ninety-nine rupees"). "how" is the note on how a line is said (copy.md); it is not sent to Cartesia.
//   "duration" fixes the film's length (else the last line's end + tail).
// Exit codes: 0 done, 1 failed (the message says how to fix it), 2 wrong call (usage).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readWav, writeMonoWav } from './lib/audio.mjs';
import { plain } from './lib/kit.mjs';

const argv = process.argv.slice(2), opts = {}, pos = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(argv[i]); }
const project = pos[0] ? path.resolve(pos[0]) : null;
const API = 'https://api.cartesia.ai', VERSION = '2026-08-14', SR = 48000;
const USAGE = 'usage: voice.mjs <project> [--words] [--lines [--only id]] [--key-file .env]   |   voice.mjs --voices [words]   |   voice.mjs --audition "<lines>" --voices <id1>,<id2>,<id3> [--out dir]';
const fail = (msg, code = 1) => { console.error('[product-explainer] ERROR: ' + msg); process.exit(code); };

function key() {
  const fromFile = f => { if (!f || !fs.existsSync(f)) return null; const m = fs.readFileSync(f, 'utf8').match(/CARTESIA_API_KEY\s*=\s*"?([^"\n#\s]+)/); return m ? m[1] : null; };
  const k = fromFile(opts['key-file']) || process.env.CARTESIA_API_KEY || (project && fromFile(path.join(project, '.env')));
  if (!k) fail('no Cartesia API key. Pass --key-file <path to a .env with CARTESIA_API_KEY=...>, set CARTESIA_API_KEY, or put it in <project>/.env.\nWithout a key, render with --estimate for a text-only cut (no voice).');
  return k;
}
const headers = () => ({ Authorization: `Bearer ${key()}`, 'Cartesia-Version': VERSION, 'Content-Type': 'application/json' });
const isEmotive = info => /emotive/i.test([info?.name, info?.tagline, info?.description].filter(Boolean).join(' '));
async function voiceInfo(id) {
  try { const r = await fetch(`${API}/voices/${id}`, { headers: headers() }); return r.ok ? await r.json() : null; } catch { return null; }
}

// ---------------------------------------------------------------- one request to Cartesia (SSE, with word timestamps)
async function tts(transcript, v) {
  const r = await fetch(`${API}/tts/sse`, { method: 'POST', headers: headers(), body: JSON.stringify({
    model_id: v.model || 'sonic-3.6', transcript, voice: { mode: 'id', id: v.id }, language: v.language || 'en', add_timestamps: true,
    generation_config: { speed: v.speed ?? 1 }, output_format: { container: 'raw', encoding: 'pcm_s16le', sample_rate: SR } }) });
  if (!r.ok) throw new Error(`Cartesia ${r.status}: ${(await r.text()).slice(0, 300)}${r.status === 401 || r.status === 403 ? ' (check the API key)' : ''}`);
  const chunks = [], words = []; let buf = '';
  for await (const part of r.body) {
    buf += Buffer.from(part).toString('utf8');
    let i; while ((i = buf.indexOf('\n\n')) >= 0) {
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = ev.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
      if (!data) continue; const m = JSON.parse(data);
      if (m.type === 'chunk' && m.data) chunks.push(Buffer.from(m.data, 'base64'));
      if (m.type === 'timestamps' && m.word_timestamps) { const w = m.word_timestamps; w.words.forEach((x, k) => words.push({ w: x, start: w.start[k], end: w.end[k] })); }
      if (m.type === 'error') throw new Error('Cartesia: ' + JSON.stringify(m).slice(0, 300));
    }
  }
  const pcm = Buffer.concat(chunks), data = new Float32Array(pcm.length / 2);
  for (let i = 0; i < data.length; i++) data[i] = pcm.readInt16LE(i * 2) / 32768;
  return { data, words };
}
// trim the silence Cartesia leaves around a take, keeping 40 ms before and 60 ms after
function trim(data, words) {
  const thr = 0.012; let a = 0, b = data.length - 1;
  while (a < data.length && Math.abs(data[a]) < thr) a++; while (b > a && Math.abs(data[b]) < thr) b--;
  a = Math.max(0, a - Math.round(0.04 * SR)); b = Math.min(data.length - 1, b + Math.round(0.06 * SR));
  const off = a / SR;
  return { data: data.slice(a, b + 1), words: words.map(w => ({ w: w.w, start: Math.max(0, w.start - off), end: Math.max(0, w.end - off) })) };
}
const norm = x => String(x).toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9%₹]+/g, '');
const ms = s => `${Math.round(Math.min(10, Math.max(0, s)) * 1000)}ms`;
const ratio = x => Math.min(1.5, Math.max(0.6, +x)).toFixed(2).replace(/0$/, '');

// ---------------------------------------------------------------- list voices
if (opts.voices && !opts.audition) {
  const q = typeof opts.voices === 'string' ? opts.voices.toLowerCase().split(/\s+/) : [];
  let all = [], after = null;
  let cut = false;
  for (let page = 0; page < 40; page++) {
    const r = await fetch(`${API}/voices?limit=100${after ? '&starting_after=' + after : ''}`, { headers: headers() });
    if (!r.ok) fail(`Cartesia ${r.status}: ${(await r.text()).slice(0, 200)} (401 or 403: check the API key)`);
    const j = await r.json(), list = Array.isArray(j) ? j : j.data || [];
    all = all.concat(list);
    if (Array.isArray(j) || !j.has_more || !list.length) break;
    after = list[list.length - 1].id; if (page === 39) cut = true;
  }
  // words a user says that the voice list writes differently: "english" is the language code "en", and so on
  const SAME = { english: ['english', ' en '], hindi: ['hindi', ' hi '], female: ['female', 'woman', 'girl', 'lady', 'feminine'], male: ['male', ' man ', 'guy', 'boy', 'masculine'], woman: ['woman', 'female', 'feminine'], man: [' man ', 'male', 'masculine'] };
  const has = (text, w) => (SAME[w] || [w]).some(x => text.includes(x));
  const textOf = v => ` ${v.name} ${v.tagline || ''} ${v.description || ''} ${v.language || ''} ${v.gender || ''} ${(v.accents || []).map(a => `${a.accent || ''} ${a.locale || ''}`).join(' ')} `.toLowerCase();
  const hit = all.filter(v => { const text = textOf(v); return q.every(w => has(text, w)); });
  for (const v of hit.slice(0, 60)) console.log(`${v.id}  ${v.language || '?'}  ${v.name}${isEmotive(v) ? '  [emotive]' : ''}${v.description ? '  ·  ' + v.description.slice(0, 110) : ''}`);
  console.log(`${hit.length} of ${all.length} voices${cut ? ' (the list was cut at 4,000 voices: add words to narrow the search)' : ''}${!hit.length ? '. No match: try fewer words, e.g. "indian" alone' : ''}`);
  process.exit(0);
}

// ---------------------------------------------------------------- audition: the hook in 2 or 3 voices
if (opts.audition) {
  const text = typeof opts.audition === 'string' ? opts.audition.trim() : '', ids = String(typeof opts.voices === 'string' ? opts.voices : '').split(',').map(s => s.trim()).filter(Boolean);
  if (!text || !ids.length) fail('give the hook lines and the voices: --audition "<the hook as it is said>" --voices <id1>,<id2>,<id3>\n' + USAGE, 2);
  const out = path.resolve(opts.out || 'audition'); fs.mkdirSync(out, { recursive: true });
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'voice';
  for (const [k, id] of ids.entries()) {
    const info = await voiceInfo(id), name = info?.name || id;
    let take;
    try { take = await tts(text, { id, model: opts.model || 'sonic-3.6', language: opts.language || 'en', speed: 1 }); }
    catch (e) { fail(`${name}: ${e.message}`); }
    const { data } = trim(take.data, take.words), f = path.join(out, `${k + 1}-${slug(name)}.wav`);
    writeMonoWav(f, data, SR);
    console.log(`${k + 1}. ${name} (${id})${isEmotive(info) ? ' [emotive]' : ''}: ${f}  (${(data.length / SR).toFixed(1)} s)`);
  }
  console.log(`\nThe user listens to them (${out}) and picks one; set its id as voice.id in script.json.`);
  process.exit(0);
}

if (opts.help) { console.log(USAGE); process.exit(0); }
if (!project) fail('no project folder.\n' + USAGE, 2);
if (!fs.existsSync(path.join(project, 'script.json'))) fail(`no script.json in ${project}. Start from templates/script.json.\n` + USAGE, 2);

// ---------------------------------------------------------------- the script, and how each line is said
const script = JSON.parse(fs.readFileSync(path.join(project, 'script.json'), 'utf8'));
const v = script.voice || {};
if (!v.id) fail('script.json has no voice.id. Pick one with: voice.mjs --voices "<language or accent>", then let the user hear 2 or 3 (--audition).');
const vo = path.join(project, 'vo'), cache = path.join(vo, 'cache'); fs.mkdirSync(cache, { recursive: true });
const oneTake = !(opts.lines || v.take === 'lines');
if (opts.only && oneTake) fail('--only works with --lines: in one take, any change records the whole take again (it is cached by its words, so an unchanged script costs nothing)', 2);
const said = L => (L.say || plain(L.text)).trim();
let emotive = v.emotive;
if (script.lines.some(L => L.emotion) && emotive === undefined) emotive = isEmotive(await voiceInfo(v.id));
if (script.lines.some(L => L.emotion) && !emotive) console.warn(`[voice] the voice ${v.id} is not tagged Emotive: the "emotion" marks are left out (set voice.emotive: true to send them anyway)`);
// the marks at the start of a line: a pause before it, its speed, its emotion; each tag only when something changes
function marks(L, i, state) {
  const out = [];
  if (i > 0 && L.pause > 0 && oneTake) out.push(`<break time="${ms(L.pause)}"/>`);
  const sp = L.speed ?? 1;
  if (sp !== state.speed) { out.push(`<speed ratio="${ratio(sp)}"/>`); state.speed = sp; }
  if (L.emotion && emotive && L.emotion !== state.emotion) { out.push(`<emotion value="${L.emotion}"/>`); state.emotion = L.emotion; }
  return out.join('');
}

const hashOf = (...xs) => crypto.createHash('sha1').update(xs.join('|')).digest('hex').slice(0, 16);
async function recorded(name, transcript) {
  const fw = path.join(cache, name + '.wav'), fj = path.join(cache, name + '.json');
  if (!fs.existsSync(fw) || opts.force) {
    let take;
    try { take = await tts(transcript, v); } catch (e) { fail(e.message); }
    writeMonoWav(fw, take.data, SR); fs.writeFileSync(fj, JSON.stringify(take.words));
  }
  return { data: readWav(fw).data, words: JSON.parse(fs.readFileSync(fj, 'utf8')) };
}
const anchorTime = (L, words) => {
  if (L.anchor == null) return null;
  const [word, nth = 1] = String(L.anchor).split('#'); let k = 0;
  const w = words.find(x => norm(x.w) === norm(word) && ++k === +nth);
  if (!w) console.warn(`[voice] ${L.id}: anchor "${L.anchor}" is not a word of this line; its start lands on ${L.at} s instead`);
  return w ? w.start : null;
};

let lines = [], track, duration, transcriptAll = null;
if (oneTake) {
  // ---------------------------------------------------------------- one take for the whole script
  const state = { speed: 1, emotion: null };
  transcriptAll = script.lines.map((L, i) => marks(L, i, state) + said(L)).join(' ');
  const h = hashOf('one-take', v.model || 'sonic-3.6', v.id, v.language || 'en', v.speed ?? 1, transcriptAll);
  if (!fs.existsSync(path.join(cache, `take-${h}.wav`)) || opts.force) console.log(`recording the whole script in one take (${script.lines.length} lines)`);
  const raw = await recorded(`take-${h}`, transcriptAll);
  const { data, words } = trim(raw.data, raw.words);
  if (!words.length) fail('Cartesia returned no word times for the take: run again; if it repeats, use --lines');
  // the take's words, split back into the script's lines: align the spoken words to the script's words (edit distance),
  // so a word the voice read differently ("P H" for "pH") still lands in its own line
  const A = []; script.lines.forEach((L, li) => said(L).replace(/<[^>]*>/g, ' ').split(/\s+/).map(norm).filter(Boolean).forEach(n => A.push({ n, li })));
  const B = words.map(w => norm(w.w)), n = A.length, m = B.length;
  const sub = (a, b) => (a === b ? 0 : a && b && (a.startsWith(b) || b.startsWith(a)) ? 0.5 : 1);
  const Dm = Array.from({ length: n + 1 }, (_, i) => { const r = new Float64Array(m + 1); r[0] = i; return r; });
  for (let j = 1; j <= m; j++) Dm[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) Dm[i][j] = Math.min(Dm[i - 1][j - 1] + sub(A[i - 1].n, B[j - 1]), Dm[i - 1][j] + 1, Dm[i][j - 1] + 1);
  const lineOf = new Array(m).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (Dm[i][j] === Dm[i - 1][j - 1] + sub(A[i - 1].n, B[j - 1])) { lineOf[j - 1] = A[i - 1].li; i--; j--; }
    else if (Dm[i][j] === Dm[i - 1][j] + 1) i--;
    else j--;
  }
  for (let k = 0; k < m; k++) if (lineOf[k] < 0 && k > 0) lineOf[k] = lineOf[k - 1];   // a spoken word with no script word joins the line before
  for (let k = m - 1; k >= 0; k--) if (lineOf[k] < 0) lineOf[k] = k < m - 1 ? lineOf[k + 1] : 0;
  const per = script.lines.map((L, li) => ({ L, words: words.filter((_, k) => lineOf[k] === li) }));
  const empty = per.filter(p => !p.words.length).map(p => p.L.id);
  if (empty.length) fail(`no spoken words matched line(s) ${empty.join(', ')} in the take. Check each line's "say", or use --lines`);
  // place the lines: the take flows on its own; a line with "at" waits for the grid (silence added before it)
  const lead0 = script.lead ?? 0.4, splices = []; let shift = lead0;
  per.forEach((p, li) => {
    const first = p.words[0].start, last = p.words[p.words.length - 1].end;
    const prevEnd = li ? per[li - 1].words[per[li - 1].words.length - 1].end : 0, nextStart = li < per.length - 1 ? per[li + 1].words[0].start : data.length / SR;
    let s = Math.max(prevEnd, first - 0.04), e = Math.min(nextStart, last + 0.06);
    if (Number.isFinite(p.L.at)) {
      const anchor = anchorTime(p.L, p.words), now = (anchor ?? s) + shift, add = p.L.at - now;
      if (add > 0.01) {
        if (li === 0) shift += add;
        else {
          // cut at the quietest 10 ms of the pause before the line, so the added silence never splits a sound
          const a = Math.round(prevEnd * SR), b = Math.round(first * SR), win = Math.round(0.01 * SR); let best = b - win, bestE = Infinity;
          for (let x = a; x + win <= b; x += Math.round(win / 2)) { let en = 0; for (let y = x; y < x + win; y++) en += data[y] * data[y]; if (en < bestE) { bestE = en; best = x + Math.round(win / 2); } }
          splices.push({ at: Math.max(0, best), dur: add, before: p.L.id }); shift += add;
        }
      } else if (add < -0.02) console.warn(`[voice] ${p.L.id} lands at ${now.toFixed(2)} s, ${(-add).toFixed(2)} s after its "at" (${p.L.at} s): a pause can only grow, never shrink. Move "at" later, or cut words before it`);
    }
    p.shift = shift;
    lines.push({ id: p.L.id, text: plain(p.L.text), said: said(p.L) !== plain(p.L.text) ? said(p.L) : undefined, start: +(s + shift).toFixed(3), end: +(e + shift).toFixed(3), take: +(e - s).toFixed(3), placed: Number.isFinite(p.L.at) ? 'grid' : 'flow',
      ...(p.L.how ? { how: p.L.how } : {}), words: p.words.map(w => ({ w: w.w, start: +(w.start + shift).toFixed(3), end: +(w.end + shift).toFixed(3) })) });
  });
  duration = +(script.duration ?? (lines[lines.length - 1].end + (script.tail ?? 2.6))).toFixed(3);
  // the track: lead, then the take with the added silences (4 ms fades at each cut)
  track = new Float32Array(Math.ceil(duration * SR));
  const fade = Math.round(0.004 * SR); let src = 0, dst = Math.round(lead0 * SR);
  const copy = (from, to) => { for (let x = from; x < to && dst < track.length; x++, dst++) { const k = Math.min(1, (x - from) / fade, (to - 1 - x) / fade); track[dst] = data[x] * (from === 0 && x < fade ? 1 : Math.max(0, k)); } };
  if (lines[0] && per[0].shift > lead0) dst = Math.round(per[0].shift * SR);
  for (const sp of splices) { copy(src, sp.at); src = sp.at; dst += Math.round(sp.dur * SR); }
  copy(src, data.length);
  if (lines[lines.length - 1].end > duration) console.warn(`[voice] the last line ends at ${lines[lines.length - 1].end} s, after "duration" (${duration} s)`);
  for (const sp of splices) console.log(`  + ${sp.dur.toFixed(2)} s of silence before ${sp.before} (its "at")`);
} else {
  // ---------------------------------------------------------------- lines mode: each line its own take
  const pieces = [], state = { speed: 1, emotion: null };
  for (const [i, L] of script.lines.entries()) {
    const text = said(L), mk = marks(L, i, { ...state, speed: 1, emotion: null }), transcript = mk + text;
    // the key of a line with no marks is the same as before v0.4, so old films keep their recorded lines
    const h = mk ? hashOf(v.model || 'sonic-3.6', v.id, v.language || 'en', v.speed ?? 1, transcript) : hashOf(v.model || 'sonic-3.6', v.id, v.language || 'en', v.speed ?? 1, text);
    if (!fs.existsSync(path.join(cache, h + '.wav')) || opts.only === L.id || opts.force) {
      process.stdout.write(`voicing ${L.id}: ${text.slice(0, 70)}\n`);
      try { fs.rmSync(path.join(cache, h + '.wav')); } catch { /* not there */ }
    }
    const raw = await recorded(h, transcript), { data, words } = trim(raw.data, raw.words);
    pieces.push({ L, said: text, data, words, dur: data.length / SR });
  }
  // place the takes: in flow, or on the grid ("at", optionally with an "anchor" word that lands on "at")
  let t = script.lead ?? 0.4, prev = null;
  for (const p of pieces) {
    let at = t;
    if (Number.isFinite(p.L.at)) { const a = anchorTime(p.L, p.words); at = p.L.at - (a ?? 0); }
    at = Math.max(0, at);
    if (prev && at < prev.at + prev.dur - 0.02) console.warn(`[voice] ${p.L.id} starts ${(prev.at + prev.dur - at).toFixed(2)} s before ${prev.L.id} ends: the takes overlap`);
    lines.push({ id: p.L.id, text: plain(p.L.text), said: p.said !== plain(p.L.text) ? p.said : undefined, start: +at.toFixed(3), end: +(at + p.dur).toFixed(3), take: +p.dur.toFixed(3), placed: Number.isFinite(p.L.at) ? 'grid' : 'flow', ...(p.L.how ? { how: p.L.how } : {}), words: p.words.map(w => ({ w: w.w, start: +(at + w.start).toFixed(3), end: +(at + w.end).toFixed(3) })) });
    p.at = at; prev = p; t = at + p.dur + (script.gap ?? 0.35) + (p.L.pause ?? 0);
  }
  duration = +(script.duration ?? (lines[lines.length - 1].end + (script.tail ?? 2.6))).toFixed(3);
  if (lines[lines.length - 1].end > duration) console.warn(`[voice] the last line ends at ${lines[lines.length - 1].end} s, after "duration" (${duration} s)`);
  track = new Float32Array(Math.ceil(duration * SR));
  for (const p of pieces) { const s0 = Math.round(p.at * SR); for (let i = 0; i < p.data.length && s0 + i < track.length; i++) track[s0 + i] += p.data[i]; }
}

writeMonoWav(path.join(vo, 'voice.wav'), track, SR);
fs.writeFileSync(path.join(vo, 'timing.json'), JSON.stringify({ duration, voice: v, take: oneTake ? 'one' : 'lines', ...(transcriptAll ? { transcript: transcriptAll } : {}), lines }, null, 1));
for (const l of lines) {
  console.log(`${l.id}  ${l.start.toFixed(2)}–${l.end.toFixed(2)} s  (${l.take.toFixed(2)} s, ${l.placed})  ${l.text}`);
  if (opts.words) console.log('     ' + l.words.map(w => `${w.w} ${w.start.toFixed(2)}`).join('  '));
}
console.log(`\n${duration.toFixed(1)} s with the end card · ${oneTake ? 'one take' : 'line by line'} · ${path.join(vo, 'voice.wav')} · ${path.join(vo, 'timing.json')}`);
