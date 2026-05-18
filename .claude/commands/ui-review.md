---
description: Invoke @ui-ux-engineer to review a feature's UX — flow friction, adaptive design per viewport tier, theme consistency. Default minimum-friction; opt-in engagement analysis via --engagement (in a separate output section). Optional --viewport tier focus.
---

The full prompt for this command is at `.github/prompts/ui-review.prompt.md`. Read it and follow it precisely.

Three axes reviewed by default: **flow friction** (steps, fields, pages), **adaptive design** (per viewport tier), **theme consistency** (against the adopted theme).

Invocation patterns:

```
/ui-review                                            # interactive
/ui-review signup-flow                                # full review
/ui-review signup-flow --engagement                   # adds engagement section (separate)
/ui-review signup-flow --viewport mobile              # focus on one tier
/ui-review signup-flow --axis flow                    # drill into one axis: flow|adaptive|theme
```

**Engagement findings are opt-in and segregated** — they appear in a separate `## Engagement opportunities` section so you can take or leave them per site type. No dark patterns ever, even in engagement mode.

First time invoked on a project: the agent collaborates with `@architect` to establish a multi-resolution strategy at `.github/specs/_design/responsive-strategy.md`. Subsequent invocations read the existing strategy.
