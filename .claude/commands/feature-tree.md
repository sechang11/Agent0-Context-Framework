---
description: Regenerate FEATURE_TREE.md at the repo root — a glanceable table of contents of every feature in the project with type (spec/cover), short summary, verification status, and clickable file links. Agent-driven; no Python script. Runs after /spec, /cover, /verify automatically; can also be invoked manually.
---

The full prompt for this command is at `.github/prompts/feature-tree.prompt.md`. Read it and follow it precisely.

`FEATURE_TREE.md` is a knowledge artifact — always written to the main tree path (resolved via `git rev-parse --git-common-dir`), not a worktree. It's a table of contents, not a detailed mirror — each feature gets a few lines (type, 1-2 sentence summary, verification status, file links).

Invocation patterns:

```
/feature-tree                 # regenerate the file
/feature-tree --check         # dry-run: describe what would change without writing
/feature-tree --verbose       # regenerate, then print the full content to chat
```

The file is normally kept in sync automatically — `/spec`, `/cover`, and `/verify` each invoke this at the end. Run it manually after editing feature files by hand, or when something looks stale.
