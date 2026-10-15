#!/usr/bin/env node
// reddit.mjs: Reddit through its official API, with the user's own app keys (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET).
// Optional: without the keys, read Reddit through WebSearch ("site:reddit.com <words>") and WebFetch instead.
//   reddit.mjs search "<words>" --out <dir> [--sub <community>] [--sort relevance|top|new|comments] [--time all|year|month|week] [--max 25]
//        -> posts that match, with their scores and comment counts
//   reddit.mjs thread <link or post id> --out <dir> [--max 200] [--chars 500]
//        -> one post and its comments, the hidden "load more" ones opened too
//   reddit.mjs sub <community>
//        -> does the community exist, and how big is it
// Exit codes: 0 done, 1 failed (the message says how to fix it), 2 wrong call (usage).
import path from 'node:path';
import { ServiceError, fail, getJson, getKey, isoDay, parseArgs, short, slug, sleep, writeJson } from './lib/common.mjs';

const USAGE = [
  'usage: reddit.mjs search "<words>" --out <dir> [--sub <community>] [--sort relevance|top|new|comments] [--time all|year|month|week] [--max 25]',
  '       reddit.mjs thread <link or post id> --out <dir> [--max 200] [--chars 500]',
  '       reddit.mjs sub <community>',
].join('\n');

const { opts, pos } = parseArgs(process.argv.slice(2));
if (opts.help) { console.log(USAGE); process.exit(0); }
const [cmd, arg] = pos;
if (!['search', 'thread', 'sub'].includes(cmd) || !arg) fail(`give a command and its subject.\n${USAGE}`, 2);
if (cmd !== 'sub' && !opts.out) fail(`no --out folder.\n${USAGE}`, 2);

const UA = 'node:brand-ads-product-ads:0.1.0';
let token = null, pausedUntil = 0;

async function appToken() {
  if (token && Date.now() < token.expiresAt - 60000) return token.value;
  const id = getKey('REDDIT_CLIENT_ID', opts, { optional: true });
  const secret = getKey('REDDIT_CLIENT_SECRET', opts, { optional: true });
  if (!id || !secret) fail('no Reddit keys (REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET). They are optional: read Reddit through WebSearch ("site:reddit.com <words>") and WebFetch instead, or ask the user for a .env path that holds them (--key-file <path>).');
  const { data } = await getJson('https://www.reddit.com/api/v1/access_token', {
    service: 'Reddit', method: 'POST', body: 'grant_type=client_credentials', timeoutMs: 30000, maxBytes: 1e5,
    headers: { authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
  });
  if (!data.access_token) fail(`Reddit did not give an app token${data.error ? `: ${data.error}` : ''}. Check the keys with the user.`);
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return token.value;
}

/** One API call. Reddit allows 1,000 calls in 10 minutes; when its own counter runs low, wait for its reset. */
async function api(pathname, params = {}) {
  if (Date.now() < pausedUntil) await sleep(pausedUntil - Date.now());
  const url = new URL(`https://oauth.reddit.com${pathname}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
  url.searchParams.set('raw_json', '1');
  const { data, headers } = await getJson(url.toString(), { service: 'Reddit', headers: { authorization: `Bearer ${await appToken()}`, 'user-agent': UA }, timeoutMs: 30000, maxBytes: 30e6 });
  const remaining = Number(headers.get('x-ratelimit-remaining')), reset = Number(headers.get('x-ratelimit-reset'));
  if (Number.isFinite(remaining) && remaining < 5 && Number.isFinite(reset)) pausedUntil = Date.now() + Math.min(reset, 600) * 1000;
  return data;
}

const postRow = (p) => ({
  id: p.id, sub: p.subreddit, title: p.title ?? '', text: p.selftext ?? '', score: p.score ?? 0, comments: p.num_comments ?? 0,
  date: isoDay(p.created_utc), link: p.permalink ? `https://www.reddit.com${p.permalink}` : p.url,
});

async function search(words) {
  const max = Number(opts.max ?? 25);
  const sub = opts.sub ? String(opts.sub).replace(/^\/?r\//i, '') : null;
  const out = [];
  let after;
  while (out.length < max) {
    const page = await api(sub ? `/r/${encodeURIComponent(sub)}/search` : '/search', {
      q: words, sort: opts.sort ?? 'relevance', t: opts.time ?? 'all', limit: Math.min(100, max - out.length), type: 'link', restrict_sr: sub ? 'on' : undefined, after,
    });
    const posts = (page.data?.children ?? []).filter((c) => c.kind === 't3').map((c) => postRow(c.data));
    out.push(...posts);
    after = page.data?.after ?? undefined;
    if (!after || !posts.length) break;
  }
  const file = path.join(path.resolve(String(opts.out)), `search-${slug(`${sub ?? 'all'}-${words}`)}.json`);
  writeJson(file, { query: words, sub, sort: opts.sort ?? 'relevance', time: opts.time ?? 'all', searched_at: new Date().toISOString(), posts: out });
  console.log(`"${words}"${sub ? ` in r/${sub}` : ' across Reddit'} · ${out.length} post(s)`);
  for (const p of out) {
    console.log(`  [${p.id}] r/${p.sub} · ${p.score} points · ${p.comments} comments · ${p.date} · ${short(p.title, 120)}`);
    if (p.text) console.log(`      ${short(p.text, 220)}`);
  }
  console.log(`saved ${file}\nOpen the threads where buyers talk (reddit.mjs thread <id>). Reddit shapes a hook; it is never quoted as a customer.`);
}

function walk(children, out, stubs) {
  for (const child of children ?? []) {
    if (child.kind === 't1') {
      const c = child.data;
      out.push({ id: c.id, parent: c.parent_id ?? '', body: c.body ?? '', score: c.score ?? 0, date: isoDay(c.created_utc), depth: c.depth ?? 0 });
      if (c.replies && typeof c.replies === 'object') walk(c.replies.data?.children, out, stubs);
    } else if (child.kind === 'more') stubs.push(child.data);
  }
}

async function thread(ref) {
  const id = (/comments\/([a-z0-9]+)/i.exec(ref)?.[1] ?? ref).replace(/^t3_/, '');
  const max = Number(opts.max ?? 200);
  const pair = await api(`/comments/${encodeURIComponent(id)}`, { limit: 500, depth: 12, sort: 'top' });
  const post = pair?.[0]?.data?.children?.[0]?.data;
  if (!post) fail(`Reddit has no thread ${id}.`);
  const comments = [], stubs = [];
  walk(pair[1]?.data?.children, comments, stubs);
  // Open "load more" stubs (100 comment ids a call) and "continue this thread" branches, up to --max comments.
  for (let calls = 0; stubs.length && comments.length < max && calls < 30; calls++) {
    const stub = stubs.shift();
    const kids = stub.children ?? [];
    if (kids.length) {
      if (kids.length > 100) stubs.push({ ...stub, children: kids.slice(100) });
      const more = await api('/api/morechildren', { link_id: `t3_${id}`, children: kids.slice(0, 100).join(','), api_type: 'json', sort: 'top', limit_children: 'false' });
      walk(more.json?.data?.things, comments, stubs);
    } else if (stub.parent_id?.startsWith('t1_')) {
      const branch = await api(`/comments/${encodeURIComponent(id)}`, { comment: stub.parent_id.slice(3), depth: 12, limit: 500, sort: 'top' });
      const found = [];
      walk(branch?.[1]?.data?.children, found, stubs);
      const known = new Set(comments.map((c) => c.id));
      comments.push(...found.filter((c) => !known.has(c.id)));
    }
  }
  const kept = comments.slice(0, max);
  const unopened = stubs.reduce((n, s) => n + (s.count ?? s.children?.length ?? 0), 0);
  const p = postRow(post);
  const file = path.join(path.resolve(String(opts.out)), `thread-${id}.json`);
  writeJson(file, { post: p, comments: kept, unopened_comments: unopened, read_at: new Date().toISOString() });
  const chars = Number(opts.chars ?? 500);
  console.log(`r/${p.sub} · ${p.score} points · ${p.comments} comments · ${p.date}\n${p.title}\n${p.link}`);
  if (p.text) console.log(`\n${short(p.text, chars * 3)}`);
  console.log(`\n${kept.length} comment(s), best first${unopened ? ` (${unopened} more left unopened)` : ''}:`);
  for (const c of kept) if (c.body && c.body !== '[deleted]' && c.body !== '[removed]') console.log(`${'  '.repeat(Math.min(c.depth, 4) + 1)}${c.score} · ${short(c.body, chars)}`);
  console.log(`\nsaved ${file}`);
}

async function sub(name) {
  const clean = name.replace(/^\/?r\//i, '').trim();
  try {
    const about = await api(`/r/${encodeURIComponent(clean)}/about`);
    if (about.kind !== 't5' || !about.data?.display_name) { console.log(`r/${clean}: no such community.`); return; }
    console.log(`r/${about.data.display_name}: ${about.data.subscribers ?? '?'} members${about.data.over18 ? ' (18+)' : ''}\n${short(about.data.public_description ?? '', 300)}`);
  } catch (err) {
    if (err instanceof ServiceError && (err.kind === 'not_found' || err.kind === 'refused')) { console.log(`r/${clean}: ${err.kind === 'refused' ? 'private or banned' : 'no such community'}.`); return; }
    throw err;
  }
}

try {
  if (cmd === 'search') await search(arg);
  else if (cmd === 'thread') await thread(arg);
  else await sub(arg);
} catch (err) {
  fail(`${err.message} If Reddit keeps failing, read it through WebSearch ("site:reddit.com <words>") instead.`);
}
