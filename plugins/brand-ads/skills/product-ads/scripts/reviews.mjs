#!/usr/bin/env node
// reviews.mjs: a product's reviews, read to the end from the shop's own review app (Judge.me, Loox, Nector, Yotpo or Okendo), from
// HealthKart's own sites (as hkvitals.com) or from a shop built on Farzi (as plixlife.com), then counted and read on
// demand. The agent picks the words; this script only fetches, counts and prints.
//   reviews.mjs <product page url> --out <dir> [--max 5000]      -> <dir>/reviews.json and a summary
//   reviews.mjs count <reviews.json> "<word|word>" ["<word|word>" ...] [--examples 3]
//                                                                 -> per group: how many reviews use any of its words, by stars
//   reviews.mjs read <reviews.json> [--stars 1-3] [--search "<word|word>"] [--sample n | --newest n] [--seed 1] [--chars 600]
//                                                                 -> the reviews themselves, to read
// Exit codes: 0 done, 1 failed (the message says how to fix it), 2 wrong call (usage).
import path from 'node:path';
import {
  BROWSER_HEADERS, ServiceError, brightDataRequests, fail, getJson, getPage, htmlToText, parseArgs, readJson, request, short,
  sleep, wordsPattern, writeJson,
} from './lib/common.mjs';

const USAGE = [
  'usage: reviews.mjs <product page url> --out <dir> [--max 5000]',
  '       reviews.mjs count <reviews.json> "<word|word>" ["<word|word>" ...] [--examples 3]',
  '       reviews.mjs read <reviews.json> [--stars 1-3] [--search "<word|word>"] [--sample n | --newest n] [--seed 1] [--chars 600]',
].join('\n');

const { opts, pos } = parseArgs(process.argv.slice(2));
if (opts.help) { console.log(USAGE); process.exit(0); }
if (!pos[0]) fail(`no product page or command given.\n${USAGE}`, 2);

// ---------- finding the review app ----------

// Each app's own marks: the address of its script, and its review box. A word on the page is not enough: themes and
// other apps mention many apps' names. The apps this script reads, in the order it prefers them when several are there.
const READS = ['judge.me', 'loox', 'nector', 'yotpo', 'okendo'];
const APP_MARKS = {
  'judge.me': { script: /cdn\.judge\.me|judge\.me\/assets|judgeme_core/i, box: /jdgm-review-widget|jdgm-rev-widg\b|id=["']judgeme_product_reviews/i },
  loox: { script: /loox\.io\\?\/widget\\?\/[A-Za-z0-9_-]+\\?\/loox/i, box: /id=["']looxReviews["']|class=["'][^"']*\bloox-widget\b/i },
  yotpo: { script: /staticw2\.yotpo\.com|cdn-widgetsrepository\.yotpo\.com/i, box: /yotpo-main-widget|yotpo-widget-instance|yotpo-reviews-main-widget/i },
  okendo: { script: /okendo\.io/i, box: /data-oke-widget|oke-reviews-widget|okeReviewsWidget/i },
  // Nector is also a points app: only its review list on the page means it holds the reviews
  nector: { script: /nector\.io/i, box: /nector_loyalty_rewards_review_list|data-op=["']review_list["']/i, boxNeeded: true },
  'Ali Reviews': { script: /alireviews\.fireapps\.io/i, box: /class=["'][^"']*\bali-reviews?\b|alireviews-/i },
  Ryviu: { script: /ryviu\.(?:com|io)/i, box: /class=["'][^"']*\bryviu-/i },
  Stamped: { script: /stamped\.io/i, box: /stamped-main-widget/i },
  Trustpilot: { script: /widget\.trustpilot\.com/i, box: /trustpilot-widget/i },
  Trustify: { script: /trustify/i, box: /trustify_reviews_app_product_block/i },
  'Amazon reviews (Buy with Amazon)': { script: /buywithamazon/i, box: /buywithamazon_bwa_rfa_review/i },
  "Shopify's own Product Reviews (retired)": { script: /productreviews\.shopifycdn\.com/i, box: /id=["']shopify-product-reviews["']|class=["'][^"']*\bspr-reviews\b/i },
};

function detectApp(html, pageUrl) {
  // HealthKart's own sites are not Shopify: a product page carries its review address and the shop's number.
  const hkStore = /"stId":(\d+)/.exec(html)?.[1] ?? /"storeId":(\d+)/.exec(html)?.[1];
  if (/hkrtcdn\.com/i.test(html) && hkStore) {
    const reviewSlug = /"allReviewsUrl":"\/reviews\/([^"?\\]+)/.exec(html)?.[1] ?? /href=["']\/reviews\/([^"'?#/]+)/.exec(html)?.[1] ??
      /^\/reviews\/([^/?#]+)/.exec(new URL(pageUrl).pathname)?.[1];
    return { app: 'healthkart', shopDomain: new URL(pageUrl).hostname, reviewSlug, storeId: hkStore, appsFound: ['healthkart'] };
  }
  // Shops built on Farzi (as plixlife.com) are not Shopify either: the product page carries the product's id and its first
  // reviews (__NEXT_DATA__), and the shop's own scripts name the address that hands out the rest.
  if (/static\.farziengineer\.co/i.test(html)) {
    let next = null;
    try { next = JSON.parse(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? 'null'); } catch { /* not readable */ }
    const ppd = next?.props?.pageProps?.productPageData;
    if (ppd?.product?.id) {
      const scripts = [...html.matchAll(/src=["'](https:\/\/static\.farziengineer\.co\/[^"']+\/_next\/static\/chunks\/pages\/_app-[^"']+\.js)["']/gi)].map((m) => m[1]);
      return { app: 'farzi', shopDomain: new URL(pageUrl).hostname, appsFound: ['farzi'], farzi: { productId: ppd.product.id, title: ppd.product.name, scripts } };
    }
  }
  const shopDomain = /Shopify\.shop\s*=\s*["']([a-z0-9-]+\.myshopify\.com)["']/i.exec(html)?.[1] ?? /["']([a-z0-9-]+\.myshopify\.com)["']/i.exec(html)?.[1];
  const found = Object.entries(APP_MARKS).map(([app, m]) => ({ app, box: m.box.test(html), script: m.script.test(html) && !m.boxNeeded }))
    .filter((x) => x.box || x.script);
  const appsFound = found.map((x) => `${x.app}${x.box ? ' (its review box is on this page)' : ''}`);
  // A readable app whose review box is on the page; else any app whose box is there; else a readable app's script.
  const pick = READS.map((a) => found.find((x) => x.app === a && x.box)).find(Boolean) ?? found.find((x) => x.box) ??
    READS.map((a) => found.find((x) => x.app === a)).find(Boolean) ?? found[0];
  if (!pick) return { app: 'none', shopDomain, appsFound };
  const out = { app: pick.app, shopDomain, appsFound };
  if (pick.app === 'nector') {
    const block = html.slice(html.search(/nector_loyalty_rewards_review_list|data-op=["']review_list["']/i));
    out.nector = {
      apiKey: /data-api_key=["']([^"']+)["']/.exec(block)?.[1], productId: /data-product_id=["'](\d+)["']/.exec(block)?.[1],
      platform: /data-platform_url=["'](https:\/\/[^"']+)["']/.exec(block)?.[1] ?? 'https://platform.nector.io',
    };
  }
  if (pick.app === 'loox') out.looxStore = /loox\.io\\?\/widget\\?\/([A-Za-z0-9_-]+)\\?\/loox/i.exec(html)?.[1];
  if (pick.app === 'yotpo') {
    out.appKey = /staticw2\.yotpo\.com\/([A-Za-z0-9]+)\/widget\.js/.exec(html)?.[1] ??
      /cdn-widgetsrepository\.yotpo\.com\/v1\/loader\/([A-Za-z0-9]+)/.exec(html)?.[1] ?? /data-appkey=["']([A-Za-z0-9]+)["']/i.exec(html)?.[1];
  }
  if (pick.app === 'okendo') {
    out.subscriberId = /oke:subscriber_id["'][^>]*content=["']([0-9a-f-]{36})["']/i.exec(html)?.[1] ??
      /subscriber[_-]?id["']?\s*[:=]\s*["']([0-9a-f-]{36})["']/i.exec(html)?.[1] ?? /api\.okendo\.io\/v1\/stores\/([0-9a-f-]{36})/i.exec(html)?.[1];
  }
  return out;
}

/** The Shopify product id behind a product page, from Shopify's public "/products/<handle>.js". */
async function shopifyProduct(productUrl) {
  const u = new URL(productUrl);
  const handle = /\/products\/([^/?#]+)/.exec(u.pathname)?.[1];
  if (!handle) return null;
  try {
    const { data } = await getJson(`${u.origin}/products/${handle}.js`, { service: 'Shopify', shop: opts, timeoutMs: 20000, maxBytes: 3e6 });
    return data?.id ? { id: String(data.id), title: data.title ?? '', handle } : null;
  } catch {
    return null;
  }
}

// ---------- reading each app (paging to the end) ----------

function judgemeBars(html) {
  const bars = {};
  for (const m of html.matchAll(/jdgm-histogram__row[^>]*data-rating=["'](\d)["'][^>]*data-frequency=["'](\d+)["']/gi)) bars[m[1]] = Number(m[2]);
  const average = Number(/data-average-rating=["']([\d.]+)["']/i.exec(html)?.[1]);
  const total = Number(/data-number-of-reviews=["'](\d+)["']/i.exec(html)?.[1]);
  return { starBars: Object.keys(bars).length ? bars : undefined, average: Number.isFinite(average) ? average : undefined, total: Number.isFinite(total) ? total : undefined };
}

function judgemeFromHtml(html) {
  const out = [];
  for (const part of html.split(/(?=<div[^>]*class=["'][^"']*\bjdgm-rev\b(?!-)[^"']*["'])/i).slice(1)) {
    const id = /data-review-id=["']([^"']+)["']/i.exec(part)?.[1];
    if (!id) continue;
    const stars = Number(/data-score=["'](\d)["']/i.exec(part)?.[1]);
    const title = /class=["'][^"']*jdgm-rev__title\b[^"']*["'][^>]*>([\s\S]*?)<\/(b|div|span|h\d)>/i.exec(part)?.[1];
    const body = /class=["'][^"']*jdgm-rev__body\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(part)?.[1];
    const author = /class=["'][^"']*jdgm-rev__author\b[^"']*["'][^>]*>([\s\S]*?)<\//i.exec(part)?.[1];
    out.push({
      id,
      stars: Number.isFinite(stars) ? stars : undefined,
      title: title ? htmlToText(title) : '',
      body: body ? htmlToText(body) : '',
      date: /jdgm-rev__timestamp[^>]*data-content=["']([^"']+)["']/i.exec(part)?.[1],
      author: author ? htmlToText(author) : undefined,
      verified: /data-verified-buyer=["']true["']/i.test(part),
    });
  }
  return out;
}

// Judge.me answers one of two ways. The old one: {html} with review blocks, 30 a page even when asked for more, the last
// page being the one that brings nothing new. The new one: JSON with reviews[], number_of_reviews, average_rating,
// histogram and pagination.total_pages. "Slow down" (HTTP 429) is waited out, up to 3 times a page.
/** A review app's public address: "slow down" (HTTP 429) is waited out, up to 3 times. */
async function askApp(url, service) {
  for (let attempt = 0; ; attempt++) {
    const got = await request(url, { service, headers: BROWSER_HEADERS, timeoutMs: 30000, maxBytes: 5e6 });
    if (got.status !== 429 || attempt >= 3) return got;
    await sleep([5000, 10000, 15000][attempt]);
  }
}

function judgemeFromJson(x) {
  return {
    id: String(x.uuid ?? x.id), stars: Number(x.rating) || undefined, title: htmlToText(x.title ?? ''), body: htmlToText(x.body_html ?? x.body ?? ''),
    date: x.created_at, author: x.reviewer_name || undefined, verified: x.verified_buyer === true,
  };
}

async function readJudgeme({ shopDomain, productId, max }) {
  const seen = new Set(), reviews = [];
  let pages = 0, stopped = 'every page was read', total, average, starBars, capped = false;
  // Judge.me hands out at most 33 pages (990 reviews) newest first, then repeats the 33rd; so a second pass reads from
  // the oldest end until it meets the first: every review of a product with up to 1,980.
  for (const order of [{}, { sort_by: 'created_at', sort_dir: 'asc' }]) {
    if (order.sort_dir && !(capped && (!total || reviews.length < total))) break;
    capped = false;
    for (let page = 1; reviews.length < max; page++) {
      const url = new URL('https://judge.me/reviews/reviews_for_widget');
      for (const [k, v] of Object.entries({ url: shopDomain, shop_domain: shopDomain, platform: 'shopify', product_id: productId, page: String(page), per_page: '30', ...order })) url.searchParams.set(k, v);
      const got = await askApp(url.toString(), 'Judge.me');
      if (!got.ok) {
        if (page === 1 && !reviews.length) throw new ServiceError('Judge.me', 'refused', `Judge.me did not hand out this product's reviews (HTTP ${got.status}).`, got.status);
        stopped = `Judge.me stopped answering at page ${page} (HTTP ${got.status})`;
        break;
      }
      const text = got.body.toString('utf8');
      let j = null;
      try { j = JSON.parse(text); } catch { /* sometimes plain HTML */ }
      pages++;
      let all;
      if (Array.isArray(j?.reviews)) {
        if (total === undefined && Number.isFinite(Number(j.number_of_reviews))) total = Number(j.number_of_reviews);
        if (average === undefined) average = Number(j.average_rating) || undefined;
        if (!starBars && Array.isArray(j.histogram)) starBars = Object.fromEntries(j.histogram.map((h) => [String(h.rating), Number(h.frequency) || 0]));
        all = j.reviews.map(judgemeFromJson);
      } else {
        const html = typeof j?.html === 'string' ? j.html : text;
        all = judgemeFromHtml(html);
        // an empty widget is a product with no reviews yet; anything else is an answer this script doesn't know
        if (!all.length && page === 1 && !reviews.length && !/jdgm-rev/i.test(html) && !(j && (j.html === '' || Number(j.number_of_reviews) === 0))) {
          throw new ServiceError('Judge.me', 'bad_answer', `Judge.me answered in a shape this script does not know (it began: "${short(text, 80)}"), so no reviews could be read.`);
        }
      }
      if (!all.length) break;
      const fresh = all.filter((r) => !seen.has(r.id));
      if (!fresh.length) { capped = true; break; } // a page that repeats: the end of what this order hands out
      for (const r of fresh) seen.add(r.id);
      reviews.push(...fresh);
      if (j?.pagination?.total_pages && page >= Number(j.pagination.total_pages)) { capped = !!total && reviews.length < total; break; }
      if (page >= 400) { stopped = 'stopped at 400 pages'; break; }
    }
  }
  if (capped && total && reviews.length < total) stopped = `Judge.me hands out about 990 reviews from each end; the ${total - reviews.length} in the middle could not be read`;
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), pages, stopped, total, average, starBars };
}

// Loox: the product widget is a public page, https://loox.io/widget/<store id>/reviews/<product id>, 10 or 20 reviews a
// page as the shop set it (&page=N; an empty page is the end). A review: its id, the reviewer, the stars (the rating icons' label), the text, a
// verified badge, and a date only when the shop shows dates (data-time, in milliseconds).
function looxFromHtml(html) {
  const out = [];
  for (const part of html.split(/(?=<div[^>]*class="grid-item-wrap)/).slice(1)) {
    const id = /data-id="([^"]+)"/.exec(part)?.[1];
    if (!id) continue;
    const stars = Number(/aria-label="Rating icons:\s*(\d)(?:\.\d+)?\s*\/\s*5/.exec(part)?.[1]);
    const author = /data-testid="review-[^"]+-title"[^>]*>([\s\S]*?)<(?:span|\/div)/.exec(part)?.[1];
    const body = /data-testid="review-[^"]+-text"[^>]*>([\s\S]*?)<\/div>/.exec(part)?.[1];
    const time = Number(/data-time="(\d+)"/.exec(part)?.[1]);
    out.push({
      id, stars: stars || undefined, title: '', body: body ? htmlToText(body) : '', date: time ? new Date(time).toISOString() : undefined,
      author: author ? htmlToText(author) : undefined, verified: /loox-verified-badge|Verified purchase/i.test(part),
    });
  }
  return out;
}

async function readLoox({ storeId, productId, max }) {
  const base = `https://loox.io/widget/${encodeURIComponent(storeId)}/reviews/${encodeURIComponent(productId)}`;
  const seen = new Set(), reviews = [];
  let pages = 0, stopped = 'every page was read', total;
  const pageOf = async (page) => {
    const got = await askApp(page === 1 ? base : `${base}?h=&total=${total ?? ''}&variant=visible&language=en&page=${page}`, 'Loox');
    if (!got.ok) throw new ServiceError('Loox', 'refused', `Loox did not hand out page ${page} of this product's reviews (HTTP ${got.status}).`, got.status);
    pages++;
    return got.body.toString('utf8');
  };
  const keep = (html) => {
    const fresh = looxFromHtml(html).filter((r) => !seen.has(r.id));
    for (const r of fresh) seen.add(r.id);
    reviews.push(...fresh);
    return fresh.length;
  };
  const first = await pageOf(1);
  total = Number(/[?&;]total=(\d+)/.exec(first)?.[1]) || undefined;
  const perPage = keep(first);
  if (total && perPage) {
    // the total is known: the remaining pages, 4 at a time (a page holds what the first did, whatever it is asked for)
    const rest = Array.from({ length: Math.max(0, Math.ceil(Math.min(total, max) / perPage) - 1) }, (_, i) => i + 2);
    try {
      for (let i = 0; i < rest.length && reviews.length < max; i += 4) {
        for (const html of await Promise.all(rest.slice(i, i + 4).map(pageOf))) keep(html);
      }
    } catch (err) {
      stopped = `${err.message} Stopped there`;
    }
  } else {
    for (let page = 2; reviews.length < max && page <= 400; page++) {
      let html;
      try { html = await pageOf(page); } catch (err) { stopped = `${err.message} Stopped there`; break; }
      if (!keep(html)) break;
    }
  }
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), pages, stopped, total };
}

// Nector (rewards and reviews): its review list calls platform.nector.io/api/v2/merchant/reviews with the store's
// public key that the page prints for it (x-apikey), 50 a page, newest first; data.count is the product's total.
async function readNector({ apiKey, productId, platform, max }) {
  const reviews = [], seen = new Set();
  let pages = 0, stopped = 'every page was read', total;
  for (let page = 1; reviews.length < max; page++) {
    const url = `${platform.replace(/\/$/, '')}/api/v2/merchant/reviews?page=${page}&limit=50&sort=posted_at&sort_op=DESC&reference_product_id=${encodeURIComponent(productId)}&reference_product_source=shopify`;
    const { data } = await getJson(url, { service: 'Nector', headers: { 'x-apikey': apiKey, 'x-source': 'web', accept: 'application/json' }, timeoutMs: 30000, maxBytes: 10e6 });
    pages = page;
    if (page === 1) total = Number(data?.data?.count) || 0;
    const fresh = (data?.data?.items ?? []).filter((x) => !seen.has(x._id));
    if (!fresh.length) break;
    for (const x of fresh) {
      seen.add(x._id);
      reviews.push({ id: String(x._id), stars: Number(x.rating) || undefined, title: '', body: htmlToText(x.description ?? ''), date: x.posted_at ?? x.created_at, author: x.name || undefined, verified: x.is_verified === true });
    }
    if (total && reviews.length >= total) break;
    if (page >= 400) { stopped = 'stopped at 400 pages'; break; }
  }
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), pages, stopped, total };
}

async function readYotpo({ appKey, productId, max }) {
  const reviews = [];
  let total, average, starBars, pages = 0, stopped = 'every page was read';
  for (let page = 1; reviews.length < max; page++) {
    const url = `https://api-cdn.yotpo.com/v1/widget/${encodeURIComponent(appKey)}/products/${encodeURIComponent(productId)}/reviews.json?per_page=150&page=${page}`;
    const { data } = await getJson(url, { service: 'Yotpo', headers: { accept: 'application/json' }, timeoutMs: 30000, maxBytes: 10e6 });
    pages = page;
    const r = data.response;
    total = r?.pagination?.total ?? r?.bottomline?.total_review ?? total;
    average = r?.bottomline?.average_score ?? average;
    starBars = r?.bottomline?.star_distribution ?? starBars;
    const batch = r?.reviews ?? [];
    for (const x of batch) {
      reviews.push({ id: String(x.id ?? `${page}-${reviews.length}`), stars: x.score, title: htmlToText(x.title ?? ''), body: htmlToText(x.content ?? ''), date: x.created_at, author: x.user?.display_name, verified: x.verified_buyer });
    }
    if (!batch.length || (total !== undefined && reviews.length >= total)) break;
  }
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), total, average, starBars, pages, stopped };
}

async function readOkendo({ subscriberId, productId, max }) {
  const reviews = [];
  let next = `/stores/${subscriberId}/products/shopify-${productId}/reviews?limit=25&orderBy=date%20desc`, pages = 0, stopped = 'every page was read';
  while (next && reviews.length < max) {
    const { data } = await getJson(`https://api.okendo.io/v1${next}`, { service: 'Okendo', headers: { accept: 'application/json' }, timeoutMs: 30000, maxBytes: 5e6 });
    pages += 1;
    for (const x of data.reviews ?? []) {
      reviews.push({ id: x.reviewId ?? `${pages}-${reviews.length}`, stars: x.rating, title: htmlToText(x.title ?? ''), body: htmlToText(x.body ?? ''), date: x.dateCreated, author: x.reviewer?.displayName, verified: x.reviewer?.isVerified });
    }
    next = data.nextUrl ?? null;
    if (!(data.reviews ?? []).length) break;
  }
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), pages, stopped };
}

// HealthKart's sites hand out every version of a product together (flavours, sizes), 100 a page. The star bars and the
// average are the ones the product page shows.
async function readHealthkart({ origin, reviewSlug, storeId, max }) {
  const seen = new Set(), reviews = [];
  let total, average, starBars, pages = 0, stopped = 'every page was read';
  for (let page = 1; reviews.length < max; page++) {
    const url = `${origin}/veronica/variant/review/${encodeURIComponent(reviewSlug)}/results/allReviews?pageNo=${page}&perPage=100&storeId=${storeId}&st=${storeId}`;
    const { data } = await getJson(url, { service: 'HealthKart', shop: opts, timeoutMs: 30000, maxBytes: 10e6 });
    const r = data?.results ?? {};
    pages = page;
    if (page === 1) {
      total = r.ttl_rvws || undefined;
      if (!total) throw new ServiceError('HealthKart', 'bad_answer', "HealthKart's site did not hand out this product's reviews.");
      if (r.sv_rtng?.ovrall_rtng) average = Math.round(r.sv_rtng.ovrall_rtng * 100) / 100;
      starBars = r.sv_rtng?.rtng_dmn ?? undefined;
    }
    const batch = (r.sv_rvw ?? []).filter((x) => !seen.has(x.id));
    if (!batch.length) break;
    for (const x of batch) {
      seen.add(x.id);
      reviews.push({ id: String(x.id), stars: x.rtng, title: htmlToText(x.title ?? ''), body: htmlToText(x.review ?? ''), date: x.rvw_dt, author: x.user || undefined, verified: x.cert === true });
    }
    if (reviews.length >= total) break;
    if (page >= 200) { stopped = 'stopped at 200 pages'; break; }
    await sleep(300);
  }
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), total, average, starBars, pages, stopped };
}

// Shops built on Farzi (as plixlife.com): the shop's own GraphQL address, the one its product page asks for more reviews.
// The address is named in the shop's main script; reviews come 100 a page, by cursor, until the last page.
async function readFarzi({ scripts, productId, max }) {
  let api;
  for (const src of scripts) {
    const got = await request(src, { service: 'Farzi', headers: BROWSER_HEADERS, timeoutMs: 30000, maxBytes: 15e6 });
    const found = [...got.body.toString('utf8').matchAll(/https:\/\/[a-z0-9.-]+\.farziengineer\.co\/graphql\/?(?:\?source=website)?/gi)].map((m) => m[0]);
    api = found.find((h) => !/internal/i.test(h)) ?? found[0];
    if (api) break;
  }
  if (!api) throw new ServiceError('Farzi', 'bad_answer', "found a shop built on Farzi, but not the address its page reads reviews from.");
  const query = 'query R($product: ID!, $first: Int!, $after: String) { productReviews(product: $product, first: $first, after: $after, isPublished: true) { totalCount pageInfo { hasNextPage endCursor } edges { node { id rating created publishedDate verified userName title review } } } }';
  const seen = new Set(), reviews = [];
  let after = null, total, pages = 0, stopped = 'every page was read';
  while (reviews.length < max) {
    const got = await request(api, {
      service: 'Farzi', method: 'POST', timeoutMs: 30000, maxBytes: 10e6,
      headers: { ...BROWSER_HEADERS, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, variables: { product: productId, first: 100, after } }),
    });
    if (!got.ok) throw new ServiceError('Farzi', 'refused', `Farzi did not hand out this product's reviews (HTTP ${got.status}).`, got.status);
    let data = null;
    try { data = JSON.parse(got.body.toString('utf8')); } catch { /* checked below */ }
    const pr = data?.data?.productReviews;
    if (!pr) throw new ServiceError('Farzi', 'bad_answer', `Farzi did not hand out this product's reviews${data?.errors?.[0]?.message ? ` ("${short(data.errors[0].message, 80)}")` : ''}.`);
    pages++;
    total ??= pr.totalCount ?? undefined;
    const batch = (pr.edges ?? []).map((e) => e?.node).filter((x) => x && !seen.has(x.id));
    for (const x of batch) {
      seen.add(x.id);
      // the date the shop shows (publishedDate), unless it is missing or in the future (a few are, by mistake): then the
      // date the review was stored
      const shown = Date.parse(x.publishedDate ?? '');
      const date = Number.isFinite(shown) && shown <= Date.now() ? x.publishedDate : x.created;
      reviews.push({ id: String(x.id), stars: Number(x.rating) || undefined, title: htmlToText(x.title ?? ''), body: htmlToText(x.review ?? ''), date, author: x.userName || undefined, verified: x.verified === true });
    }
    if (!batch.length || !pr.pageInfo?.hasNextPage) break;
    after = pr.pageInfo.endCursor;
    if (pages >= 200) { stopped = 'stopped at 200 pages'; break; }
    await sleep(300);
  }
  if (reviews.length >= max) stopped = `stopped at --max ${max}`;
  return { reviews: reviews.slice(0, max), total, pages, stopped };
}

// ---------- helpers for count and read ----------

const dayOf = (d) => {
  const t = Date.parse(d ?? '');
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : '?';
};
const textOfReview = (r) => `${r.title ?? ''}\n${r.body ?? ''}`;
const starCounts = (list) => {
  const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of list) if (c[r.stars] !== undefined) c[r.stars] += 1;
  return c;
};
const starsLine = (c) => [5, 4, 3, 2, 1].map((s) => `${s}★ ${c[s] ?? 0}`).join(' · ');

function starFilter(spec) {
  if (!spec || spec === true) return () => true;
  const m = /^(\d)(?:-(\d))?$/.exec(String(spec));
  if (!m) fail(`--stars takes one number or a range, like 5 or 1-3 (got "${spec}").`, 2);
  const lo = Number(m[1]), hi = Number(m[2] ?? m[1]);
  return (r) => r.stars >= Math.min(lo, hi) && r.stars <= Math.max(lo, hi);
}

/** A seeded shuffle, so the same sample can be read again. */
function sample(list, n, seed) {
  let s = (Number(seed) || 1) % 2147483647;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

/** The sentence around the first match, for an example line. */
function around(text, re) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const m = re.exec(flat);
  if (!m) return short(flat, 160);
  const start = Math.max(0, flat.lastIndexOf('.', m.index) + 1, m.index - 100);
  return short(flat.slice(start), 170);
}

// ---------- the three commands ----------

async function fetchMode(link) {
  if (!opts.out) fail(`no --out folder.\n${USAGE}`, 2);
  let productUrl;
  try { productUrl = new URL(/^https?:/i.test(link) ? link : `https://${link}`); } catch { fail(`"${link}" is not a web address.`, 2); }
  const max = Number(opts.max) || 5000;
  let page;
  try {
    page = await getPage(productUrl.toString(), { keys: opts });
  } catch (err) {
    fail(`could not open the product page: ${err.message} Open it with WebFetch instead, and search the web for its reviews.`);
  }
  const app = detectApp(page.html, page.finalUrl);
  if (app.appsFound.length > 1) console.log(`review apps on the page: ${app.appsFound.join('; ')}. Reading ${app.app}.`);
  if (![...READS, 'healthkart', 'farzi'].includes(app.app)) {
    const which = app.app === 'none' ? 'no review app this script knows' : app.app;
    fail(`this page uses ${which}. This script reads Judge.me, Loox, Nector, Yotpo, Okendo, HealthKart's own sites and shops built on Farzi only. Read the reviews the page itself shows (WebFetch), and search the web for the product's reviews on marketplaces (Amazon, and the country's own: Nykaa or Flipkart in India): their snippets show customers' words. Say in BRIEF.md that the shop's own reviews could not be counted.`);
  }
  let product;
  if (app.app === 'healthkart') {
    if (!app.reviewSlug) fail(`found HealthKart's own reviews, but ${page.finalUrl} is not a product page. Give the product's own page, not the home page or a list of products.`);
    const title = /property=["']og:title["']\s+content=["']([^"']+)/i.exec(page.html)?.[1] ?? /<title[^>]*>([^<]+)/i.exec(page.html)?.[1] ?? app.reviewSlug;
    product = { id: app.reviewSlug, title: htmlToText(title).split(' | ')[0].trim() };
  } else if (app.app === 'farzi') {
    const title = app.farzi.title ?? /property=["']og:title["']\s+content=["']([^"']+)/i.exec(page.html)?.[1] ?? app.farzi.productId;
    product = { id: app.farzi.productId, title: htmlToText(title).trim() };
  } else {
    product = await shopifyProduct(page.finalUrl);
    if (!product) fail(`found ${app.app}, but not the Shopify product id behind ${page.finalUrl}. Give the product's own page (with /products/<name> in its address).`);
  }
  let got;
  try {
    if (app.app === 'healthkart') {
      got = await readHealthkart({ origin: new URL(page.finalUrl).origin, reviewSlug: app.reviewSlug, storeId: app.storeId, max });
    } else if (app.app === 'farzi') {
      got = await readFarzi({ ...app.farzi, max });
    } else if (app.app === 'judge.me') {
      if (!app.shopDomain) fail('found Judge.me, but not the shop\'s myshopify.com address in the page, which Judge.me needs.');
      got = await readJudgeme({ shopDomain: app.shopDomain, productId: product.id, max });
      const bars = judgemeBars(page.html); // the page's own numbers, when Judge.me's answer has none
      got = { ...got, appTotal: got.total, total: got.total ?? bars.total, average: got.average ?? bars.average, starBars: got.starBars ?? bars.starBars };
    } else if (app.app === 'nector') {
      if (!app.nector?.apiKey) fail("found Nector's review list, but not its store key in the page, which Nector needs.");
      got = await readNector({ ...app.nector, productId: app.nector.productId ?? product.id, max });
    } else if (app.app === 'loox') {
      if (!app.looxStore) fail("found Loox, but not its store id in the page, which Loox needs.");
      got = await readLoox({ storeId: app.looxStore, productId: product.id, max });
    } else if (app.app === 'yotpo') {
      if (!app.appKey) fail("found Yotpo, but not its app key in the page, which Yotpo needs.");
      got = await readYotpo({ appKey: app.appKey, productId: product.id, max });
    } else {
      if (!app.subscriberId) fail("found Okendo, but not its store id in the page, which Okendo needs.");
      got = await readOkendo({ subscriberId: app.subscriberId, productId: product.id, max });
    }
  } catch (err) {
    fail(`${err.message} Read the reviews the page itself shows (WebFetch), and search the web for marketplace reviews.`);
  }
  const reviews = got.reviews.filter((r) => (r.title || r.body));
  const file = path.join(path.resolve(String(opts.out)), 'reviews.json');
  const appSays = app.app === 'judge.me' ? got.appTotal : got.total; // not the page's badge: it may belong to another product on the page
  if (!got.reviews.length && appSays) fail(`${app.app} counts ${appSays} reviews for this product but handed out none. Read the reviews the page itself shows (WebFetch), and search the web for marketplace reviews.`);
  writeJson(file, {
    product_url: page.finalUrl, product_title: product.title, app: app.app, apps_found: app.appsFound, shop: app.shopDomain ?? null, product_id: product.id,
    read_at: new Date().toISOString(), total_reported: got.total ?? null, average: got.average ?? null, star_bars: got.starBars ?? null,
    pages: got.pages, stopped: got.stopped, via: brightDataRequests() ? 'bright data' : 'direct', bright_data_requests: brightDataRequests(),
    fetched: got.reviews.length, count: reviews.length, reviews,
  });
  if (!got.reviews.length) {
    console.log(`${product.title}  (${page.finalUrl})\nreview app: ${app.app} · this product has no reviews yet.`);
    console.log(`\nsaved ${file}\nnext: run this on the shop's product with the most reviews (often its best seller), or read the marketplaces' reviews.`);
    return;
  }
  const dates = reviews.map((r) => dayOf(r.date)).filter((d) => d !== '?').sort();
  console.log(`${product.title}  (${page.finalUrl})`);
  console.log(`review app: ${app.app} · read ${got.reviews.length} reviews${got.total ? ` (the app says ${got.total})` : ''} in ${got.pages} pages: ${got.stopped}`);
  if (brightDataRequests()) console.log(`the shop turned this computer away: read through Bright Data (${brightDataRequests()} requests)`);
  if (got.average) console.log(`average: ${got.average}`);
  if (got.starBars) console.log(`stars the page shows: ${starsLine(got.starBars)}`);
  console.log(`stars of the reviews read: ${starsLine(starCounts(reviews))}`);
  if (dates.length) console.log(`dates: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`with words (title or text): ${reviews.length}; verified buyers: ${reviews.filter((r) => r.verified).length}`);
  console.log('newest three:');
  for (const r of reviews.slice().sort((a, b) => (Date.parse(b.date ?? '') || 0) - (Date.parse(a.date ?? '') || 0)).slice(0, 3)) console.log(`  ${r.stars ?? '?'}★ ${dayOf(r.date)} · ${short(`${r.title ? `${r.title}: ` : ''}${r.body}`, 200)}`);
  console.log(`\nsaved ${file}\nnext: read the 1 to 3 star ones (read ${file} --stars 1-3), a sample of the rest (--stars 4-5 --sample 100), then count each want (count ${file} "word|word").`);
}

function countMode(file, groups) {
  if (!groups.length) fail(`give at least one group of words to count, like "light|heavy|bloat".\n${USAGE}`, 2);
  const data = readJson(file);
  const all = data.reviews ?? [];
  const byStars = starCounts(all);
  const examples = Number(opts.examples ?? 3);
  console.log(`${all.length} reviews of ${data.product_title ?? 'the product'} (${starsLine(byStars)})`);
  for (const g of groups) {
    const re = wordsPattern(g);
    if (!re) continue;
    const hits = all.filter((r) => re.test(textOfReview(r)));
    const c = starCounts(hits);
    const pct = all.length ? ((hits.length / all.length) * 100).toFixed(1) : '0';
    console.log(`\n"${g}": ${hits.length} of ${all.length} reviews (${pct}%)`);
    console.log(`  by stars: ${[5, 4, 3, 2, 1].map((s) => `${s}★ ${c[s]} of ${byStars[s]}`).join(' · ')}`);
    for (const r of sample(hits, examples, hits.length)) console.log(`  e.g. ${r.stars ?? '?'}★ ${dayOf(r.date)}: "${around(textOfReview(r), re)}"`);
  }
  console.log('\nA review counts once per group however often it uses the words. Read a few hits before you trust a count: a word can mean something else ("light" the colour, "not heavy").');
}

function readMode(file) {
  const data = readJson(file);
  let list = (data.reviews ?? []).filter(starFilter(opts.stars));
  if (opts.search) {
    const re = wordsPattern(opts.search);
    if (re) list = list.filter((r) => re.test(textOfReview(r)));
  }
  const matched = list.length;
  if (opts.newest) list = list.slice().sort((a, b) => (Date.parse(b.date ?? '') || 0) - (Date.parse(a.date ?? '') || 0)).slice(0, Number(opts.newest));
  else if (opts.sample) list = sample(list, Number(opts.sample), opts.seed ?? 1);
  const chars = Number(opts.chars ?? 600);
  console.log(`${matched} reviews match${opts.stars ? ` (stars ${opts.stars})` : ''}${opts.search ? ` (words "${opts.search}")` : ''}; showing ${list.length}.\n`);
  for (const r of list) {
    console.log(`[${r.id}] ${r.stars ?? '?'}★ ${dayOf(r.date)}${r.verified ? ' · verified' : ''}${r.author ? ` · ${r.author}` : ''}`);
    if (r.title) console.log(`  ${short(r.title, 160)}`);
    if (r.body) console.log(`  ${short(r.body, chars)}`);
    console.log('');
  }
}

if (pos[0] === 'count') countMode(pos[1] ?? fail(`no reviews.json given.\n${USAGE}`, 2), pos.slice(2));
else if (pos[0] === 'read') readMode(pos[1] ?? fail(`no reviews.json given.\n${USAGE}`, 2));
else await fetchMode(pos[0]);
