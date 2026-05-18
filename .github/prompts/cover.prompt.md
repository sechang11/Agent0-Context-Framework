---
mode: agent
description: Generate a code-derived verification.md for an EXISTING feature that has no spec. Reads code at given surfaces, drafts checkpoints documenting current observable behavior. Used for brownfield adoption — features that predate the framework.
---

# /cover

Generate a `verification.md` for an **existing feature** that doesn't have a spec. For greenfield work that goes through `/spec` first, use `/verify --bootstrap` instead.

This is Stage 2.5 of the spec-bound debug surface: the on-ramp for brownfield adoption. `/spec` is for new work where acceptance criteria are written first; `/cover` is for existing work where acceptance is reverse-engineered from observable behavior.

## The honest tradeoff

**Code-derived verification documents what the code does today, not what it should do.** If a latent bug exists in current behavior, a code-derived checkpoint codifies that bug as "expected." Every console summary and the generated file itself flags this prominently.

In practice this means:

- **Code-derived verification is a snapshot** — useful as a regression suite ("did anything change since adoption?").
- **Spec-derived verification is a contract** — useful as acceptance testing ("does this meet our criteria?").
- **You can upgrade** a code-derived verification by writing the real `requirements.md` retroactively, then running `/verify {feature} --bootstrap` to regenerate from desired behavior. The verification's `source:` field flips from `code` to `spec`.

## Invocation patterns

| Pattern | What it does |
|---|---|
| `/cover` | Interactive — asks for the feature name and surfaces |
| `/cover {feature-name}` | Asks the user to list surfaces; agent suggests candidates from the codebase |
| `/cover {feature-name} --surfaces "/login,/api/auth/*,components/AuthGuard.tsx"` | Surfaces given explicitly; runs non-interactively |
| `/cover --discover` | Scan the codebase, propose feature boundaries, confirm with user, batch-cover all confirmed features. See the `--discover mode` section below. |

`{feature-name}` is kebab-case. The resulting verification lives at `.github/specs/{feature-name}/verification.md` — same path as spec-derived verification, distinguished only by frontmatter.

## What counts as a feature? (read this before invoking)

A **feature** is a coherent logical concern someone would name in a product meeting — "login," "password reset," "user signup," "checkout." A **surface** is where that feature manifests in code — a route, an endpoint, a file, a CLI command.

The relationship is many-to-many:

- **One feature can touch multiple surfaces.** "User signup" touches `/signup`, `POST /api/users`, `POST /api/auth/login`, and the welcome-email worker.
- **Multiple features can share a surface.** `POST /api/auth/login` might be touched by "password login," "magic-link login," and "2FA verification" — three features sharing one endpoint.

**Each feature gets one `verification.md`.** Two features that share a surface get two files, both listing that surface in their `Surfaces` section. The debug panel (if installed) renders the union of all specs whose surfaces include the current route.

Heuristics for picking boundaries:

- A feature is something a PM would name. "Login flow" yes; "the third branch of the login handler" no.
- Coherent behavior — two checkpoints that always pass-or-fail together belong to one feature.
- One paragraph of `requirements.md` worth of explanation. If you need a multi-level outline, the scope is probably more than one feature.
- When in doubt, split smaller. Easier to merge two verification.md files later than to disentangle a bundled one.

If you can't decide what the feature boundaries are, use `--discover` (described below) — the agent scans the codebase and proposes boundaries, and you confirm or edit them before any files are written.

## --discover mode

When the user invokes `/cover --discover` (no feature name), the agent scans the codebase and proposes feature boundaries instead of asking the user to enumerate them. **The agent never writes a file without explicit user confirmation.**

If `--discover` is **not** passed, skip this section and proceed to Phase 1 below for the single-feature flow.

### Phase D1 — Scan the codebase

Look for feature-shaped structures. Don't enumerate every file — only top-level structure:

- **Page routes** — Next.js (`app/*/page.tsx`, `pages/*.tsx`), Vite/React (router config), Remix (`app/routes/*`), SvelteKit (`src/routes/*`), Rails (`config/routes.rb`), Django (`urls.py`).
- **API endpoints** — same frameworks; group separately from page routes. For Express/Fastify, grep for `app.get/post/put/patch/delete`. For FastAPI, grep for `@app.X` decorators.
- **CLI subcommands** — argument-parser entries (argparse subparsers, click groups, Cobra commands, etc.).
- **Feature directories** — `src/features/*/`, `app/features/*/`, top-level subdirectories under `lib/`, `internal/`, or `pkg/`.
- **Components** — `components/*/` and `src/components/*/` if there's no clear feature directory structure.

Cap each category at what you can see in one scan — don't recursively walk every subdirectory. The goal is a feature-shaped map, not a file census.

### Phase D2 — Group surfaces into proposed features

Apply these heuristics in order:

1. **Path-prefix**: endpoints sharing a path prefix (`/api/auth/*`) → one feature named after the prefix (`auth-flow` or `auth-api`).
2. **Directory-based**: files under `src/features/{name}/` → one feature named `{name}`.
3. **Naming similarity**: `LoginForm.tsx`, `useAuth.ts`, `AuthGuard.tsx` → cluster as one feature (`auth-flow`).
4. **Adjacent surfaces**: a page route + the API endpoints it calls + the components it renders → one feature, named after the dominant concern.

Anything that doesn't fit a single feature goes into an **unclaimed bucket** — utility files, shared components, anything you couldn't classify with confidence. **Don't force unclaimed surfaces into features they don't obviously belong to.** Leaving them unclaimed gives the user the choice.

### Phase D3 — Present the proposal

Print to chat:

```
═══ /cover --discover ═══

Scanned codebase. Proposed feature breakdown ({N} features, {M} surfaces):

1. {feature-name-1}
   {surface 1}, {surface 2}, {surface 3}, ...

2. {feature-name-2}
   ...

...

{N+1}. (unclaimed — don't seem to belong to a single feature)
   {surface}, {surface}, ...
   ↳ Skip these, or claim them under a "shared" feature?

Review the proposal:
  y — accept and run /cover for each
  e — edit groupings (rename / split / merge / drop / claim unclaimed)
  n — cancel, nothing written

  [y/e/n]
```

Wait for the user's response. Do not proceed until they pick one.

### Phase D4 — Edit loop (only if user picks `e`)

Walk through each proposed feature in order. For each, ask:

> Feature {N}: `{feature-name}` ({M} surfaces)
> {list surfaces}
>
> [k]eep / [r]ename / [s]plit / [m]erge with another / [d]rop / [a]bort edit-mode?

- **Keep** — moves to the next feature unchanged.
- **Rename** — ask for new name. Validate as kebab-case. Move on.
- **Split** — ask which surfaces belong in the original feature and which move to a new one. Ask for the new feature's name.
- **Merge** — ask which other proposed feature (by number) to merge with. Combine surfaces, ask for the merged name (default to one of the original names).
- **Drop** — remove this feature from the plan. Its surfaces go back to the unclaimed bucket.
- **Abort edit-mode** — exit the edit loop without further changes. Show the current state of the plan and re-ask `[y/n]`.

After walking every feature, also ask about the unclaimed bucket:

> Unclaimed surfaces: {list}
> [s]kip them / [c]laim under a "shared" feature / [a]ssign to existing features one at a time?

If `c`, the unclaimed bucket becomes one feature named `shared` (or whatever the user prefers). If `a`, walk each unclaimed surface and ask which existing feature it belongs to (or "drop").

After the edit loop completes, **show the final revised plan and ask one final `[y/n]`** before proceeding. This is the last gate before files get written.

### Phase D5 — Batch run

For each confirmed feature in the final plan, invoke the single-feature flow internally. Pass the feature name and surfaces directly to `verification-engineer` in code-derived mode — skip Phase 2 (surface identification) since surfaces are already known from the proposal.

Process features in **sequence, not parallel**. Parallel would interleave the agent's reasoning across multiple verification.md files and produce a worse result.

After each feature, print a one-line progress marker:

```
[2/6] auth-flow ............ written (4 checkpoints, 1 concern flagged)
```

If any feature fails to generate (agent can't determine behavior at a surface, or returns an empty result), continue with the rest but record the failure for the final summary. Don't stop the whole batch on a single failure.

### Phase D6 — Final summary

After all features are processed, print a substantial summary. Each feature is shown with its verification.md path on the next line, indented with a `→` arrow — the user should be able to scan the list and jump straight to any file:

```
═══ /cover --discover complete ═══

Coverage written:

  ✓ auth-flow                    (4 checkpoints, 1 concern)
      → .github/specs/auth-flow/verification.md

  ✓ user-dashboard               (6 checkpoints, 0 concerns)
      → .github/specs/user-dashboard/verification.md

  ✓ checkout                     (8 checkpoints, 3 concerns ← review!)
      → .github/specs/checkout/verification.md

  ✓ admin-panel                  (3 checkpoints, 0 concerns)
      → .github/specs/admin-panel/verification.md

  ✓ notifications                (2 checkpoints, 1 concern)
      → .github/specs/notifications/verification.md

  ⚠ shared                       (skipped — unclaimed, user declined to create)

Total: 5 features covered, 23 checkpoints, 5 concerns flagged.

⚠️  All verifications are code-derived (source: code). They document
    CURRENT behavior, not desired behavior. Concerns are likely bugs
    in current code — review each and consider /report-bug if real.

To capture initial pass/fail results for any feature:
    /verify {feature-name}

To upgrade a code-derived verification to a spec-derived contract:
    1. Write .github/specs/{feature}/requirements.md
    2. /verify {feature} --bootstrap
```

Skipped features (like the `shared` row above) show only the reason; no path arrow since no file was written for them.

The `⚠️` reminder is mandatory. After batch discovery, it's easy for the user to forget that every file is a snapshot, not a contract.

## Phase 1 — Resolve the target feature

1. If no `{feature-name}` was provided, ask the user:

   > What's the feature name (kebab-case)?

2. Validate the name is kebab-case (`[a-z0-9-]+`). If not, suggest a corrected form and confirm.

3. Check `.github/specs/{feature-name}/`:
   - **Doesn't exist** — fine, you'll create it.
   - **Exists with no verification.md** — fine, you'll add verification.md alongside whatever else is there.
   - **Exists with a spec-derived verification.md** (frontmatter `source: spec`) — STOP. Tell the user this feature already has a spec-derived verification; they should use `/verify {feature} --bootstrap` instead, or delete the existing file first if they really want to convert it to code-derived.
   - **Exists with a code-derived verification.md** — ask the user whether to overwrite ("a code-derived verification already exists from {timestamp}; overwrite? [y/N]"). Default to N.

## Phase 2 — Identify surfaces

The user has to tell the agent which routes, endpoints, commands, or components this feature touches. The agent can't reliably infer this without help — "the auth flow" could mean three different things in three different codebases.

1. If `--surfaces` was provided, parse the comma-separated list and proceed.

2. Otherwise, ask the user **one batch of questions**:

   > 1. What surfaces does this feature touch? (routes, API endpoints, CLI commands, or component file paths — comma-separated)
   > 2. *(optional)* Any one-line description of what the feature does?

3. After receiving surfaces, validate each one:
   - **Route patterns** (e.g. `/login`, `/api/auth/*`): try to find the handler. For a Next.js app, check `app/`, `pages/`, or `src/app/`. For Express, grep for `app.get('/login')` style. For FastAPI, grep for `@app.get("/login")`. If you can't find a handler, ask the user to point you at the file.
   - **File paths** (e.g. `components/AuthGuard.tsx`): just `ls` to confirm existence.
   - **CLI commands** (e.g. `mycli auth login`): grep for the command's argument parser entry.

   Report any surfaces you couldn't locate and ask the user to clarify or remove them.

4. Suggest additional surfaces the user might have missed. Heuristics:
   - If they listed `/api/auth/login`, also surface adjacent endpoints — `/api/auth/logout`, `/api/auth/refresh`, etc.
   - If they listed a component file, surface its imports that look feature-relevant.
   - Cap suggestions at 5. Ask the user to confirm or decline each one.

   **Do not auto-add surfaces.** Always ask.

## Phase 3 — Invoke verification-engineer in code-derived mode

Route to `verification-engineer` via the Task tool with this brief:

> Generate a **code-derived** verification.md for the feature `{feature-name}`.
>
> Surfaces (user-confirmed):
> - {surface 1}
> - {surface 2}
> - …
>
> Description (if provided): {description}
>
> Read the code at each surface to understand its current behavior. Translate the observable behavior into checkpoints following the standard verification.md structure. Use `source: code` in the frontmatter.
>
> **Document current behavior, not desired behavior.** Each checkpoint's Pass/Fail criteria describes what the code currently does. If you spot something that looks like a bug (e.g. an endpoint that returns 500 on empty input), note it as a `## Concerns` section after the checkpoints, but don't write the checkpoint as if the buggy behavior is the bug — write it as the current observed behavior.
>
> Write the file to `.github/specs/{feature-name}/verification.md`. Create the parent directory if needed. Return a summary: number of checkpoints written, automation coverage (X of Y automated), any concerns flagged, and any surfaces where you couldn't determine observable behavior clearly.

## Phase 4 — Confirm file write + render the caveat

After the agent returns:

1. Read the new `verification.md` to confirm it exists and has `source: code` in the frontmatter.

2. **Prepend a caveat block** to the file, immediately after the H1, if the agent didn't already include one:

   ```markdown
   > ⚠️ **This verification was generated from existing code, not from a written spec.**
   > Each checkpoint documents observable current behavior. If a bug exists in
   > current code, this verification captures the bug as "expected." Review carefully
   > before relying on this as a contract. To upgrade to a spec-derived verification,
   > write `requirements.md` for the desired behavior and run `/verify {feature} --bootstrap`.
   ```

   This block stays in the file across `/verify` runs. It's removed automatically when the file is regenerated as spec-derived.

## Phase 5 — Print substantial console summary

```
═══ Code-derived verification bootstrapped — {feature-name} ═══

  File:        .github/specs/{feature-name}/verification.md
  Source:      code  (NOT a spec — see caveat below)
  Surfaces:    {N} ({list, truncated})
  Checkpoints: {N} total ({A} automated, {M} manual, {X} mixed)
  Status:      draft

  ⚠️  This verification documents CURRENT behavior, not desired behavior.
      If today's code has a bug, this verification records the bug as "expected."

  Concerns the agent flagged (potential bugs in current behavior):
    • {concern 1}
    • {concern 2}
    ({or "None flagged.")

  Surfaces with unclear behavior (review manually):
    • {surface 1} — {one-line reason}
    ({or "All surfaces clearly analyzed.")

To capture initial pass/fail results:
    /verify {feature-name}

To upgrade to a spec-derived verification later:
    1. Write .github/specs/{feature-name}/requirements.md with desired behavior.
    2. /verify {feature-name} --bootstrap
```

## Phase 6 — Suggest next steps

After the summary, suggest in plain prose:

- If `## Concerns` section is non-empty, suggest filing each as a `/report-bug` to investigate.
- If any surfaces had unclear behavior, suggest a manual code-read pass.
- Always: run `/verify {feature-name}` to get an initial pass/fail snapshot of the checkpoints.

## Rules

- **Code-derived ≠ desired behavior.** This is the single most important rule. Every output channel — the file itself, the console summary, the next-steps prose — must make this clear. Never present code-derived checkpoints as if they were acceptance criteria.
- **Always ask the user for surfaces.** Don't guess them. Don't grab them from a recent spec. The agent can suggest additions, but the user is authoritative.
- **Don't modify production code.** Read it. Read it carefully. Don't change it.
- **Don't install dependencies.** Same rule as `verification-engineer`.
- **Don't commit anything.** Same as `/spec` and `/verify`.
- **One verification.md per feature.** If the user wants to cover three sub-features separately, they run `/cover` three times with three feature names — the same way `/spec` would split them.
- **Never auto-overwrite a spec-derived verification.** That would silently downgrade a contract into a snapshot. Stop and tell the user.
- **The `source: code` frontmatter field is mandatory** for code-derived verifications. Without it, downstream tooling can't distinguish snapshot from contract.
