---
mode: agent
description: Convene every agent for a roundtable progress review; writes a timestamped PROGRESS_REPORT.md at the repo root.
---

# /report

Convene every agent on the roster, have each analyze the project from their specialty, and consolidate their input into a single timestamped `PROGRESS_REPORT.md` at the repo root.

## Phase 1 — Discover the roster

List `.claude/agents/*.md` and exclude any file starting with `_` (templates). For each remaining agent, read its frontmatter and capture the `name`. That's who you'll invoke.

## Phase 2 — Read prior state (if any)

If `PROGRESS_REPORT.md` exists at the repo root, read it before invoking agents. You'll need:

- The previous `Generated` timestamp.
- Each agent's prior rating and "Build next" suggestions.

This is the baseline for the "Since last report" section. If the file does not exist, this is the first report — agents should say "First report — no baseline." in that section.

## Phase 3 — Convene the agents

Invoke every agent on the roster **in parallel** (single message, multiple Task calls). Use the agent's `name` as the `subagent_type`. Give each one this brief, verbatim:

> You are participating in a roundtable progress review of this project. Analyze the project from your specialty's perspective and report back. Read the prior `PROGRESS_REPORT.md` at the repo root if it exists — you need it for the "Since last report" section.
>
> Output **exactly** the following sections, with these headings, in Markdown. Do not add other sections. Do not write code. Do not modify any file.
>
> 1. **Current state** — 2–3 sentence assessment of the project from your specialty.
> 2. **Since last report** — what improved since the previous `PROGRESS_REPORT.md`. If no prior report exists, write "First report — no baseline."
> 3. **Rating: X / 10** — your honest score against the highest standard for your domain. Be willing to score low. One sentence justifying the number.
> 4. **Gaps to highest standard** — bulleted list of what would need to change to reach 10/10. Be specific. Cite file paths.
> 5. **Build next** — bulleted list of concrete suggestions for what to work on next, ordered by impact.
> 6. **Roster gap** *(optional)* — if you feel the project is missing a specialist or that the current agent load is too heavy for the work in flight, name the proposed role and one sentence on why. Omit this section entirely if there is no gap.

## Phase 4 — Consolidate into PROGRESS_REPORT.md

Aggregate the agents' replies into a single Markdown document and write it to `PROGRESS_REPORT.md` at the repo root, **overwriting any existing file**. Use this structure exactly:

```markdown
# Progress Report

**Generated:** {YYYY-MM-DD HH:MM} {timezone abbreviation, or UTC if unknown}
**Previous report:** {previous Generated timestamp, or "none — first report"}

## Roundtable

### @{agent-name}

{agent's full reply, sections 1–5 verbatim, plus section 6 if they included it}

### @{next-agent-name}

...

## Collective recommendations

### Hiring a new specialist

{If two or more agents flagged a Roster gap, summarize the shared case and propose one new agent: proposed `name`, a one-line description matching the shim style, and one sentence on why now. If only one agent flagged a gap, note it as a single-voice suggestion. If no gaps were flagged, write: "No new specialist needed at this time."}

### Top priorities for the next iteration

{Synthesize the highest-impact items across all agents' "Build next" lists into 3–5 bullets, ordered by impact. Merge duplicates. Attribute each bullet with the agent(s) who raised it in parentheses, e.g. "(architect, test-engineer)".}

### Composite rating

{Mean of all agent ratings, displayed as "X.X / 10 across N agent(s)". Round to one decimal.}
```

## Phase 5 — Finalize

After writing the file, print a one-line summary to the user:

> `PROGRESS_REPORT.md` updated at {timestamp}. Composite rating: X.X/10 across N agent(s). {If a roster gap was flagged by ≥2 agents, append: "Roster gap flagged: <proposed role>."}

## Rules

- Use the current date/time for the timestamp. Format: `YYYY-MM-DD HH:MM`.
- The file name is always `PROGRESS_REPORT.md`. Always overwrite. Never create dated copies (no `PROGRESS_REPORT-2026-05-15.md`).
- Place the file at the repo root (sibling to `CLAUDE.md`).
- Do not commit or stage the file. The user reviews.
- Run agents in parallel where possible.
- Do not invent agent feedback. If an agent fails to respond, write "_No report returned._" under their heading and continue. Do not retry more than once.
- Do not include the verbatim brief from Phase 3 in the output — only the agents' replies.
