---
description: Regenerate FEATURE_TREE.md at the repo root — a comprehensive table of contents of every knowledge artifact in the project (features, bugs, themes, latest reports, framework state) with summaries and clickable file links. Agent-driven; no Python script. Runs after /spec, /cover, /verify automatically; can also be invoked manually.
---

The full prompt for this command is at `.github/prompts/feature-tree.prompt.md`. Read it and follow it precisely.

`FEATURE_TREE.md` is a knowledge artifact — always written to the main tree path (resolved via `git rev-parse --git-common-dir`), not a worktree. It's the single project index covering:

- **Features** — type (spec/cover), short summary, verification status, file links
- **Bugs** — grouped by status (open / in-progress / resolved-collapsed)
- **Themes** — mood + adoption status
- **Latest reports** — PROGRESS_REPORT.md and NEXT_STEPS.md freshness
- **Framework state** — installed version + mode

Each section only appears if it has content; no empty sections.

Invocation patterns:

```
/feature-tree                 # regenerate the file
/feature-tree --check         # dry-run: describe what would change without writing
/feature-tree --verbose       # regenerate, then print the full content to chat
```

The file is normally kept in sync automatically — `/spec`, `/cover`, and `/verify` each invoke this at the end. Run it manually after editing feature files by hand, or when something looks stale.
