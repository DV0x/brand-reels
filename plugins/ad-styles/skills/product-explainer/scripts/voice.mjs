#!/usr/bin/env node
// voice.mjs: the voiceover, with a timestamp for every word, from Cartesia (needs a Cartesia API key).
//   voice.mjs <project>                 -> <project>/vo/voice.wav and vo/timing.json (the film's clock)
//   voice.mjs <project> --only l3       -> remake one line (after changing its text or the voice)
//   voice.mjs --voices [words]          -> list voices, e.g. --voices "indian english" or --voices hindi
// The key comes from --key-file <.env>, the CARTESIA_API_KEY environment variable, or <project>/.env.
// Each line is cached by its words and voice settings, so re-running only pays for lines that changed.
// script.json: { voice: { id, model, language, speed }, lead, gap, tail, lines: [{ id, text, say?, pause? }] }
//   text is what the captions show (*emphasis* allowed); say, if given, is what the voice reads (e.g. "₹499" -> "four ninety-nine rupees").
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readWav, writeMonoWav } from './lib/audio.mjs';
import { plain } from './lib/kit.mjs';

const argv = process.argv.slice(2), opts = {}, pos = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(argv[i]); }
const project = pos[0] ? path.resolve(pos[0]) : null;
const API = 'https://api.cartesia.ai', VERSION = '2026-08-14', SR = 48000;

function key() {
  const fromFile = f => { if (!f || !fs.existsSync(f)) return null; const m = fs.readFileSync(f, 'utf8').match(/CARTESIA_API_KEY\s*=\s*"?([^"\n#\s]+)/); return m ? m[1] : null; };
  const k = fromFile(opts['key-file']) || process.env.CARTESIA_API_KEY || (project && fromFile(path.join(project, '.env')));
  if (!k) { console.error('[product-explainer] ERROR: no Cartesia API key. Pass --key-file <path to a .env with CARTESIA_API_KEY=...>, set CARTESIA_API_KEY, or put it in <project>/.env.\nWithout a key, render with --estimate for a text-only cut (no voice).'); process.exit(3); }
  return k;
}
const headers = () => ({ Authorization: `Bearer ${key()}`, 'Cartesia-Version': VERSION, 'Content-Type': 'application/json' });

// ---------------------------------------------------------------- list voices
if (opts.voices) {
  const q = typeof opts.voices === 'string' ? opts.voices.toLowerCase().split(/\s+/) : [];
  let all = [], after = null;
  for (let page = 0; page < 10; page++) {
    const r = await fetch(`${API}/voices?limit=100${after ? '&starting_after=' + after : ''}`, { headers: headers() });
    if (!r.ok) { console.error(r.status, await r.text()); process.exit(1); }
    const j = await r.json(), list = Array.isArray(j) ? j : j.data || [];
    all = all.concat(list);
    if (Array.isArray(j) || !j.has_more || !list.length) break;
    after = list[list.length - 1].id;
  }
  const hit = all.filter(v => q.every(w => `${v.name} ${v.description || ''} ${v.language || ''}`.toLowerCase().includes(w)));
  for (const v of hit.slice(0, 60)) console.log(`${v.id}  ${v.language || '?'}  ${v.name}${v.description ? '  ·  ' + v.description.slice(0, 110) : ''}`);
  console.log(`${hit.length} of ${all.length} voices`);
  process.exit(0);
}
if (!project) { console.log('usage: voice.mjs <project> [--only id] [--key-file .env] | voice.mjs --voices [words]'); process.exit(1); }

// ---------------------------------------------------------------- one line through Cartesia (SSE, with word timestamps)
async function tts(transcript, v) {
  const r = await fetch(`${API}/tts/sse`, { method: 'POST', headers: headers(), body: JSON.stringify({
    model_id: v.model || 'sonic-3.6', transcript, voice: { mode: 'id', id: v.id }, language: v.language || 'en', add_timestamps: true,
    generation_config: { speed: v.speed ?? 1 }, output_format: { container: 'raw', encoding: 'pcm_s16le', sample_rate: SR } }) });
  if (!r.ok) throw new Error(`Cartesia ${r.status}: ${(await r.text()).slice(0, 300)}`);
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

// ---------------------------------------------------------------- build the voice track and the clock
const script = JSON.parse(fs.readFileSync(path.join(project, 'script.json'), 'utf8'));
const v = script.voice || {};
if (!v.id) { console.error('[product-explainer] ERROR: script.json has no voice.id. Pick one with: voice.mjs --voices "<language or accent>"'); process.exit(1); }
const vo = path.join(project, 'vo'), cache = path.join(vo, 'cache'); fs.mkdirSync(cache, { recursive: true });
const pieces = [];
for (const L of script.lines) {
  const said = (L.say || plain(L.text)).trim();
  const h = crypto.createHash('sha1').update([v.model || 'sonic-3.6', v.id, v.language || 'en', v.speed ?? 1, said].join('|')).digest('hex').slice(0, 16);
  const fw = path.join(cache, h + '.wav'), fj = path.join(cache, h + '.json');
  if (!fs.existsSync(fw) || opts.only === L.id || opts.force) {
    process.stdout.write(`voicing ${L.id}: ${said.slice(0, 70)}\n`);
    const { data, words } = await tts(said, v);
    writeMonoWav(fw, data, SR); fs.writeFileSync(fj, JSON.stringify(words));
  }
  let { data } = readWav(fw), words = JSON.parse(fs.readFileSync(fj, 'utf8'));
  // trim the silence Cartesia leaves around a line, keeping 40 ms
  const thr = 0.012; let a = 0, b = data.length - 1;
  while (a < data.length && Math.abs(data[a]) < thr) a++; while (b > a && Math.abs(data[b]) < thr) b--;
  a = Math.max(0, a - Math.round(0.04 * SR)); b = Math.min(data.length - 1, b + Math.round(0.06 * SR));
  data = data.slice(a, b + 1); const off = a / SR;
  words = words.map(w => ({ w: w.w, start: Math.max(0, w.start - off), end: Math.max(0, w.end - off) }));
  pieces.push({ L, said, data, words, dur: data.length / SR });
}
let t = script.lead ?? 0.4; const lines = [];
for (const p of pieces) { lines.push({ id: p.L.id, text: plain(p.L.text), said: p.said !== plain(p.L.text) ? p.said : undefined, start: +t.toFixed(3), end: +(t + p.dur).toFixed(3), words: p.words.map(w => ({ w: w.w, start: +(t + w.start).toFixed(3), end: +(t + w.end).toFixed(3) })) }); p.at = t; t += p.dur + (script.gap ?? 0.35) + (p.L.pause ?? 0); }
const duration = +(lines[lines.length - 1].end + (script.tail ?? 2.6)).toFixed(3);
const track = new Float32Array(Math.ceil(duration * SR));
for (const p of pieces) { const s0 = Math.round(p.at * SR); for (let i = 0; i < p.data.length && s0 + i < track.length; i++) track[s0 + i] += p.data[i]; }
writeMonoWav(path.join(vo, 'voice.wav'), track, SR);
fs.writeFileSync(path.join(vo, 'timing.json'), JSON.stringify({ duration, voice: v, lines }, null, 1));
for (const l of lines) console.log(`${l.id}  ${l.start.toFixed(2)}–${l.end.toFixed(2)} s  ${l.text}`);
console.log(`\n${duration.toFixed(1)} s with the end card · ${path.join(vo, 'voice.wav')} · ${path.join(vo, 'timing.json')}`);
