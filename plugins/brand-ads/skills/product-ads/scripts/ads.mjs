#!/usr/bin/env node
// ads.mjs: live ads from Meta's Ad Library, through ScrapeCreators (key SCRAPECREATORS_API_KEY). Every call costs
// ad-library credits; each command prints what it used and what is left.
//   ads.mjs page "<brand name>" --site <web address> --out <dir> [--country IN]
//        -> which Facebook page runs the brand's ads, with the evidence (2 to 5 credits)
//   ads.mjs pull <page id> --out <dir> [--sort most-seen|newest] [--more n] [--stills] [--pictures 4] [--country IN]
//        -> the page's live ads: days running, format, copies, words; still ads' pictures saved small (1 credit, +1 per --more)
//   ads.mjs search "<words>" --out <dir> [--exact] [--country IN]
//        -> live ads from any page that use these words, grouped by page (1 credit)
// Exit codes: 0 done, 1 failed (the message says how to fix it), 2 wrong call (usage).
import path from 'node:path';
import {
  ServiceError, domainOf, downloadImage, fail, getJson, getKey, getPage, goesTo, inBatches, isoDay, parseArgs, realLanding, short, slug, writeJson,
} from './lib/common.mjs';

const USAGE = [
  'usage: ads.mjs page "<brand name>" --site <web address> --out <dir> [--country IN]',
  '       ads.mjs pull <page id> --out <dir> [--sort most-seen|newest] [--more n] [--stills] [--pictures 4] [--country IN]',
  '       ads.mjs search "<words>" --out <dir> [--exact] [--country IN]',
].join('\n');

const { opts, pos } = parseArgs(process.argv.slice(2));
if (opts.help) { console.log(USAGE); process.exit(0); }
const [cmd, arg] = pos;
if (!['page', 'pull', 'search'].includes(cmd) || !arg) fail(`give a command and its subject.\n${USAGE}`, 2);
if (!opts.out) fail(`no --out folder.\n${USAGE}`, 2);
const OUT = path.resolve(String(opts.out));
const COUNTRY = String(opts.country ?? 'IN').toUpperCase();

// ---------- the ad library ----------

let KEY, used = 0, left;
async function library(endpoint, params) {
  KEY ??= getKey('SCRAPECREATORS_API_KEY', opts, { service: "ScrapeCreators (Meta's Ad Library)" });
  const url = new URL(`https://api.scrapecreators.com${endpoint}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  const { data } = await getJson(url.toString(), { service: 'ScrapeCreators', headers: { 'x-api-key': KEY }, timeoutMs: 90000, maxBytes: 40e6 });
  if (data.success === false) throw new ServiceError('ScrapeCreators', 'bad_answer', `the ad library call did not work${data.message || data.error ? `: ${data.message ?? data.error}` : '.'}`);
  used += data.credits_charged ?? 1;
  left = data.credits_remaining ?? left;
  return data;
}
const credits = () => `credits: used ${used}${left !== undefined ? `, ${Number(left).toLocaleString('en')} left` : ''}`;

const searchPages = (query) => library('/v1/facebook/adLibrary/search/companies', { query });
const pageAds = (pageId, { sort = 'most-seen', stills = false, cursor } = {}) =>
  library('/v1/facebook/adLibrary/company/ads', {
    pageId, status: 'ACTIVE', country: COUNTRY, media_type: stills ? 'IMAGE_AND_MEME' : 'ALL',
    sort_by: sort === 'newest' ? 'relevancy_monthly_grouped' : 'total_impressions', cursor,
  });
const searchAds = (query, { exact = false } = {}) =>
  library('/v1/facebook/adLibrary/search/ads', { query, search_type: exact ? 'keyword_exact_phrase' : 'keyword_unordered', status: 'ACTIVE', media_type: 'ALL', country: COUNTRY });

// ---------- reading one ad ----------

const textOf = (b) => (!b ? '' : typeof b === 'string' ? b : b.text ?? '');
const clean = (t) => String(t ?? '').replace(/\{\{[^}]*\}\}/g, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim();
const squash = (s) => String(s ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

/** The ad's words in the order a person sees them: the text above the picture, the headline, each card, the rest. */
function adWords(ad) {
  const s = ad.snapshot ?? {};
  const parts = [textOf(s.body), s.title, ...(s.cards ?? []).flatMap((c) => [c.title, textOf(c.body)]), s.link_description,
    ...(s.extra_texts ?? []).map((t) => (typeof t === 'string' ? t : t?.text))];
  const lines = [];
  for (const p of parts) { const c = clean(p); if (c && !lines.includes(c)) lines.push(c); }
  return lines.join('\n');
}

function formatOf(ad) {
  const s = ad.snapshot ?? {};
  const df = String(s.display_format ?? '').toUpperCase();
  const raw = [textOf(s.body), s.title, ...(s.cards ?? []).map((c) => `${c.title ?? ''} ${textOf(c.body)}`)].join(' ');
  if (df === 'DPA' || /\{\{\s*product\./i.test(raw)) return 'catalog';
  if (df === 'VIDEO' || df === 'MULTI_VIDEOS') return 'video';
  if (df === 'IMAGE') return 'single image';
  if (df === 'CAROUSEL' || df === 'MULTI_IMAGES') return 'carousel';
  if (df === 'DCO') return (s.cards ?? []).some((c) => c.video_hd_url || c.video_sd_url) || (s.videos ?? []).length ? 'video set' : 'image set';
  return df ? df.toLowerCase() : 'other';
}
const STILL = new Set(['single image', 'image set', 'carousel']);

function pictureUrls(ad) {
  const s = ad.snapshot ?? {};
  const cards = (s.cards ?? []).filter((c) => !(c.video_hd_url || c.video_sd_url)).map((c) => c.resized_image_url || c.original_image_url).filter(Boolean);
  const singles = (s.images ?? []).map((im) => im.resized_image_url || im.original_image_url).filter(Boolean);
  return [...new Set(cards.length ? cards : singles)];
}

const daysOf = (ad) => (ad.start_date ? Math.max(0, Math.floor((Date.now() / 1000 - ad.start_date) / 86400)) : null);
const band = (d) => (d === null ? '?' : d < 7 ? 'test (under 7 days)' : d < 14 ? 'settling (7-13 days)' : d < 30 ? 'kept (14-29 days)' : d < 60 ? 'survivor (30-59 days)' : 'long-runner (60+ days)');

function landingOf(ad) {
  const s = ad.snapshot ?? {};
  return realLanding(s.link_url ?? (s.cards ?? [])[0]?.link_url);
}

/** Does the ad send people to the domain, and do its own words name the brand? (The page's name doesn't count: a
 *  lookalike page carries the name too.) */
function aboutBrand(ad, domain, name) {
  const s = ad.snapshot ?? {};
  const links = [s.link_url, ...(s.cards ?? []).map((c) => c.link_url)].some((u) => goesTo(u, domain));
  const words = squash(`${adWords(ad)} ${s.caption ?? ''}`);
  const n = squash(name);
  return { links, names: n.length >= 3 && words.includes(n), carriesAddress: links || words.includes(squash(domain)) };
}

function row(ad) {
  const id = String(ad.ad_archive_id ?? ad.ad_id ?? '');
  const days = daysOf(ad);
  const s = ad.snapshot ?? {};
  return {
    id, page_id: String(ad.page_id ?? ''), page_name: ad.page_name ?? s.page_name ?? '', started: isoDay(ad.start_date), days, age: band(days),
    format: formatOf(ad), copies: ad.collation_count ?? 1, words: adWords(ad), landing: landingOf(ad) ?? null, cta: s.cta_text ?? null,
    platforms: ad.publisher_platform ?? [], library_link: id ? `https://www.facebook.com/ads/library/?id=${id}` : null, pictures: [],
  };
}

const tally = (xs) => xs.reduce((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});
const tallyLine = (t) => Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');

// ---------- page: which Facebook page runs the brand's ads ----------

function socialHandles(html, base) {
  const fb = new Set(), ig = new Set();
  for (const m of html.matchAll(/https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/([^"'\s<>?#]+)/gi)) {
    const parts = m[1].split('/').filter(Boolean);
    const h = parts[0]?.toLowerCase() === 'pages' ? parts[parts.length - 1] : parts[0];
    if (h && !/^(sharer|share|plugins|tr|dialog|groups|events|watch|profile\.php|help|policies)$/i.test(h)) fb.add(squash(h));
  }
  for (const m of html.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/([^"'\s<>?#/]+)/gi)) {
    if (!/^(p|reel|explore|stories|accounts)$/i.test(m[1])) ig.add(squash(m[1]));
  }
  return { fb, ig };
}

async function findPage(name) {
  if (!opts.site) fail('give --site <the brand\'s web address>: ads that link there are the strongest evidence.', 2);
  const domain = domainOf(String(opts.site));
  if (!domain) fail(`"${opts.site}" is not a web address.`, 2);
  const notes = [];

  // 1. The site's own Facebook and Instagram links (free).
  let site = { fb: new Set(), ig: new Set() };
  try {
    const home = await getPage(`https://${domain}`);
    site = socialHandles(home.html);
    notes.push(`The site links to ${site.fb.size} Facebook and ${site.ig.size} Instagram account(s).`);
  } catch (err) {
    notes.push(`The site could not be read (${err.message}), so its own Facebook and Instagram links are unknown.`);
  }

  // 2. Pages by name, and 3. every live ad here that carries the web address (1 credit each).
  const [named, addressed] = await Promise.all([searchPages(name.normalize('NFKC').trim()), searchAds(domain)]);
  const candidates = new Map();
  const add = (id, base) => {
    if (!candidates.has(id)) candidates.set(id, { page_id: id, name: '', handle: null, instagram: null, category: null, likes: null, ads_seen: 0, ads_linking_to_site: 0, ads_naming_brand: 0, site_links_here: false, handle_matches_address: false, exact_name: false, found_by: [], ...base });
    return candidates.get(id);
  };
  for (const p of named.searchResults ?? []) {
    const c = add(String(p.page_id), { name: p.name ?? '', handle: p.page_alias ?? null, instagram: p.ig_username ?? null, category: p.category ?? null, likes: p.likes ?? null });
    c.found_by.push('name search');
  }
  for (const ad of addressed.searchResults ?? []) {
    if (!ad.page_id) continue;
    const c = add(String(ad.page_id), { name: ad.page_name ?? '' });
    if (!c.found_by.includes('ads carrying the web address')) c.found_by.push('ads carrying the web address');
    const a = aboutBrand(ad, domain, name);
    c.ads_seen += 1;
    if (a.links) c.ads_linking_to_site += 1;
    if (a.names) c.ads_naming_brand += 1;
  }
  const addressName = squash(domain.split('.')[0]);
  for (const c of candidates.values()) {
    c.site_links_here = site.fb.has(squash(c.page_id)) || (c.handle && site.fb.has(squash(c.handle))) || (c.instagram && site.ig.has(squash(c.instagram))) || false;
    c.handle_matches_address = Boolean(addressName && [c.handle, c.instagram].some((h) => h && squash(h).includes(addressName)));
    c.exact_name = squash(c.name) === squash(name);
  }

  // Evidence first, never likes: ads that link to the site, the site's own link, a matching handle, the exact name.
  const order = (c) => [c.ads_linking_to_site > 0, c.site_links_here, c.handle_matches_address, c.exact_name, c.ads_naming_brand > 0];
  const ranked = [...candidates.values()].sort((a, b) => {
    const x = order(a), y = order(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return Number(y[i]) - Number(x[i]);
    return b.ads_linking_to_site - a.ads_linking_to_site;
  });

  // 4. No page's ads link to the site: read the two best-placed pages' own ads (1 credit each). A page counts when at
  //    least a third of its ads link to the site or name the brand: matching by name alone was wrong 1 time in 5.
  if (!ranked.some((c) => c.ads_linking_to_site > 0)) {
    for (const c of ranked.filter((r) => r.found_by.includes('name search')).slice(0, 2)) {
      const d = await pageAds(c.page_id, { sort: 'newest' });
      const ads = d.results ?? [];
      c.live_ads_total = d.searchResultsCount ?? null;
      c.checked_own_ads = ads.length;
      c.ads_linking_to_site = ads.filter((ad) => aboutBrand(ad, domain, name).links).length;
      c.ads_naming_brand = ads.filter((ad) => aboutBrand(ad, domain, name).names).length;
    }
  }
  // Confirmed: its ads link to the site; or, for a page whose own ads were read, at least a third of them link to the
  // site or name the brand (some brands send their ads to a marketplace instead of their own site).
  const confirmed = (c) => (c.checked_own_ads !== undefined
    ? c.checked_own_ads > 0 && c.ads_linking_to_site + c.ads_naming_brand >= Math.max(1, Math.floor(c.checked_own_ads / 3))
    : c.ads_linking_to_site > 0);
  // 5. Still nothing: search live ads for the brand's name, exact phrase (1 credit).
  if (!ranked.some(confirmed)) {
    const d = await searchAds(name, { exact: true });
    for (const ad of d.searchResults ?? []) {
      if (!ad.page_id) continue;
      const c = add(String(ad.page_id), { name: ad.page_name ?? '' });
      if (!c.found_by.includes('ads naming the brand')) c.found_by.push('ads naming the brand');
      const a = aboutBrand(ad, domain, name);
      if (a.links) c.ads_linking_to_site += 1;
      if (a.names) c.ads_naming_brand += 1;
      if (!ranked.includes(c)) ranked.push(c);
    }
    notes.push(`Searched live ads for "${name}" as an exact phrase too.`);
  }

  const yes = ranked.filter(confirmed);
  const file = path.join(OUT, `page-${slug(name)}.json`);
  writeJson(file, { brand: name, site: domain, country: COUNTRY, checked_at: new Date().toISOString(), confirmed: yes.map((c) => c.page_id), notes, candidates: ranked, credits_used: used });

  console.log(`${name} (${domain}) · live ads in ${COUNTRY}`);
  for (const n of notes) console.log(n);
  console.log('\ncandidates, evidence first (likes are shown for information only):');
  for (const c of ranked.slice(0, 12)) {
    const signs = [
      c.ads_linking_to_site ? `${c.ads_linking_to_site} ad(s) link to ${domain}` : '',
      c.ads_naming_brand ? `${c.ads_naming_brand} name the brand` : '',
      c.checked_own_ads !== undefined ? `checked its ${c.checked_own_ads} newest ads` : '',
      c.site_links_here ? "the site's own link" : '',
      c.handle_matches_address ? 'handle matches the web address' : '',
      c.exact_name ? 'exact name' : '',
    ].filter(Boolean).join(', ');
    console.log(`  page ${c.page_id} · ${c.name || '(no name)'}${c.handle ? ` (@${c.handle})` : ''}${c.instagram ? ` · Instagram @${c.instagram}` : ''}${c.category ? ` · ${c.category}` : ''}${c.likes != null ? ` · ${c.likes} likes` : ''}${signs ? ` · ${signs}` : ''}`);
  }
  console.log(yes.length
    ? `\nCONFIRMED: ${yes.map((c) => `${c.name} (page ${c.page_id})`).join('; ')}. Pull its ads: ads.mjs pull <page id> --out <dir>.`
    : `\nNOT CONFIRMED: no page's live ads in ${COUNTRY} link to ${domain}. The brand may not advertise here now, or runs its ads under another name. Try its short name, or ask the user which page runs their ads. Never pick a page by likes.`);
  console.log(`saved ${file}\n${credits()}`);
}

// ---------- pull: one page's live ads ----------

async function pull(pageId) {
  const sort = opts.sort === 'newest' ? 'newest' : 'most-seen';
  const first = await pageAds(pageId, { sort, stills: Boolean(opts.stills) });
  const ads = [...(first.results ?? [])];
  let cursor = first.cursor;
  for (let i = 0; i < (Number(opts.more) || 0) && cursor; i++) {
    const d = await pageAds(pageId, { sort, stills: Boolean(opts.stills), cursor });
    ads.push(...(d.results ?? []));
    cursor = d.cursor;
  }
  const seen = new Set();
  const rows = ads.map(row).filter((r) => r.id && !seen.has(r.id) && seen.add(r.id));
  const pageName = rows[0]?.page_name || pageId;
  const dir = OUT;
  const perAd = Number(opts.pictures ?? 4);
  const stills = rows.filter((r) => STILL.has(r.format));
  const byId = new Map(ads.map((a) => [String(a.ad_archive_id ?? a.ad_id ?? ''), a]));
  // Picture links die in about 48 hours, so still ads' pictures are saved now, small (about 600 px).
  await inBatches(stills, 6, async (r) => {
    for (const [n, url] of pictureUrls(byId.get(r.id)).slice(0, perAd).entries()) {
      const f = await downloadImage(url, path.join(dir, 'pics', `${r.id}-${n + 1}`));
      if (f) r.pictures.push(path.relative(dir, f));
    }
  });
  const file = path.join(dir, 'ads.json');
  writeJson(file, { page_id: pageId, page_name: pageName, country: COUNTRY, sort, stills_only: Boolean(opts.stills), pulled_at: new Date().toISOString(), live_ads_total: first.searchResultsCount ?? null, more_exist: Boolean(cursor), credits_used: used, ads: rows });

  const total = first.searchResultsCount;
  console.log(`${pageName} (page ${pageId}) · live ads in ${COUNTRY} · ${sort === 'newest' ? 'newest first' : 'most seen first'}${opts.stills ? ' · still pictures only' : ''}`);
  console.log(`Meta shows ${total ?? '?'} live ads for this page here; read ${rows.length}.${cursor ? ' More exist: --more 1 reads the next page for 1 credit.' : ''}`);
  if (!rows.length) { console.log(`No live ads read. A page with no live ads here may still advertise from another page (ads.mjs page).\n${credits()}`); return; }
  console.log(`formats: ${tallyLine(tally(rows.map((r) => r.format)))}`);
  console.log(`age: ${tallyLine(tally(rows.map((r) => r.age)))}`);
  console.log('\n days | format       | copies | words (first line)                                               | pictures');
  for (const r of rows.slice().sort((a, b) => (b.days ?? -1) - (a.days ?? -1))) {
    console.log(`${String(r.days ?? '?').padStart(5)} | ${r.format.padEnd(12)} | ${String(r.copies).padStart(6)} | ${short(r.words.split('\n')[0], 64).padEnd(64)} | ${r.pictures.length ? r.pictures.join(' ') : '-'}`);
  }
  console.log(`\nsaved ${file}${stills.length ? `; pictures in ${path.join(dir, 'pics')} (${stills.reduce((n, r) => n + r.pictures.length, 0)} saved). Look at the long-running still ads first, with the Read tool` : ''}.\n${credits()}`);
}

// ---------- search: live ads from any page that use these words ----------

async function search(words) {
  const d = await searchAds(words, { exact: Boolean(opts.exact) });
  const rows = (d.searchResults ?? []).map(row);
  const pages = new Map();
  for (const r of rows) {
    const p = pages.get(r.page_id) ?? { page_id: r.page_id, page_name: r.page_name, ads: 0, formats: {}, landings: new Set(), example: '' };
    p.ads += 1;
    p.formats[r.format] = (p.formats[r.format] ?? 0) + 1;
    if (r.landing) p.landings.add(domainOf(r.landing));
    if (!p.example) p.example = short(r.words.split('\n')[0], 110);
    pages.set(r.page_id, p);
  }
  const list = [...pages.values()].sort((a, b) => b.ads - a.ads).map((p) => ({ ...p, landings: [...p.landings] }));
  const file = path.join(OUT, `search-${slug(words)}.json`);
  writeJson(file, { query: words, exact: Boolean(opts.exact), country: COUNTRY, searched_at: new Date().toISOString(), total: d.searchResultsCount ?? null, more_exist: Boolean(d.cursor), pages: list, ads: rows, credits_used: used });
  console.log(`"${words}"${opts.exact ? ' (exact phrase)' : ''} · live ads in ${COUNTRY}: Meta counts ${d.searchResultsCount ?? '?'}; read ${rows.length}${d.cursor ? ' (the first page of results)' : ''}, from ${list.length} page(s).`);
  for (const p of list.slice(0, 25)) {
    console.log(`  page ${p.page_id} · ${p.page_name} · ${p.ads} ad(s) · ${tallyLine(p.formats)}${p.landings.length ? ` · links to ${p.landings.slice(0, 3).join(', ')}` : ''}\n      e.g. "${p.example}"`);
  }
  console.log(`saved ${file}\nA page here is a lead, not a rival yet: check it is a brand that sells this kind of product, then pull its ads.\n${credits()}`);
}

try {
  if (cmd === 'page') await findPage(arg);
  else if (cmd === 'pull') await pull(arg);
  else await search(arg);
} catch (err) {
  if (err instanceof ServiceError && err.kind === 'out_of_credit') fail(`ScrapeCreators' credit is empty. The user must top it up (scrapecreators.com); nothing else can read the Ad Library. ${credits()}`);
  if (err instanceof ServiceError && err.kind === 'refused') fail(`ScrapeCreators refused the key (HTTP ${err.status}): it is wrong or expired. Ask the user for a new one.`);
  fail(`${err.message} ${credits()}`);
}
