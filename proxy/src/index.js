const ALLOWED_ORIGIN = 'https://cmankotech.github.io';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// ─── Abuse protection ──────────────────────────────────────────────────────────
// The AI POST endpoints sit behind an Origin check, but Origin is trivially spoofed
// outside a browser. These bounds + a per-IP rate limit keep a leaked endpoint from
// turning into an open, uncapped bill on the Groq key.
const RATE_LIMIT_MAX = 30;        // requests allowed per IP per window
const RATE_LIMIT_WINDOW = 60;     // seconds (also the KV TTL ; KV min is 60s)
const MAX_TOKENS_CAP = 4000;      // hard ceiling on max_tokens for the raw passthrough
const MAX_MESSAGES = 20;          // max messages array length
const MAX_TOTAL_CHARS = 24000;    // max summed length of all message contents

// ─── Veille sources ───────────────────────────────────────────────────────────

// Build a Bing News RSS search URL for a topic query in a given market.
// (Google News RSS returns HTTP 503 to Cloudflare datacenter IPs; Bing does not.)
function bingNewsUrl(query, locale) {
  const q = encodeURIComponent(query);
  const mkt = locale === 'en' ? 'en-US' : 'fr-FR';
  return `https://www.bing.com/news/search?q=${q}&format=rss&setmkt=${mkt}`;
}

// Open-ended topics fanned out across the whole web via Bing News, one query per
// market (FR + EN). Single phrases only : Bing News returns nothing for "A" OR "B".
// The publisher is derived from each article's real domain (see unwrapBing).
const VEILLE_TOPICS = [
  { id: 'product',  label: 'Product',      fr: '"product management"',        en: '"product management"' },
  { id: 'ai',       label: 'IA',           fr: '"intelligence artificielle"', en: '"generative AI"' },
  { id: 'builders', label: 'Builders',     fr: 'startup IA',                  en: '"AI startup"' },
  { id: 'nocode',   label: 'No-code & FR', fr: 'no-code',                     en: 'no-code' },
];

// Curated high-signal feeds, each with its display name.
const VEILLE_CURATED = [
  { id: 'product', label: 'Product', name: 'Mind the Product',       url: 'https://www.mindtheproduct.com/feed/' },
  { id: 'product', label: 'Product', name: "Lenny's Newsletter",     url: 'https://lennysnewsletter.substack.com/feed' },
  { id: 'product', label: 'Product', name: 'Maddyness',              url: 'https://www.maddyness.com/feed/' },
  { id: 'product', label: 'Product', name: 'Rémi Guyot',             url: 'https://remiguyot.substack.com/feed' },
  { id: 'ai',      label: 'IA',      name: "Ben's Bites",            url: 'https://bensbites.substack.com/feed' },
  { id: 'ai',      label: 'IA',      name: 'TLDR AI',                url: 'https://tldr.tech/ai/rss' },
  { id: 'ai',      label: 'IA',      name: 'Marily Nika',            url: 'https://marilynika.substack.com/feed' },
  { id: 'ai',      label: 'IA',      name: 'Génération IA',          url: 'https://generationia.substack.com/feed' },
  { id: 'builders',label: 'Builders',name: 'The Pragmatic Engineer', url: 'https://newsletter.pragmaticengineer.com/feed' },
  { id: 'builders',label: 'Builders',name: 'Hacker News',            url: 'https://hnrss.org/frontpage' },
  { id: 'nocode',  label: 'No-code & FR', name: 'Le Ticket',         url: 'https://leticket.substack.com/feed' },
  { id: 'nocode',  label: 'No-code & FR', name: 'FrenchWeb',         url: 'https://www.frenchweb.fr/feed' },
  { id: 'nocode',  label: 'No-code & FR', name: 'No-code France',    url: 'https://nocodefrance.substack.com/feed' },
];

// Curated feeds + Bing News topics (FR + EN). Free Cloudflare plan caps a
// request at 50 subrequests; this stays ~21 fetches (13 curated + 8 Bing News)
// + Groq + KV. Keep total feeds well under ~40 when adding topics.
const VEILLE_SOURCES = [
  ...VEILLE_CURATED,
  ...VEILLE_TOPICS.flatMap(t => [
    { id: t.id, label: t.label, bing: true, url: bingNewsUrl(t.fr, 'fr') },
    { id: t.id, label: t.label, bing: true, url: bingNewsUrl(t.en, 'en') },
  ]),
];

// Max articles kept per category after merge+dedup (bounds Groq prompt size).
const VEILLE_MAX_PER_CATEGORY = 12;

function decodeEntities(s) {
  return (s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&') // ampersand last so &amp;#233; isn't double-decoded
    .trim();
}

// Bing News links wrap the real article URL in an apiclick redirect; unwrap it
// and use the publisher's bare domain as the source label.
function unwrapBing(link) {
  try {
    const u = new URL(link.replace(/&amp;/g, '&'));
    const real = u.searchParams.get('url');
    if (!real) return { url: link, host: '' };
    return { url: real, host: new URL(real).hostname.replace(/^www\./, '') };
  } catch {
    return { url: link, host: '' };
  }
}

function parseRSSItems(xml, limit = 5) {
  const items = [];
  const itemRx = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const titleRx = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
  const linkRx = /<link>(https?[^<]*)<\/link>|<link\s[^>]*href="([^"]*)"/i;
  const sourceRx = /<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < limit) {
    const block = m[1];
    const t = titleRx.exec(block);
    const l = linkRx.exec(block);
    if (!t || !l) continue;
    let title = decodeEntities(t[1]);
    const link = (l[1] || l[2] || '').trim();
    // Google News items carry the real publisher in <source>; normal feeds don't.
    const s = sourceRx.exec(block);
    const siteName = s ? decodeEntities(s[1]) : '';
    // Google News appends " - Publisher" to titles; drop it when redundant.
    if (siteName && title.endsWith(` - ${siteName}`)) {
      title = title.slice(0, -(siteName.length + 3)).trim();
    }
    if (title && link && link.startsWith('http')) items.push({ title, url: link, siteName });
  }
  return items;
}

// ─── Veille storage ───────────────────────────────────────────────────────────

// ISO 8601 : la semaine 1 est celle qui contient le premier jeudi de l'année
function isoWeekYear(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { week: String(week), year: String(d.getUTCFullYear()) };
}

// Écrit l'édition courante + son archive hebdo + l'index trié (année/semaine desc)
async function storeEdition(env, categories) {
  const now = new Date();
  const { week, year } = isoWeekYear(now);
  const stored = { updated_at: now.toISOString(), week, year, categories };

  await env.VEILLE_STORE.put('veille_latest', JSON.stringify(stored));
  await env.VEILLE_STORE.put(`veille_week_${year}_${week}`, JSON.stringify(stored));

  const index = (await env.VEILLE_STORE.get('veille_index', { type: 'json' })) || [];
  const existing = index.find(e => e.week === week && e.year === year);
  if (existing) existing.updated_at = stored.updated_at;
  else index.push({ week, year, updated_at: stored.updated_at });
  index.sort((a, b) => (Number(b.year) - Number(a.year)) || (Number(b.week) - Number(a.week)));
  await env.VEILLE_STORE.put('veille_index', JSON.stringify(index));

  return stored;
}

// Fetch every veille RSS feed, interleave + dedup per category, synthesize each
// digest with Groq, then store the edition. Shared by the /veille-refresh route
// (external trigger) and the scheduled() cron handler (weekly self-trigger).
async function runVeilleRefresh(env) {
  // Fetch all feeds in parallel, ignore failures
  const results = await Promise.allSettled(
    VEILLE_SOURCES.map(src =>
      fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cf: { cacheTtl: 3600 } })
        .then(r => r.ok ? r.text().then(xml => ({ src, items: parseRSSItems(xml) })) : null)
        .catch(() => null)
    )
  );

  // Group items by category, keeping each feed's items separate for interleaving
  const byCategory = {};
  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value) continue;
    const { src, items } = r.value;
    if (!byCategory[src.id]) byCategory[src.id] = { id: src.id, label: src.label, feeds: [] };
    byCategory[src.id].feeds.push(items.map(i => {
      let link = i.url;
      let site = i.siteName;
      if (src.bing) { const b = unwrapBing(link); link = b.url; site = b.host; }
      return { title: i.title, url: link, source: site || src.name || src.label };
    }));
  }

  // Round-robin across feeds, dedup by title, cap per category. Interleaving
  // guarantees a mix of curated feeds and Google News instead of the first
  // feeds filling the cap and squeezing the rest out.
  for (const cat of Object.values(byCategory)) {
    const queues = cat.feeds.map(f => [...f]);
    const seen = new Set();
    const merged = [];
    let active = true;
    while (active && merged.length < VEILLE_MAX_PER_CATEGORY) {
      active = false;
      for (const q of queues) {
        if (!q.length) continue;
        active = true;
        const item = q.shift();
        const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
        if (merged.length >= VEILLE_MAX_PER_CATEGORY) break;
      }
    }
    cat.items = merged;
    delete cat.feeds;
  }

  // Synthesize each category with Groq
  const processed = [];
  let totalArticles = 0;
  for (const cat of Object.values(byCategory)) {
    totalArticles += cat.items.length;
    let digest = '';
    if (cat.items.length > 0 && env.GROQ_KEY) {
      const titles = cat.items.map(i => `- ${i.title}`).join('\n');
      const groqRes = await callGroq(env, {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'Tu es un assistant de veille technologique. Rédige en 2 phrases maximum en français une synthèse concise et factuelle des articles listés. Sois direct, informatif, sans intro. N\'utilise jamais de tirets longs.' },
          { role: 'user', content: `Articles de la semaine :\n${titles}` },
        ],
        temperature: 0.4,
        max_tokens: 120,
      });
      if (groqRes.ok) digest = extractContent(groqRes.data) || '';
    }
    processed.push({ id: cat.id, label: cat.label, digest, items: cat.items });
  }

  const stored = await storeEdition(env, processed);
  return { week: stored.week, categories: processed.length, articles: totalArticles };
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

const KB_FILES = {
  'rice.md': `# RICE Scoring Framework

## Definition

RICE is a prioritization framework for product backlogs. Each initiative receives a numeric score that helps teams compare options objectively and reduce cognitive bias in prioritization decisions.

**RICE stands for:** Reach, Impact, Confidence, Effort.

**Formula:**
\`\`\`
RICE Score = (Reach × Impact × Confidence) / Effort
\`\`\`

## Components

### Reach
How many users or customers will this feature affect over a given time period (e.g., per quarter)?

- Measure in real numbers: users, transactions, signups, etc.
- Be specific about the time window (monthly, quarterly)
- Example: 2 000 users per month

### Impact
How much will this move the needle for the target metric per person who encounters it?

| Score | Meaning |
|-------|---------|
| 3 | Massive impact |
| 2 | High impact |
| 1 | Medium impact |
| 0.5 | Low impact |
| 0.25 | Minimal impact |

### Confidence
How confident are you in your estimates? Lower confidence = higher risk.

| Score | Meaning |
|-------|---------|
| 100% | High confidence : data-backed estimates |
| 80% | Medium confidence : some supporting data |
| 50% | Low confidence : mostly assumptions |

### Effort
Total person-months of work required across all team members (design, dev, QA).

- Measure in person-months or person-weeks
- Include all disciplines (design, engineering, QA, PM)
- Example: 2 person-months

## Worked Example

| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| Onboarding redesign | 1 000 | 2 | 80% | 1 | 1 600 |
| Push notifications | 5 000 | 1 | 50% | 2 | 1 250 |
| Dark mode | 500 | 0.5 | 100% | 0.5 | 500 |

→ Onboarding redesign has the highest RICE score and should be prioritized first.

## When to Use RICE

- Comparing multiple features competing for the same sprint or quarter
- Justifying prioritization decisions to stakeholders
- Breaking ties in feature debates using data instead of opinions
- Quarterly planning with cross-functional teams

## Common Mistakes to Avoid

1. **Overestimating Reach** : be conservative, use real analytics data
2. **Inflating Confidence** : if you have no data, use 50% or lower
3. **Underestimating Effort** : always add 20-30% buffer for unknowns
4. **Using RICE in isolation** : combine with strategic alignment and dependencies
5. **Treating the score as absolute truth** : RICE is a conversation starter, not a verdict

## RICE vs. ICE

ICE (Impact × Confidence × Ease) is a simpler variant that drops Reach. Use ICE for smaller, uniform-audience features; use RICE when your features target different user segments of varying sizes.`,

  'okr.md': `# OKR Framework : Objectives and Key Results

## Definition

OKRs are a goal-setting framework that connects ambitious objectives to measurable outcomes. Pioneered at Intel by Andy Grove and popularized by Google, OKRs align individual, team, and company efforts toward shared priorities.

**Structure:**
- **Objective** : a qualitative, inspiring statement of what you want to achieve
- **Key Results** : 2-5 quantitative metrics that prove the objective is being achieved

\`\`\`
Objective: [Inspiring qualitative statement]
  KR1: [Measurable outcome] from X to Y by [date]
  KR2: [Measurable outcome] from X to Y by [date]
  KR3: [Measurable outcome] from X to Y by [date]
\`\`\`

## What Makes a Good Objective

- Qualitative and aspirational : it should inspire and give direction
- Memorable and short (one sentence)
- Time-bound (typically quarterly)
- Should NOT be a metric itself : that's what Key Results are for
- Good: "Become the go-to platform for freelance designers"
- Bad: "Increase revenue by 20%"

## What Makes a Good Key Result

- Strictly quantitative : if it can't be measured, it's not a KR
- Outcome-based, not output-based (measure impact, not activity)
- Contains a baseline and a target: "from X to Y"
- Should be ambitious but achievable (~70% completion is a success at Google)
- 2-5 KRs per Objective : more creates dilution and confusion

| Output (bad KR) | Outcome (good KR) |
|-----------------|-------------------|
| Launch 3 features | Increase feature adoption from 20% to 45% |
| Run 10 user interviews | Improve NPS score from 32 to 50 |
| Write 20 blog posts | Grow organic traffic from 5K to 15K/month |

## OKR Hierarchy

\`\`\`
Company OKR
  └── Team OKR (aligned to company OKR)
        └── Individual OKR (aligned to team OKR)
\`\`\`

- Top-down: company sets strategic direction
- Bottom-up: teams propose KRs that roll up to company objectives
- Bidirectional: best practice combines both approaches

## Worked Example

**Objective:** Make onboarding delightful and frictionless for new users

| Key Result | Baseline | Target | Measurement |
|------------|----------|--------|-------------|
| KR1: Reduce time-to-first-value | 8 min | 3 min | Analytics |
| KR2: Increase 7-day activation rate | 35% | 60% | Product data |
| KR3: Improve onboarding CSAT | 3.2/5 | 4.5/5 | In-app survey |

## OKR Cadence

| Level | Frequency |
|-------|-----------|
| Company OKRs | Annual (reviewed quarterly) |
| Team OKRs | Quarterly |
| Individual OKRs | Quarterly (sometimes monthly) |
| Check-ins | Weekly (progress updates, not re-scoring) |
| Scoring | End of quarter (0.0 – 1.0 scale) |

## Scoring OKRs

- Score each KR from 0.0 to 1.0
- Objective score = average of KR scores
- **0.7 is the target** : consistently scoring 1.0 means objectives weren't ambitious enough
- 0.0–0.3: Significant shortfall, needs retrospective
- 0.4–0.6: Progress made, but fell short
- 0.7–1.0: Strong performance

## When to Use OKRs

- Quarterly company or product team planning
- Aligning cross-functional teams on shared outcomes
- Communicating product strategy to stakeholders
- Shifting team culture from output-thinking to outcome-thinking

## Common Mistakes to Avoid

1. **Too many OKRs** : 3-5 objectives per team maximum; more = loss of focus
2. **Tasks disguised as Key Results** : "Launch feature X" is a task, not a KR
3. **OKRs as performance reviews** : OKRs are for direction, not HR evaluation
4. **Setting OKRs in isolation** : must be co-created with the team to get buy-in
5. **Forgetting to check in** : OKRs abandoned after Q1 kickoff achieve nothing
6. **100% score as the goal** : ambitious OKRs should be hard; 100% may signal low ambition`,

  'discovery.md': `# Product Discovery Framework

## Definition

Product discovery is the process of determining what to build before building it. It answers the question: "Are we solving the right problem in the right way?" Effective discovery reduces the risk of building features users don't want or that don't achieve business goals.

**The dual risk in product:**
- **Value risk** : will users want this?
- **Feasibility risk** : can we build it?
- **Usability risk** : can users figure out how to use it?
- **Business viability risk** : will this work for our business?

## The Double Diamond Model

The Double Diamond (Design Council, 2005) is the most widely used discovery framework:

\`\`\`
  Discover ──→ Define ──→ Develop ──→ Deliver
 (Diverge)   (Converge)  (Diverge)  (Converge)
     ◇            ◆           ◇           ◆
  Problem        Right      Solutions    Right
  Space         Problem     Space       Solution
\`\`\`

### Diamond 1 : Problem Space

**Discover (Diverge):**
- Broad research to understand the problem landscape
- Methods: user interviews, surveys, analytics, field observation, competitor analysis
- Goal: challenge assumptions, gather raw insight
- Output: research synthesis, insight patterns

**Define (Converge):**
- Synthesize research into a clear, validated problem statement
- Methods: affinity mapping, "How Might We" (HMW) questions, user journey mapping
- Goal: align the team on the right problem to solve
- Output: problem statement, validated opportunity

### Diamond 2 : Solution Space

**Develop (Diverge):**
- Generate a wide range of potential solutions
- Methods: brainstorming, sketching, crazy eights, solution workshops
- Goal: quantity over quality at this stage : avoid premature convergence
- Output: concepts, wireframes, prototypes

**Deliver (Converge):**
- Test, iterate, and select the best solution
- Methods: prototype testing, A/B tests, usability studies, Wizard of Oz tests
- Goal: validate the solution before full build
- Output: validated concept, go/no-go decision

## Problem Framing Techniques

### Problem Statement Template
\`\`\`
[User segment] struggles with [problem] when [context],
which results in [impact / consequence].
We believe that [solution hypothesis] will [desired outcome].
We'll know we're right when [measurable signal].
\`\`\`

### "How Might We" (HMW) Questions
Transform insights into opportunity areas:
- Insight: "Users abandon checkout when asked for shipping address"
- HMW: "How might we reduce the steps needed to complete a purchase?"
- HMW: "How might we make returning users feel like checkout is instant?"

### Opportunity Solution Tree (Teresa Torres)
A visual map connecting:
\`\`\`
Desired Outcome
  └── Opportunity 1
        ├── Solution A
        │     └── Assumption / Experiment
        └── Solution B
  └── Opportunity 2
        └── Solution C
\`\`\`

## Discovery Methods by Phase

| Phase | Method | Output |
|-------|--------|--------|
| Discover | User interviews | Verbatim quotes, observation notes |
| Discover | Analytics review | Drop-off points, usage patterns |
| Define | Affinity mapping | Clustered themes, insight patterns |
| Define | User journey map | Pain points, moments of truth |
| Develop | Crazy 8s sketch | 8 rough concepts in 8 minutes |
| Develop | Story mapping | Feature scope per user journey step |
| Deliver | Prototype test | Usability findings, validated/invalidated hypotheses |
| Deliver | Concierge test | Manual service validation before automation |

## Continuous Discovery Cadence (Teresa Torres)

- Recruit a pool of users for ongoing interviews (1 interview / week minimum)
- Each interview surfaces new opportunities for the Opportunity Solution Tree
- Run small, fast experiments weekly : no big-bang launches
- Discovery and delivery run in parallel, not sequentially

## When to Use Discovery

- Before committing to a new feature or product area
- When churn or low adoption signals a problem but not a clear cause
- When the team is debating solutions without alignment on the problem
- At the start of each quarter before roadmap planning

## Common Mistakes to Avoid

1. **Skipping the problem diamond** : jumping straight to solutions without validating the problem
2. **Conducting biased interviews** : asking "would you use this?" instead of "tell me about the last time you..."
3. **Survey-only research** : surveys confirm hypotheses; interviews surface unknown unknowns
4. **Discovery as a one-time phase** : continuous discovery beats waterfall discovery sprints
5. **Insufficient sample size** : minimum 5-8 user interviews per research question
6. **Confusing output with outcome** : "we ran 10 interviews" is an output; "we validated the core job" is an outcome`,

  'invest.md': `# INVEST Criteria for User Stories

## Definition

INVEST is a checklist for writing high-quality user stories. Each letter describes a property that good user stories should have. Stories that fail one or more criteria tend to cause problems in estimation, delivery, and acceptance.

**INVEST stands for:** Independent, Negotiable, Valuable, Estimable, Small, Testable.

## The Six Criteria

### Independent (I)
User stories should be self-contained and have no hidden dependencies on other stories.

- Teams can deliver stories in any order
- No "we must finish story A before story B" constraints (or these are made explicit)
- Reduces scheduling complexity and blocked work
- Tip: if stories are tightly coupled, consider merging them or extracting a shared spike

### Negotiable (N)
Stories are not rigid contracts : they are an invitation to a conversation.

- Details are negotiated between the team and the stakeholder
- The user story captures intent, not a full specification
- Implementation details are decided collaboratively during refinement
- Stories can be rewritten, split, or reframed as understanding deepens

### Valuable (V)
Every story must deliver value to a user or stakeholder.

- Value should be explicit: "As a [user], I want [action] so that [benefit]"
- Avoid technical stories that don't directly provide user-facing value : wrap them in a user-centric framing
- If you can't articulate the value, the story isn't ready
- Infrastructure or tech debt stories should reference the user outcome they enable

### Estimable (E)
The team must be able to size the story in relative terms.

- Stories that can't be estimated are usually too vague or too large
- Three reasons a story isn't estimable: (1) missing domain knowledge, (2) missing technical knowledge, (3) story is too large (epic)
- If estimability is low, run a spike (time-boxed exploration) first

### Small (S)
Stories should be small enough to complete within a sprint (ideally in a few days).

- Large stories increase risk and make progress hard to track
- A story should represent 1-3 days of work, not a two-week epic
- Split large stories by: user workflow steps, data variations, rule sets, happy path vs. edge cases
- Splitting techniques: vertical slice, CRUD operations, acceptance criteria split, defer error handling

### Testable (T)
Stories must have clear, unambiguous acceptance criteria that can be verified.

- "Done" means all acceptance criteria are met
- Acceptance criteria written in Given-When-Then (Gherkin) format
- Cannot be tested = cannot be accepted as done
- Non-functional requirements (performance, security) must also have measurable acceptance criteria

## User Story Template

\`\`\`
As a [type of user],
I want to [perform an action],
So that [I achieve a benefit / goal].

Acceptance Criteria:
- Given [context], when [action], then [outcome]
- Given [context], when [action], then [outcome]
\`\`\`

## Worked Example

**Before (poor story):**
> "Improve the checkout flow"

- Not Estimable (too vague)
- Not Small (too broad)
- Not Testable (no acceptance criteria)

**After (INVEST-compliant):**
> As a returning customer, I want to save my payment method so that I can complete purchases in under 30 seconds.
>
> Acceptance Criteria:
> - Given I am logged in, when I complete a purchase, then I am offered to save my card
> - Given I have a saved card, when I reach checkout, then my saved card is pre-selected
> - Given I have a saved card, when I click "Buy now", then the purchase completes without re-entering card details

## Common Mistakes to Avoid

1. **Writing stories as tasks** : "Implement API endpoint for X" is a task, not a user story. Always anchor to user value.
2. **Merging multiple scenarios into one story** : each scenario should be its own testable story.
3. **Missing acceptance criteria** : a story without AC is not ready for development.
4. **Ignoring the Independent criterion** : hidden dependencies blow up sprint planning.
5. **Equating Small with trivial** : small means deliverable in one sprint, not necessarily simple.`,

  'jtbd.md': `# Jobs-to-be-Done (JTBD) Methodology

## Definition

Jobs-to-be-Done is a framework for understanding why customers "hire" a product or service to accomplish a goal in their lives. Developed by Clayton Christensen, JTBD shifts the focus from what users do to why they do it : the underlying progress they are trying to make.

**Core insight:** People don't buy products; they hire them to get a job done.

**Famous example:** "People don't want a quarter-inch drill. They want a quarter-inch hole." : Theodore Levitt

## The Job Statement Structure

A well-formed job statement follows this pattern:

\`\`\`
When [situation / trigger],
I want to [motivation / what the user is trying to accomplish],
So I can [expected outcome / the progress they seek].
\`\`\`

**Example:**
> When I finish a long day at work and don't have energy to cook, I want to find a healthy meal quickly, so I can eat well without the stress of planning.

## Three Dimensions of a Job

### Functional Job
The core practical task the user needs to accomplish.
- "Manage my monthly budget"
- "Send money internationally"

### Emotional Job
How the user wants to feel (or avoid feeling) while doing the job.
- "Feel in control of my finances"
- "Feel confident my money is safe"

### Social Job
How the user wants to be perceived by others.
- "Look responsible to my partner"
- "Appear tech-savvy to my team"

## The Competitor Lens

JTBD redefines competition. The real competitor is whatever the customer used before your product to get the job done : including doing nothing.

| Traditional view | JTBD view |
|-----------------|-----------|
| Competitors = other apps | Competitors = all ways to get the job done |
| Slack competes with Teams | Slack competes with email, meetings, and shared docs |
| Netflix competes with Hulu | Netflix competes with sleep, books, social media |

## Forces of Progress Model

Four forces influence whether a customer will switch to a new solution:

**Pushing away from the old:**
1. **Push** : pain and frustration with the current solution
2. **Pull** : attraction toward the new solution's promise

**Pulling back toward the old:**
3. **Anxiety** : fears about trying something new
4. **Habit** : comfort and inertia with the existing solution

For a switch to happen, Push + Pull must outweigh Anxiety + Habit.

## Using JTBD in Product Discovery

### 1. Jobs Interview Technique
- Recruit customers who recently switched to your product or away from it
- Ask them to tell the story of the decision chronologically
- Focus on the "first thought" moment : what triggered the search
- Avoid leading questions; let them narrate

### 2. Outcome-Driven Innovation (ODI)
Uncover what customers use to measure success of the job:
\`\`\`
[Direction] + [Metric] + [Object] + [Context]
"Minimize the time it takes to find the right meal option when I'm tired"
\`\`\`

### 3. Job Map
Sequence the steps of the job:
1. Define → 2. Locate → 3. Prepare → 4. Confirm → 5. Execute → 6. Monitor → 7. Modify → 8. Conclude

Find where the job is most painful or underserved : that's the opportunity.

## Worked Example : Project Management Tool

**Functional Job:** Track my team's work to ensure projects finish on time
**Emotional Job:** Feel confident that nothing important is falling through the cracks
**Social Job:** Look like a reliable team lead to my manager

**Job Statement:**
> When I'm leading multiple concurrent projects, I want to see the real-time status of all tasks in one place, so I can intervene early before deadlines are missed.

**Competitor analysis:** The real competitor is a shared spreadsheet + email + memory.

## When to Use JTBD

- Early product discovery to find unmet needs
- Repositioning an existing product in a new market
- Understanding why customers churn (the job changed or a better solution emerged)
- Innovation strategy: find adjacently related jobs to expand into

## Common Mistakes to Avoid

1. **Confusing jobs with features** : "I want a dashboard" is a feature request, not a job
2. **Writing jobs that are too narrow** : "Send a PDF" is a task, not a job; look for the why behind it
3. **Ignoring emotional and social jobs** : functional jobs alone miss the full picture
4. **Stopping at the interview** : JTBD insights must translate into prioritization and design decisions
5. **Assuming one product = one job** : users often hire the same product for multiple jobs`,

  'moscow.md': `# MoSCoW Prioritization

## Definition

MoSCoW is a prioritization technique that categorizes requirements into four buckets based on their necessity to a delivery. It is commonly used in agile product development, sprint planning, and stakeholder alignment sessions.

**MoSCoW stands for:** Must have, Should have, Could have, Won't have (this time).

## The Four Categories

### Must Have (M)
Non-negotiable requirements. Without these, the product, release, or sprint is a failure.

- Safety-critical features
- Legal or regulatory requirements
- Core user flows without which the product cannot function
- If in doubt, ask: "What happens if we ship without this?" : if the answer is "we can't ship", it's a Must.

### Should Have (S)
Important requirements that add significant value but are not critical for the current release.

- Features that cause major pain if absent but have workarounds
- Performance improvements, UX enhancements
- They will be included if time and resources allow
- Should items are the first candidates to be deferred if scope needs to be cut

### Could Have (C)
Nice-to-have requirements with a small impact if omitted.

- Minor quality-of-life improvements
- "Delighter" features that exceed expectations but aren't expected
- Usually the first to be cut under time pressure
- Often form the basis of future backlog items

### Won't Have (W) : This Time
Requirements explicitly out of scope for the current iteration.

- Manages stakeholder expectations proactively
- "This time" is key : it signals the feature is not forgotten, only deferred
- Prevents scope creep and keeps the team focused
- Should be revisited in future planning cycles

## Practical Application

### In Sprint Planning
\`\`\`
Must Have  → committed delivery
Should Have → delivery expected but negotiable
Could Have → best-effort if sprint capacity allows
Won't Have → explicitly out of scope this sprint
\`\`\`

### Typical Distribution
- Must: ~60% of total effort
- Should: ~20% of total effort
- Could: ~20% of total effort
- Won't: listed explicitly, zero effort allocated

## Worked Example : Mobile App Release

| Requirement | Category | Reasoning |
|-------------|----------|-----------|
| User login / auth | Must | Core security, no workaround |
| Password reset | Must | Legal baseline + user expectation |
| Push notifications | Should | High value but email fallback exists |
| Dark mode | Could | Nice UX but not blocking |
| Social login (OAuth) | Won't (this time) | Deferred to v1.1 |

## When to Use MoSCoW

- Sprint planning and backlog grooming
- Stakeholder workshops to align on scope
- MVP definition : separating essentials from nice-to-haves
- Managing scope creep in ongoing projects

## Common Mistakes to Avoid

1. **Too many Musts** : if everything is Must, nothing is prioritized. Musts should be critical only.
2. **Skipping the Won't column** : explicitly stating Won't Have prevents scope creep and manages expectations.
3. **Using MoSCoW once and forgetting it** : reprioritize at each planning cycle.
4. **No stakeholder alignment** : MoSCoW decisions must be co-owned by business + tech + design.
5. **Confusing Should and Could** : Should = important + painful if missing; Could = nice-to-have.`,

  'roadmap.md': `# Product Roadmap Strategies and Formats

## Definition

A product roadmap is a strategic communication artifact that shows where a product is going and why, over a period of time. It is not a detailed project plan : it is a shared understanding of direction, priorities, and rationale.

**Key distinction:** A roadmap communicates strategy; a sprint backlog communicates execution.

## Roadmap Types

### Now / Next / Later Roadmap
The most popular modern format. Focuses on outcomes and horizons rather than fixed dates.

\`\`\`
NOW              NEXT             LATER
(current sprint) (next 1-3 months) (3+ months)
─────────────    ─────────────     ─────────────
Mobile checkout  Loyalty program   International
Performance opt  Analytics v2      B2B portal
Bug triage       Notification hub  API marketplace
\`\`\`

**Best for:** Early-stage products, fast-changing priorities, outcomes-driven teams

### Theme-Based Roadmap
Organizes work around strategic bets or problem areas rather than features.

\`\`\`
Q1: "Make onboarding frictionless"
Q2: "Help users discover value faster"
Q3: "Enable team collaboration"
\`\`\`

**Best for:** Product-led companies, stakeholder alignment, communicating strategy

### Timeline / Gantt Roadmap
Features plotted on a calendar with start/end dates.

**Best for:** Hardware products, regulated industries, dependencies-heavy projects
**Warning:** Creates false precision; treat dates as estimates, not commitments

### Opportunity Roadmap
Maps customer opportunities (jobs, pain points) rather than solutions : leaves room for the team to find the best solution.

**Best for:** Discovery-led organizations, teams practicing continuous discovery

## Roadmap Components

Each item on a roadmap should include:

| Component | Description | Example |
|-----------|-------------|---------|
| **Theme / Goal** | The strategic problem being solved | "Reduce onboarding drop-off" |
| **Hypothesis** | Belief that drives the work | "A guided tour will increase activation" |
| **Expected outcome** | The metric this will move | "+15% 7-day activation rate" |
| **Confidence level** | How validated is this bet? | Medium : 3 user interviews done |
| **Horizon** | When we plan to work on it | NOW / NEXT / LATER |

## Stakeholder Communication

Different audiences need different roadmap views:

| Audience | What they care about | Format |
|----------|---------------------|--------|
| Engineering | Dependencies, tech constraints | Detailed with epics |
| Sales / CS | "Will this help my customer?" | High-level themes + dates |
| C-suite | Strategic bets, business impact | 3 themes max, outcome-focused |
| Users | What's coming that benefits them | Public changelog / release notes |

## The AARRR Lens on Roadmaps

Organize roadmap themes by the funnel stage they address:

- **Acquisition** : features that attract new users
- **Activation** : features that deliver first value quickly
- **Retention** : features that keep users coming back
- **Revenue** : features that convert or upsell
- **Referral** : features that generate word-of-mouth

This helps stakeholders see how the roadmap balances growth stages.

## Roadmap Anti-Patterns

### The Feature Factory Roadmap
A long list of features with no strategic context. "Build X, then Y, then Z" without explaining why.
**Fix:** Add a "Goal" column to every row; if you can't articulate the goal, remove the item.

### The Promise Roadmap
Dates committed to sales as binding contracts. Creates a culture of deadline pressure over outcome quality.
**Fix:** Use horizon-based roadmaps; add "estimated" labels; educate stakeholders on why flexibility matters.

### The Exhaustive Roadmap
18 months of detailed items. Creates false precision and stale plans.
**Fix:** Keep LATER items high-level; only NOW items should be specific.

### The Frozen Roadmap
Reviewed once per year and never updated.
**Fix:** Monthly roadmap reviews minimum; quarterly major revisions.

## Roadmap as a Communication Tool

Effective roadmap presentations include:

1. **Why now** : what changed in the market or with users that makes this the right priority
2. **What we learned** : discovery insights that inform the bet
3. **What success looks like** : specific metrics and timeline
4. **What we're not doing** : explicit out-of-scope items (prevents scope creep)
5. **Open questions** : what we still need to validate

## Roadmap Formats for Presentations

### Narrative Roadmap (for leadership)
> "In Q1 we're focused on making onboarding frictionless because our data shows 60% of users churn before reaching their first 'aha moment'. We expect this to increase 7-day activation from 35% to 55%, which directly supports our annual target of 2M active users."

### Bullet Roadmap (for sprint teams)
\`\`\`
NOW: Redesign onboarding flow (4 sprints, starts next week)
NEXT: Push notification system (scoping in progress)
LATER: B2B portal (opportunity validated, design TBD)
\`\`\`

## Common Mistakes to Avoid

1. **Confusing a roadmap with a backlog** : roadmaps are strategic, backlogs are tactical
2. **Committing to specific features too far in advance** : discovery may reveal better solutions
3. **Not updating the roadmap** : a stale roadmap erodes trust
4. **One roadmap for all audiences** : tailor the detail level and framing to the audience
5. **Ignoring technical debt** : roadmaps should allocate explicit capacity for non-feature work`,

  'kano.md': `# Kano Model : Feature Prioritization by Satisfaction

## Definition

The Kano Model (Noriaki Kano, 1984) classifies features by their impact on customer satisfaction. Unlike effort-based frameworks, Kano focuses on the emotional response features trigger : helping teams decide what to build next by understanding what customers truly value vs what they merely expect.

## The Five Categories

### Must-Be (Basic Expectations)
Features customers expect as a baseline. Their presence doesn't increase satisfaction, but their absence causes severe dissatisfaction.
- Login/logout on any app
- No crashes, basic performance
- Cannot be used as differentiators : they're table stakes

### Performance (Linear Satisfiers)
More is better. The more you deliver, the more satisfied customers are. These directly affect competitive positioning.
- Load time: faster = more satisfied
- Storage space, battery life, pricing
- Invest here when you want measurable NPS improvement

### Attractive / Delighters
Unexpected features that create disproportionate delight. Customers don't know they want them, but love them when present.
- iPhone's pinch-to-zoom in 2007
- Slack's emoji reactions
- Over-invest in delighters to create word-of-mouth

### Indifferent
Features most users don't care about either way. Often technical requirements with no user-facing value.

### Reverse
Features that increase satisfaction for some users but frustrate others (advanced settings, complex configurability).

## How to Run a Kano Survey

1. For each feature, ask two questions:
   - "How would you feel if this feature **was present**?" → Functional question
   - "How would you feel if this feature **was absent**?" → Dysfunctional question
2. Both answers use a 5-point scale: Love it / Expect it / Neutral / Can live with it / Dislike it
3. Map each answer pair to a Kano category using the standard evaluation table

## When to Use Kano

- Deciding which features to include in a release
- Understanding why a product feels "flat" despite many features (too many Must-Be, not enough Delighters)
- Prioritizing between competing features with similar RICE scores
- Validating feature concepts during discovery

## Common Mistakes to Avoid

1. **Treating Must-Be as priorities** : they're hygiene, not differentiators
2. **Over-investing in Indifferent features** : common trap when engineers drive roadmap
3. **Forgetting Kano shifts over time** : yesterday's Delighter becomes tomorrow's Must-Be (e.g., HTTPS, dark mode)
4. **Running Kano too late** : it's a discovery tool, not a post-build evaluation`,

  'heart.md': `# HEART Framework : User-Centered Metrics

## Definition

HEART is a user experience metrics framework developed at Google by Kerry Rodden (2010). It provides a structured approach to measuring product quality from the user's perspective, complementing business metrics (revenue, retention) with experience metrics.

**HEART stands for:** Happiness, Engagement, Adoption, Retention, Task Success.

## The Five Dimensions

### Happiness
Subjective satisfaction, often measured through surveys.
- NPS (Net Promoter Score)
- CSAT (Customer Satisfaction Score)
- App store ratings
- "How satisfied are you with this feature?" (1-5 scale)

### Engagement
Frequency and depth of user interaction.
- DAU/MAU ratio (stickiness)
- Sessions per user per week
- Actions per session
- Pages/screens visited per visit

### Adoption
New users or features being picked up.
- % of new users activating within 7 days
- % of existing users enabling a new feature within 30 days
- Time-to-first-value for new users

### Retention
Users coming back over time.
- D1/D7/D30 retention cohorts
- Monthly churn rate
- Subscription renewal rate
- "Did users who activated in month X still use the product in month X+3?"

### Task Success
Efficiency and effectiveness of user flows.
- Completion rate for a key flow (e.g., checkout)
- Time-on-task
- Error rate
- Abandonment rate at each step

## GSM : Goals, Signals, Metrics

HEART works best with the GSM framework:
1. **Goal** : What user behavior are you trying to change?
2. **Signal** : What user action indicates success or failure?
3. **Metric** : How do you quantify that signal?

Example for Adoption:
- Goal: More users discover and use the new collaboration feature
- Signal: User invites a teammate within 7 days of signing up
- Metric: % of new signups who send ≥1 invite in week 1

## When to Use HEART

- Establishing a measurement plan before launching a feature
- OKR definition : translating product goals into measurable KRs
- Post-launch health check: is the new feature improving experience?
- Prioritizing instrumentation in a data-poor environment

## Common Mistakes to Avoid

1. **Measuring all 5 dimensions always** : pick 2-3 relevant to your current focus
2. **Confusing Engagement with Addiction** : high engagement on a frustrating feature isn't good
3. **No baseline** : always establish a pre-launch baseline before measuring change
4. **Ignoring Task Success** : the most direct measure of UX quality, yet often skipped`,

  'north-star.md': `# North Star Metric : Product Strategy Alignment

## Definition

A North Star Metric (NSM) is a single metric that best captures the core value your product delivers to customers. It sits between leading indicators (features shipped, DAU) and lagging indicators (revenue, profit) : it measures value delivered, not just activity or financial output.

The concept was popularized by Sean Ellis and is central to product-led growth (PLG) strategy.

## What Makes a Good North Star Metric

A strong NSM:
- **Reflects customer value** : not just business value (revenue is a consequence, not the NSM)
- **Leads revenue** : moves before revenue does; predicts long-term business health
- **Is measurable** : trackable in your analytics stack
- **Is actionable** : teams can influence it through product decisions
- **Is singular** : one number, not a composite score

| Company | North Star Metric |
|---------|------------------|
| Spotify | Time spent listening |
| Airbnb | Nights booked |
| Slack | Messages sent per active team |
| LinkedIn | Endorsements given |
| Duolingo | Daily active learners |
| Notion | Blocks created |

## North Star + Input Metrics Tree

The NSM sits at the top of a metric tree. Below it are **input metrics** (levers teams can pull):

\`\`\`
NSM: Weekly active users completing core action
  ├── Acquisition: New signups per week
  ├── Activation: % users completing onboarding
  ├── Engagement: % activated users returning week 2
  └── Breadth: Avg. features used per active user
\`\`\`

Each squad owns one or more input metrics. The NSM gives alignment; input metrics give autonomy.

## NSM vs OKR

- **NSM** is a company/product-level constant (changes rarely, maybe once a year)
- **OKRs** are quarterly goals that move input metrics toward the NSM
- The NSM is the "why" behind your OKRs

## When to Use

- Product strategy workshops to align cross-functional teams
- Evaluating whether a proposed feature moves the NSM
- Quarterly planning: "Does this OKR move our North Star?"
- Diagnosing product-market fit: if you can't define an NSM, you may not have PMF

## Common Mistakes to Avoid

1. **Revenue as NSM** : revenue is an output; choose a metric that predicts it
2. **Vanity metrics** : page views, total registered users (don't reflect value)
3. **Multiple NSMs** : defeats the purpose; if you have two, you have none
4. **NSM that optimizes engagement over value** : maximize time-in-app ≠ maximize value`,

  'story-mapping.md': `# User Story Mapping : Backlog Organization

## Definition

User Story Mapping (Jeff Patton, 2014) is a collaborative technique for organizing user stories into a two-dimensional map that represents the user's journey. Unlike a flat backlog, a story map preserves the narrative of how users interact with the product : making it easier to scope releases and identify gaps.

## Structure of a Story Map

\`\`\`
BACKBONE (horizontal, top row)
Activities → Tasks → Tasks → Tasks → Activities → ...

WALKING SKELETON (first release)
├── Story (must-have)
├── Story (must-have)

RELEASE 2
├── Story (should-have)
├── Story (enhancement)

FUTURE
└── Story (nice-to-have)
\`\`\`

- **Activities** (top level): High-level user goals ("Set up account", "Find a product", "Checkout")
- **Tasks** (middle level): Steps within each activity ("Enter email", "Choose password", "Confirm email")
- **Stories** (vertical, below tasks): Specific implementations, ordered by priority

## How to Build a Story Map

1. **Define the user** : one persona per map
2. **Write the narrative** : walk through what the user does from left to right (activities)
3. **Decompose activities into tasks** : the backbone
4. **Add stories below each task** : specific implementations, variations, edge cases
5. **Draw release slices** : horizontal cuts define what ships in each release
6. **Identify the walking skeleton** : smallest end-to-end experience that delivers core value

## Story Mapping vs Flat Backlog

| Flat Backlog | Story Map |
|-------------|-----------|
| Stories in isolation | Stories in context of user journey |
| Priority = single dimension | Priority = release slice |
| Hard to see gaps | Gaps are visually obvious |
| Stakeholders don't understand it | Stakeholders can navigate it |

## When to Use

- Kicking off a new product or major feature
- Sprint 0 / discovery workshops with stakeholders
- Scoping an MVP: draw the walking skeleton first
- Onboarding new team members: the map tells the product story

## Common Mistakes to Avoid

1. **Mapping features, not user actions** : activities should be verbs ("Find a product"), not nouns ("Product search")
2. **Too many levels of decomposition** : activities → tasks → stories is enough; don't add sub-tasks
3. **Building the map alone** : story mapping is a collaborative workshop, not a PM artifact
4. **Forgetting to draw release slices** : without slices, a story map is just a wall of post-its`,

  'sprint-ceremonies.md': `# Agile Sprint Ceremonies : Scrum Rituals

## Definition

Scrum ceremonies (or events) are structured meetings that create a regular cadence for planning, transparency, and continuous improvement. In a standard 2-week sprint, five ceremonies guide the team from planning to retrospection.

## The Five Ceremonies

### 1. Sprint Planning (start of sprint, ~4h for 2-week sprint)

**Purpose:** Define what the team will build this sprint and how.

Two parts:
- **What:** Product Owner presents prioritized backlog items; team selects stories that fit sprint capacity
- **How:** Team breaks selected stories into tasks; each task estimated in hours

Output: Sprint Goal (a single sentence summarizing the sprint's objective) + Sprint Backlog

### 2. Daily Standup (every day, 15 minutes max)

**Purpose:** Synchronize the team, surface blockers early.

Three questions per team member:
1. What did I complete yesterday?
2. What will I work on today?
3. What's blocking me?

**Key:** Standups are for the team, not a status report to the Scrum Master or PO.

### 3. Sprint Review (end of sprint, ~2h)

**Purpose:** Demonstrate completed work to stakeholders and gather feedback.

- Team demos potentially shippable increment
- Stakeholders give feedback → input for next sprint backlog
- Focus on outcomes, not just output
- Only "Done" stories are demoed (no WIP)

### 4. Sprint Retrospective (end of sprint, ~1.5h)

**Purpose:** Continuous improvement of the team's process.

Classic format: What went well? / What didn't? / What will we try next sprint?

Output: 1-3 action items owned by specific people, reviewed next retro.

### 5. Backlog Refinement / Grooming (mid-sprint, ~1h)

**Purpose:** Keep the backlog healthy for future sprints.

Activities:
- Break down large stories into smaller ones
- Estimate upcoming stories (story points or T-shirt sizes)
- Clarify acceptance criteria
- Remove or deprioritize obsolete items

**Not in original Scrum** but universal in practice. Keeps Sprint Planning short.

## Story Points vs Hours

| Story Points | Hours |
|-------------|-------|
| Relative complexity | Absolute time |
| Team-calibrated | Individual estimate |
| Stable across team changes | Varies by person |
| Fibonacci scale (1,2,3,5,8,13) | Decimal hours |

## Velocity

Average story points completed per sprint. Use velocity for capacity planning, not as a performance metric.

## Common Mistakes to Avoid

1. **Standups as status reports** : this kills psychological safety and slows the meeting
2. **Skipping retrospectives** : the most valuable ceremony; skipping it kills improvement culture
3. **No sprint goal** : without a goal, the sprint is just a list of tasks, not a commitment
4. **Demoing unfinished work in Review** : erodes trust with stakeholders
5. **Velocity as a KPI** : velocity is a planning tool, not a productivity measure`,

  'dod.md': `# Definition of Done & Definition of Ready

## Definition of Done (DoD)

The Definition of Done is a shared agreement on what "complete" means for any user story or increment. It ensures quality consistency and prevents partially-done work from being called finished.

### What a DoD Typically Includes

\`\`\`
□ Code written and peer-reviewed
□ Unit tests written and passing
□ Integration tests passing
□ Acceptance criteria met and verified
□ Feature tested in staging environment
□ No critical bugs introduced
□ Documentation updated (if applicable)
□ Product Owner has accepted the story
□ Feature flagged / ready to deploy
\`\`\`

### Why DoD Matters

- Creates shared quality standards across the team
- Prevents "90% done" syndrome where stories sit in QA forever
- Makes velocity meaningful: only DoD-compliant stories count toward velocity
- Builds trust with stakeholders: "done" means deployable

### DoD at Different Levels

| Level | Definition |
|-------|-----------|
| Story DoD | Individual story complete and accepted |
| Sprint DoD | All sprint stories done + sprint goal met |
| Release DoD | Full regression, performance tested, release notes written |

## Definition of Ready (DoR)

The Definition of Ready is the inverse: criteria a user story must meet before it can be pulled into a sprint. It prevents teams from starting work on underspecified stories.

### What a DoR Typically Includes

\`\`\`
□ Story written in user story format (As a... I want... So that...)
□ Acceptance criteria defined and agreed
□ Story sized by the team (story points)
□ Dependencies identified
□ Designs/mockups available (if UI story)
□ Business value clear
□ Story fits within one sprint (if not, split it)
\`\`\`

### DoR vs DoD

| Definition of Ready | Definition of Done |
|--------------------|-------------------|
| Entry criteria for sprint | Exit criteria for story |
| PO responsibility | Team responsibility |
| Prevents starting bad stories | Prevents shipping bad work |
| Checked at refinement | Checked at sprint review |

## When to Create/Update DoD and DoR

- Team kickoff / Sprint 0
- After retrospectives that surface quality issues
- When onboarding new team members
- When starting a new workstream with different quality standards

## Common Mistakes

1. **Too long DoD** : if the DoD has 20 items, half will be ignored
2. **DoD as a checkbox ritual** : it should be internalized, not mechanical
3. **No DoR** : leads to sprint planning chaos when stories are unclear
4. **PO accepting DoD-non-compliant stories** : "we'll fix it next sprint" is how tech debt accumulates`,

  'rag-llm.md': `# RAG & LLMs : AI Product Management Fundamentals

## What is RAG (Retrieval-Augmented Generation)

RAG is an AI architecture pattern that enhances LLM responses with relevant external knowledge retrieved at query time. Instead of relying solely on a model's training data (which may be outdated or too general), RAG pulls specific, up-to-date context before generating a response.

\`\`\`
User Query
    ↓
Embedding Model → Query Vector
    ↓
Vector Search → Top-K Relevant Chunks (from your knowledge base)
    ↓
LLM (query + retrieved context) → Grounded Response
\`\`\`

## RAG vs Fine-Tuning : When to Use What

| Dimension | RAG | Fine-Tuning |
|-----------|-----|-------------|
| **Use case** | Up-to-date knowledge, grounding | Tone, style, domain behavior |
| **Data freshness** | Real-time (update the KB) | Requires retraining |
| **Cost** | Low (inference + retrieval) | High (training compute) |
| **Transparency** | Can cite sources | Black box |
| **Hallucination control** | High (grounded in retrieved facts) | Medium |
| **When to choose** | Company docs, product KB, support | Writing style, specialized domain |

## Key Concepts for AI PMs

### Chunking Strategy
How documents are split before embedding. Chunk size affects retrieval quality:
- Too large: irrelevant text dilutes relevance
- Too small: loss of context
- Typical: 200-500 tokens with 10-20% overlap

### Embedding Models
Convert text to vectors for semantic search. Key tradeoffs:
- **Size vs quality**: bge-small (fast, cheap) vs text-embedding-3-large (better quality, more expensive)
- **Multilingual**: multilingual-e5, cohere-multilingual for non-English content

### Vector Databases
Store and query embeddings at scale: Pinecone, Qdrant, Weaviate, pgvector, Chroma.
For prototypes: in-memory cosine similarity is sufficient (no vector DB needed).

### Evaluation Metrics
- **Retrieval precision**: are the retrieved chunks relevant?
- **Answer faithfulness**: does the answer stay grounded in retrieved context? (no hallucination)
- **Answer relevance**: does the answer address the question?

Tools: Langfuse evals, Ragas, TruLens.

## LLM Parameters Every AI PM Should Know

| Parameter | Effect | PM Implication |
|-----------|--------|----------------|
| Temperature (0-2) | Randomness of output | 0.2 for structured tasks, 0.7 for creative |
| max_tokens | Output length limit | Cost + latency control |
| top_p | Nucleus sampling | Alternative to temperature |
| system prompt | LLM persona + constraints | Your primary quality lever |

## AI PM-Specific Considerations

- **Latency budget**: users tolerate ~2-3s for AI features; stream responses for longer generations
- **Cost per query**: track token usage by feature; some features need expensive models, others don't
- **Fallback strategy**: what happens when the LLM API is down?
- **Guardrails**: scope the LLM's behavior with clear system prompt constraints + output validation
- **Observability**: trace every LLM call (Langfuse, LangSmith) to debug quality regressions`,

  'ai-product.md': `# AI Product Strategy : Building with LLMs

## The AI PM's Core Decision Framework

AI product strategy starts with one question: **what problem are we solving, and is AI the right tool?**

AI is a means to an end. The product manager's job is to identify where AI unlocks value that was previously impossible or impractical : not to add AI for its own sake.

## Build vs Buy vs Fine-Tune

\`\`\`
Off-the-shelf LLM API (GPT-4, Claude, Groq)
├── Pros: Fast to ship, no ML expertise needed, best model quality
├── Cons: Ongoing cost per call, data sent to third party, limited control
└── Use when: Prototyping, general tasks, tight deadlines

RAG on top of existing LLM
├── Pros: Grounds responses in your data, updatable without retraining
├── Cons: Retrieval quality depends on chunking + embedding strategy
└── Use when: Company knowledge base, support, documentation search

Fine-tuned model
├── Pros: Domain-specific behavior, style consistency, potentially cheaper at scale
├── Cons: Requires training data + compute, retraining cycle, expertise needed
└── Use when: Very specific domain, high volume, style/persona requirements

Custom model (from scratch)
└── Use when: Never, unless you're a frontier lab
\`\`\`

## AI Feature Lifecycle

**Discovery → Design → Build → Evaluate → Monitor → Iterate**

Key difference from traditional product: the **Evaluate** and **Monitor** phases are much more important.

- **Evaluate before shipping**: benchmark the AI feature against a test set (golden dataset of inputs + expected outputs)
- **Monitor in production**: track hallucination rate, user satisfaction on AI outputs, latency, cost per query
- **Detect regression**: model updates or prompt changes can silently degrade quality

## Responsible AI Considerations for PMs

| Risk | Mitigation |
|------|-----------|
| Hallucination | RAG grounding, output validation, confidence thresholds |
| Bias in outputs | Diverse test sets, human review of edge cases |
| Data privacy | Avoid sending PII to third-party APIs, use self-hosted models for sensitive data |
| Over-reliance | Design UI to show AI uncertainty, offer human fallback |
| Cost blowout | Token budgets per feature, caching, model tiering |

## AI Product Metrics

Beyond standard product metrics, AI features need:
- **Quality rate**: % of responses rated good by users (thumbs up/down)
- **Hallucination rate**: % of responses containing factual errors (eval pipeline)
- **Cost per successful query**: tokens × price, only counting queries that led to user value
- **Latency p50/p95**: especially important for streaming vs blocking responses
- **Fallback rate**: how often the AI fails and a fallback is triggered

## Key Principles for AI PMs

1. **Start with the user problem, not the AI capability** : "users struggle to X" before "we could use LLMs to"
2. **Prototype fast, evaluate honestly** : AI quality is hard to predict; test on real data early
3. **Ship the simplest AI** : a well-prompted GPT-4 beats a complex pipeline for most use cases
4. **Design for failure** : AI features will fail; the UX needs graceful degradation
5. **Measure what matters** : token count is not a product metric; user value delivered is`,
};

// ─── Chunk cache (built once per isolate) ────────────────────────────────────
let _chunks = null;

// ─── Worker entry point ───────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Public read endpoint for usage stats
    if (request.method === 'GET' && url.pathname === '/stats') {
      return handleStats(env);
    }

    // Veille history : public, returns list of available weeks
    if (request.method === 'GET' && url.pathname === '/veille/history') {
      const index = await env.VEILLE_STORE.get('veille_index', { type: 'json' });
      return jsonResponse(index || []);
    }

    // Veille GET : public, no origin check; ?week=24&year=2026 for specific edition
    if (request.method === 'GET' && url.pathname === '/veille') {
      const week = url.searchParams.get('week');
      const year = url.searchParams.get('year');
      if (week && year) {
        const data = await env.VEILLE_STORE.get(`veille_week_${year}_${week}`, { type: 'json' });
        if (!data) return jsonResponse({ empty: true }, 404);
        return jsonResponse(data);
      }
      const data = await env.VEILLE_STORE.get('veille_latest', { type: 'json' });
      if (!data) return jsonResponse({ empty: true }, 404);
      return jsonResponse(data);
    }

    // Veille refresh : Worker fetches RSS feeds directly, no Make RSS modules needed
    if (request.method === 'POST' && url.pathname === '/veille-refresh') {
      const secret = request.headers.get('x-make-secret');
      if (!env.MAKE_SECRET || secret !== env.MAKE_SECRET) {
        return new Response('Forbidden', { status: 403 });
      }
      const result = await runVeilleRefresh(env);
      return jsonResponse({ ok: true, ...result });
    }

    // Veille ingest : Make sends raw articles, Worker synthesizes with Groq and stores
    if (request.method === 'POST' && url.pathname === '/veille-ingest') {
      const secret = request.headers.get('x-make-secret');
      if (!env.MAKE_SECRET || secret !== env.MAKE_SECRET) {
        return new Response('Forbidden', { status: 403 });
      }
      let body;
      try { body = await request.json(); } catch { return new Response('Bad Request', { status: 400 }); }

      const categories = Array.isArray(body.categories) ? body.categories : [];
      const processed = [];

      for (const cat of categories) {
        const raw = cat.raw || '';
        const items = raw.split(/;;;|\n/)
          .map(line => line.trim())
          .filter(line => line.includes('|'))
          .map(line => {
            const idx = line.indexOf('|');
            return {
              title: line.slice(0, idx).trim(),
              url: line.slice(idx + 1).trim(),
              source: cat.label || cat.id,
            };
          })
          .filter(item => item.title && item.url);

        let digest = '';
        if (items.length > 0 && env.GROQ_KEY) {
          const titles = items.map(i => `- ${i.title}`).join('\n');
          const groqRes = await callGroq(env, {
            model: DEFAULT_MODEL,
            messages: [
              { role: 'system', content: 'Tu es un assistant de veille technologique. Rédige en 2 phrases maximum en français une synthèse concise et factuelle des articles listés. Sois direct, informatif, sans intro. N\'utilise jamais de tirets longs.' },
              { role: 'user', content: `Articles de la semaine :\n${titles}` },
            ],
            temperature: 0.4,
            max_tokens: 120,
          });
          if (groqRes.ok) digest = extractContent(groqRes.data) || '';
        }

        processed.push({ id: cat.id, label: cat.label, digest, items });
      }

      const stored = await storeEdition(env, processed);

      return jsonResponse({ ok: true, week: stored.week, categories: processed.length });
    }

    // Veille POST : protected by MAKE_SECRET, called by Make
    if (request.method === 'POST' && url.pathname === '/veille') {
      const secret = request.headers.get('x-make-secret');
      if (!env.MAKE_SECRET || secret !== env.MAKE_SECRET) {
        return new Response('Forbidden', { status: 403 });
      }
      let body;
      try { body = await request.json(); } catch { return new Response('Bad Request', { status: 400 }); }
      if (Array.isArray(body.categories)) {
        const stored = await storeEdition(env, body.categories);
        return jsonResponse({ ok: true, week: stored.week });
      }
      // payload legacy sans categories : comportement historique, sans archive
      await env.VEILLE_STORE.put('veille_latest', JSON.stringify(body));
      return jsonResponse({ ok: true });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    if (await rateLimited(request, env)) {
      return jsonResponse({ error: { message: 'Rate limit reached. Please wait a moment and try again.' } }, 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    if (url.pathname === '/orchestrate') {
      return handleOrchestrator(body, env, ctx);
    }

    if (url.pathname === '/orchestrate-stream') {
      return handleOrchestratorStream(body, env, ctx);
    }

    if (url.pathname === '/rag-query') {
      return handleRagQuery(body, env, ctx);
    }

    if (url.pathname === '/feedback') {
      return handleFeedback(body, env, ctx);
    }

    return proxyGroq(body, env, ctx);
  },

  // Weekly cron (see [triggers] in wrangler.toml) : regenerate the veille edition
  // for the current ISO week. Runs inside the Worker, so no MAKE_SECRET needed.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runVeilleRefresh(env));
  },
};

// ─── Stats ────────────────────────────────────────────────────────────────────

async function handleStats(env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN };
  if (!env.USAGE_COUNTER) {
    return new Response(JSON.stringify({ total: 0 }), { headers });
  }
  const val = await env.USAGE_COUNTER.get('total');
  return new Response(JSON.stringify({ total: parseInt(val || '0', 10) }), { headers });
}

async function incrementCounter(env) {
  if (!env.USAGE_COUNTER) return;
  try {
    const current = parseInt((await env.USAGE_COUNTER.get('total')) || '0', 10);
    await env.USAGE_COUNTER.put('total', String(current + 1));
  } catch {
    // non-blocking : never fail a request over a counter
  }
}

// ─── Langfuse tracing (non-blocking, opt-in via secrets) ─────────────────────

function lf_id() { return crypto.randomUUID(); }

function lf_event(type, body) {
  return { id: lf_id(), type, timestamp: new Date().toISOString(), body };
}

async function lf_flush(env, events) {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return;
  try {
    await fetch('https://cloud.langfuse.com/api/public/ingestion', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(env.LANGFUSE_PUBLIC_KEY + ':' + env.LANGFUSE_SECRET_KEY)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batch: events }),
    });
  } catch { /* non-blocking */ }
}

function lf_usage(groqData) {
  const u = groqData?.usage;
  if (!u) return undefined;
  return { input: u.prompt_tokens, output: u.completion_tokens, total: u.total_tokens, unit: 'TOKENS' };
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-8);
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

async function handleOrchestrator(body, env, ctx) {
  const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
  if (!userMessage || userMessage.length > 2000) {
    const lang = body.lang === 'en' ? 'en' : 'fr';
    if (!userMessage) return jsonResponse({ reply: lang === 'en' ? 'Please share your request.' : 'Partage-moi ton besoin.' }, 400);
    return jsonResponse({ reply: lang === 'en' ? 'Message too long.' : 'Message trop long.' }, 400);
  }

  if (env.LANGGRAPH_ORCHESTRATOR_URL) {
    try {
      const langGraphRes = await forwardToLangGraph(body, env);
      if (langGraphRes && langGraphRes.ok) {
        ctx?.waitUntil?.(incrementCounter(env));
        return langGraphRes;
      }
    } catch {
      // fallback to worker-native orchestration
    }
  }

  const lang = body.lang === 'en' ? 'en' : 'fr';
  const history = normalizeHistory(body.history);

  const plannerPrompt = lang === 'en'
    ? 'You are KRL1, portfolio assistant for Carlin Mankoto (AI Product Manager). Analyse the user intent and return strict JSON only. ' +
      'Intent values: "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory questions), "portfolio" (Carlin profile/experience/certifications), "tech" (stack/architecture/KRL1 technical questions), "contact", "other". ' +
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} : only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} : seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal, do NOT mention PM tools unless genuinely relevant. ' +
      'Only share Carlin\'s LinkedIn/email when intent is "contact" or the user explicitly asks how to reach him; never suggest contact proactively. ' +
      'Max 220 words. Never use em dashes or long dashes; use commas, colons or periods instead. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal, ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Ne partage le LinkedIn/email de Carlin que si l\'intent est "contact" ou si l\'utilisateur demande explicitement comment le joindre ; ne suggère jamais le contact de façon proactive. ' +
      'Max 220 mots. N\'utilise jamais de tirets longs ; préfère virgules, deux-points ou points. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const plannerMessages = [
    { role: 'system', content: plannerPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const traceId = lf_id();
  const plannerStart = Date.now();
  const plannerRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: plannerMessages,
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!plannerRes.ok) {
    return plannerRes.response;
  }

  const plannerEnd = Date.now();
  const planText = extractContent(plannerRes.data);

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

  const synthesisMessages = [
    { role: 'system', content: synthesisPrompt },
    {
      role: 'user',
      content: `User request:\n${userMessage}\n\nPlan JSON:\n${planText}\n\nTools:\n${toolLinks}`,
    },
  ];

  const synthesisStart = Date.now();
  const synthesisRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: synthesisMessages,
    temperature: 0.45,
    max_tokens: 450,
  });

  if (!synthesisRes.ok) {
    return synthesisRes.response;
  }

  const synthesisEnd = Date.now();
  const reply = extractContent(synthesisRes.data);
  const plan = safeJsonParse(planText);
  const lfEvents = [
    lf_event('trace-create', {
      id: traceId,
      name: 'krl1-orchestrate',
      input: { message: userMessage, lang },
      output: { reply, intent: plan?.intent, confidence: plan?.confidence },
      metadata: { route: '/orchestrate', model: DEFAULT_MODEL },
      tags: ['krl1'],
    }),
    lf_event('generation-create', {
      id: lf_id(),
      traceId,
      name: 'planner',
      model: DEFAULT_MODEL,
      modelParameters: { temperature: 0.2, maxTokens: 500 },
      input: plannerMessages,
      output: planText,
      startTime: new Date(plannerStart).toISOString(),
      endTime: new Date(plannerEnd).toISOString(),
      usage: lf_usage(plannerRes.data),
    }),
    lf_event('generation-create', {
      id: lf_id(),
      traceId,
      name: 'synthesis',
      model: DEFAULT_MODEL,
      modelParameters: { temperature: 0.45, maxTokens: 450 },
      input: synthesisMessages,
      output: reply,
      startTime: new Date(synthesisStart).toISOString(),
      endTime: new Date(synthesisEnd).toISOString(),
      usage: lf_usage(synthesisRes.data),
    }),
  ];
  ctx?.waitUntil?.(Promise.all([incrementCounter(env), lf_flush(env, lfEvents)]));
  return jsonResponse({ reply, plan: plan || null });
}

// ─── Streaming orchestrator ───────────────────────────────────────────────────

async function handleOrchestratorStream(body, env, ctx) {
  const lang = body.lang === 'en' ? 'en' : 'fr';
  const history = normalizeHistory(body.history);
  const userMessage = typeof body.message === 'string' ? body.message.trim() : '';

  if (!userMessage || userMessage.length > 2000) {
    if (!userMessage) return jsonResponse({ reply: lang === 'en' ? 'Please share your request.' : 'Partage-moi ton besoin.' }, 400);
    return jsonResponse({ reply: lang === 'en' ? 'Message too long.' : 'Message trop long.' }, 400);
  }

  const plannerPrompt = lang === 'en'
    ? 'You are KRL1, portfolio assistant for Carlin Mankoto (AI Product Manager). Analyse the user intent and return strict JSON only. ' +
      'Intent values: "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory questions), "portfolio" (Carlin profile/experience/certifications), "tech" (stack/architecture/KRL1 technical questions), "contact", "other". ' +
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} : only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} : seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const traceId = lf_id();
  const plannerStart = Date.now();
  const plannerRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: plannerPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!plannerRes.ok) return plannerRes.response;

  const plannerEnd = Date.now();
  const planText = extractContent(plannerRes.data);

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal, do NOT mention PM tools unless genuinely relevant. ' +
      'Only share Carlin\'s LinkedIn/email when intent is "contact" or the user explicitly asks how to reach him; never suggest contact proactively. ' +
      'Max 220 words. Never use em dashes or long dashes; use commas, colons or periods instead. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal, ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Ne partage le LinkedIn/email de Carlin que si l\'intent est "contact" ou si l\'utilisateur demande explicitement comment le joindre ; ne suggère jamais le contact de façon proactive. ' +
      'Max 220 mots. N\'utilise jamais de tirets longs ; préfère virgules, deux-points ou points. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

  const synthesisStart = Date.now();
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: synthesisPrompt },
        { role: 'user', content: `User request:\n${userMessage}\n\nPlan JSON:\n${planText}\n\nTools:\n${toolLinks}` },
      ],
      temperature: 0.45,
      max_tokens: 450,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const text = await groqRes.text();
    return new Response(text, {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const plan = safeJsonParse(planText);
  const lfEvents = [
    lf_event('trace-create', {
      id: traceId,
      name: 'krl1-orchestrate-stream',
      input: { message: userMessage, lang },
      output: { intent: plan?.intent, confidence: plan?.confidence },
      metadata: { route: '/orchestrate-stream', model: DEFAULT_MODEL },
      tags: ['krl1', 'stream'],
    }),
    lf_event('generation-create', {
      id: lf_id(),
      traceId,
      name: 'planner',
      model: DEFAULT_MODEL,
      modelParameters: { temperature: 0.2, maxTokens: 500 },
      input: [{ role: 'system', content: plannerPrompt }, ...history, { role: 'user', content: userMessage }],
      output: planText,
      startTime: new Date(plannerStart).toISOString(),
      endTime: new Date(plannerEnd).toISOString(),
      usage: lf_usage(plannerRes.data),
    }),
    lf_event('generation-create', {
      id: lf_id(),
      traceId,
      name: 'synthesis',
      model: DEFAULT_MODEL,
      modelParameters: { temperature: 0.45, maxTokens: 450, stream: true },
      input: [
        { role: 'system', content: synthesisPrompt },
        { role: 'user', content: `User request:\n${userMessage}\n\nPlan JSON:\n${planText}` },
      ],
      output: '[streaming]',
      startTime: new Date(synthesisStart).toISOString(),
    }),
  ];
  ctx?.waitUntil?.(Promise.all([incrementCounter(env), lf_flush(env, lfEvents)]));

  return new Response(groqRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      ...corsHeaders(),
    },
  });
}

// ─── RAG query (semantic, native Worker) ─────────────────────────────────────

async function handleRagQuery(body, env, ctx) {
  const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
  const lang = body.lang === 'en' ? 'en' : 'fr';

  if (!userMessage) {
    return jsonResponse({ reply: lang === 'en' ? 'Please share your request.' : 'Partage-moi ton besoin.' }, 400);
  }
  if (userMessage.length > 2000) {
    return jsonResponse({ reply: lang === 'en' ? 'Message too long.' : 'Message trop long.' }, 400);
  }

  // Step 1: Planner
  const plannerPrompt = lang === 'en'
    ? 'You are KRL1, portfolio assistant for Carlin Mankoto (AI Product Manager). Analyse the user intent and return strict JSON only. ' +
      'Intent values: "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory questions), "portfolio" (Carlin profile/experience/certifications), "tech" (stack/architecture/KRL1 technical questions), "contact", "other". ' +
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} : only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} : seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const traceId = lf_id();
  const plannerStart = Date.now();
  const plannerRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: [{ role: 'system', content: plannerPrompt }, { role: 'user', content: userMessage }],
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!plannerRes.ok) return plannerRes.response;

  const plannerEnd = Date.now();
  const planText = extractContent(plannerRes.data);
  const plan = safeJsonParse(planText) || {};

  // Step 2: Semantic retrieval (always, regardless of intent)
  const retrievalStart = Date.now();
  const chunks = await retrieveSemantic(userMessage, env, 3);
  const retrievalEnd = Date.now();

  // Step 3: Synthesis : inject retrieved context only for pm_workflow
  const intent = plan.intent || 'other';
  const ragSection = intent === 'pm_workflow' && chunks.length > 0
    ? (lang === 'en'
        ? 'Use the following PM knowledge base excerpts to ground your answer. Reference specific frameworks from them when relevant.\n\nPM Knowledge Base:\n'
        : 'Utilise les extraits suivants de la base de connaissances PM pour ancrer ta réponse. Cite les frameworks spécifiques quand pertinent.\n\nBase PM:\n')
      + chunks.map(c => `[Source: ${c.source}]\n${c.text}`).join('\n\n---\n\n') + '\n\n'
    : '';

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal, do NOT mention PM tools unless genuinely relevant. ' +
      'Only share Carlin\'s LinkedIn/email when intent is "contact" or the user explicitly asks how to reach him; never suggest contact proactively. ' +
      'Max 220 words. Never use em dashes or long dashes; use commas, colons or periods instead. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal, ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Ne partage le LinkedIn/email de Carlin que si l\'intent est "contact" ou si l\'utilisateur demande explicitement comment le joindre ; ne suggère jamais le contact de façon proactive. ' +
      'Max 220 mots. N\'utilise jamais de tirets longs ; préfère virgules, deux-points ou points. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

  const synthesisStart = Date.now();
  const synthesisRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: synthesisPrompt },
      { role: 'user', content: `${ragSection}User request:\n${userMessage}\n\nPlan JSON:\n${planText}\n\nTools:\n${toolLinks}` },
    ],
    temperature: 0.45,
    max_tokens: 450,
  });

  if (!synthesisRes.ok) return synthesisRes.response;

  const synthesisEnd = Date.now();
  const reply = extractContent(synthesisRes.data);
  const lfEvents = [
    lf_event('trace-create', {
      id: traceId,
      name: 'rag-query',
      input: { message: userMessage, lang },
      output: { reply, intent: plan.intent, confidence: plan.confidence, chunksRetrieved: chunks.length },
      metadata: { route: '/rag-query', model: DEFAULT_MODEL, ragActive: plan.intent === 'pm_workflow' },
      tags: ['rag', 'krl1'],
    }),
    lf_event('generation-create', {
      id: lf_id(),
      traceId,
      name: 'planner',
      model: DEFAULT_MODEL,
      modelParameters: { temperature: 0.2, maxTokens: 500 },
      input: [{ role: 'system', content: plannerPrompt }, { role: 'user', content: userMessage }],
      output: planText,
      startTime: new Date(plannerStart).toISOString(),
      endTime: new Date(plannerEnd).toISOString(),
      usage: lf_usage(plannerRes.data),
    }),
    lf_event('span-create', {
      id: lf_id(),
      traceId,
      name: 'retriever',
      startTime: new Date(retrievalStart).toISOString(),
      endTime: new Date(retrievalEnd).toISOString(),
      input: { query: userMessage },
      output: { chunks: chunks.length, sources: chunks.map(c => c.source) },
      metadata: { model: 'bge-small-en-v1.5', topK: 3, ragActive: plan.intent === 'pm_workflow' },
    }),
    lf_event('generation-create', {
      id: lf_id(),
      traceId,
      name: 'synthesis',
      model: DEFAULT_MODEL,
      modelParameters: { temperature: 0.45, maxTokens: 450 },
      input: [
        { role: 'system', content: synthesisPrompt },
        { role: 'user', content: `${ragSection}User request:\n${userMessage}\n\nPlan JSON:\n${planText}` },
      ],
      output: reply,
      startTime: new Date(synthesisStart).toISOString(),
      endTime: new Date(synthesisEnd).toISOString(),
      usage: lf_usage(synthesisRes.data),
    }),
  ];
  ctx?.waitUntil?.(Promise.all([incrementCounter(env), lf_flush(env, lfEvents)]));

  return jsonResponse({ reply, plan, chunks, engine: 'worker-rag-semantic' });
}

// ─── Semantic retrieval helpers ───────────────────────────────────────────────

function buildChunks() {
  const CHUNK_WORDS = 300;
  const OVERLAP = 50;
  const chunks = [];
  for (const [source, content] of Object.entries(KB_FILES)) {
    const words = content.split(/\s+/).filter(Boolean);
    let i = 0;
    while (i < words.length) {
      const text = words.slice(i, i + CHUNK_WORDS).join(' ');
      if (text.trim()) chunks.push({ text, source });
      i += CHUNK_WORDS - OVERLAP;
    }
  }
  return chunks;
}

function getChunks() {
  if (!_chunks) _chunks = buildChunks();
  return _chunks;
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

async function retrieveSemantic(query, env, topK = 3) {
  if (!env.AI) return [];
  const allChunks = getChunks();
  if (!allChunks.length) return [];

  const texts = [query, ...allChunks.map(c => c.text)];
  let result;
  try {
    result = await env.AI.run('@cf/baai/bge-small-en-v1.5', { text: texts });
  } catch {
    return [];
  }

  if (!result?.data?.length) return [];
  const [queryVec, ...chunkVecs] = result.data;

  const scored = allChunks.map((chunk, i) => ({
    ...chunk,
    score: cosineSimilarity(queryVec, chunkVecs[i] || []),
  }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, topK).filter(c => c.score > 0);
  if (!top.length) return [];
  const maxScore = top[0].score;
  return top.map(c => ({ text: c.text, source: c.source, score: round4(c.score / maxScore) }));
}

// ─── Feedback pipeline (Make webhook + Groq fallback) ────────────────────────

async function handleFeedback(body, env, ctx) {
  const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
  const source   = typeof body.source   === 'string' ? body.source   : 'Manual';
  const lang     = body.lang === 'en' ? 'en' : 'fr';

  if (!feedback || feedback.length > 1000) {
    return jsonResponse({ error: lang === 'en' ? 'Invalid feedback.' : 'Feedback invalide.' }, 400);
  }

  if (env.MAKE_WEBHOOK_URL) {
    try {
      const makeRes = await fetch(env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, source, lang }),
      });
      if (makeRes.ok) {
        const data = await makeRes.json();
        ctx?.waitUntil?.(incrementCounter(env));
        return jsonResponse({ ...data, engine: 'make' });
      }
    } catch { /* fallback below */ }
  }

  const systemPrompt = lang === 'en'
    ? 'You are a product feedback analyst. Categorize the feedback and return strict JSON only.\n' +
      'Keys: category (Bug Report|Feature Request|Compliment|Question|Other), sentiment (positive|neutral|negative), priority (high|medium|low), themes (array of 1-3 short strings in English), summary (one sentence, max 15 words).'
    : 'Tu es un analyste de feedback produit. Catégorise le feedback et retourne uniquement du JSON strict.\n' +
      'Clés : category (Bug Report|Feature Request|Compliment|Question|Other), sentiment (positive|neutral|negative), priority (high|medium|low), themes (tableau de 1 à 3 courtes chaînes en français), summary (une phrase, 15 mots max).';

  const groqRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Source: ${source}\n\nFeedback:\n${feedback}` },
    ],
    temperature: 0.2,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  if (!groqRes.ok) return groqRes.response;
  const data = safeJsonParse(extractContent(groqRes.data)) || {};
  ctx?.waitUntil?.(incrementCounter(env));
  return jsonResponse({ ...data, engine: 'groq-fallback' });
}

// ─── LangGraph forward (optional, if LANGGRAPH_ORCHESTRATOR_URL is set) ───────

async function forwardToLangGraph(body, env) {
  const endpoint = env.LANGGRAPH_ORCHESTRATOR_URL;
  if (!endpoint) {
    return null;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ─── Groq proxy ───────────────────────────────────────────────────────────────

// Per-IP rate limit backed by KV. Fails open (returns false) when the KV binding
// is absent or errors, so a counter hiccup never takes the proxy down.
async function rateLimited(request, env) {
  if (!env.USAGE_COUNTER) return false;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = `rl_${ip}`;
  try {
    const current = parseInt((await env.USAGE_COUNTER.get(key)) || '0', 10);
    if (current >= RATE_LIMIT_MAX) return true;
    await env.USAGE_COUNTER.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW });
    return false;
  } catch {
    return false;
  }
}

// Validates / clamps a raw Groq passthrough body. Returns an error string when the
// request must be rejected, or null when it is safe (mutating body in place to clamp).
function validateGroqBody(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body.';
  if (body.model && body.model !== DEFAULT_MODEL) return 'Unsupported model.';
  body.model = DEFAULT_MODEL;
  if (!Array.isArray(body.messages) || body.messages.length === 0) return 'Missing messages.';
  if (body.messages.length > MAX_MESSAGES) return 'Too many messages.';
  const totalChars = body.messages.reduce(
    (n, m) => n + (m && typeof m.content === 'string' ? m.content.length : 0), 0);
  if (totalChars > MAX_TOTAL_CHARS) return 'Payload too large.';
  if (typeof body.max_tokens !== 'number' || body.max_tokens > MAX_TOKENS_CAP) {
    body.max_tokens = MAX_TOKENS_CAP;
  }
  return null;
}

async function proxyGroq(body, env, ctx) {
  const invalid = validateGroqBody(body);
  if (invalid) return jsonResponse({ error: { message: invalid } }, 400);

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await groqRes.text();
  if (groqRes.ok) ctx?.waitUntil?.(incrementCounter(env));
  return new Response(text, {
    status: groqRes.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function callGroq(env, payload) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      response: new Response(text || 'Upstream Error', {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      }),
    };
  }

  return { ok: true, data: safeJsonParse(text) || {} };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function extractContent(data) {
  return data?.choices?.[0]?.message?.content || '';
}

function safeJsonParse(value) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
}
