---
description: Show or set the framework's per-project mode. `review` (default) uses worktree isolation for code changes; `solo` writes code directly to the main tree. Knowledge artifacts always go to main tree in both modes. Marker file at `.github/.agent0-mode`.
---

The full prompt for this command is at `.github/prompts/mode.prompt.md`. Read it and follow it precisely.

Two modes:

```
/mode                  # show current mode + explain
/mode solo             # disable worktree isolation; code writes go directly to main tree
/mode review           # (default) use worktree isolation for code changes
/mode --help           # modes table + worktree explanation
```

`solo` is for solo projects where the worktree round-trip is friction without benefit. Code changes land directly in the main tree; rely on git/GitHub for rollback.

`review` is the default and recommended for multi-contributor work. Knowledge artifacts (specs, verifications, bug reports, themes, progress reports) always go to the main tree regardless of mode.
