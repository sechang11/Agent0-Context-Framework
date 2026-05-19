---
description: Convene agents for a structured roundtable progress review with rubric-based ratings; writes PROGRESS_REPORT.md at the repo root and prints a substantial summary to the console. Supports --only and --exclude flags to filter agents (single-agent reports are valid).
---

The full prompt for this command is at `.github/prompts/report.prompt.md`. Read it and follow it precisely.

Invocation patterns:

```
/report                                       # full roundtable — every agent
/report --only architect                       # just one agent
/report --only architect,security-reviewer    # subset of agents
/report --exclude test-engineer                # all except one
/report --exclude test-engineer,verification-engineer   # all except several
```

`--only` and `--exclude` are mutually exclusive. Single-agent reports work — the scorecard becomes one row and the "Top priorities" come straight from that agent without cross-agent synthesis.

The report is always written to `PROGRESS_REPORT.md` at the repo root (sibling to `CLAUDE.md`). If the file already exists it is overwritten with the new timestamp. For a lighter "what should we do next" focus without ratings or gaps analysis, use `/nextsteps` instead.
