---
description: Generate a code-derived verification.md for an EXISTING feature that has no spec. Reads code at given surfaces, drafts checkpoints documenting current observable behavior. The brownfield on-ramp for projects that adopt Agent0 after they already have code.
---

The full prompt for this command is at `.github/prompts/cover.prompt.md`. Read it and follow it precisely.

The artifact lives at `.github/specs/{feature}/verification.md` — same path as spec-derived verification, distinguished by `source: code` in its frontmatter.

Invocation patterns:

```
/cover                                            # interactive
/cover auth-flow                                  # asks for surfaces
/cover auth-flow --surfaces "/login,/api/auth/*"  # surfaces given explicitly
```

**Important:** code-derived verifications document **current** behavior, not **desired** behavior. If today's code has a bug, the checkpoint captures the bug as "expected." Use `/spec` for new work where acceptance criteria are written first.

To upgrade a code-derived verification to a spec-derived one later: write `requirements.md` for the desired behavior, then run `/verify {feature} --bootstrap`.
