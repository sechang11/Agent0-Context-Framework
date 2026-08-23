---
description: Tear the Scaffold back out of the host app — remove the dev-server wiring, routes, and script injection with a preview-and-confirm gate. Queued requests and spec edits stay in the repo unless you opt to delete them.
---

The full prompt for this command is at `.github/prompts/demolish-scaffold.prompt.md`. Read it and follow it precisely.

Invocation patterns:

```
/demolish-scaffold          # inventory → preview + confirm → remove → verify clean
```

The specs are the building; the Scaffold is the temporary structure around it. Striking it removes only wiring — `scaffold.js` (framework-managed) and `.github/scaffolding/` data are kept by default. Re-erect any time with `/install-scaffold`.
