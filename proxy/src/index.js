const ALLOWED_ORIGIN = 'https://cmankotech.github.io';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

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
| 100% | High confidence — data-backed estimates |
| 80% | Medium confidence — some supporting data |
| 50% | Low confidence — mostly assumptions |

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

1. **Overestimating Reach** — be conservative, use real analytics data
2. **Inflating Confidence** — if you have no data, use 50% or lower
3. **Underestimating Effort** — always add 20-30% buffer for unknowns
4. **Using RICE in isolation** — combine with strategic alignment and dependencies
5. **Treating the score as absolute truth** — RICE is a conversation starter, not a verdict

## RICE vs. ICE

ICE (Impact × Confidence × Ease) is a simpler variant that drops Reach. Use ICE for smaller, uniform-audience features; use RICE when your features target different user segments of varying sizes.`,

  'okr.md': `# OKR Framework — Objectives and Key Results

## Definition

OKRs are a goal-setting framework that connects ambitious objectives to measurable outcomes. Pioneered at Intel by Andy Grove and popularized by Google, OKRs align individual, team, and company efforts toward shared priorities.

**Structure:**
- **Objective** — a qualitative, inspiring statement of what you want to achieve
- **Key Results** — 2-5 quantitative metrics that prove the objective is being achieved

\`\`\`
Objective: [Inspiring qualitative statement]
  KR1: [Measurable outcome] from X to Y by [date]
  KR2: [Measurable outcome] from X to Y by [date]
  KR3: [Measurable outcome] from X to Y by [date]
\`\`\`

## What Makes a Good Objective

- Qualitative and aspirational — it should inspire and give direction
- Memorable and short (one sentence)
- Time-bound (typically quarterly)
- Should NOT be a metric itself — that's what Key Results are for
- Good: "Become the go-to platform for freelance designers"
- Bad: "Increase revenue by 20%"

## What Makes a Good Key Result

- Strictly quantitative — if it can't be measured, it's not a KR
- Outcome-based, not output-based (measure impact, not activity)
- Contains a baseline and a target: "from X to Y"
- Should be ambitious but achievable (~70% completion is a success at Google)
- 2-5 KRs per Objective — more creates dilution and confusion

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
- **0.7 is the target** — consistently scoring 1.0 means objectives weren't ambitious enough
- 0.0–0.3: Significant shortfall, needs retrospective
- 0.4–0.6: Progress made, but fell short
- 0.7–1.0: Strong performance

## When to Use OKRs

- Quarterly company or product team planning
- Aligning cross-functional teams on shared outcomes
- Communicating product strategy to stakeholders
- Shifting team culture from output-thinking to outcome-thinking

## Common Mistakes to Avoid

1. **Too many OKRs** — 3-5 objectives per team maximum; more = loss of focus
2. **Tasks disguised as Key Results** — "Launch feature X" is a task, not a KR
3. **OKRs as performance reviews** — OKRs are for direction, not HR evaluation
4. **Setting OKRs in isolation** — must be co-created with the team to get buy-in
5. **Forgetting to check in** — OKRs abandoned after Q1 kickoff achieve nothing
6. **100% score as the goal** — ambitious OKRs should be hard; 100% may signal low ambition`,

  'discovery.md': `# Product Discovery Framework

## Definition

Product discovery is the process of determining what to build before building it. It answers the question: "Are we solving the right problem in the right way?" Effective discovery reduces the risk of building features users don't want or that don't achieve business goals.

**The dual risk in product:**
- **Value risk** — will users want this?
- **Feasibility risk** — can we build it?
- **Usability risk** — can users figure out how to use it?
- **Business viability risk** — will this work for our business?

## The Double Diamond Model

The Double Diamond (Design Council, 2005) is the most widely used discovery framework:

\`\`\`
  Discover ──→ Define ──→ Develop ──→ Deliver
 (Diverge)   (Converge)  (Diverge)  (Converge)
     ◇            ◆           ◇           ◆
  Problem        Right      Solutions    Right
  Space         Problem     Space       Solution
\`\`\`

### Diamond 1 — Problem Space

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

### Diamond 2 — Solution Space

**Develop (Diverge):**
- Generate a wide range of potential solutions
- Methods: brainstorming, sketching, crazy eights, solution workshops
- Goal: quantity over quality at this stage — avoid premature convergence
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
- Run small, fast experiments weekly — no big-bang launches
- Discovery and delivery run in parallel, not sequentially

## When to Use Discovery

- Before committing to a new feature or product area
- When churn or low adoption signals a problem but not a clear cause
- When the team is debating solutions without alignment on the problem
- At the start of each quarter before roadmap planning

## Common Mistakes to Avoid

1. **Skipping the problem diamond** — jumping straight to solutions without validating the problem
2. **Conducting biased interviews** — asking "would you use this?" instead of "tell me about the last time you..."
3. **Survey-only research** — surveys confirm hypotheses; interviews surface unknown unknowns
4. **Discovery as a one-time phase** — continuous discovery beats waterfall discovery sprints
5. **Insufficient sample size** — minimum 5-8 user interviews per research question
6. **Confusing output with outcome** — "we ran 10 interviews" is an output; "we validated the core job" is an outcome`,

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
Stories are not rigid contracts — they are an invitation to a conversation.

- Details are negotiated between the team and the stakeholder
- The user story captures intent, not a full specification
- Implementation details are decided collaboratively during refinement
- Stories can be rewritten, split, or reframed as understanding deepens

### Valuable (V)
Every story must deliver value to a user or stakeholder.

- Value should be explicit: "As a [user], I want [action] so that [benefit]"
- Avoid technical stories that don't directly provide user-facing value — wrap them in a user-centric framing
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

1. **Writing stories as tasks** — "Implement API endpoint for X" is a task, not a user story. Always anchor to user value.
2. **Merging multiple scenarios into one story** — each scenario should be its own testable story.
3. **Missing acceptance criteria** — a story without AC is not ready for development.
4. **Ignoring the Independent criterion** — hidden dependencies blow up sprint planning.
5. **Equating Small with trivial** — small means deliverable in one sprint, not necessarily simple.`,

  'jtbd.md': `# Jobs-to-be-Done (JTBD) Methodology

## Definition

Jobs-to-be-Done is a framework for understanding why customers "hire" a product or service to accomplish a goal in their lives. Developed by Clayton Christensen, JTBD shifts the focus from what users do to why they do it — the underlying progress they are trying to make.

**Core insight:** People don't buy products; they hire them to get a job done.

**Famous example:** "People don't want a quarter-inch drill. They want a quarter-inch hole." — Theodore Levitt

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

JTBD redefines competition. The real competitor is whatever the customer used before your product to get the job done — including doing nothing.

| Traditional view | JTBD view |
|-----------------|-----------|
| Competitors = other apps | Competitors = all ways to get the job done |
| Slack competes with Teams | Slack competes with email, meetings, and shared docs |
| Netflix competes with Hulu | Netflix competes with sleep, books, social media |

## Forces of Progress Model

Four forces influence whether a customer will switch to a new solution:

**Pushing away from the old:**
1. **Push** — pain and frustration with the current solution
2. **Pull** — attraction toward the new solution's promise

**Pulling back toward the old:**
3. **Anxiety** — fears about trying something new
4. **Habit** — comfort and inertia with the existing solution

For a switch to happen, Push + Pull must outweigh Anxiety + Habit.

## Using JTBD in Product Discovery

### 1. Jobs Interview Technique
- Recruit customers who recently switched to your product or away from it
- Ask them to tell the story of the decision chronologically
- Focus on the "first thought" moment — what triggered the search
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

Find where the job is most painful or underserved — that's the opportunity.

## Worked Example — Project Management Tool

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

1. **Confusing jobs with features** — "I want a dashboard" is a feature request, not a job
2. **Writing jobs that are too narrow** — "Send a PDF" is a task, not a job; look for the why behind it
3. **Ignoring emotional and social jobs** — functional jobs alone miss the full picture
4. **Stopping at the interview** — JTBD insights must translate into prioritization and design decisions
5. **Assuming one product = one job** — users often hire the same product for multiple jobs`,

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
- If in doubt, ask: "What happens if we ship without this?" — if the answer is "we can't ship", it's a Must.

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

### Won't Have (W) — This Time
Requirements explicitly out of scope for the current iteration.

- Manages stakeholder expectations proactively
- "This time" is key — it signals the feature is not forgotten, only deferred
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

## Worked Example — Mobile App Release

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
- MVP definition — separating essentials from nice-to-haves
- Managing scope creep in ongoing projects

## Common Mistakes to Avoid

1. **Too many Musts** — if everything is Must, nothing is prioritized. Musts should be critical only.
2. **Skipping the Won't column** — explicitly stating Won't Have prevents scope creep and manages expectations.
3. **Using MoSCoW once and forgetting it** — reprioritize at each planning cycle.
4. **No stakeholder alignment** — MoSCoW decisions must be co-owned by business + tech + design.
5. **Confusing Should and Could** — Should = important + painful if missing; Could = nice-to-have.`,

  'roadmap.md': `# Product Roadmap Strategies and Formats

## Definition

A product roadmap is a strategic communication artifact that shows where a product is going and why, over a period of time. It is not a detailed project plan — it is a shared understanding of direction, priorities, and rationale.

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
Maps customer opportunities (jobs, pain points) rather than solutions — leaves room for the team to find the best solution.

**Best for:** Discovery-led organizations, teams practicing continuous discovery

## Roadmap Components

Each item on a roadmap should include:

| Component | Description | Example |
|-----------|-------------|---------|
| **Theme / Goal** | The strategic problem being solved | "Reduce onboarding drop-off" |
| **Hypothesis** | Belief that drives the work | "A guided tour will increase activation" |
| **Expected outcome** | The metric this will move | "+15% 7-day activation rate" |
| **Confidence level** | How validated is this bet? | Medium — 3 user interviews done |
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

- **Acquisition** — features that attract new users
- **Activation** — features that deliver first value quickly
- **Retention** — features that keep users coming back
- **Revenue** — features that convert or upsell
- **Referral** — features that generate word-of-mouth

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

1. **Why now** — what changed in the market or with users that makes this the right priority
2. **What we learned** — discovery insights that inform the bet
3. **What success looks like** — specific metrics and timeline
4. **What we're not doing** — explicit out-of-scope items (prevents scope creep)
5. **Open questions** — what we still need to validate

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

1. **Confusing a roadmap with a backlog** — roadmaps are strategic, backlogs are tactical
2. **Committing to specific features too far in advance** — discovery may reveal better solutions
3. **Not updating the roadmap** — a stale roadmap erodes trust
4. **One roadmap for all audiences** — tailor the detail level and framing to the audience
5. **Ignoring technical debt** — roadmaps should allocate explicit capacity for non-feature work`,
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

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
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

    return proxyGroq(body, env, ctx);
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
    // non-blocking — never fail a request over a counter
  }
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
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} — only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} — seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal — do NOT mention PM tools unless genuinely relevant. ' +
      'Max 220 words. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal — ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Max 220 mots. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const plannerMessages = [
    { role: 'system', content: plannerPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

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

  const synthesisRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: synthesisMessages,
    temperature: 0.45,
    max_tokens: 450,
  });

  if (!synthesisRes.ok) {
    return synthesisRes.response;
  }

  const reply = extractContent(synthesisRes.data);
  ctx?.waitUntil?.(incrementCounter(env));
  return jsonResponse({ reply, plan: safeJsonParse(planText) || null });
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
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} — only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} — seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

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

  const planText = extractContent(plannerRes.data);

  const synthesisPrompt = lang === 'en'
    ? 'You are KRL1, Carlin Mankoto\'s portfolio assistant. ' +
      'For intent "pm_workflow": transform the PM plan into an actionable answer with links to PM tools. ' +
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal — do NOT mention PM tools unless genuinely relevant. ' +
      'Max 220 words. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal — ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Max 220 mots. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

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

  ctx?.waitUntil?.(incrementCounter(env));

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
      'Keys: intent, confidence (0-1), user_goal, steps (array of {tool, objective, output} — only for pm_workflow, else []), risks (array), quick_win.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto (AI PM). Analyse l\'intention et retourne uniquement du JSON strict. ' +
      'Valeurs d\'intent : "pm_workflow" (backlog/OKR/discovery/roadmap/epic/userStory), "portfolio" (profil/expérience/certifs de Carlin), "tech" (stack/architecture/questions techniques sur KRL1), "contact", "other". ' +
      'Clés : intent, confidence (0-1), user_goal, steps (tableau {tool, objective, output} — seulement pour pm_workflow, sinon []), risks (tableau), quick_win.';

  const plannerRes = await callGroq(env, {
    model: DEFAULT_MODEL,
    messages: [{ role: 'system', content: plannerPrompt }, { role: 'user', content: userMessage }],
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!plannerRes.ok) return plannerRes.response;

  const planText = extractContent(plannerRes.data);
  const plan = safeJsonParse(planText) || {};

  // Step 2: Semantic retrieval (always, regardless of intent)
  const chunks = await retrieveSemantic(userMessage, env, 3);

  // Step 3: Synthesis — inject retrieved context only for pm_workflow
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
      'For other intents (portfolio/tech/contact/other): answer the question directly based on user_goal — do NOT mention PM tools unless genuinely relevant. ' +
      'Max 220 words. When citing a tool, use HTML link: <a href="URL" target="_blank">Name</a>. Never use markdown link syntax.'
    : 'Tu es KRL1, assistant portfolio de Carlin Mankoto. ' +
      'Pour l\'intent "pm_workflow" : transforme le plan PM en réponse actionnable avec liens vers les outils PM. ' +
      'Pour les autres intents (portfolio/tech/contact/other) : réponds directement à la question via user_goal — ne cite pas les outils PM sauf si vraiment pertinent. ' +
      'Max 220 mots. Liens HTML cliquables si tu cites un outil : <a href="URL" target="_blank">Nom</a>. Jamais de liens markdown.';

  const toolLinks = [
    'OKR Builder: https://cmankotech.github.io/cmankotech/okr-builder.html',
    'Discovery Assistant: https://cmankotech.github.io/cmankotech/discovery-assistant.html',
    'User Interview Analyzer: https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
    'Backlog Prioritizer: https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
    'Epic to User Stories: https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
    'Roadmap Storyteller: https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
  ].join('\n');

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

  const reply = extractContent(synthesisRes.data);
  ctx?.waitUntil?.(incrementCounter(env));

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

async function proxyGroq(body, env, ctx) {
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
