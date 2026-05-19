---
mode: agent
description: Bootstrap or run a verification.md for a spec — turns acceptance criteria into runnable checkpoints, executes the automated ones, walks the user through manual ones, records pass/fail.
---

# /verify

Verify that a spec's acceptance criteria actually hold. Either **bootstraps** a `verification.md` from the spec (when none exists) or **runs** the existing verification (when one does), depending on file state.

This is Stage 2 of the spec-bound debug surface. It's the artifact that Stage 3 (the web debug panel) will later surface as live, route-keyed content.

## Invocation patterns

| Pattern | What it does |
|---|---|
| `/verify` | Lists every spec in `.github/specs/` with its verification status. The user picks one. |
| `/verify {feature}` | If `.github/specs/{feature}/verification.md` exists → **runs** it. If not → **bootstraps** it. |
| `/verify {feature} --bootstrap` | Forces bootstrap mode. Overwrites any existing `verification.md`. Use after a major spec change. |
| `/verify {feature} --dry-run` | Runs through the checkpoints without executing automated commands or asking for manual results. Useful for sanity-checking the verification.md itself. |

`{feature}` is the kebab-case directory name under `.github/specs/`.

## Phase 1 — Resolve the target

1. If no `{feature}` was provided, list every directory in `.github/specs/` (excluding `_template/` and `README.md`). For each, show:
   - Feature name
   - Does `verification.md` exist? (yes/no)
   - If yes, what's the `last_verified` timestamp and `status` from its frontmatter?
   - One-line summary from `requirements.md` (first paragraph)

   Then ask the user which feature to verify, or stop and let them re-invoke.

2. If `{feature}` was provided, confirm `.github/specs/{feature}/` exists. If not, list the closest matches and stop.

## Phase 2 — Decide bootstrap vs. run

- **Bootstrap mode** when: `verification.md` doesn't exist OR `--bootstrap` was passed.
- **Run mode** when: `verification.md` exists AND `--bootstrap` was not passed.
- **Dry-run mode**: like run mode, but skip execution.

## Phase 3a — Bootstrap mode

Route to the **verification-engineer** agent via the Task tool with this brief:

> Bootstrap the verification.md for the spec at `.github/specs/{feature}/`. Read `requirements.md`, `design.md`, and `tasks.md`. Translate the acceptance criteria into checkpoints following the structure in your role definition (`.github/agents/verification-engineer.agent.md`). Pick stack-appropriate automation tooling — check `package.json`, `pyproject.toml`, etc. for what's already in use. Don't add new dependencies. Write the file to `.github/specs/{feature}/verification.md`. Return a summary of what was written: number of checkpoints, automation coverage (X of Y automated), and any spec gaps you flagged.

When the agent returns:

1. Read the new `verification.md` to confirm it exists.
2. Print a console summary (see Phase 5).

## Phase 3b — Run mode

**The subagent runs the automated portion; the orchestrator (this session) walks the user through manual portions afterward.** This split exists because subagents can't prompt the user interactively (see AGENTS.md → Hard rules).

### Phase 3b.1 — Subagent: run automated portion only

Route to the **verification-engineer** agent via the Task tool with this brief:

> Run the **automated portion only** of the verification for the spec at `.github/specs/{feature}/`. Read its `verification.md` and process every checkpoint:
>
> - **automated** checkpoints: execute the `Automation:` command via Bash. Record the exit code. Pass if exit 0, fail otherwise. Capture the last ~15 lines of stdout/stderr for the report.
>   - If the command can't run because a service or tool isn't available (e.g., Postgres isn't running, Playwright browsers aren't installed, Docker daemon is down), record `pending: needs <prereq>` rather than `fail`. Example: `pending: needs postgres`. Use this whenever the environment is the problem, not the feature.
> - **manual** checkpoints: do NOT attempt to walk the user through them. Record `pending: needs walk-through`.
> - **mixed** checkpoints: run the automated portion first. If it passes, record `pending: needs walk-through (manual portion)`. If it fails, record the failure on the automated portion and skip the manual portion (recording `pending: needs walk-through after automated fix`).
>
> Update each checkpoint's `Last result` field inline with the result and current timestamp.
>
> After every checkpoint has been processed, update the frontmatter:
>
> - `last_verified` to the current timestamp.
> - `status`: `passing` (all pass), `failing` (≥1 fail, no pendings), `pending` (≥1 pending, no fails), `partial` (mix of pass + fail + pending).
>
> Return a structured summary: total CPs, count by result state, captured stderr from any fails, and a list of pendings with their reason. Do NOT prompt the user for anything — your output goes back to the orchestrator, which handles walk-throughs in the main session.

### Phase 3b.2 — Orchestrator: walk the user through pendings

When the subagent returns, the orchestrator (this session) walks the user through every `pending: needs walk-through` checkpoint, one at a time:

For each pending walk-through CP:

1. Print the CP's identifier, description, steps, pass criteria, fail criteria.
2. Ask the user: `pass / fail / skip — with a one-line note`. Use `AskUserQuestion` if available, otherwise a plain text prompt.
3. Update the CP's `Last result` in `verification.md` directly (orchestrator can edit files).

Skip `pending: needs <prereq>` CPs — those need the user to install the prerequisite first, not a walk-through. Surface them in the final summary with a "to unblock: install/start X" hint.

After all walk-throughs are complete, re-compute the frontmatter `status` based on the final result mix and update it.

### Phase 3b.3 — Final summary

Print the console summary (see Phase 5). If any checkpoint failed, suggest the dispatch line: `@software-engineer investigate .github/specs/{feature}/verification.md` (or `@verification-engineer` if the issue is the verification itself, not the feature).

## Phase 3c — Dry-run mode

Like run mode, but the brief to verification-engineer changes:

> Walk through the verification.md for `.github/specs/{feature}/` **without executing** automated commands or asking the user about manual ones. For each checkpoint, sanity-check that:
>
> - The Steps section is concrete and complete.
> - The Pass/Fail criteria are observable from outside the feature.
> - The Automation command (if any) references something that exists.
> - The Surface is one of the surfaces listed in the file's Surfaces section.
>
> Return a list of any structural issues found. Do not modify the file.

Use this when you want to validate the verification.md itself without running it — e.g. after editing it by hand.

## Phase 4 — (optional) Bug filing on failure

If run mode produced any failing checkpoints, ask the user:

> {N} checkpoint(s) failed. File a bug report?

If yes, invoke the `/report-bug` flow with a pre-filled title like `Verification failed for {feature}: CP-{N} ({checkpoint description})` and the failing checkpoint's captured stderr as the "what actually happened" answer. This closes the loop between Stage 1 (bug filing) and Stage 2 (verification).

If no, just leave the updated verification.md as the record.

## Phase 5 — Print console summary

After every mode, print this structure to chat:

**Bootstrap mode:**

```
═══ Verification bootstrapped — {feature} ═══

  Checkpoints: {N} total ({A} automated, {M} manual, {X} mixed)
  Status:      draft (run /verify {feature} to execute)

{If any spec gaps were flagged:}
  Spec gaps the agent flagged:
    • {gap 1}
    • {gap 2}
    These should be clarified in requirements.md before verification is meaningful.
```

**File:** [.github/specs/{feature}/verification.md](.github/specs/{feature}/verification.md)

**Run mode:**

Print the structural summary in a code block, then break the file references out as Markdown links below so the user can click to preview (see AGENTS.md → "Link MD files in chat output"):

```
═══ Verification run — {feature} — {YYYY-MM-DD HH:MM} ═══

  Status:  passing | failing | pending | partial
  Results: {P} pass, {F} fail, {S} skip, {W} pending walk-through, {B} pending blocked ({N} total)

  Failures:
    • CP-{N}: {description} — {one-line reason}
    • CP-{N}: …

  Pending — needs prerequisite (couldn't run, not a feature failure):
    • CP-{N}: {description} — needs {prereq}
        → to unblock: {one-line install/start command}

  Pending — needs walk-through:
    • CP-{N}: {description}
    ({If walk-throughs were just completed inline, omit this section.})

  Skipped:
    • CP-{N}: {description} ({user's reason})
```

**Updated:** [.github/specs/{feature}/verification.md](.github/specs/{feature}/verification.md)  *(last_verified field + per-CP results)*

{If any failures, append a dispatch suggestion as plain Markdown so the file reference inside it stays clickable:}

To investigate failures, run:

> `@software-engineer investigate` [.github/specs/{feature}/verification.md](.github/specs/{feature}/verification.md)

Or file a bug report: `/report-bug Verification failed for {feature}: CP-{N}`

**Dry-run mode:**

```
═══ Verification dry-run — {feature} ═══

  Structural issues found: {N}

    • {issue 1, with CP reference}
    • {issue 2, …}

  No changes written. Fix issues by hand or re-bootstrap with /verify {feature} --bootstrap.
```

**File examined:** [.github/specs/{feature}/verification.md](.github/specs/{feature}/verification.md)

## Rules

- **Don't write or modify production code.** Verification is read-mostly. The verification-engineer creates verification.md; running just updates the result fields inside it.
- **Don't install new dependencies.** If a checkpoint requires a tool that's not installed, mark it `manual` instead.
- **Don't commit or stage anything.** The user reviews and commits.
- **Run mode is idempotent.** Re-running with no code changes should produce the same results.
- **Always update the timestamp** in `last_verified` after a run — even if every checkpoint was skipped. The act of running is itself a checkpoint.
- **Failing checkpoints don't auto-route to agents.** Print the dispatch suggestion; let the user decide. (Same pattern as `/report-bug`.)
- **Dry-run never modifies the file.** Period. It's a linter.
