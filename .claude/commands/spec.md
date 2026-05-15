---
description: Generate a spec for non-trivial work — produces requirements.md, design.md, tasks.md under .github/specs/{feature-name}/.
---

The full prompt for this command is at `.github/prompts/spec.prompt.md`. Read it and follow it precisely.

Output is three separate files under `.github/specs/{feature-name}/`:

1. `requirements.md`
2. `design.md`
3. `tasks.md`

Never combined. Never inside a source directory. Use kebab-case for `{feature-name}`.

A spec is documents, not code. **Do not write implementation code during spec creation.** Pseudocode is fine; runnable code is not.

After writing `design.md`, stop and route to the `architect` agent for review before producing `tasks.md`.
