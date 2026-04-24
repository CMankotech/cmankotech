# RICE Scoring Framework

## Definition

RICE is a prioritization framework for product backlogs. Each initiative receives a numeric score that helps teams compare options objectively and reduce cognitive bias in prioritization decisions.

**RICE stands for:** Reach, Impact, Confidence, Effort.

**Formula:**
```
RICE Score = (Reach × Impact × Confidence) / Effort
```

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

ICE (Impact × Confidence × Ease) is a simpler variant that drops Reach. Use ICE for smaller, uniform-audience features; use RICE when your features target different user segments of varying sizes.
