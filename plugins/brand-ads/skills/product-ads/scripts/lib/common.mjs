// Shared plumbing for the product-ads scripts: arguments, keys, calls to the outside world, files, small text helpers.
// Every outside call has a time limit, a size limit and plain-words errors; "slow down" (HTTP 429) is retried.
import fs from 'node:fs';
import path from 'node:path';

export const TAG = '[product-ads]';

/** `--name value` and `--flag` options, the rest positional. */
export function parseArgs(argv) {
  const opts = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) opts[a.slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else pos.push(a);
  }
  return { opts, pos };
}

/** Print an error the agent can act on, and stop. Exit 1: failed (the message says how to fix it); 2: wrong call. */
export function fail(message, code = 1) {
  console.error(`${TAG} ERROR: ${message}`);
  process.exit(code);
}

export function warn(message) {
  console.error(`${TAG} warning: ${message}`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- keys ----------

function readEnvFile(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}

/**
 * A key, from (in order) the --key-file the user named, the environment, or a .env file in the folder the script runs
 * from. Nowhere else: the user's keys are theirs, and other folders are never searched.
 */
export function getKey(name, opts, { optional = false, service = name } = {}) {
  if (opts['key-file']) {
    const file = path.resolve(String(opts['key-file']));
    if (!fs.existsSync(file)) fail(`no file at ${file} (the --key-file path). Ask the user for the right path.`);
    const v = readEnvFile(file)[name];
    if (v) return v;
  }
  if (process.env[name]?.trim()) return process.env[name].trim();
  const local = path.resolve('.env');
  if (fs.existsSync(local)) {
    const v = readEnvFile(local)[name];
    if (v) return v;
  }
  if (optional) return null;
  fail(`no ${name} for ${service}. Ask the user for the key, or for the path of a .env file that holds it, then run again with --key-file <path>. Never search their computer for it.`);
}

// ---------- calls ----------

export const BROWSER_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en;q=0.9',
};

export class ServiceError extends Error {
  constructor(service, kind, message, status) {
    super(message);
    this.service = service;
    this.kind = kind; // too_many | out_of_credit | refused | not_found | service_error | network | timeout | too_big | bad_answer
    this.status = status;
  }
}

/** One call with a time limit and a size limit. Never throws for an HTTP status; the caller decides. */
export async function request(url, { service = 'the site', method = 'GET', headers = {}, body, timeoutMs = 30000, maxBytes = 20e6 } = {}) {
  let res;
  try {
    res = await fetch(url, { method, headers, body, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') throw new ServiceError(service, 'timeout', `${service} did not answer within ${Math.round(timeoutMs / 1000)} seconds.`);
    throw new ServiceError(service, 'network', `${service} could not be reached${err?.cause?.message ? ` (${err.cause.message})` : ''}.`);
  }
  const chunks = [];
  let size = 0, cut = false;
  try {
    for await (const chunk of res.body ?? []) {
      size += chunk.byteLength;
      if (size > maxBytes) { cut = true; break; }
      chunks.push(Buffer.from(chunk));
    }
  } catch {
    throw new ServiceError(service, 'network', `${service}: the answer broke off half-way.`);
  }
  return { status: res.status, ok: res.ok, finalUrl: res.url || url, headers: res.headers, body: Buffer.concat(chunks), cut };
}

function errorFor(service, status, text) {
  const said = text.replace(/\s+/g, ' ').trim().slice(0, 200);
  const tail = said ? ` It said: "${said}"` : '';
  if (status === 429) return new ServiceError(service, 'too_many', `${service} asked us to slow down (HTTP 429).${tail}`, status);
  if (status === 402) return new ServiceError(service, 'out_of_credit', `${service} says its prepaid credit is empty (HTTP 402). The user must top it up.${tail}`, status);
  if (status === 401 || status === 403) return new ServiceError(service, 'refused', `${service} refused the request (HTTP ${status}): the key is wrong or expired, or the site turns scripts away.${tail}`, status);
  if (status === 404 || status === 410) return new ServiceError(service, 'not_found', `${service} has nothing at that address (HTTP ${status}).`, status);
  if (status >= 500) return new ServiceError(service, 'service_error', `${service} had a problem on its side (HTTP ${status}).${tail}`, status);
  return new ServiceError(service, 'bad_answer', `${service} answered HTTP ${status}.${tail}`, status);
}

const WAITS = [5000, 10000, 15000];

/**
 * A JSON service: errors in plain words; "slow down" is retried up to 3 times, a network or server error once.
 * With `shop` (the script's options, for --key-file), the address is on the shop's own site: see fetchShop.
 */
export async function getJson(url, opts = {}) {
  const service = opts.service ?? 'the service';
  for (let attempt = 0; ; attempt++) {
    try {
      const got = opts.shop
        ? await fetchShop(url, { keys: opts.shop, accept: 'application/json', timeoutMs: opts.timeoutMs, maxBytes: opts.maxBytes })
        : await request(url, opts);
      const text = got.body.toString('utf8');
      if (got.turnedAway) throw turnedAwayError(service, got.status);
      if (!got.ok) throw errorFor(service, got.status, text);
      if (got.cut) throw new ServiceError(service, 'too_big', `${service} sent more than ${opts.maxBytes ?? 20e6} bytes; the answer was cut.`);
      try {
        return { data: JSON.parse(text), headers: got.headers };
      } catch {
        throw new ServiceError(service, 'bad_answer', `${service} did not answer in JSON.`);
      }
    } catch (err) {
      const retry = err instanceof ServiceError && attempt < WAITS.length &&
        (err.kind === 'too_many' || (['service_error', 'network', 'timeout'].includes(err.kind) && attempt < 1));
      if (!retry) throw err;
      await sleep(WAITS[attempt]);
    }
  }
}

/** A web page's HTML from the shop's own site, as a browser would ask for it (see fetchShop). */
export async function getPage(url, { timeoutMs = 25000, keys = {} } = {}) {
  const got = await fetchShop(url, { keys, timeoutMs, maxBytes: 8e6 });
  if (got.turnedAway) throw turnedAwayError(new URL(url).hostname, got.status);
  if (!got.ok) throw errorFor(new URL(url).hostname, got.status, '');
  return { html: got.body.toString('utf8'), finalUrl: got.finalUrl, via: got.via };
}

// ---------- the shop's own site: asked directly, and through Bright Data when it turns this computer away ----------
// Only the shop's own pages go this way (home page, product pages, products.json, HealthKart's review address). Review
// apps and services (Judge.me, Yotpo, Okendo, Loox, ScrapeCreators, Reddit) never do: they don't turn scripts away,
// and their keys must never reach a third party.

const BRIGHT_DATA_CAP = 60; // per run: a blocked shop needs about 10; the free allowance is 5,000 a month
let brightDataCalls = 0;

/** How many times this run asked Bright Data. */
export const brightDataRequests = () => brightDataCalls;

function turnedAwayError(service, status) {
  return new ServiceError(service, 'turned_away', `${service} turned this computer away (HTTP ${status}). From another computer it may open. With a Bright Data key and zone (BRIGHTDATA_API_KEY and BRIGHTDATA_ZONE), the scripts ask Bright Data for the page instead.`, status);
}

/** Did the shop turn us away? A status that walls answer with, or a "checking your browser" page. */
function turnedAway(got) {
  if ([403, 429, 503].includes(got.status)) return true;
  if (got.headers?.get?.('cf-mitigated') === 'challenge') return true;
  return /<title[^>]*>\s*(?:just a moment|attention required|access denied)/i.test(got.body.subarray(0, 6000).toString('utf8'));
}

async function viaBrightData(url, key, zone, maxBytes, country) {
  let last = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    if (brightDataCalls >= BRIGHT_DATA_CAP) {
      throw new ServiceError('Bright Data', 'too_many', `this run already asked Bright Data ${BRIGHT_DATA_CAP} times, the most one run may.`);
    }
    brightDataCalls++;
    const got = await request('https://api.brightdata.com/request', {
      service: 'Bright Data', method: 'POST', timeoutMs: 90000, maxBytes,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ zone, url, format: 'raw', country }),
    });
    const said = got.headers.get('x-brd-error');
    if (got.ok && got.body.length && !said) return { ...got, finalUrl: url, via: 'bright data' };
    if (got.status === 401 || got.status === 403) throw new ServiceError('Bright Data', 'refused', `Bright Data refused the key (HTTP ${got.status}): check BRIGHTDATA_API_KEY.`, got.status);
    if (got.status === 400) throw new ServiceError('Bright Data', 'bad_answer', `Bright Data said: "${got.body.toString('utf8').replace(/\s+/g, ' ').slice(0, 160)}". Check BRIGHTDATA_ZONE.`, 400);
    last = said || `HTTP ${got.status}`; // its own fetch failed (seen once: "Navigation timeout"): one more try
  }
  throw new ServiceError('Bright Data', 'service_error', `Bright Data could not fetch it either (${last}).`);
}

/**
 * A request to the shop's own site. Asked directly first. When the shop turns this computer away and the user gave a
 * Bright Data key and zone (from --key-file, the environment or a .env here, like every key), asked again through
 * Bright Data. `keys` is the script's options, for --key-file. Never throws for an HTTP status: `turnedAway` is set
 * when the shop refused and there was no key to try another way.
 */
export async function fetchShop(url, { keys = {}, accept, timeoutMs = 25000, maxBytes = 8e6 } = {}) {
  const service = new URL(url).hostname;
  const got = await request(url, { service, headers: { ...BROWSER_HEADERS, ...(accept ? { accept } : {}) }, timeoutMs, maxBytes });
  if (!turnedAway(got)) return { ...got, via: 'direct' };
  const key = getKey('BRIGHTDATA_API_KEY', keys, { optional: true });
  const zone = getKey('BRIGHTDATA_ZONE', keys, { optional: true });
  if (!key || !zone) return got.status === 429 ? { ...got, via: 'direct' } : { ...got, via: 'direct', turnedAway: true }; // 429 alone: "slow down", retried by the caller
  // where Bright Data fetches from: India unless BRIGHTDATA_COUNTRY names another country (two letters)
  const asked = String(getKey('BRIGHTDATA_COUNTRY', keys, { optional: true }) ?? '').trim().toLowerCase();
  return viaBrightData(url, key, zone, maxBytes, /^[a-z]{2}$/.test(asked) ? asked : 'in');
}

/** Save a picture or any file; returns its size in bytes, or 0 when it could not be fetched. */
export async function download(url, file, { timeoutMs = 30000 } = {}) {
  try {
    const got = await request(url, { service: 'picture', headers: { 'user-agent': BROWSER_HEADERS['user-agent'] }, timeoutMs, maxBytes: 15e6 });
    if (!got.ok || got.cut || !got.body.length) return 0;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, got.body);
    return got.body.length;
  } catch {
    return 0;
  }
}

/** Save a picture as <base>.jpg, .png, .webp or .gif, from what its bytes say it is. Returns the file, or null. */
export async function downloadImage(url, base, { timeoutMs = 30000 } = {}) {
  try {
    const got = await request(url, { service: 'picture', headers: { 'user-agent': BROWSER_HEADERS['user-agent'] }, timeoutMs, maxBytes: 15e6 });
    const b = got.body;
    if (!got.ok || got.cut || b.length < 12) return null;
    const ext = b[0] === 0xff && b[1] === 0xd8 ? 'jpg'
      : b[0] === 0x89 && b[1] === 0x50 ? 'png'
      : b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' ? 'webp'
      : b.toString('latin1', 0, 3) === 'GIF' ? 'gif' : null;
    if (!ext) return null;
    const file = `${base}.${ext}`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, b);
    return file;
  } catch {
    return null;
  }
}

/** Run tasks a few at a time. */
export async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

// ---------- files ----------

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
}

export function readJson(file) {
  if (!fs.existsSync(file)) fail(`no file at ${path.resolve(file)}. Run the command that saves it first.`, 2);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    fail(`${file} is not a JSON file this script wrote.`, 2);
  }
}

// ---------- text ----------

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—', rarr: '→', times: '×', copy: '©', reg: '®', trade: '™', deg: '°', middot: '·', bull: '•', rupee: '₹' };

export function decodeEntities(text) {
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole;
    }
    return NAMED[code.toLowerCase()] ?? whole;
  });
}

/** HTML to plain text: line breaks kept, tags dropped, entities decoded. */
export function htmlToText(html) {
  return decodeEntities(String(html ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

export const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'x';

/** "https://www.Brand.in/products/x" or "brand.in" -> "brand.in". */
export function domainOf(raw) {
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Facebook wraps ad links in its own redirect (l.facebook.com/l.php?u=...): the real address behind it. */
export function realLanding(raw) {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (/^(l|lm)\.facebook\.com$/.test(u.hostname) && u.searchParams.get('u')) return u.searchParams.get('u');
    return u.toString();
  } catch {
    return undefined;
  }
}

/** Does a link go to the domain or one of its subdomains? */
export function goesTo(raw, domain) {
  const real = realLanding(raw);
  if (!real || !domain) return false;
  try {
    const host = new URL(real).hostname.toLowerCase().replace(/^www\./, '');
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

/** A regular expression for "word|word|a phrase": each must start at a word's start; endings may follow (bloat -> bloating). */
export function wordsPattern(words) {
  const terms = String(words).split('|').map((w) => w.trim()).filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  if (!terms.length) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${terms.join('|')})`, 'iu');
}

export const short = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

export const isoDay = (unixSeconds) => (unixSeconds ? new Date(unixSeconds * 1000).toISOString().slice(0, 10) : '?');
