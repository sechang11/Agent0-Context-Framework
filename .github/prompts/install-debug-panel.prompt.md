---
mode: agent
description: Install the web-debug panel into the host project. Routes via @architect (stack-fit check) and @debug-panel-engineer (implementation). Off by default — DEBUG_PANEL=1 required to activate.
---

# /install-debug-panel

Install the **web-debug panel** into the host project. The panel mounts at `/__debug`, gated by an env var (`DEBUG_PANEL=1` or stack-equivalent), surfaces every `verification.md` whose surfaces include the current route, and provides per-checkpoint status, feature-flag toggles, state probes, and a "copy bug report to clipboard" button.

This is Stage 3 of the spec-bound debug surface. It depends on Stages 1, 2, and 2.5:

- **Stage 1** (`/report-bug`) supplies the bug-report structure the panel's button emits.
- **Stage 2** (`/verify`) supplies the verification.md files the panel reads.
- **Stage 2.5** (`/cover`) supplies verification.md files for existing features so the panel has content for brownfield adopters.

If the host project has no `verification.md` files at all, the panel will install but render an empty state. Tell the user to run `/cover` or `/verify` first.

## Phase 1 — Pre-install checks

1. Confirm at least one `verification.md` exists somewhere under `.github/specs/`. If none:

   > No verification.md files found. The panel will install but show an empty state. Run `/cover {feature}` (for existing code) or `/verify {feature} --bootstrap` (for spec'd features) first, or proceed anyway? [proceed / cancel]

2. Confirm the user understands the safety posture:

   > The panel installs OFF by default. It only activates when `DEBUG_PANEL=1` is set in the environment (or stack-equivalent — Next.js uses `NEXT_PUBLIC_DEBUG_PANEL`, Vite uses `VITE_DEBUG_PANEL`). Production deployments leave the env var unset; the panel route returns 404 and renders nothing. To run the panel in your single-environment setup, you'll set the env var manually.
   >
   > Continue? [y/N]

   If the user wants the panel on by default in production, **decline**. Tell them the framework's contract enforces off-by-default; if they want production access, they set the env var themselves at deploy time, fully aware of the consequences.

## Phase 2 — Architect stack-fit review

Route to `@architect` via the Task tool with this brief:

> Review whether this project's stack is a fit for installing the web-debug panel. Read `.github/skills/web-debug/SKILL.md` for the contract. Check:
>
> 1. Is this a web app with an HTTP routing layer? (Decline if a pure library, CLI, or non-web artifact.)
> 2. Does it have a frontend framework (React, Vue, Svelte, etc.) that can render the panel UI?
> 3. Does the stack support env-var gating for routes? (Next.js: yes. Vite SPA: yes. Pure static site: no.)
> 4. Is there a conflict at `/__debug` already?
> 5. Are there architectural constraints (e.g., "no client-side localStorage") that would prevent the panel from working?
>
> Return a structured decision: APPROVE, REVISE, or REJECT. Per your role file's output format. If REJECT, explain which check failed.

If the architect rejects, stop. Print the architect's reasoning and exit. Don't try to work around it.

If the architect approves or asks for revisions, proceed with the conditions they specified.

## Phase 3 — Debug-panel-engineer implementation

Route to `@debug-panel-engineer` via the Task tool with this brief:

> Install the web-debug panel into this project. The architect has approved with the following conditions: {architect's conditions, if any}.
>
> Follow your role definition (`.github/agents/debug-panel-engineer.agent.md`) and the contract at `.github/skills/web-debug/SKILL.md`. Specifically:
>
> 1. Phase 1 stack assessment — if you have a reason to decline that the architect didn't catch (e.g., no UI framework you can use), decline now rather than building something broken.
> 2. Phase 2 implementation — propose the file layout to the user, get confirmation, then write the files. Don't add new dependencies.
> 3. Generate probe stubs for every `## State to surface` declaration in any `verification.md`. Refuse to generate probes whose names indicate secret-reading.
> 4. Make sure the env-var gate is enforced at every entry point: the route, the API endpoints, the hotkey, the panel UI. Belt-and-suspenders.
> 5. Update `.env.example` (or stack-equivalent) with the env var set to `0` and a comment explaining what it does.
>
> Return: list of files created, list of files modified, the env-var name(s) used, and the path the panel mounts at (`/__debug` unless conflict required a different prefix). Also report any probe stubs the user needs to fill in.

## Phase 4 — Console summary

After the agent returns, print this to chat:

```
═══ Debug panel installed — {YYYY-MM-DD HH:MM} ═══

  Stack:        {detected stack, e.g. "Next.js 14 (app router) + TypeScript"}
  Mount path:   /__debug
  Env-var:      {var name, e.g. NEXT_PUBLIC_DEBUG_PANEL}
  Hotkey:       Ctrl+Shift+D  (Cmd+Shift+D on macOS)

Files created:
  • {file 1}
  • {file 2}
  • ...

Files modified:
  • {file 1}
  • ...

Probe stubs to fill in:
  • debug/probes.ts → "current-user-id"  (from auth-flow/verification.md)
  • debug/probes.ts → "last-api-call"     (from auth-flow/verification.md)
  ({or "None — no probes declared in any verification.md."})

To activate the panel:
  1. Set the env var:  export {var name}=1   (or add to .env.local)
  2. Restart your dev server.
  3. Visit /__debug  — or press the hotkey from any page.

Safety posture:
  • Panel is OFF when {var name} is unset. Production deployments without
    the env var get a 404 on /__debug and no panel UI elsewhere.
  • The panel reads .github/specs/*/verification.md via the filesystem at
    runtime. If you deploy without .github/, the manifest endpoint will
    return empty. (Static-export support is future work.)

To remove the panel completely:
  /demolish-debug
```

If any probe stubs need filling in, also suggest:

> Open `debug/probes.ts` and implement the bodies. **Do not return secrets** (auth tokens, API keys, PII). If you accidentally wrote a stub that exposes a secret, the demolition path won't catch that — review each probe yourself.

## Rules

- **Architect gate is mandatory.** Don't skip Phase 2. Even if you're sure the stack fits, the architect's review is the safety check.
- **Off-by-default is non-negotiable.** If the user pushes back and asks for on-by-default, decline. Their single-environment use case is fine — they set the env var at deploy time.
- **No new dependencies.** The agent declines if the stack can't render a panel without adding packages.
- **No automatic installation if `verification.md` files don't exist** — at least warn first. An empty panel is bad UX.
- **Don't commit.** User reviews.
- **Print the demolition command in the summary.** Make the off-ramp visible from day one.
