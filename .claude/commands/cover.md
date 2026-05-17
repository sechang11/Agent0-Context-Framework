---
description: Generate a code-derived verification.md for an EXISTING feature that has no spec. Reads code at given surfaces, drafts checkpoints documenting current observable behavior. The brownfield on-ramp for projects that adopt Agent0 after they already have code.
---

The full prompt for this command is at `.github/prompts/cover.prompt.md`. Read it and follow it precisely.

The artifact lives at `.github/specs/{feature}/verification.md` — same path as spec-derived verification, distinguished by `source: code` in its frontmatter.

Invocation patterns:

```
/cover                                            # interactive — feature name + surfaces
/cover auth-flow                                  # asks for surfaces
/cover auth-flow --surfaces "/login,/api/auth/*"  # surfaces given explicitly
/cover --discover                                  # scan codebase, propose features, confirm before writing
```

**Feature, not endpoint.** A feature is a coherent logical concern (e.g. "login," "checkout"). A surface is where it manifests in code (a route, an endpoint, a file). One feature → one verification.md → many surfaces. Two features can share a surface; both list it in their `Surfaces` section. See the prompt's "What counts as a feature?" section before invoking.

**`--discover` mode** when you don't know the codebase well enough to enumerate features by hand: the agent scans, proposes a breakdown, and waits on your confirmation before any file is written.

**Important:** code-derived verifications document **current** behavior, not **desired** behavior. If today's code has a bug, the checkpoint captures the bug as "expected." Use `/spec` for new work where acceptance criteria are written first.

To upgrade a code-derived verification to a spec-derived one later: write `requirements.md` for the desired behavior, then run `/verify {feature} --bootstrap`.
