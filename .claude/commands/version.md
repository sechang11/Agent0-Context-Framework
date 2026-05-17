---
description: Report installed framework version, latest available upstream, the gap, available slash commands, and recent changelog entries. Read-only — no writes, no destructive operations. Works offline.
---

The full prompt for this command is at `.github/prompts/version.prompt.md`. Read it and follow it precisely.

Invocation patterns:

```
/version                  # full status — local + remote + gap + commands + recent changelog
/version --offline        # skip remote check, useful when no network
/version --changelog      # also print the full changelog history
```

Read-only sibling of `/update-framework`. Use this to check status; use `/update-framework` to actually pull updates.

The framework's full changelog lives at `CHANGELOG.md` at the repo root, regenerated from `MANIFEST.json` by `scripts/generate-changelog.py`.
