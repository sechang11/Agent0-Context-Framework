---
mode: agent
description: Fully remove the web-debug panel from the host project. Deletes the /__debug routes, the debug/ directory, env-var lines, and reports any remaining references in host code for manual cleanup.
---

# /demolish-debug

Fully remove the web-debug panel from the host project. After this command completes, the project should have no `/__debug` routes, no `debug/` helper modules, no `DEBUG_PANEL` env-var references in `.env.example`, and no hotkey mount in the root layout.

This is the off-ramp for Stage 3. It exists so that a user who's done with the panel — or who wants to ship a public release without any debug-related surface area — can guarantee removal in one command.

**This is a destructive operation.** It deletes directories. The user gets a preview-and-confirm gate before anything is removed.

## Phase 1 — Pre-demolition checks

1. Confirm the panel is actually installed. Look for at least one of:
   - `app/api/__debug/` or `pages/api/__debug/` or `src/api/__debug/` (the API endpoints)
   - `src/debug/`, `debug/`, or `app/debug/` (the helper directory)
   - **Legacy v1 artifacts** (panel-as-page) — `app/__debug/`, `src/__debug/`, `pages/__debug/`
   - `<DebugPanel` imports/usages in source
   - `DEBUG_PANEL` references in `.env.example` or env files
   - `getDebugFlag` / `isDebugEnabled` imports in source

   If **none** are found, the panel isn't installed. Tell the user and exit.

2. Confirm the user understands the scope:

   > This will delete every file the panel created and remove all references to it in your codebase. Your `.github/specs/*/verification.md` files will be untouched — they're independent of the panel. You can re-install later with `/install-debug-panel` without losing any verification work.
   >
   > Continue? [y/N]

## Phase 2 — Inventory via debug-panel-engineer

Route to `@debug-panel-engineer` via the Task tool with this brief:

> Inventory the web-debug panel installation in this project for removal. Follow your role definition's demolition section. Specifically:
>
> 1. List every directory to delete (`app/__debug/`, `src/debug/`, etc.).
> 2. List every file to modify surgically (root layout for hotkey mount, `.env.example`, anything else with debug-specific lines that should be removed without deleting the whole file).
> 3. **Report** (do not propose to auto-fix) every host-code file that imports debug helpers (`getDebugFlag`, `isDebugEnabled`, etc.) or references the panel's env var outside `.env.example`. The user must clean these up manually — auto-modifying host code is risky.
> 4. Return the inventory as a structured plan ready to present to the user.

## Phase 3 — Present the plan, get explicit confirmation

Show the user the agent's plan in this format:

```
Demolition plan:

  DELETE (recursive):
    • app/api/__debug/         (API endpoints: manifest, run-checkpoint, probe)
    • src/debug/                (panel component, state, gate, flags, probes, hotkey)
    • {legacy app/__debug/ if found — older v1 panel-as-page artifacts}

  MODIFY:
    • app/layout.tsx           — remove <DebugPanel/> mount and its import
    • .env.example             — remove NEXT_PUBLIC_DEBUG_PANEL=0 line

  REPORT (you must clean up manually):
    • src/components/Header.tsx:14   — imports getDebugFlag, will fail to compile after delete
    • src/api/featureFlags.ts:42     — references NEXT_PUBLIC_DEBUG_PANEL

Confirm? [y/N]
```

If the user declines, stop. Print nothing else — they just dodged a destructive action.

## Phase 4 — Execute

Route back to `@debug-panel-engineer` with:

> The user confirmed the demolition plan. Execute:
>
> 1. Delete the listed directories with `rm -rf` (or stack-equivalent).
> 2. Make the surgical modifications to layout files and `.env.example`.
> 3. Do **not** modify the host-code files in the REPORT list — those are the user's job.
> 4. Run a final verification grep to confirm:
>    - No `app/api/__debug/` or `pages/api/__debug/` API endpoints remain.
>    - No `src/debug/`, `debug/`, or `app/debug/` helper directory remains.
>    - No legacy `app/__debug/`, `src/__debug/`, or `pages/__debug/` route directories remain.
>    - The root layout no longer imports or renders `<DebugPanel/>`.
>    - `.env.example` no longer references `DEBUG_PANEL`.
> 5. Return: confirmation of completion + the count of host-code references the user still needs to address.

## Phase 5 — Console summary

```
═══ Debug panel demolished — {YYYY-MM-DD HH:MM} ═══

  Deleted:    {N} director(y/ies)
  Modified:   {N} file(s)
  Verified:   no /__debug routes remain, no debug/ helpers remain, no DEBUG_PANEL references in .env.example

  Remaining manual cleanup ({M} references):
    • src/components/Header.tsx:14   — imports getDebugFlag
    • src/api/featureFlags.ts:42     — references NEXT_PUBLIC_DEBUG_PANEL
    ({or "None — codebase is clean."})

Your .github/specs/*/verification.md files are untouched. The panel-related
sections inside them (## Flags exposed, ## State to surface) stay as
documentation in case you re-install later.

To re-install: /install-debug-panel
```

If there are remaining references the user needs to clean up, end with:

> Once you've removed those imports, run `grep -rn 'DEBUG_PANEL\|/__debug\|getDebugFlag\|isDebugEnabled' .` to confirm a clean removal. The project should produce zero matches.

## Rules

- **Confirm before deleting.** Two confirmations: one for intent (Phase 1), one for the specific plan (Phase 3). No bypass.
- **Never touch `.github/`.** Verification files stay. The panel's documentation sections inside them stay. This is the contract — the verification artifacts are independent of the panel.
- **Never auto-modify host components.** Even if you can clearly see how to remove a `getDebugFlag` call cleanly, leave it. The user reviews and removes by hand. The risk of breaking host code by auto-modifying is greater than the inconvenience of manual cleanup.
- **Idempotent.** Re-running `/demolish-debug` on an already-demolished project should report "panel not installed" and exit cleanly.
- **Don't commit.** User reviews and commits the deletions themselves.
- **Verify after delete.** Phase 4 step 4 isn't optional — it confirms the demolition actually succeeded.
