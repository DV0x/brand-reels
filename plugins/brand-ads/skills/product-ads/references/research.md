# Research: a plan first, then only what the hooks need

Research is for one thing: the wants the hooks will speak to, how many buyers have each, whether the market already
pays to sell on it, and the product fact that proves it. It is not a report on the brand or the category. You plan it
before the first search, keep to the plan, and stop when the plan is answered.

## Contents
1. The core question
2. The plan, before the first search
3. The sources: what each is good for
4. Doing the research
5. Reading reviews and counting wants
6. Reading ads
7. Weighing what you found
8. The wants table: where research ends
9. research.md layout

## 1. The core question
From the skim and the user's answers, write the question the research must answer, in one sentence, before anything
else. Its usual shape: "Which want do *these buyers* of *this product* already have, that the product can prove and
the market already pays to sell on?" Fill it from what you know: who buys (the user's answer, a lead to check), the
product's type and price, what it claims. A part you can't fill is a gap the plan must close first.

Write down what the skim and the answers already told you, so the plan doesn't research it again.

## 2. The plan, before the first search
Think through at least three ways to answer the core question, then pick the one this product's material supports best.
Write the plan at the top of `research.md`, show it in the chat, and go on without waiting: the user reads it while you
work.

**Ways to answer it,** and when each fits (pick, or combine, with a reason):
- **Reviews first:** the shop has a few hundred reviews or more that `reviews.mjs` can read. Count the wants, then check
  that rivals pay to sell on the top ones.
- **Market first:** few readable reviews (a new product, or a review app the script can't read). Start from rivals'
  long-running ads, which show what the market pays for, and from what buyers ask before buying (Reddit, the web). The
  few reviews give quotes, not counts.
- **The user's lead first:** the user named a want or a complaint in step 2. Check it against the reviews and the
  rivals before anything else. If it holds, research its proof; if it doesn't, say so.

**The plan holds:**
- **The core question** (section 1) and the approach, with one line on why the other two lost.
- **3 to 5 sub-questions, only ones the hooks need.** Test each one: "If this stayed unanswered, would a hook be weaker
  or wrong?" If not, it goes on the won't-research list. A sub-question is specific: "Do first-time buyers fear
  stinging, and how many of the 1 to 3 star reviews say so?", never "What do customers think?". For each, write:
  - why the hooks need it;
  - the one best source for it (section 3) and its tool;
  - what comes back: a count, a list of angles with days running, a fact with its source;
  - a budget in tool calls: under 5 for a simple one (a fact on the product page), about 5 for a medium one, about 10
    for a hard one (counting wants across reviews; reading three rivals' ads), 15 at most. Opening a picture counts as
    a call.
- **Won't research,** each with its reason: other products, the brand's story, the size of the category, a source that
  a better one already covers ("Reddit: 1,800 reviews already give buyers' words").
- **Done when:** every sub-question has its answer, or its budget is spent and you say what is missing.

The whole research usually takes 20 to 40 tool calls, and never more than 60. Two products rarely share a plan: if
yours looks like the last one, check that this product really needs the same questions.

## 3. The sources: what each is good for
A menu, not an order. Use only what the plan needs.

| Source | Good for | Weak spot | Tool (tools.md) |
|---|---|---|---|
| The product page and its photos | the facts that can prove a want: actives and amounts, numbers, what it is free of, price, offers, the FAQ | the brand's own claims, not buyers' | `site.mjs --product`, WebFetch, the Read tool for photos |
| The shop's own reviews | buyers' wants and words, with counts; the only customers' words you may quote | written after buying: they show what pleased or let buyers down, not always what stopped them before | `reviews.mjs` |
| Marketplace reviews (Amazon, and the country's own: Nykaa or Flipkart in India) | buyers' words when the shop's can't be read | search snippets only, no counts; never quoted in an ad | WebSearch |
| The brand's own live ads | what it already says, and which ads it keeps paying for | they hold the brand's guesses as well as its winners: only long-runners count as proof | `ads.mjs page`, `pull --sort newest` |
| Rivals' live ads | what the market pays to say: long-runners and ads with copies are the nearest thing to rivals' sales numbers | a new ad proves nothing; a line every rival runs is a template | `ads.mjs page`, `pull`, `search` |
| Reddit and the web | questions and fears before buying, across the product type, in people's own words | the loudest people, not the typical buyer; never quoted in an ad | `reddit.mjs`, WebSearch, WebFetch |
| The country's ad rules | what hooks may and may not claim in this category | blogs and summaries get them wrong: read the regulator's own pages | WebSearch, WebFetch |

**Source quality.** Prefer the original (the brand's page, the shop's review, the ad itself) over a page that reports
it. Treat marketing words, "could" and "may" claims, numbers with no source, and listicles as leads to check, never as
facts.

## 4. Doing the research
- **One sub-question at a time,** in the plan's order. Run independent calls together (three rivals' pulls at once).
- **Searches short and broad first** (under five words), narrower when the results are plenty. Never run the same
  search twice.
- **After every result, think:** what did I learn, what is still missing for this sub-question, what is the next best
  call? Write findings into `research.md` under their sub-question as you go, with their sources.
- **Change the plan when a finding changes it,** and write the change and its reason in the plan: the user's main want
  is missing from the reviews; a rival you hadn't heard of runs the most long-runners.
- **Stop a sub-question** when its answer is in, when new results stop adding anything, or when its budget is spent.
  Then move to the next.

## 5. Reading reviews and counting wants
When the plan uses reviews:
- `RUN reviews.mjs <product url> --out <brand>/<product>/data` reads them all.
- **Read every 1 to 3 star review first:** they hold the fears and the letdowns ("I thought it would..."). Then a
  sample of about 100 of the 4 and 5 star ones: the wants that were met, in buyers' words.
- **Read each review for five things:**
  1. **The pain:** the problem before the product, how long they had it, what they tried.
  2. **The moment they bought:** what finally made them buy (a wedding, a friend, a breaking point, giving up on
     something else).
  3. **The doubt before buying:** in happy reviews it shows in the past tense ("I was skeptical but...", "I almost
     didn't buy because..."). It is the fear an ad must answer before someone buys (section 7, test 2).
  4. **What changed:** the result in their words, and how it felt.
  5. **Standout lines:** lines so specific and felt that a buyer's own words could carry an ad. Keep them word for
     word, with where they came from. They feed one shape, a customer's words (copy.md, section 4).
- **Detail matters more than stars:** quote from long, specific reviews; short ones ("love it") only help a count.
- **Write each want as a buyer would say it before buying** ("I want my skin to look less dull before the wedding",
  not "radiance").
- **Count each want** with a group of the words buyers use for it (`reviews.mjs count`), then read the hits
  (`reviews.mjs read --search`, up to about 20): a count is only as good as its words, and a word often means something
  else. The wants table says how many you read and how many really meant the want.
- **Note the words buyers use for things** ("tan", not "hyperpigmentation"): the hooks use them.
- **Collect the material for the other hook shapes** (copy.md, section 4): the moments buyers describe, the questions
  and doubts they had before buying, the numbers they give, and what they tried before. When the reviews hold few of
  these, look on Reddit and the web: they shape hooks and are never shown as a customer's words.
- **Fewer than 20 reviews:** patterns may mean little; use their words, not their counts.
- A want counts for the hooks when many buyers have it, not when one review says it beautifully.

## 6. Reading ads
When the plan uses ads:
- Find each page with `ads.mjs page` (the brand, and each rival), then `pull` it (most seen first), in the country
  where the ads will run (`--country`).
- **Read the long-runners and the pushed ones (2 or more copies) first,** a few at a time: the words on the picture
  (look at it), the want it sells on, its proof, its format, and the shape of its words (copy.md, section 4).
- **For each want, note who sells on it and for how long.** Several rivals paying for months: proven. One new ad: a
  test.
- **Note the lines every rival runs:** a hook that copies them is a template.
- Fewer ads, read closely: three long-runners read well beat thirty skimmed.

## 7. Weighing what you found
**Four tests for every fear,** before it can become a hook:
1. **Swap the category.** Would a shoe buyer say it too ("it arrived late", "it looked different from the photo")?
   Then it is an online-shopping worry the shop's policy answers, not this product's hook.
2. **Before or after buying?** Reviews are written after; an ad must answer what stops someone before they buy.
3. **Who has it?** A cold ad reaches people who aren't shopping yet; their doubts differ from a buyer's.
4. **What does the market say?** A want or a fear missing from every rival's long-running ads is a warning (never
   tried, or tried and dropped), not a gap to grab.

**And for the proof:**
- **Buying proof over PR proof.** A fact a buyer acts on (what they get, or a problem it spares them) beats an award,
  a lab report or the founder's story.
- **A proof without homework.** The buyer sees it at a glance; a QR code to a lab report is homework.

## 8. The wants table: where research ends
Only the wants the plan found, ranked by how many buyers have them, then by how strongly the market pays to sell on
them.

| Want, in buyers' words | How many (count of N, and where) | Checked: read n matching reviews, m really meant this want | Their words (2 or 3, with where) | Before or after buying | Rivals selling on it (who, days running, copies) | The proof this product has (fact, source) |
|---|---|---|---|---|---|---|

Under the table, the **material for the hooks** (section 5), each with where it came from: the standout lines, word
for word, and the moments, questions, numbers and what buyers tried before. copy.md picks each version's shape from it.

Then the hooks: [copy.md](copy.md). If no want has both buyers and a proof, say so: a hook must never fake one.

**The voice card** comes from the pages you open anyway (the product page, and the About page if the skim showed one):
5 to 8 lines in the brand's own words, three words for how they sound and one they never do. It is not a sub-question.

## 9. research.md layout
```
# <Brand> <Product>: research (<date>)
## The plan
Core question · approach (and why the other two lost) · sub-questions (each: why, source, what comes back,
budget, status) · won't research · done when · changes to the plan (with why)
## Findings, by sub-question
### 1. <the sub-question> (calls used: n of n)
## The voice card
## The wants table
## Material for the hooks
## Decisions I made, and what I could not do
```
