---
mode: agent
description: Tear the Scaffold back out of the host app — remove the dev-server wiring, routes, and script injection with a preview-and-confirm gate. Queued requests and spec edits stay in the repo unless the user opts to delete them.
---

# /demolish-scaffold

Take the Scaffold down. Like striking real scaffolding: the temporary structure comes off, the building — your specs, plus any edits and queued requests made through the panel — stays.

**This deletes wiring code.** The user gets a preview-and-confirm gate before anything is removed.

## Phase 1 — Inventory

Find every trace: `grep -rn "SCAFFOLD_PANEL\|/__scaffold\|scaffold-dev" --include="*.{js,jsx,ts,tsx,mjs,cjs,html}" .` excluding `node_modules/`, `.github/`, and the framework file `scaffold.js` itself. Classify:

- **wiring** — the dev module / plugin / route handlers created by `/install-scaffold`,
- **mounts** — script-tag injection or the ≤5-line hooks in existing files,
- **data** — `.github/scaffolding/` (requests.json, routes.json),
- **framework file** — `scaffold.js` at the repo root (managed by `/update-framework`; leave it).

Nothing found → report "no Scaffold wiring installed" and stop.

## Phase 2 — Present the plan, get explicit confirmation

Show exactly what will be removed (files deleted, lines reverted) and what stays (`scaffold.js`, `.github/scaffolding/` data). Ask two things:

1. Proceed with removal? (required yes)
2. Also delete `.github/scaffolding/` — the queued requests and route map? **Default: keep.** Only delete on an explicit yes; if it holds pending requests, say how many and suggest running `/standup` on them first.

## Phase 3 — Execute

Remove wiring and mounts. Honor the data decision. Then re-run the Phase 1 grep — it must come back empty (outside `.github/` and `scaffold.js`). If not, show the leftovers and clean them.

## Phase 4 — Console summary

```
═══ Scaffold struck ═══

  Removed: {files / line-reverts}
  Kept:    scaffold.js (framework-managed) · .github/scaffolding/ {kept | deleted, per your call}
  Check:   grep -rn "SCAFFOLD_PANEL\|/__scaffold" . → clean

  Re-erect any time with /install-scaffold.
```

## Rules

- **Preview before deletion.** No removal without the Phase 2 confirmation.
- **Data survives by default.** `.github/scaffolding/` is the user's work product, not wiring.
- **Never delete `scaffold.js`** at the repo root — `/update-framework` owns it.
- **Verification files untouched.** Same guarantee as `/demolish-debug`.
- **Don't commit.** Same as every other slash command.
