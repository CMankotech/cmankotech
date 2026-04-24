# INVEST Criteria for User Stories

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

```
As a [type of user],
I want to [perform an action],
So that [I achieve a benefit / goal].

Acceptance Criteria:
- Given [context], when [action], then [outcome]
- Given [context], when [action], then [outcome]
```

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
5. **Equating Small with trivial** — small means deliverable in one sprint, not necessarily simple.
