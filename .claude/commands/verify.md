---
description: Bootstrap or run a verification.md for a spec — turns acceptance criteria into runnable checkpoints, executes automated ones, walks the user through manual ones, records pass/fail.
---

The full prompt for this command is at `.github/prompts/verify.prompt.md`. Read it and follow it precisely.

The artifact lives at `.github/specs/{feature}/verification.md`. One per spec. Bootstrapped from `requirements.md` + `design.md`; updated in place on each run.

Invocation patterns:

```
/verify                              # list specs and their verification status
/verify auth-redesign                # bootstrap if missing, run if present
/verify auth-redesign --bootstrap    # force regenerate verification.md
/verify auth-redesign --dry-run      # walk checkpoints without executing
```

On failure, the command suggests `/report-bug` to file a structured report — closes the loop with Stage 1.
