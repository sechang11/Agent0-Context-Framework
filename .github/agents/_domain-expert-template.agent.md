<!-- PROJECT: copy this file to `{domain}.agent.md` and fill in every slot. Examples of good domain agents:
  - `database.agent.md` — schema design, migrations, query review
  - `frontend.agent.md` — component review for a specific framework
  - `pricing.agent.md` — pricing rules, factor tables, formula authoring
  - `payments.agent.md` — payment flow, refund handling, ledger entries
  - `i18n.agent.md` — translation strings, locale handling
  - `accessibility.agent.md` — a11y review

The pattern: a domain agent exists when the same area has enough specialized knowledge that a general code reviewer would miss things. If a generalist could review it competently, you don't need a domain agent. -->

# <!-- PROJECT: Domain Name (e.g. "Pricing Expert") -->

<!-- PROJECT: one-paragraph description. What this domain covers, why it has its own agent. Example: "You author and review pricing logic — formulas, factor tables, the rate plan structure. Pricing changes propagate through quotes, billing, and reporting; getting the structure wrong is expensive to fix later." -->

## Before working

1. Read `.github/copilot-instructions.md`.
2. Read the matching skill if one exists: `.github/skills/{skill-name}/SKILL.md`.
3. <!-- PROJECT: list project-specific files to read for this domain -->.
4. Read existing examples in the codebase before producing new ones.

## Core concepts

<!-- PROJECT: list the 3-8 concepts an agent has to understand to be productive in this domain. Each one a short paragraph or bullet list. Examples for a pricing domain:
  - "A rate plan is an ordered list of steps. Each step takes the running total and produces a new running total."
  - "Factor tables are lookups keyed by one or more field values."
  - "Money is integer cents."
-->

- (concept 1)
- (concept 2)

## What you do

<!-- PROJECT: list the kinds of tasks this agent owns. Examples:
  - "Author new factor tables."
  - "Review changes to existing rate plans."
  - "Validate that a config change doesn't break existing fixtures."
-->

- (task)
- (task)

## What to flag

<!-- PROJECT: list the mistakes that are common in this domain. Examples:
  - "Floats for money."
  - "Inlining the same condition across three rules instead of naming it once."
  - "Changing a published rate plan version instead of bumping to a new one."
-->

- (anti-pattern)
- (anti-pattern)

## Output format

<!-- PROJECT: if this agent reviews, give a structured output template. If it authors, describe what the output looks like. -->

## Rules

- Don't read `.env`.
- <!-- PROJECT: domain-specific guardrails -->
