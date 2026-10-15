---
name: product-ads
description: Writes research-driven hooks for still-image Meta ads (Facebook and Instagram) for a skincare or supplement product sold online. From a product link it reads the product page, asks a few questions, plans a narrow research from the answers, and researches only what the hooks need: the product's reviews, rivals' live ads in Meta's Ad Library, what buyers say on Reddit and the web. Then it picks 2 to 4 angles, writes about 6 hooks for each in different shapes, keeps only those that pass its checks, and shows the best 2 or 3 angles with their evidence for approval. Use it whenever someone shares a skincare or supplement product link and wants ad hooks, angles or headlines for static ads, even if they never say "hook". Not for services (mortgages, appraisals, local businesses) or other product categories. It does not make pictures yet.
---

# Product ads: research-driven hooks

Approved hooks for still-image Meta ads, for one skincare or supplement product, built on research: the words on the
picture, each with the evidence behind it. This version stops at approved hooks: no pictures, and no Meta ad text (the
post's caption and the headline under the picture) yet. **Needed:** the product's link and a ScrapeCreators API key
(it reads Meta's Ad Library). Reddit keys are optional: without them, Reddit is read through web search. A Bright
Data key is optional too: with it, a shop that turns scripts away is read anyway.

| The request | Go to |
|---|---|
| Hooks for a product (the normal case) | **The workflow** below |
| Research: the product, its reviews, the brand's and rivals' ads, what buyers say | [references/research.md](references/research.md) |
| Angles, hooks, versions and checks | [references/copy.md](references/copy.md) |
| Commands, options, errors | [references/tools.md](references/tools.md) |
| Pictures, videos or Meta's ad text | not in this version: say so, and offer the approved hooks as the brief |
| A service, a local business, or a product outside skincare and supplements | not this skill: say so, and don't write hooks |

**The ad is for a stranger scrolling the feed,** with no interest in the brand. A still ad gets about a second. Every
hook follows one line: **a want the buyer already has** (found in the research, and counted) → **a hook that names
it** → **the brand's fact as the proof.**

**You research and write; the user approves.** The research picks the angle. A hook's shape (a moment, a question
answered, a customer's words, an offer) only says the same want in different ways, so the versions are not all one
kind (copy.md). A shape never comes first: a hook built from a formula is a template any rival could run.

## Where files go
In the folder the user started from (ask once if they want another place):
- `<brand>/`: the brand's memory, `BRAND.md` and `LEARNINGS.md` (from `templates/`), read first next time; `site.json`
  (the site skim).
- `<brand>/<product>/`: one folder per product. `research.md` (the plan at the top, then the findings with their
  sources), `HOOKS.md` (the angles and every hook written, with its checks), `BRIEF.md` (the approved angles and
  hooks, from `templates/`), and `data/` (the raw reviews, ads, pictures and posts the scripts save).

Scripts run through the plugin's launcher: `RUN <script> <args>` in the guides (tools.md). Don't install anything
yourself.

## The workflow
Copy this checklist into your reply and tick it off. You stop for the user twice: the questions, and the hooks.

```
Hooks progress:
- [ ] 1. Skim: the brand's memory, the product page, the product photos
- [ ] 2. Questions (STOP 1)
- [ ] 3. The research plan, from the answers
- [ ] 4. Research: the product, its reviews, the brand's and rivals' ads, what buyers say
- [ ] 5. Angles, about 6 hooks each, then the checks as a separate step; the best 2 or 3 angles shown (STOP 2)
- [ ] 6. BRIEF.md, and the brand's memory updated
```

1. **Skim.** If `<brand>/BRAND.md` exists, read it and `LEARNINGS.md` first, and skip what they answer; a new brand
   starts both from the templates. `RUN site.mjs <link> --out <brand>`; for the product, `RUN site.mjs <link>
   --product <link> --out <brand>/<product>/data/product` saves its photos (tools.md, section 2). Then open the product
   page itself (WebFetch) and look at the photos with the Read tool: brands often print their claims (actives,
   numbers, what it is free of) only inside them. If the link is a home page or a collection, list the likely products
   for the first question.
2. **Questions (STOP 1).** Ask only what the user alone can answer, after the skim. Use AskUserQuestion if available:
   it holds 4 questions, so use a second one straight after if you need more, never more than two. Skip anything the
   brand folder, the request or the skim already answers.
   - **Always, unless already answered:**
     - **Which product,** if the link shows several (your pick first). One product per run.
     - **Are you the brand?** If not, the hooks are a concept, and `BRIEF.md` says so.
     - **Where will the ads run:** which country or countries? The site's currency and web address often answer it.
     - **Who will see these ads:** new people, or people who already know the brand (visitors, past buyers)? Without
       an answer, write for new people (copy.md, section 2).
     - **Any offer running now** (a price, a discount, a free gift): an offer can be a hook, but only a real one.
     - **Anything never to say:** claims, words, rivals' names.
     - **How did last time's hooks do?** Only when `BRAND.md` lists hooks with no result yet; write the answer in its
       last column. The next hooks start from what won.
   - **From the skim, only when it matters:** a gap or a contradiction only the brand can settle, whose answer would
     change the hooks or the research: prices or offers that don't match, several pack sizes or variants, a claim with
     no source, a product with too few reviews to read, buyers who look very different from each other.

   Who buys it, its rivals and what customers complain about are for the research to find: a founder's view of these
   is a guess until the reviews and the Ad Library back it. Decide every other gap yourself, and write each decision
   in `research.md`.
3. **The research plan, before the first search** (research.md, sections 1 and 2): the core question, the approach,
   3 to 5 sub-questions the hooks need (each with its source and a budget), and what you won't research. Write it at
   the top of `research.md` and show it in the chat, then go on without waiting: it is not a stop.
4. **Research, by the plan** (research.md, sections 3 to 7): only the plan's sub-questions, each within its budget,
   about 20 to 40 tool calls in all and never more than 60. When a finding changes the plan, change it in writing. It
   ends with the **wants table** (section 8): each want, how many have it, their words, and which rivals already sell
   on it.
5. **The hooks (STOP 2)** (copy.md). Pick 2 to 4 angles from the wants table, write about 6 versions of each, in
   different shapes, in `HOOKS.md`, then run the three checks and the rule as a separate step, keep the 3 or 4 per angle
   that pass (in at least 3 shapes), and show the best 2 or 3 angles (copy.md, section 7). For each: its versions (the
   words on the picture); the want it speaks to; why it should sell (the counts, the rivals running it, the bet); and
   the product fact that proves it, with its source. The user approves, changes, or sends you back for another round:
   two rounds at most.
6. **Lock and remember.** Save `BRIEF.md` from `templates/BRIEF.md`: the approved angles and their hooks (locked), the
   facts they may show (only these), and what never to say. Add the angles, the hooks and the user's verdict to
   `BRAND.md`, and the lessons to `LEARNINGS.md`.

## Rules, with the reason for each
- **Start from what buyers want; the brand's difference is only the proof.** A fact no rival says is not a reason to
  buy: people act on wants they already have, and the brand's fact makes the promise believable.
- **Every hook shows its evidence, counted** ("62 of 410 reviews ask for this"), with the customers' words and the
  rivals who run the angle: the most vivid quote is not always the most common want, and a hook without evidence is a
  guess.
- **Customers' words come only from the brand's own reviews, word for word.** Reddit and web posts can shape a hook
  but are never printed as a customer's words: anything else puts words in a customer's mouth.
- **Every number, offer and claim exactly as the brand publishes it,** with its source, and no health or results
  claims beyond theirs: Meta's rules and the country's own (in India, ASCI, and FSSAI for supplements) reject them,
  and a wrong number costs the brand's trust.
- **The words are approved before any picture:** changing words after the pictures are made wastes the work.
- **One stop for questions, then decide the rest yourself,** and write each decision down. The user's answers are
  leads to check, not a reason to skip the research: a founder's view of their buyers is a guess until the reviews
  back it.
- **Save findings to the files as you go:** when your memory fills, Claude Code compacts it and early details can be
  lost; what is in the files survives.
- **Keys come from the user, and tools fail loudly.** Ask for a key or a `.env` path; never search their computer or
  other projects for keys. When a tool fails, read the error, fix the cause and run again (tools.md); go back to the
  user only for something only they can give (a key, a decision).
