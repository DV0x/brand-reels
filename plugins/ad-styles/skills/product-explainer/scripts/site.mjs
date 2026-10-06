#!/usr/bin/env node
// site.mjs: reads a brand's website so Claude can pick a product and hear the brand's voice.
//   site.mjs <url> --out <dir>                       -> <dir>/site.json and a short summary: products, fonts, colours, copy
//   site.mjs <url> --product <handle|number|url> --out <project>/product/raw
//                                                    -> that product's photos at full size, product.json, and any reviews on the page
// Shopify stores are read from /products.json; other sites from the page's own product data (JSON-LD) and og:image.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2), opts = {}, pos = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; else pos.push(argv[i]); }
if (!pos[0]) { console.log('usage: site.mjs <url> [--out dir] [--product handle|n|url]'); process.exit(1); }
const start = new URL(/^https?:/.test(pos[0]) ? pos[0] : 'https://' + pos[0]), origin = start.origin, out = path.resolve(opts.out || '.');
fs.mkdirSync(out, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
async function get(url, as = 'text') {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 25000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: as === 'json' ? 'application/json' : '*/*' }, redirect: 'follow', signal: ac.signal });
    if (!r.ok) return null;
    if (as === 'json') { const t = await r.text(); try { return JSON.parse(t); } catch { return null; } }
    if (as === 'buffer') return Buffer.from(await r.arrayBuffer());
    return await r.text();
  } catch { return null; } finally { clearTimeout(tm); }
}
const strip = h => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&#\d+;/g, ' ')
  .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const meta = (html, key) => (html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i')) || [])[1] || null;
const abs = u => { try { return new URL(u.replace(/^\/\//, 'https://'), origin).href; } catch { return null; } };
function jsonld(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1].trim()); const walk = x => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { out.push(x); if (x['@graph']) walk(x['@graph']); } }; walk(j); } catch { /* skip bad blocks */ }
  }
  return out;
}
const isType = (x, t) => [].concat(x['@type'] || []).some(v => String(v).toLowerCase() === t);

// ---------------------------------------------------------------- one product: photos, details, reviews
async function productMode() {
  const sel = String(opts.product);
  let prod = null, html = null, pageUrl = null;
  const shop = await get(`${origin}/products.json?limit=250`, 'json');
  if (/^https?:/.test(sel) || sel.includes('/')) pageUrl = abs(sel);
  else if (shop?.products) {
    const p = /^\d+$/.test(sel) ? shop.products[+sel - 1] : shop.products.find(x => x.handle === sel);
    if (!p) { console.error(`no product "${sel}" (use a handle or a number from the list)`); process.exit(1); }
    pageUrl = `${origin}/products/${p.handle}`;
  } else pageUrl = abs(`/products/${sel}`);
  // Shopify gives the original uploads with their sizes
  const handle = (pageUrl.match(/\/products\/([^/?#]+)/) || [])[1];
  const pj = handle ? await get(`${origin}/products/${handle}.json`, 'json') : null;
  html = await get(pageUrl);
  const files = [];
  if (pj?.product) {
    const p = pj.product;
    prod = { title: p.title, type: p.product_type, vendor: p.vendor, tags: String(p.tags || '').split(',').map(s => s.trim()).filter(Boolean), description: strip(p.body_html),
      price: p.variants?.[0]?.price, variants: (p.variants || []).map(v => ({ title: v.title, price: v.price })).slice(0, 12), url: pageUrl };
    for (const [i, im] of (p.images || []).entries()) {
      const buf = await get(im.src, 'buffer'); if (!buf) continue;
      const ext = (im.src.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i) || [, 'jpg'])[1].toLowerCase(), f = `img-${String(i + 1).padStart(2, '0')}.${ext}`;
      fs.writeFileSync(path.join(out, f), buf); files.push({ file: f, w: im.width, h: im.height, alt: im.alt || null });
    }
  } else if (html) {
    const ld = jsonld(html).find(x => isType(x, 'product')) || {};
    const offer = [].concat(ld.offers || [])[0] || {};
    prod = { title: ld.name || meta(html, 'og:title'), description: strip(ld.description || meta(html, 'og:description') || ''), price: offer.price || offer.lowPrice || null, currency: offer.priceCurrency || null,
      rating: ld.aggregateRating ? { value: ld.aggregateRating.ratingValue, count: ld.aggregateRating.reviewCount || ld.aggregateRating.ratingCount } : null, url: pageUrl };
    const imgs = [...new Set([].concat(ld.image || []).map(x => (typeof x === 'string' ? x : x?.url)).concat(meta(html, 'og:image')).filter(Boolean).map(abs))];
    const { loadImage } = await import('./lib/canvas.mjs').catch(() => ({}));
    for (const [i, u] of imgs.entries()) {
      const buf = await get(u, 'buffer'); if (!buf) continue;
      const ext = (u.split('?')[0].match(/\.(jpe?g|png|webp)$/i) || [, 'jpg'])[1].toLowerCase(), f = `img-${String(i + 1).padStart(2, '0')}.${ext}`;
      fs.writeFileSync(path.join(out, f), buf);
      let w = null, h = null; try { if (loadImage) { const im = await loadImage(buf); w = im.width; h = im.height; } } catch { /* size unknown */ }
      files.push({ file: f, w, h });
    }
  }
  if (!prod) { console.error('could not read that product page'); process.exit(1); }
  // reviews printed into the page by common review apps (many load later with JavaScript and won't show here)
  const reviews = [];
  if (html) {
    for (const m of html.matchAll(/class=["'][^"']*(?:jdgm-rev__body|spr-review-content-body|review-content|stamped-review-content-body|loox-review-content)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|span)>/gi)) { const t = strip(m[1]); if (t.length > 12) reviews.push(t.slice(0, 400)); }
    for (const x of jsonld(html)) for (const r of [].concat(x.review || [])) { const t = strip(r.reviewBody || r.description || ''); if (t.length > 12) reviews.push(t.slice(0, 400)); }
  }
  prod.images = files; prod.reviewsOnPage = [...new Set(reviews)].slice(0, 40);
  fs.writeFileSync(path.join(out, 'product.json'), JSON.stringify(prod, null, 2));
  console.log(`${prod.title}\n${prod.url}\nprice ${prod.price ?? '?'}${prod.currency ? ' ' + prod.currency : ''}`);
  console.log(`photos (${files.length}) in ${out}:`); for (const f of files) console.log(`  ${f.file}  ${f.w ?? '?'}x${f.h ?? '?'}${f.alt ? '  "' + f.alt + '"' : ''}`);
  console.log(`reviews found on the page: ${prod.reviewsOnPage.length}`); prod.reviewsOnPage.slice(0, 8).forEach(r => console.log('  - ' + r.slice(0, 160)));
  console.log(`description: ${prod.description.slice(0, 600)}`);
}

// ---------------------------------------------------------------- the whole site: products, voice, fonts, colours
async function siteMode() {
  const home = await get(origin) || await get(start.href) || '';
  const page = start.pathname.length > 1 ? (await get(start.href)) || '' : '';
  const html = home + page;
  const site = { url: origin, name: meta(home, 'og:site_name') || strip((home.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').split(/[|–—-]/)[0].trim(), title: strip((home.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''),
    description: meta(home, 'description') || meta(home, 'og:description'), ogImage: meta(home, 'og:image'), themeColor: meta(home, 'theme-color'), shopify: false };
  // their own words: headings, short paragraphs, product descriptions
  const copy = [], body = html.replace(/<(nav|header|footer)[\s\S]*?<\/\1>/gi, ' ');
  for (const m of body.matchAll(/<(h1|h2|h3|p|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi)) { const t = strip(m[2]).replace(/\n/g, ' '); if (t.length >= 14 && t.length <= 260 && (t.match(/[₹$€£]/g) || []).length < 2 && !/\[\[|\$\{|\{\{|\}\}/.test(t) && !/cookie|©|copyright|subscribe|newsletter|log ?in|sign ?up|add to cart|checkout|privacy|terms|javascript/i.test(t)) copy.push(t); }
  site.copy = [...new Set(copy)].slice(0, 40);
  // fonts and colours from the page and its stylesheets
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
  const sheets = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi), ...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*rel=["']stylesheet["']/gi)].map(m => abs(m[1])).filter(Boolean);
  for (const u of [...new Set(sheets)].slice(0, 8)) { const t = await get(u); if (t) css.push(t.slice(0, 600000)); }
  const allCss = css.join('\n');
  const fam = {};
  for (const m of allCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) { const f = m[1].split(',')[0].replace(/["']/g, '').trim(); if (f && !/^(var|inherit|initial|sans-serif|serif|monospace|system-ui|-apple|BlinkMacSystemFont|Helvetica|Arial|icons?|swiper)/i.test(f)) fam[f] = (fam[f] || 0) + 1; }
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'>]+)/gi)) for (const f of decodeURIComponent(m[1]).matchAll(/family=([^:&;]+)/g)) { const n = f[1].replace(/\+/g, ' '); fam[n] = (fam[n] || 0) + 50; }
  site.fonts = Object.entries(fam).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => ({ family: f, uses: n }));
  const col = {};
  const hex6 = h => { h = h.replace('#', '').toLowerCase(); return '#' + (h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6)); };
  for (const m of allCss.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) { const h = hex6(m[0]); col[h] = (col[h] || 0) + 1; }
  for (const m of allCss.matchAll(/--[\w-]*colou?r[\w-]*\s*:\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi)) { const h = '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join(''); col[h] = (col[h] || 0) + 3; }
  site.colors = Object.entries(col).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([c, n]) => ({ color: c, uses: n }));
  site.logo = [...new Set([...html.matchAll(/<img[^>]+>/gi)].map(m => m[0]).filter(t => /logo/i.test(t)).map(t => (t.match(/\ssrc=["']([^"']+)["']/i) || t.match(/srcset=["']([^"'\s]+)/i) || [])[1]).filter(Boolean).map(abs))].slice(0, 4);
  // products
  const shop = await get(`${origin}/products.json?limit=250`, 'json');
  if (shop?.products?.length) {
    site.shopify = true;
    site.products = shop.products.map((p, i) => ({ n: i + 1, handle: p.handle, title: p.title, type: p.product_type || null, price: p.variants?.[0]?.price ?? null,
      tags: String(p.tags || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 6), photos: p.images?.length || 0,
      biggestPhoto: (p.images || []).reduce((m, im) => (im.width * im.height > (m?.w || 0) * (m?.h || 0) ? { w: im.width, h: im.height } : m), null), description: strip(p.body_html).slice(0, 280) }));
  } else {
    site.products = jsonld(html).filter(x => isType(x, 'product')).map((x, i) => ({ n: i + 1, title: x.name, url: x.url || x['@id'] || null, description: strip(x.description || '').slice(0, 280) }));
    const links = [...new Set([...html.matchAll(/href=["']([^"']*\/(?:products?|shop|item|p)\/[^"'#?]+)["']/gi)].map(m => abs(m[1])).filter(Boolean))].slice(0, 40);
    site.productLinks = links;
  }
  fs.writeFileSync(path.join(out, 'site.json'), JSON.stringify(site, null, 2));
  console.log(`${site.name || origin}  (${site.shopify ? 'Shopify' : 'not Shopify'})\n${site.description || ''}`);
  console.log(`fonts: ${site.fonts.map(f => f.family).join(', ') || 'none found'}`);
  console.log(`colours: ${site.colors.slice(0, 10).map(c => c.color).join(' ')}`);
  console.log(`their words (${site.copy.length}):`); site.copy.slice(0, 14).forEach(c => console.log('  - ' + c.slice(0, 150)));
  console.log(`products (${site.products.length}):`);
  for (const p of site.products.slice(0, 40)) console.log(`  ${String(p.n).padStart(2)}. ${p.title}${p.type ? ' [' + p.type + ']' : ''}${p.price ? ' ' + p.price : ''}${p.photos != null ? ` · ${p.photos} photos${p.biggestPhoto ? ` up to ${p.biggestPhoto.w}x${p.biggestPhoto.h}` : ''}` : ''}${p.handle ? '  (' + p.handle + ')' : ''}`);
  if (!site.shopify && site.productLinks?.length) { console.log('product links:'); site.productLinks.slice(0, 15).forEach(l => console.log('  ' + l)); }
  console.log(`\nsaved ${path.join(out, 'site.json')}`);
}

await (opts.product ? productMode() : siteMode());
