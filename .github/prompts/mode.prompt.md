---
mode: agent
description: Show or set the framework's per-project mode. `review` (default) uses worktree isolation for code changes. `solo` writes code directly to the main tree — useful for solo projects where review overhead exceeds value. Knowledge artifacts always go to main tree regardless of mode.
---

# /mode

Show or set the current Agent0 mode for this project. Modes control whether Agent0 uses worktree isolation for **code changes**. Knowledge artifacts (specs, verifications, bug reports, themes, progress reports) always go to the main tree — see `.github/AGENTS.md` → "Knowledge artifacts and worktrees."

## The two modes

| Mode | Code-change behavior | Knowledge artifacts | When to use |
|------|---------------------|---------------------|-------------|
| `review` *(default)* | Worktree isolation. Subagent writes go to a separate worktree; you review the diff before merging into main. | Main tree | Multi-contributor projects, anywhere code review matters, anyone who wants a checkpoint before each change lands. |
| `solo` | No worktree isolation. Subagent writes go directly to the main tree alongside knowledge artifacts. | Main tree | Solo projects, single-contributor codebases where the worktree round-trip is friction without benefit. Rely on git/GitHub for rollback. |

The current mode is stored in `.github/.agent0-mode` — a single-line file containing `solo` or `review`. If the file is absent, the mode is `review`.

## Invocation patterns

| Pattern | What it does |
|---|---|
| `/mode` | Show the current mode + what it means + how to switch. |
| `/mode solo` | Switch to solo mode. Writes `solo` to `.github/.agent0-mode`. Confirms first. |
| `/mode review` | Switch to review mode (default). Deletes the marker file. |
| `/mode --help` | Print the modes table and the worktree-isolation explanation. |

## Phase 1 — Read current state

1. Check for `.github/.agent0-mode`. If present, read the value. Valid values: `solo` or `review` (anything else is invalid — print a warning and treat as `review`).
2. If the file is absent, current mode is `review` (the default).

## Phase 2 — Execute the action

### Show current mode (no args)

Print the state, including what's in effect right now:

```
═══ Agent0 mode — {current-mode} ═══

  Mode:         {solo | review}
  Marker file:  .github/.agent0-mode  ({present | absent})

What this mode means for this project:

  Worktree isolation for CODE changes: {ON in review / OFF in solo}
  Knowledge artifacts (specs, bugs, themes): always main tree

{If review:}
  Code-writing agents (software-engineer, test-engineer, debug-panel-engineer
  during /install-debug-panel) write to a worktree. You review the diff and
  merge into main when satisfied.

{If solo:}
  ⚠️  No worktree isolation. Code writes go directly to the main tree, no
      review checkpoint. Rely on git/GitHub for rollback — commit and push
      regularly so you have a recovery point.

To switch:
  /mode review    {if currently solo}
  /mode solo      {if currently review}
```

### Switch to solo

Two phases: check for outstanding worktree work first, then confirm the tradeoff, then flip the mode.

#### Phase 2a — Check for active worktrees with outstanding work

Knowledge artifacts have always been written to the main tree, so they're not affected by the mode switch. But **code changes** in any active worktree from prior review-mode work stay in that worktree until manually merged. Switching to solo mid-session can orphan those changes — future writes go to main, but the worktree's existing files don't move.

Run:

```bash
git worktree list
```

If there are worktrees beyond the main one, check each for uncommitted or unmerged work:

```bash
for wt in $(git worktree list --porcelain | awk '/^worktree / {print $2}'); do
  [[ "$wt" == "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)" ]] && continue
  echo "=== worktree: $wt ==="
  (cd "$wt" && git status --short && git log --oneline @{upstream}..HEAD 2>/dev/null)
done
```

If any worktree has uncommitted changes or unpushed commits, surface them to the user:

```
⚠ Found outstanding work in worktree(s) that solo mode will leave behind:

  .claude/worktrees/feature-auth/
    M src/lib/auth.ts        (uncommitted)
    + 2 commits ahead of main (not yet merged)

  .claude/worktrees/dashboard-fix/
    M src/components/Dashboard.tsx   (uncommitted)

If you switch to solo mode now, these changes remain in the worktree
directories but the orchestrator will write new code directly to the
main tree from now on. The orphaned worktree work won't automatically
merge — you'd need to commit + merge each manually.

Recommended order:
  1. Cancel this mode switch.
  2. For each worktree above: cd into it, review the changes, commit
     and merge into main (or discard if not wanted).
  3. After cleanup, re-run /mode solo.

  [c] cancel mode switch and clean up worktrees first
  [p] proceed anyway — accept the orphaned worktrees, switch to solo
```

If `git worktree list` shows only the main tree (or the project doesn't use worktrees), skip this phase entirely and go straight to 2b.

#### Phase 2b — Confirm the mode switch

After Phase 2a clears (no worktrees, or user accepted the orphaning):

> Solo mode disables worktree isolation. Code changes will go directly to the main tree — no review checkpoint between subagent output and your main branch. Knowledge artifacts (specs, verifications, bug reports, themes, reports) already go to main tree regardless of mode; switching only affects how code changes route.
>
> Commit and push regularly so GitHub is your rollback safety net.
>
> Continue? [y/N]

#### Phase 2c — Flip the mode

On confirmation, write `solo\n` to `.github/.agent0-mode` at the **main tree** path (resolve via `git rev-parse --path-format=absolute --git-common-dir | xargs dirname`). Create the file (and parent dir if needed) if it doesn't exist.

Note: this file is NOT in the framework manifest — it's per-project state. If the user doesn't want it committed, suggest they add it to `.gitignore`.

### Switch to review

1. Delete `.github/.agent0-mode` if it exists. `review` is the default, so no marker file is needed.
2. If the file doesn't exist, you're already in review mode — tell the user that and exit.

## Phase 3 — Console summary

After any state-changing action, print:

```
═══ Agent0 mode ═══

  Now in: {mode}
  Worktree isolation for code changes: {ON | OFF}
  Knowledge artifacts: always main tree (regardless of mode)

{If just switched to solo:}
  ⚠️  Reminder: solo mode skips the worktree review step. Your safety net
      is git — commit and push to GitHub regularly. To revert a change, use
      `git revert` or `git reset` against a known-good commit.

{If just switched to review:}
  Code-writing agents will now use worktree isolation. Knowledge artifacts
  continue to land in the main tree.
```

## Rules

- **Knowledge artifacts ALWAYS go to main tree.** Mode controls only the worktree behavior for CODE changes. The knowledge-artifacts rule from `.github/AGENTS.md` applies in both modes.
- **Per-project setting, not per-session.** Once set, persists until you switch back via `/mode review`. The orchestrator reads `.github/.agent0-mode` at the start of any session and follows the mode for the duration.
- **Solo mode warning is mandatory.** Always confirm the user understands the no-review-checkpoint implication before flipping the switch. Don't silently change behavior.
- **Don't commit** the mode change itself. Same rule as every other slash command.
- **Don't add `.agent0-mode` to the user's `.gitignore` automatically.** Suggest it; let them decide whether to commit the mode (so collaborators see it) or ignore it (so each person picks their own).
