# MoSCoW Prioritization

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
```
Must Have  → committed delivery
Should Have → delivery expected but negotiable
Could Have → best-effort if sprint capacity allows
Won't Have → explicitly out of scope this sprint
```

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
5. **Confusing Should and Could** — Should = important + painful if missing; Could = nice-to-have.
