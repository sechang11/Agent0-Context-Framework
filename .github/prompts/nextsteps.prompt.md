---
mode: agent
description: Convene agents for focused next-step recommendations only — no rating, no gaps analysis, no concerns. Writes NEXT_STEPS.md at the repo root with a prioritized cross-agent table. Lighter than /report. Supports --only and --exclude agent filters.
---

# /nextsteps

Ask agents the single question: **"What should we work on next?"** No ratings, no gaps analysis, no concerns inventory — just prioritized recommendations from each specialty's lens. Writes a `NEXT_STEPS.md` artifact at the repo root and prints a substantial summary.

This is the focused counterpart to `/report`. Use `/report` when you want a full health check (ratings, gaps, themes, hiring suggestions). Use `/nextsteps` when you already have a sense of where the project stands and you just want concrete action items to pull off the shelf.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/nextsteps` | Every agent on the roster contributes recommendations. |
| `/nextsteps --only architect` | Just one agent. Comma-separated for multiple: `--only architect,software-engineer`. |
| `/nextsteps --exclude test-engineer` | Every agent except the named one(s). Comma-separated for multiple. |
| `/nextsteps --horizon short` | Focus on the next 1–2 weeks of work. Default. |
| `/nextsteps --horizon medium` | Focus on the next 1–2 months of work. |
| `/nextsteps --horizon long` | Focus on the next quarter+ of work. |

`--only` and `--exclude` are mutually exclusive. Agent name validation works the same way as `/report` — if a name doesn't match the roster, suggest closest match and stop.

## Phase 1 — Discover and filter the roster

Same logic as `/report` Phase 1:

1. List `.claude/agents/*.md` (excluding files starting with `_`). Capture each `name`.
2. Apply `--only` or `--exclude` filter if passed.
3. If both are passed, ask the user which they meant. Stop.
4. If the filtered roster is empty, stop with a clear message.

## Phase 2 — Read context

Read these so the agents have project context to ground their recommendations in:

- `CLAUDE.md` (root)
- `.github/copilot-instructions.md`
- The latest `PROGRESS_REPORT.md` at the repo root if it exists (gives recent ratings + the previous "Top priorities" list, useful for "what got built since")
- Every `.github/specs/{feature}/verification.md` summary (just frontmatter — feature, status, last_verified, source). This tells the agents what's currently being verified and what's in flight.
- Every `.github/bugs/*.md` with status `open` or `in-progress`. These are likely candidates for next steps.

## Phase 3 — Convene the agents

Invoke every filtered agent **in parallel** (single message, multiple Task calls). Use the agent's `name` as the `subagent_type`. Give each one this brief verbatim:

> Recommend concrete next steps for this project from your specialty's perspective. **Be specific.** Don't say "improve security" — say "rotate the JWT signing key at `lib/auth/session.ts:14` to use the new rotation schedule we agreed on."
>
> Read the context the orchestrator has gathered: `CLAUDE.md`, the latest `PROGRESS_REPORT.md` (if exists), the verification.md frontmatter for every feature, the open bug reports. These tell you the current state, what's been worked on, and what's open.
>
> Output **exactly** this format, with these exact headings, in Markdown. No other sections. No code. No rating or gaps analysis — that's `/report`'s job.
>
> ## Recommended next steps (horizon: {short|medium|long})
>
> | Priority | Action | Why it matters | Effort | Tied to |
> |---|---|---|---|---|
> | P0 | <specific action with file paths or feature names> | <one sentence — why now, not later> | S/M/L | <verification CP, bug ID, spec, or "none"> |
> | P1 | … | … | … | … |
> | P2 | … | … | … | … |
>
> Priority levels:
> - **P0** — ship-blocker or critical for the project's health. Should be next.
> - **P1** — important; should land within this horizon.
> - **P2** — worth doing if capacity allows.
>
> Effort:
> - **S** — under a day.
> - **M** — 1–3 days.
> - **L** — a week or more.
>
> Horizon meanings:
> - **short** — next 1–2 weeks.
> - **medium** — next 1–2 months.
> - **long** — next quarter+. Capacity for planning rather than execution.
>
> Include 3–6 items total. Each row's "Tied to" column references the concrete artifact this recommendation addresses (a checkpoint id like `CP-3` in `auth-flow/verification.md`, a bug id like `2026-05-15-1432-login-...`, a spec like `auth-flow`, or "none" if it's not tied to existing artifacts).
>
> ## Why these and not others (optional)
>
> If you considered and rejected other items, name 1–3 with one-sentence reasons. Helps the user understand your framing. Omit this section if you have no rejections worth surfacing.

## Phase 4 — Consolidate

Aggregate the agents' replies into `NEXT_STEPS.md` at the repo root (write to the MAIN TREE — this is a knowledge artifact). Always overwrite. Structure:

```markdown
# Next Steps

**Generated:** {YYYY-MM-DD HH:MM} {timezone}
**Horizon:** {short / medium / long}
**Agents consulted:** N — {comma-separated names}
**Filter:** {--only X, --exclude Y, or "all agents"}

## Top priorities — cross-agent synthesis

The orchestrator merges every agent's recommendations into a single ranked table. Same priority rules apply (P0 first, then P1, then P2). When two agents recommend the same action, merge into one row and list both in "Raised by." Up to 10 rows.

| # | Priority | Action | Why it matters | Raised by | Effort | Tied to |
|---|---|---|---|---|---|---|
| 1 | P0 | … | … | architect, security-reviewer | M | CP-3 in auth-flow |
| 2 | P0 | … | … | software-engineer | S | bug 2026-05-15-... |
| 3 | P1 | … | … | architect | L | spec checkout |
| … | … | … | … | … | … | … |

## Per-agent recommendations

### @architect
{their verbatim section 1 — the recommendations table}
{if section 2 was provided — "Why these and not others"}

### @software-engineer
{same structure}

### {next agent}
{same structure}

## Themes

{1–3 bullets summarizing what came up across multiple agents. Surface coincidences ("three agents independently called out test coverage on the auth flow as P0") and disagreements ("architect wants to refactor X first, but software-engineer thinks Y first is faster"). Omit if nothing meaningful crosses agents.}
```

## Phase 5 — Console summary

After writing the file, print this verbatim. **Not optional** — same rule as `/report`.

```
═══ Next Steps — {YYYY-MM-DD HH:MM} ═══

Horizon: {short | medium | long}
Agents:  {N} ({names — comma-separated})

Top 5 priorities:
  1. [P0] {action} — {one-line rationale} (raised by: {agents}, effort: {S/M/L})
  2. [P0] {action} — …
  3. [P1] {action} — …
  4. [P1] {action} — …
  5. [P2] {action} — …

Themes (cross-agent):
  • {1–3 bullets, or "nothing crossed multiple agents" if so}

Written to: NEXT_STEPS.md
```

## Rules

- **No ratings, no gaps analysis, no concerns.** That's `/report`'s job. `/nextsteps` is forward-looking only.
- **Single-agent invocations are valid.** `/nextsteps --only architect` produces a NEXT_STEPS.md with one section in "Per-agent recommendations" and a "Top priorities" table that's straight from that agent (no synthesis). The format stays the same.
- **NEXT_STEPS.md is a knowledge artifact** — always written to the main tree (per `.github/AGENTS.md` → "Knowledge artifacts and worktrees"), even when invoked from a worktree. Always overwrites.
- **Don't commit.** Same rule as every other slash command.
- **Don't invent ties.** The "Tied to" column should reference artifacts that actually exist. If a recommendation isn't tied to anything concrete, say "none" — don't fabricate a checkpoint id.
- **Each agent's response must be substantive.** If an agent returns thin output (no specific files, vague rationale), give one retry. If they still won't be specific, include their output and flag `(thin)` next to their name in the summary.
