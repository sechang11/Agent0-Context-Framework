---
description: Install the Scaffold — an in-app, dev-only spec overlay (devtools for your specs). A pill → drawer on every page shows that page's node, its Invariants and Flair in an IDE-colored plain-language editor, plus an all-specs browser and a request queue Claude reads next session. Env-gated; reversible with /demolish-scaffold.
---

The full prompt for this command is at `.github/prompts/install-scaffold.prompt.md`. Read it and follow it precisely.

Invocation patterns:

```
/install-scaffold           # preflight → stack plan → confirm → wire → verify
/install-scaffold --plan    # stop after the wiring plan, write nothing
```

The overlay UI ships prebuilt with the framework (`scaffold.js` at the repo root — run `/update-framework` if it's missing); this command only wires the host dev server: serve the script, three JSON routes, dev-only injection, all gated on `SCAFFOLD_PANEL=1`. Contract: `.github/skills/scaffolding/SKILL.md`. Panel buttons never call AI — they queue requests in `.github/scaffolding/requests.json`, surfaced by `/standup`.
