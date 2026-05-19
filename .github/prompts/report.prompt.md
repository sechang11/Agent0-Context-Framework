---
mode: agent
description: Convene every agent for a structured roundtable progress review with rubric-based ratings; writes PROGRESS_REPORT.md at the repo root and prints a substantial summary to the console.
---

# /report

Convene agents from the roster, have each analyze the project from their specialty **using a structured rubric**, consolidate their input into a single timestamped `PROGRESS_REPORT.md` at the repo root, and print a substantial summary to the chat. The console summary is not optional — the user should be able to read it and understand the state of the project without opening the file.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/report` | Convene every agent on the roster (default — full roundtable). |
| `/report --only architect` | Convene only the named agent(s). Comma-separated list for multiple: `--only architect,security-reviewer`. |
| `/report --exclude test-engineer` | Convene every agent EXCEPT the named one(s). Comma-separated list: `--exclude test-engineer,verification-engineer`. |

`--only` and `--exclude` are mutually exclusive. If both are passed, ask the user which they meant.

Agent names match the `name` field in `.claude/agents/*.md` (e.g. `architect`, `software-engineer`, `code-reviewer`, `security-reviewer`, `test-engineer`, `verification-engineer`, `ui-ux-engineer`, `debug-panel-engineer`, plus any domain experts). If a name doesn't match, suggest the closest match and stop.

When the filter resolves to a single agent, the report is still produced — but the "Composite rating" field shows that single agent's rating, the scorecard is one row, and the "Top priorities" synthesis is straight from that agent's recommendations (no merging across agents because there's only one).

## The rubric

Every agent rates the project on **five sub-dimensions of their own choosing**, each scored 1–10. The composite rating is the rounded mean of the five sub-scores. This forces concrete, defensible numbers rather than vibes.

Score anchors:

- **10/10** — world-class. Nothing meaningful to improve in this dimension.
- **7/10** — solid. A careful engineer would call it "good but not exceptional."
- **5/10** — functional but visibly mediocre. A new contributor would notice problems.
- **3/10** — broken or harmful. Would fail a serious review.
- **1/10** — actively dangerous. This dimension is causing damage.

Agents pick the five dimensions that matter most for their domain. Suggested starting points (agents may use these or pick others, but each rating MUST have five sub-scores):

- **architect** — invariant clarity, component boundaries, cross-cutting concerns, design coherence, future-proofing
- **software-engineer** — pattern consistency, implementation completeness, error handling, test integration, code readability
- **code-reviewer** — clarity, modularity, anti-pattern absence, style consistency, maintainability
- **security-reviewer** — secret handling, input validation, auth & authz, dependency safety, data exposure
- **test-engineer** — coverage breadth, edge-case coverage, assertion quality, test maintainability, test speed
- **domain experts** — choose five dimensions appropriate to their specialty

## Phase 1 — Discover the roster (with optional filtering)

1. List `.claude/agents/*.md` and exclude any file starting with `_` (templates). For each remaining agent, read its frontmatter and capture the `name`. This is the full roster.

2. Apply filters:
   - If `--only` was passed, narrow the roster to only the named agents. Validate every name appears in the roster — suggest closest match and stop if not.
   - If `--exclude` was passed, remove the named agents from the roster. Same validation.
   - If both were passed, ask the user which they meant. Stop.

3. If the filtered roster is empty (e.g. `--exclude` left no one), stop with a clear message.

4. If the filtered roster has exactly one agent, set a flag `single_agent_mode=true`. The downstream phases adjust their output (single-row scorecard; "Top priorities" is straight from this one agent; no cross-agent synthesis).

## Phase 2 — Read prior state (if any)

If `PROGRESS_REPORT.md` exists at the repo root, read it before invoking agents. Capture:

- The previous `Generated` timestamp.
- Each agent's prior composite rating and sub-score breakdown.
- The prior "Top priorities" list — used to assess what actually got built since.

This is the baseline for the "Since last report" section and for the trend table in Phase 4. If the file doesn't exist, this is the first report — every agent says "First report — no baseline." in that section and the trend table is omitted.

## Phase 3 — Convene the agents

Invoke every agent on the roster **in parallel** (single message, multiple Task calls). Use the agent's `name` as the `subagent_type`. Give each one this brief verbatim (do not paraphrase; the structure is load-bearing):

> You are participating in a roundtable progress review of this project. Analyze the project from your specialty's perspective using the rubric below. Read the prior `PROGRESS_REPORT.md` at the repo root if it exists — you need it for the "Since last report" section.
>
> **Be substantive.** Every section must be at least 3–5 sentences or 4–6 bullets. Cite specific files and line ranges. No vague platitudes ("improve quality") — say what specifically, and where. Aim for the depth a senior reviewer would expect, not a one-line shrug.
>
> Output the following sections, with these exact headings, in Markdown. Do not add other sections. Do not write code. Do not modify any file.
>
> ## 1. Current state
> 3–5 sentence assessment from your specialty's perspective. What's working, what's the overall shape of the codebase or project from your lens. Cite at least 2 specific files or features that exemplify the state — good or bad.
>
> ## 2. Since last report
> What measurably improved (or regressed) since the previous report's date. Reference specific items from the prior report — were the prior "Top priorities" addressed? If no prior report exists, write exactly: "First report — no baseline."
>
> ## 3. Rating
>
> Break your rating into **five sub-dimensions of your choosing** appropriate to your domain. Score each 1–10 against the highest standard. Be willing to score low. The composite is the rounded mean of the five sub-scores.
>
> | Sub-dimension | Score | One-line justification (cite a file if applicable) |
> |---|---|---|
> | <your dimension 1> | X/10 | … |
> | <your dimension 2> | X/10 | … |
> | <your dimension 3> | X/10 | … |
> | <your dimension 4> | X/10 | … |
> | <your dimension 5> | X/10 | … |
> | **Composite** | **X.X/10** | (mean of the five sub-scores, rounded to one decimal) |
>
> ## 4. Gaps to highest standard
>
> For each sub-dimension scoring **below 9**, describe what would need to change to reach 10/10. Bullet list. Cite file paths. Be specific — name the function, the test, the missing rule. Do not write "needs more tests" — write "no tests cover the error path in `handlers/auth.go:142`."
>
> ## 5. Build next
>
> A prioritized list of concrete next-step recommendations. Each row in this table:
>
> | Priority | Action | Why it matters | Effort |
> |---|---|---|---|
> | P0 | <specific action, name files/components> | <one-sentence rationale tied to a sub-score above> | S / M / L |
> | P1 | … | … | … |
> | P2 | … | … | … |
>
> Priority levels:
> - **P0** — ship-blocker. Should be the next thing worked on. Tied to a sub-score ≤ 4.
> - **P1** — important. Should land within the next iteration. Tied to a sub-score 5–7.
> - **P2** — nice-to-have. Queue when capacity allows. Tied to a sub-score 8+.
>
> Effort:
> - **S** — under a day.
> - **M** — 1–3 days.
> - **L** — a week or more.
>
> Include 3–6 items total. At least one must be P0 unless every sub-score is ≥ 8.
>
> ## 6. Roster gap *(optional)*
>
> If you feel the project is missing a specialist or the current agent load is too heavy for the work in flight, name the proposed role and explain in 1–2 sentences why. The proposed name should match the shim style (kebab-case, e.g. `db-expert`, `ml-reviewer`). Omit this section entirely if there is no gap.

If an agent returns thin output (one-liners, missing sections, fewer than five sub-scores), **send one retry** asking them to follow the brief precisely. If they still won't, include their thin output but flag them in the console summary as `(thin report — review manually)`.

## Phase 4 — Consolidate into PROGRESS_REPORT.md

Aggregate the agents' replies into a single Markdown document and write it to `PROGRESS_REPORT.md` at the repo root, **overwriting any existing file**. Use this structure exactly:

```markdown
# Progress Report

**Generated:** {YYYY-MM-DD HH:MM} {timezone abbreviation, or UTC if unknown}
**Previous report:** {previous Generated timestamp, or "none — first report"}
**Composite rating:** **X.X / 10** across N agent(s)
**Filter:** {if --only or --exclude was used: list it; otherwise: "all agents (no filter)"}

## Composite scorecard

| Agent | Composite | Sub-scores (dimension: score) |
|---|---|---|
| @architect          | X.X/10 | invariant clarity: 7, component boundaries: 6, … |
| @software-engineer  | X.X/10 | pattern consistency: 8, … |
| @code-reviewer      | X.X/10 | … |
| @security-reviewer  | X.X/10 | … |
| @test-engineer      | X.X/10 | … |

## Top priorities for the next iteration

Synthesized across every agent's "Build next" lists. Duplicates merged (if two agents raised the same priority, attribute both). Ordered by priority then by impact. Show up to 7 rows.

| # | Priority | Action | Why it matters | Raised by | Effort |
|---|---|---|---|---|---|
| 1 | P0 | … | … | architect, test-engineer | M |
| 2 | P0 | … | … | security-reviewer | S |
| 3 | P1 | … | … | software-engineer | L |
| … | … | … | … | … | … |

## Trends since last report

(Omit this section if first report.)

| Agent | Last composite | Now | Δ | Notable sub-score moves |
|---|---|---|---|---|
| @architect | 6.4 | 7.0 | +0.6 | invariant clarity 5 → 8 |
| … | … | … | … | … |

## Roundtable

### @architect

Composite: **X.X/10**

#### 1. Current state
{agent's section 1 verbatim}

#### 2. Since last report
{agent's section 2 verbatim}

#### 3. Rating

{agent's section 3 table verbatim}

#### 4. Gaps to highest standard
{agent's section 4 verbatim}

#### 5. Build next
{agent's section 5 table verbatim}

#### 6. Roster gap
{agent's section 6 verbatim, or omit this subsection if the agent omitted it}

### @software-engineer
{same structure as above}

### @code-reviewer
{same structure}

### @security-reviewer
{same structure}

### @test-engineer
{same structure}

## Collective recommendations

### Hiring a new specialist

{If two or more agents flagged a Roster gap, summarize the shared case and propose one new agent: proposed `name` (kebab-case), a one-line description matching the shim style, and one sentence on why now. If only one agent flagged a gap, write "Single-voice suggestion from @<agent>: …" and include it without strongly endorsing. If no gaps were flagged, write: "No new specialist needed at this time."}

### Cross-cutting themes

{2–4 bullets identifying themes that came up in multiple agents' reports — e.g. "Three agents flagged the lack of integration tests as the top blocker." Optional but valuable when present.}
```

## Phase 5 — Print substantial summary to the chat

After writing the file, print this verbatim structure to the chat. **This is not optional** — the user should be able to read this and understand the state without opening the file.

```
═══ Progress Report — {YYYY-MM-DD HH:MM} ═══

Composite rating: X.X / 10 across N agent(s){if delta: ", Δ {+/-X.X} since last report}

Scorecard:
  @architect          X.X/10   (top dimension: <name> X/10  •  weakest: <name> X/10)
  @software-engineer  X.X/10   (top: …  •  weakest: …)
  @code-reviewer      X.X/10   (top: …  •  weakest: …)
  @security-reviewer  X.X/10   (top: …  •  weakest: …)
  @test-engineer      X.X/10   (top: …  •  weakest: …)

Top 3 priorities for the next iteration:
  1. [P0] {action} — {one-line rationale} (raised by: {agents}, effort: {S/M/L})
  2. [P0] {action} — …
  3. [P1] {action} — …

{If any roster gap was flagged by ≥2 agents:}
Roster gap flagged: {proposed role}. {one sentence why.}

Notable observations:
  • {3–5 bullets surfacing the most interesting findings — what surprised, what concerns, what's worth celebrating. Pull from cross-cutting themes.}

Written to: PROGRESS_REPORT.md
```

This summary must be in the chat output, **before** any "anything else?" closing. Do not collapse it. Do not replace it with "report written."

## Rules

- Use the current date/time for the timestamp. Format: `YYYY-MM-DD HH:MM`.
- The file name is always `PROGRESS_REPORT.md`. Always overwrite. Never create dated copies (no `PROGRESS_REPORT-2026-05-15.md`).
- Place the file at the repo root (sibling to `CLAUDE.md`).
- Do not commit or stage the file. The user reviews.
- Run agents in parallel where possible.
- Do not invent agent feedback. If an agent fails to respond after one retry, write "_No report returned._" under their heading and continue.
- Do not include the verbatim brief from Phase 3 in the output file — only the agents' replies.
- Each agent's response must be substantive. If an agent returns one-liners or skips sections, ask them to expand (one retry). If they still won't, include their output and flag `(thin report)` in the console summary's scorecard line.
- Sub-scores are mandatory. An agent who reports a single composite rating without the five sub-dimensions has failed the brief — retry once, then flag.
