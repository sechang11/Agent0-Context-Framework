---
mode: agent
description: Install the Scaffold — an in-app, dev-only spec overlay (devtools for your specs). A pill → drawer on every page showing that page's node, its Invariants and Flair in an IDE-colored plain-language editor, an all-specs browser, and a request queue Claude reads next session. Env-gated, reversible with /demolish-scaffold.
---

# /install-scaffold

Erect the **Scaffold** around the host app: wire the framework's prebuilt overlay (`scaffold.js`, shipped at the repo root by `/update-framework`) into the project's dev server so every page grows a "⌂ Scaffold" pill. The full behavior contract is `.github/skills/scaffolding/SKILL.md` — read it first and follow it exactly. This command only wires; the UI already exists.

Like real scaffolding, it's temporary by design: `/demolish-scaffold` tears it down cleanly and the specs (the building) remain.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/install-scaffold` | Full flow: preflight → stack plan → confirm → wire → verify. |
| `/install-scaffold --plan` | Stop after presenting the wiring plan. Nothing written. |

## Phase 1 — Preflight

1. **`scaffold.js` present at the repo root?** If missing → tell the user to run `/update-framework` first, and stop.
2. **`FEATURE_TREE.json` exists?** Check the repo root; if the project keeps it elsewhere (e.g. `canvas/FEATURE_TREE.json`), note the path — the data route will read from there. If none exists anywhere → suggest `/feature-tree` first and stop (a Scaffold with no map is an empty drawer).
3. **Skill contract**: read `.github/skills/scaffolding/SKILL.md` in full.
4. **Conflict check**: `grep -rn "/__scaffold" --include="*.{js,jsx,ts,tsx,mjs,cjs}" .` (excluding `node_modules`, `scaffold.js` itself). Existing wiring → report "already installed" with its location and stop.
5. **Decline cases** (from the skill): no dev server that serves HTML → point at the canvas instead.

## Phase 2 — Stack plan

Identify the dev stack (check `package.json` scripts, framework configs) and draft the smallest wiring that satisfies the skill's **Required surfaces** table:

- serve `GET /__scaffold/scaffold.js` from the repo-root file,
- `GET /__scaffold/data` (tree + routes + requests + `editable:true`),
- `POST /__scaffold/save` (bounded section writes per safety property 4),
- `POST /__scaffold/request` (queue append/remove),
- dev-only script-tag injection,
- everything gated on `SCAFFOLD_PANEL=1` and not-production.

Prefer **one new file** (e.g. `server/scaffold-dev.js` middleware, or a Vite plugin in `vite.config`) plus a ≤5-line mount in existing code. Use the skill's stack-specific notes. No new dependencies — Node built-ins and the stack's own APIs only.

Present the plan: files to create/touch (with line counts), the gate variable, where the tree is read from, and how to open it. **Get explicit confirmation before writing anything.** With `--plan`, stop here.

## Phase 3 — Wire it

1. Implement the plan. Keep the new module self-contained and commented with a pointer to the skill.
2. Create `.github/scaffolding/` with:
   - `routes.json` → `{}` (manual route → node-id overrides; document the shape in a `_comment` key),
   - `requests.json` → `[]`.
3. Do **not** add `SCAFFOLD_PANEL` to any committed env file — tell the user to set it per-run.

## Phase 4 — Verify

With the dev server running and `SCAFFOLD_PANEL=1`:
- `GET /__scaffold/data` → 200 JSON with `tree.nodes` non-empty.
- `GET /__scaffold/scaffold.js` → 200, `Content-Type` includes `javascript`.
- Without the env var (restart or a second check): both → 404.
If the user can't run the server now, print the curl checks for them to run and mark verification pending — don't claim success.

## Phase 5 — Console summary

```
═══ Scaffold erected ═══

  Wiring:   {files created/touched}
  Gate:     SCAFFOLD_PANEL=1   (dev only — 404s in production or ungated)
  Data:     {FEATURE_TREE.json path} · {N} nodes
  Queue:    .github/scaffolding/requests.json  (surfaced by /standup)

  Open it:  {start command with the env var}, then click "⌂ Scaffold" bottom-right.
  Teardown: /demolish-scaffold
```

## Rules

- **Read the skill first.** The contract in `.github/skills/scaffolding/SKILL.md` wins over anything here.
- **No new dependencies.** Ever.
- **Gate everything.** No route, no injection, no render without `SCAFFOLD_PANEL=1` outside production.
- **Confirm before writing.** The plan gate in Phase 2 is mandatory.
- **Don't commit.** Same as every other slash command.
- **Don't touch production code paths.** Dev server wiring only.
