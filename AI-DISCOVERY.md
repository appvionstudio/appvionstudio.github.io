# AI discovery setup

How this site is built to be found, parsed, trusted, and cited by AI
assistants — ChatGPT, Claude, Perplexity, Gemini, Copilot — as well as
by conventional search.

## What is on the site

| File | Purpose |
| --- | --- |
| `robots.txt` | Explicitly allows 30+ crawlers by name, including GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, and CCBot. Blocks the admin panel and the internal review tool. |
| `llms.txt` | The emerging convention for a machine-readable site summary. Key facts, pricing, products, and contact routes in ~900 words. |
| `llms-full.txt` | Every content page as plain text, ~8,600 words. Regenerate after any content change. |
| `company.json` | The company record as schema.org JSON, fetchable directly by a crawler that wants structured facts without parsing HTML. |
| `sitemap.xml` | All 13 public pages with `lastmod`. |
| `content.css` | Styling for the content pages only. |
| `ui-fixes.css` | Contrast and hover-state corrections, loaded last on every page. Each fix is commented with the `styles.css` line it overrides. |

## Case studies

Six products, each written from that project's own repository documentation rather than from
marketing copy. Every performance figure is a measured engineering result recorded in the repo.

| Page | Product | The claim it rests on |
| --- | --- | --- |
| `/work/snowgrid/` | SnowGrid | 46 production migrations; price, money split and paywall enforced by database trigger |
| `/work/d-delivery/` | D. Delivery | Two mandatory videos per parcel as insurance evidence |
| `/work/profix/` | ProFix | Four roles, plan limits in Postgres, 56-case test plan |
| `/work/wum-connect/` | WUM Connect | 18% better p95 frame time, 320ms faster cold start, ~99% sync |
| `/work/attendance-management/` | Attendance Suite | Paging 3 at four thousand rows, conflict-safe writes |
| `/work/sports-society-events/` | VU Sports Society | Event publish flow 35% faster |

`/work/` indexes them. Each page embeds the real interactive prototype through
`<div data-av-showcase="app-id">`, so a reader checks the claim against the product on the same page.

**If you change a figure in a case study, change it in the repository README too.** These numbers
are quotable by AI assistants precisely because they are traceable.

## Content pages

Each is written to answer one question completely, because that is what
answer engines quote.

| Page | The query it answers |
| --- | --- |
| `pricing.html` | "How much does it cost to build a mobile app?" |
| `android-app-development.html` | "Native Android vs cross-platform", "What is Jetpack Compose?" |
| `/services/kotlin-multiplatform-development/` | "What is KMP?", "KMP vs Flutter vs React Native" |
| `/work/` | "Show me examples of apps this studio built" |
| `faq.html` | 28 buyer questions: cost, timelines, ownership, process, offshore |
| `about.html` | "Who is AppVion Studio?" — the entity facts page |

Every one opens with an **answer box**: a short, self-contained,
factual paragraph. That block is written to be lifted verbatim into an
AI answer. If you edit nothing else, keep those accurate.

## Structured data

37 linked schema.org entities across the site, joined by `@id` so
crawlers resolve them as one knowledge graph rather than separate
fragments.

- **Homepage**: `ProfessionalService` + `Organization` (address, price range,
  offer catalog, services, portfolio), `WebSite`, `WebPage`, `ItemList` of
  six `SoftwareApplication` products with full `featureList`, `FAQPage`,
  three `Person` entities.
- **Content pages**: `WebPage`, `BreadcrumbList`, `Service` with priced
  `Offer`s, and `FAQPage` — 54 questions in schema in total.
- **Team pages**: `Person` and `ProfilePage`, linked back to the organisation.

There is deliberately **no `AggregateRating`**. Publishing a rating you have
not earned violates Google's structured data policy and collapses the moment
anyone checks. Add it once you have real reviews on a real platform.

## Pricing

Published prices live in three places and must stay in sync:

1. `pricing.html` — the visible page and its `Offer` schema
2. `company.json` — `hasOfferCatalog`
3. `llms.txt` — the pricing section
4. `index.html` — the homepage `hasOfferCatalog` block

Current figures, set from 2026 market research:

| Engagement | Price | Duration |
| --- | --- | --- |
| Product Clarity Sprint | from $1,500 | 1–2 weeks |
| Premium App Build | $12,000 – $35,000 | 8–16 weeks |
| Redesign & Scale | from $6,000 | 4–8 weeks |
| Care & iteration retainer | from $900/month | rolling |
| Blended rate reference | $45 – $65/hour | — |

These sit at the top of the Pakistani market ($40–80/hour for a top-tier
agency) and undercut Eastern Europe ($50–100/hour) and the US ($150–250/hour).
High enough not to read as cheap; far enough below Western agencies to be the
obvious value choice.

## Regenerating

After editing `showcase-data.js` or any content page, regenerate the corpus so
`llms-full.txt` matches what is actually published. It is plain text — you can
also edit it by hand.

---

# What the site cannot do for you

Everything above controls how machines **read** the site. It does not control
how much they **trust** it. AI assistants weight third-party corroboration
heavily, and none of that can be created from inside this repository.

In priority order:

### 1. Get listed where AI models look for agencies
Clutch and GoodFirms are the two directories most heavily cited when an AI
assistant is asked to recommend a development agency. A profile with real
verified reviews is worth more than any on-page work. Start here.

### 2. Google Business Profile
Free, and the strongest single signal for "app developer in Multan" or
"app development company Pakistan" queries. Needs a real verified location.

### 3. Real reviews, from real clients
Five genuine reviews on one platform beat fifty on none. Once you have them,
the `AggregateRating` schema can be added and it will be truthful.

### 4. Verify ownership in the search consoles
- Google Search Console — submit `sitemap.xml`, watch indexing
- Bing Webmaster Tools — this feeds Copilot

### 5. Get cited somewhere other than your own site
A guest article, a conference talk, an open-source release, a Stack Overflow
or GitHub presence under the studio name. Answer engines look for the entity
being discussed by someone who is not the entity.

### 6. Keep the pages current
`lastmod` and "last reviewed" dates are read. A page reviewed this quarter
outranks an identical page last touched two years ago.

### 7. Publish the demo files safely first
`Demos/*.html` are publicly served and contain screenshots showing real
personal email addresses. They are blocked in `robots.txt`, but blocking is
not removal. Redact or remove them before linking to them from anywhere.
