---
description: Regenerate FEATURE_TREE.md AND FEATURE_TREE.json at the repo root — a comprehensive table of contents of every knowledge artifact (features, bugs, themes, latest reports, framework state) plus a machine-readable graph projection that the feature canvas (canvas.html) renders. One walk, two projections. Agent-driven; no Python script. Runs after /spec, /cover, /verify automatically; can also be invoked manually.
---

The full prompt for this command is at `.github/prompts/feature-tree.prompt.md`. Read it and follow it precisely.

`FEATURE_TREE.md` and `FEATURE_TREE.json` are knowledge artifacts — always written to the main tree path (resolved via `git rev-parse --git-common-dir`), not a worktree. Composed from a single walk so they never drift:

- **`FEATURE_TREE.md`** — the human/agent-readable index:
  - **Features** — type (spec/cover), short summary, verification status, file links
  - **Bugs** — grouped by status (open / in-progress / resolved-collapsed)
  - **Themes** — mood + adoption status
  - **Latest reports** — PROGRESS_REPORT.md and NEXT_STEPS.md freshness
  - **Framework state** — installed version + mode
- **`FEATURE_TREE.json`** — the graph the feature canvas renders: rooms, feature/endpoint/component/schema/integration nodes, verification checkpoints, the done/doing/next board, surfaces, and `dependsOn` edges. Conforms to `.github/schemas/feature-tree.schema.json`. Open `canvas.html` to view it. See `docs/feature-canvas.md`.

Each Markdown section only appears if it has content; no empty sections.

Invocation patterns:

```
/feature-tree                 # regenerate both files
/feature-tree --check         # dry-run: describe what would change without writing
/feature-tree --verbose       # regenerate, then print the Markdown to chat (JSON node count only)
```

The files are normally kept in sync automatically — `/spec`, `/cover`, and `/verify` each invoke this at the end. Run it manually after editing feature files by hand, or when something looks stale.
