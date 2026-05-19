---
mode: agent
description: Capture a structured bug report — current state, recent changes, active spec, environment — and write it to .github/bugs/. Suggests which agent to route to. Stack-agnostic.
---

# /report-bug

Capture a structured bug report into `.github/bugs/{YYYY-MM-DD-HHMM}-{slug}.md`, bundling the user's description with auto-captured project state, and suggest which agent to investigate. This is the structured hand-back channel — it replaces the lossy loop of "paste console, screenshot, describe what I clicked."

This command **writes a report and stops**. It does not auto-invoke any agent or spawn a new session. The user reviews the report and chooses how to dispatch — consistent with `/spec`, `/report`, and every other skill in this framework.

## Phase 1 — Get the user's report

The user invokes the command either as bare `/report-bug` or with a one-line description: `/report-bug login button does nothing on click`.

If a one-line description was provided, proceed to Phase 2 and use it as the bug title. Otherwise, ask the user one question to get the title:

> What's the bug, in one line?

After the title, ask **three short follow-up questions in a single batch** (use `AskUserQuestion` if available, otherwise one message with three numbered questions):

1. **What were you trying to do?** — the user action / goal.
2. **What did you expect to happen?** — the desired behavior.
3. **What actually happened?** — the observed behavior, including any error message or symptom.

Optionally also ask:

4. **Where?** — route, URL, command, screen, or file path if obvious. Leave blank if the user doesn't know.

Keep questions terse. If the user already provided answers in the original message, skip the corresponding questions.

## Phase 2 — Auto-capture project state

In parallel, gather whatever the runtime can see without asking the user:

### Git state (only if `.git` exists)

- `git status --short` — uncommitted changes
- `git diff --stat HEAD` — what's changed since last commit (file list + line counts)
- `git log -5 --oneline` — last five commits for recency context
- Current branch name

Cap each to ~25 lines. If the repo is large or `git` is unavailable, skip the section.

### Active spec (if any)

Look in `.github/specs/` for the most recently modified spec directory. If one was modified within the last 7 days, capture:

- The feature name (directory name)
- The first paragraph of `requirements.md` (the spec summary)
- A link reference: `.github/specs/<feature>/`

This is the agent's best guess at "what was the user working on." If multiple specs are recent, pick the most recently modified.

### Environment basics

Try to read, but skip silently if unavailable:

- OS: from `uname` or `$OS` env var
- Node version: `node --version` (only if `package.json` exists)
- Python version: `python --version` (only if `pyproject.toml` or `requirements.txt` exists)
- Go version: `go version` (only if `go.mod` exists)
- Framework: best guess from package manifests (Next.js, Vite, FastAPI, etc.) — one line, no deep analysis

### Recently changed source files

From `git diff --name-only HEAD~5..HEAD 2>/dev/null` (last 5 commits) plus uncommitted files from `git status`. Limit to the top 10 most-likely-relevant. Skip if no git.

### Active framework version

Read `.github/.framework-version` if present.

## Phase 3 — Suggest a routing agent

Based on what the bug touches, pick the most appropriate agent to investigate. Heuristic ladder — first match wins:

| Bug touches | Suggested agent |
|---|---|
| Authentication, authorization, sessions, tokens, secrets handling, PII | `@security-reviewer` (then `@software-engineer` after) |
| Architectural seams — cross-component, schema, new external integration | `@architect` (then `@software-engineer` after) |
| A spec'd feature with a `verification.md` (future) | `@verification-engineer` |
| Tests, missing coverage, flaky tests | `@test-engineer` |
| Anything else — implementation bug, UI bug, plain logic error | `@software-engineer` |

If multiple agents are plausible, list the top two with a one-line rationale per agent. The user picks. Do not invoke any agent.

If the project has domain-expert agents (any non-template agent not in the standard roster), and the bug touches their domain (e.g. database expert + the bug mentions a query), surface them as the first choice.

## Phase 4 — Write the report

### Filename

`.github/bugs/{YYYY-MM-DD-HHMM}-{kebab-slug}.md`

Where:
- `YYYY-MM-DD-HHMM` is the current local timestamp.
- `kebab-slug` is the bug title, lowercased, with non-alphanumeric characters replaced by `-`, collapsed runs, max 50 chars. Example title "Login button does nothing on click" → slug `login-button-does-nothing-on-click`.

Create the `.github/bugs/` directory if it doesn't exist.

### Structure

Write the report with this structure exactly:

```markdown
# Bug: {user's one-line description}

**Filed:** {YYYY-MM-DD HH:MM} {timezone or UTC}
**Bug ID:** {YYYY-MM-DD-HHMM-slug}
**Status:** open
**Suggested investigator:** @{primary-agent}{if secondary, ", then @secondary-agent"}

---

## Summary

{1–2 sentence consolidated summary of the user's report, written by you. Not verbatim from the user — a clean rephrase.}

## What the user was trying to do

{from user answer 1}

## What they expected

{from user answer 2}

## What actually happened

{from user answer 3, including any error messages or symptoms}

## Where it happened

- **Route / URL / command:** {from user answer 4, or "not specified"}
- **Files most likely involved:** {best guess from recently changed files + the user's description; bullet list, or "unknown — investigation needed"}
- **Active spec:** {`.github/specs/{feature}/` if applicable, otherwise "none"}

## Captured state

### Recent file changes

{git diff --stat output, capped at 25 lines. Or "Not a git repo / no recent changes."}

### Last 5 commits

{git log -5 --oneline output. Or omit if not a git repo.}

### Environment

- OS: {os}
- {Node/Python/Go version}: {version} {(detected stack: Next.js / FastAPI / etc.)}
- Framework version: {value of .github/.framework-version, or "not adopted"}

## Routing rationale

{1–2 sentences explaining why the suggested investigator was picked. Reference the heuristic from the bug's surface area.}

If the primary investigator's lens turns up nothing, escalate to: @{fallback-agent}.

---

## Investigation notes

_To be filled in by the investigating agent._

## Resolution

_To be filled in when fixed. Link the commit or PR that closes this bug._
```

### Things to never put in the report

- The contents of `.env`, `.env.*`, or any secrets file. If the user pasted a secret in their description, redact it as `[REDACTED]` before writing.
- API tokens, private keys, passwords. Same rule.
- Personal data of end users (real emails, real names). If the user mentions a real account, redact.

## Phase 5 — Print summary to chat

After writing the file, print this to chat:

```
═══ Bug filed — {bug-id} ═══

Title:      {user's one-line description}
Where:      {route/file, or "not specified"}
Suggested:  @{primary-agent}{if secondary, " (or @secondary-agent if that lens turns up nothing)"}

Captured:
  • {N} files changed in working tree
  • Active spec: {feature-name, or "none"}
  • Environment: {one-line — OS + primary runtime}

```

**Bug report:** [.github/bugs/{bug-id}.md](.github/bugs/{bug-id}.md)

To investigate, run:

> `@{primary-agent} investigate` [.github/bugs/{bug-id}.md](.github/bugs/{bug-id}.md)

Keep it scannable. The user should be able to either dispatch the agent immediately or click the link to preview the report, with one glance at this summary. The file link MUST be broken out as a Markdown link below the code block — bare paths inside the code block don't render as clickable (see AGENTS.md → "Link MD files in chat output").

## Rules

- **Write the report and stop.** Do not invoke the suggested agent. Do not spawn a sub-session. The user is in control of routing.
- **Do not commit or stage the file.** The user reviews and decides whether to commit bug reports to git.
- **Redact secrets aggressively.** Better to over-redact than to leak.
- **Capture, don't speculate.** "Files most likely involved" is a guess based on recent changes — say "best guess" rather than asserting. "What actually happened" is the user's words, not your diagnosis.
- **Idempotent on re-run within the same minute.** If the user runs `/report-bug` twice in the same minute, the second one gets a suffix: `-2`, `-3` etc. Never overwrite an existing bug file.
- **One file per bug.** No appending to existing bug files from this command — the investigating agent updates the "Investigation notes" and "Resolution" sections separately.
- **Skip auto-capture sections that fail.** If `git` isn't available, omit the git sections rather than erroring. The report should always succeed even on a fresh project with no history.
