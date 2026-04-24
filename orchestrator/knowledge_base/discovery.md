# Product Discovery Framework

## Definition

Product discovery is the process of determining what to build before building it. It answers the question: "Are we solving the right problem in the right way?" Effective discovery reduces the risk of building features users don't want or that don't achieve business goals.

**The dual risk in product:**
- **Value risk** — will users want this?
- **Feasibility risk** — can we build it?
- **Usability risk** — can users figure out how to use it?
- **Business viability risk** — will this work for our business?

## The Double Diamond Model

The Double Diamond (Design Council, 2005) is the most widely used discovery framework:

```
  Discover ──→ Define ──→ Develop ──→ Deliver
 (Diverge)   (Converge)  (Diverge)  (Converge)
     ◇            ◆           ◇           ◆
  Problem        Right      Solutions    Right
  Space         Problem     Space       Solution
```

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
```
[User segment] struggles with [problem] when [context],
which results in [impact / consequence].
We believe that [solution hypothesis] will [desired outcome].
We'll know we're right when [measurable signal].
```

### "How Might We" (HMW) Questions
Transform insights into opportunity areas:
- Insight: "Users abandon checkout when asked for shipping address"
- HMW: "How might we reduce the steps needed to complete a purchase?"
- HMW: "How might we make returning users feel like checkout is instant?"

### Opportunity Solution Tree (Teresa Torres)
A visual map connecting:
```
Desired Outcome
  └── Opportunity 1
        ├── Solution A
        │     └── Assumption / Experiment
        └── Solution B
  └── Opportunity 2
        └── Solution C
```

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
6. **Confusing output with outcome** — "we ran 10 interviews" is an output; "we validated the core job" is an outcome
