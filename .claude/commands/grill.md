---
description: Interrogate an idea before it becomes a spec — one grounded question at a time, each with a recommended answer, until every branch is resolved. Writes a decision record (grill.md) that /spec builds from. No code, no spec, just decisions and the reasons behind them.
---

The full prompt for this command is at `.github/prompts/grill.prompt.md`. Read it and follow it precisely.

Invocation patterns:

```
/grill {topic}              # full interrogation, runs until the branches are resolved
/grill {topic} --quick      # the highest-leverage 8-12 questions only
/grill {feature} --resume   # continue from an existing grill.md
/grill {feature} --spec     # interrogate, then run /spec straight afterwards
```

Reach for it when a wrong assumption costs more than the questions: before a schema, before an API contract freezes, before a wide refactor, or before writing a spec you'll live with. Reads `FEATURE_TREE.json` first so the questions name real nodes and real blast radius. Writes `.github/specs/{feature}/grill.md`; `/spec` picks it up from there. Interrogation pattern adapted from Matt Pocock's `grill-me` skill.
