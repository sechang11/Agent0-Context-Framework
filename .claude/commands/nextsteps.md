---
description: Convene agents for focused next-step recommendations only — no ratings, no gaps analysis, no concerns. Writes NEXT_STEPS.md at the repo root with a prioritized cross-agent table. Lighter than /report. Supports --only/--exclude agent filters and --horizon short|medium|long.
---

The full prompt for this command is at `.github/prompts/nextsteps.prompt.md`. Read it and follow it precisely.

Use `/nextsteps` when you already have a sense of where the project stands and you just want concrete action items. Use `/report` when you want a full health check (ratings, gaps, themes, hiring suggestions).

Invocation patterns:

```
/nextsteps                                # every agent, short horizon
/nextsteps --only architect               # just one agent
/nextsteps --exclude test-engineer        # all except one
/nextsteps --horizon medium               # focus on 1-2 months out
/nextsteps --horizon long                 # focus on next quarter+
```

`--only` and `--exclude` are mutually exclusive. Single-agent invocations work — the file has one "Per-agent" section and the "Top priorities" come straight from that agent.

The artifact is always written to `NEXT_STEPS.md` at the repo root (knowledge artifact — goes to the main tree regardless of worktree). Always overwrites.
