---
description: Pull the latest additive files (commands, agent shims, manifest) from the public Agent0-Context-Framework repo on GitHub. Never overwrites files with user-filled PROJECT slots.
---

The full prompt for this command is at `.github/prompts/update-framework.prompt.md`. Read it and follow it precisely.

Source repo: `sechang11/Agent0-Context-Framework` (public, `main` branch). The skill fetches over `curl` from `raw.githubusercontent.com` — no `gh` CLI required.
