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

## Phase 3 — Debug-panel-engineer: propose plan (no files written)

Subagents can't prompt the user mid-task. So the implementation runs in two passes: first the agent proposes a plan and returns; then the orchestrator (this session) shows the plan to the user; then the agent is re-dispatched with `confirmed=true` to write files.

### Phase 3.1 — Propose

Route to `@debug-panel-engineer` via the Task tool with this brief:

> **Propose-only pass.** Do NOT write any files yet.
>
> The architect approved installation with the following conditions: {architect's conditions, if any}.
>
> Follow your role definition (`.github/agents/debug-panel-engineer.agent.md`) and the contract at `.github/skills/web-debug/SKILL.md`. Specifically:
>
> 1. Run Phase 1 (stack assessment) — if you have a reason to decline that the architect didn't catch (e.g., no UI framework you can use), return a `DECLINE` decision with the reason.
> 2. Run the planning portion of Phase 2 — determine the file layout you'd create, the env-var name you'd use, and any files you'd modify (e.g., root layout for the hotkey mount, `.env.example`). Do not write yet.
> 3. Identify every `## State to surface` declaration across all `verification.md` files. For each, plan a probe stub. Flag any whose names indicate secret-reading (refuse and propose a safer name).
>
> Return a structured plan: `decision` (APPROVE | DECLINE), `reason` (if decline), `files_to_create` (list), `files_to_modify` (list), `env_var_name`, `mount_path`, `probes_planned` (list of name + source verification.md), `probes_refused` (list of name + replacement suggestion).

### Phase 3.2 — Orchestrator: show plan, get confirmation

When the subagent returns:

1. If `decision = DECLINE`, print the reason and stop. The architect's approval was insufficient; the engineer caught a deeper issue.
2. Otherwise, print the plan to the user as a structured preview:

   ```
   Plan:
     Files to create:
       • {file 1}
       • {file 2}
       ...
     Files to modify:
       • {file 1} — {one-line change}
     Env-var: {var name} (default: 0)
     Mount path: {/__debug or alt}
     Probe stubs to scaffold:
       • {name} (from .github/specs/{feature}/verification.md)
     Probes refused (safer alternatives proposed):
       • {original-name} → {safer-name}
   ```

3. Ask the user to confirm (`y / n / edit`). Edit lets them change the env-var name, mount path, or skip specific files.

### Phase 3.3 — Debug-panel-engineer: execute

After the user confirms (and applies any edits to the plan), re-dispatch `@debug-panel-engineer` via the Task tool with this brief:

> **Execute the previously-approved plan.** The user has confirmed the following plan: {confirmed plan, including any edits}.
>
> Write the files. Make modifications. Enforce env-var gating at every entry point: route, API endpoints, hotkey, panel UI. Belt-and-suspenders.
>
> Generate probe stubs for the planned probes. Don't generate the refused ones.
>
> Update `.env.example` (or stack-equivalent) with the env var set to `0` and a comment explaining what it does.
>
> Return: list of files actually created, list of files actually modified, and any probe stub paths the user needs to fill in.

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
