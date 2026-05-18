---
mode: agent
description: Invoke @ui-ux-engineer to review a feature's UX — flow friction (minimum-friction by default), adaptive design per viewport tier, theme consistency. Optional --engagement flag adds engagement-hacking analysis in a separate section. Optional --viewport flag focuses on one tier.
---

# /ui-review

Have `@ui-ux-engineer` audit a feature's user experience across three axes:

1. **Flow friction** — steps the user takes, fields they fill, pages they navigate.
2. **Adaptive design** — how the feature presents across viewport tiers (`mobile`, `tablet`, `desktop`, `wide`).
3. **Theme consistency** — whether the feature follows the project's adopted theme tokens or breaks from them.

Default mode: minimum-friction (always). Engagement-hacking analysis is opt-in via `--engagement` and lands in a separate `## Engagement opportunities` section so you can take or leave it per site.

## Invocation patterns

| Pattern | What it does |
|---|---|
| `/ui-review` | Interactive — asks which feature to review. |
| `/ui-review {feature}` | Reviews the named feature across all three axes. |
| `/ui-review {feature} --engagement` | Adds engagement-hacking analysis in a separate output section. |
| `/ui-review {feature} --viewport {tier}` | Focuses the review on one viewport tier (`mobile` / `tablet` / `desktop` / `wide`). |
| `/ui-review {feature} --axis {axis}` | Focuses on one axis (`flow` / `adaptive` / `theme`). Use to drill in after a full review surfaces something. |

`{feature}` matches a directory under `.github/specs/{feature}/`. If no spec exists, the agent reviews against the implementation directly.

## Phase 1 — Resolve the target

1. If no `{feature}` was provided, list all features under `.github/specs/` (excluding `_template/` and `_design/`) and ask which to review.
2. Verify the feature directory exists. If not, suggest closest match and stop.
3. Read the spec if it exists: `requirements.md`, `design.md`, `tasks.md`. If no spec (brownfield), look for the verification.md instead — its `Surfaces` section tells you which files to read.

## Phase 2 — Read project-level design context

1. `.github/specs/_design/responsive-strategy.md` if it exists — the project's adopted multi-resolution approach. If it doesn't exist, this is the first UI review and the agent will help establish one (see Phase 4 below).
2. `.github/themes/.adopted` if it exists — the project's adopted theme name.
3. `.github/themes/{adopted-name}/THEME.md` if a theme is adopted — the design tokens to check consistency against.

## Phase 3 — Invoke `@ui-ux-engineer`

Route to the agent via the Task tool with this brief:

> Review the feature `{feature}` across these axes: {axes — default all three, or one if --axis was passed}.
>
> **Mode:** minimum-friction (always). {if --engagement: "Also produce engagement findings in a SEPARATE `## Engagement opportunities` section."}
>
> **Viewport focus:** {tier — default all four, or one if --viewport was passed}.
>
> **Read:**
> - The spec at `.github/specs/{feature}/` if it exists.
> - The verification.md if it exists.
> - The actual implementation files for the surfaces this feature touches.
> - `.github/skills/responsive-design/SKILL.md` for the adaptive-design vocabulary.
> - `.github/themes/.adopted` and the corresponding `THEME.md` for theme consistency.
>
> Output the review in the structured format from your role file. Each axis gets its own section. Be specific — cite file paths and line numbers. Don't say "the flow is too long" — say "the signup flow at `/signup` requires 4 steps; 2 could be eliminated by inferring locale from IP and deferring the optional bio field."

## Phase 4 — If no responsive-strategy.md exists yet

If this is the project's first UI review and `.github/specs/_design/responsive-strategy.md` doesn't exist, the agent prompts the user to establish one collaboratively:

1. Briefly explain the four approaches (reference `.github/skills/responsive-design/SKILL.md`).
2. Recommend one based on the project's stack and content (e.g., "I'd suggest Approach 1 — adaptive components — given this is a Next.js component-heavy SPA").
3. Ask the user to confirm or pick a different approach.
4. Once confirmed, route to `@architect` for a quick gate-check: "We're proposing Approach X for this project. Any architectural reason to decline?"
5. If approved by architect, write `.github/specs/_design/responsive-strategy.md` documenting the choice.

This only happens once per project. Subsequent `/ui-review` invocations skip Phase 4.

## Phase 5 — Console summary

After the agent returns the review, print a structured summary:

```
═══ /ui-review {feature} — {YYYY-MM-DD HH:MM} ═══

  Axes reviewed: {flow | adaptive | theme — comma-separated}
  Viewport(s):   {all 4 | specific tier}
  Engagement:    {ON / OFF}

Flow friction:
  Current steps to {goal}: {N}
  Proposed steps:           {M}  ({-X} reduction)
  Top finding:              {one-line summary of the biggest reduction}

Adaptive design:
  Strategy in use: {Approach name from responsive-strategy.md, or "(not yet established)"}
  Tier issues found:
    mobile:   {N issues}
    tablet:   {N issues}
    desktop:  {N issues}
    wide:     {N issues}
  Top finding: {one-line}

Theme consistency:
  Adopted theme: {name, or "(none)"}
  Off-theme references found: {N}
  Top finding: {one-line}

{if --engagement was on:}
Engagement opportunities (review carefully — appropriate for some sites, not others):
  • {one-line summary 1}
  • {one-line summary 2}

Full review written inline above. To investigate any specific finding:
  @ui-ux-engineer drill into {topic} in {feature}
```

The full review (with file/line citations and concrete fixes) lives in the chat output above the summary. The summary is the at-a-glance.

## Phase 6 — Optional: write the review to a file

If the review is substantial (more than ~10 findings), the agent offers to write it to `.github/specs/{feature}/ui-review-{timestamp}.md` for the record. Default: don't write the file — the chat output is enough. The user explicitly asks if they want the file.

## Rules

- **Minimum-friction is the default lens.** Always evaluate friction. Don't ask to skip it.
- **Engagement is opt-in only.** Without `--engagement`, the agent must not produce engagement findings. With `--engagement`, the findings live in a SEPARATE section, never mixed with friction findings.
- **No dark patterns even in engagement mode.** Forced continuity, manipulative urgency, confirmshaming, hidden costs are out of scope. If the user explicitly asks for those by name, the agent declines and notes that those are outside its role.
- **Cite specific file paths and line numbers.** "The flow is too long" is not feedback; "the signup at `app/signup/page.tsx:42` requires entering a postal code that could be inferred from the GeoIP lookup at `lib/geo.ts:18`" is.
- **Respect user authority.** The agent recommends; the user decides. When the user says "I want it this way even though it adds a step," the agent accepts and moves on.
- **Don't write production code.** The review proposes; software-engineer implements.
- **Don't commit.** User reviews and decides what to act on.
