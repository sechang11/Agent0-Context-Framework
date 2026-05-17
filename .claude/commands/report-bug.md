---
description: Capture a structured bug report — current state, recent changes, active spec, environment — and write it to .github/bugs/. Suggests which agent to route to.
---

The full prompt for this command is at `.github/prompts/report-bug.prompt.md`. Read it and follow it precisely.

Bug reports land at `.github/bugs/{timestamp}-{slug}.md`. The command writes the report and stops — it does not auto-invoke the suggested agent. Routing is the user's call.

Pass a one-line description as args to skip the title question:

```
/report-bug login button does nothing on click
```
