# Skill: web-debug

The contract for the Stage 3 debug panel. Defines what the panel must do regardless of stack, so the `debug-panel-engineer` agent can implement it consistently across Next.js, Vite/React, Remix, SvelteKit, Rails, Django, or anything else with a routing layer.

This is a **framework-canonical** skill — the contract is the same in every adopted project. Per-project skills under `.github/skills/{name}/SKILL.md` would document project domain knowledge; this one documents framework-domain knowledge.

## Purpose

The debug panel surfaces the `verification.md` files of every spec whose `Surfaces` section includes the current route. It gives developers a route-keyed view of:

- **Checkpoints** — the spec's acceptance criteria, with their last pass/fail status and a button to re-run the automated ones.
- **Flags** — feature toggles the spec exposes, stored in `localStorage`, read by the host code on demand.
- **State probes** — read-only snapshots of named state values (current user, last API call, etc.).
- **A "report bug" button** that bundles current route + flag state + probe values into a Markdown report copied to clipboard for `/report-bug`.

This is the runtime surfacing of Stage 2 artifacts. Stage 2 produces the verification.md files; Stage 3 makes them interactive at the routes they describe.

## Safety properties — non-negotiable

1. **OFF by default.** The panel must be gated by an environment variable (`DEBUG_PANEL=1` by convention, but the agent picks the stack-appropriate gating mechanism — e.g., `NEXT_PUBLIC_DEBUG_PANEL` for Next.js client code). When unset, the panel route returns 404 and any panel-related UI doesn't render. **This is the single most important property.** A debug panel that surfaces internal state in production is a vulnerability.
2. **Reversible.** `/demolish-debug` removes the panel entirely. No leftover env-var checks. No orphan imports. The user can verify the project is debug-free by running `grep -rn 'DEBUG_PANEL\|/__debug\|@debug' .` after demolition.
3. **No code injection into host components.** The panel does not patch React components, monkey-patch fetch, intercept network calls without consent, or otherwise reach into host code. It reads:
   - The verification.md files from `.github/specs/*/`.
   - localStorage for flag values.
   - State probes the user explicitly wrote in `debug/probes.{ts,js}`.
4. **No secrets in state probes.** The agent that generates probe stubs must warn the user against reading auth tokens, API keys, or PII into the panel. The agent should refuse to write a probe that obviously reads secrets.

## Required surfaces (the routes the agent creates)

| Surface | Role |
|---------|------|
| `GET /__debug` | The panel page itself. Accepts a `?context=<route>` query param (the route the hotkey was pressed on). Shows the union of all verification.md files whose `Surfaces` include that context. |
| `GET /__debug/api/manifest` | Returns JSON: every verification.md file parsed into a structured manifest (specs, surfaces, checkpoints, flags, probes). Used by the panel for client-side rendering. |
| `POST /__debug/api/run-checkpoint` | Runs a single automated checkpoint by id. Returns `{ status: "pass" \| "fail", stderr: "..." }`. Updates the `Last result` field in the corresponding verification.md. **Only available in dev — verifies env-var gating before executing.** |
| `GET /__debug/api/probe?name=...` | Returns the current value of a named state probe. Implemented by the user in `debug/probes.{ts,js}`. |

The `/__debug/` prefix is hardcoded for v1. The double underscore signals "system, not user-facing" — the same convention as `_next/`, `__esModule`, etc.

## Required client-side modules

The agent generates these inside `debug/` (path adapted to the stack — `src/debug/` for Vite, `app/__debug/` for Next.js app router, etc.):

| Module | Purpose |
|--------|---------|
| `debug/panel.{tsx,jsx,vue,svelte}` | The panel UI itself. Renders sections per spec whose surfaces include the current route. |
| `debug/flags.{ts,js}` | `getDebugFlag(name)` helper. Reads from `localStorage`. Returns `null` if the panel is disabled (env var unset). Host code uses this for toggleable behavior. |
| `debug/probes.{ts,js}` | Map of name → getter function. The agent generates stubs based on probe declarations in verification.md files. The user fills in the bodies. |
| `debug/hotkey.{ts,js}` | Global keyboard handler. Default: `Ctrl+Shift+D` (or `Cmd+Shift+D` on macOS). Navigates to `/__debug?context=<current-route>`. No-op when env var unset. |
| `debug/gate.{ts,js}` | `isDebugEnabled()` — reads the env var. Every other module imports this and short-circuits when false. |

## How the panel chooses what to render

1. Read `?context=<route>` from the URL.
2. Fetch `/__debug/api/manifest`.
3. For every spec in the manifest, check if `spec.surfaces` contains a glob that matches `context`. Use a permissive glob match (`/api/auth/*` matches `/api/auth/login`).
4. Render one collapsible section per matching spec, in order of spec name. Each section shows:
   - The spec's title and source (spec/contract or code/snapshot — show a badge).
   - The checkpoints, with their `Last result` and timestamp.
   - For automated checkpoints: a "Run now" button that POSTs to `/__debug/api/run-checkpoint` and updates the UI.
   - The flags (each rendered as a toggle backed by localStorage).
   - The probes (each rendered as a read-only value, refreshed on a 2-second interval).
5. A floating "Report bug from this state" button at the top-right.

When the user clicks "Report bug from this state":
1. The panel collects: current route, all matching specs' names, current flag values, current probe values, the last failing checkpoint (if any), the user-agent string.
2. Formats as Markdown matching the structure `/report-bug` produces.
3. Copies to clipboard.
4. Shows a toast: "Bug context copied. Paste it into Claude Code with `/report-bug` to file the report."

## How the panel reads verification.md at runtime

V1 uses **runtime filesystem reads** via the `/__debug/api/manifest` endpoint. The endpoint:

1. Verifies `DEBUG_PANEL` is set (or stack-equivalent). If not, returns 404.
2. Reads `.github/specs/*/verification.md` via the host stack's FS API (`fs.readFile` for Node, equivalent for others).
3. Parses each file: YAML frontmatter + structured Markdown sections.
4. Returns JSON.

**Known limitation:** if the project is built and deployed as a static artifact that doesn't include `.github/`, the panel can't read the manifest in that deployment. Document this in the install command's output. Static-export support (build-time JSON generation) is future work.

## Stack-specific implementation notes for the agent

### Next.js (app router)

- Route: `app/__debug/page.tsx` for the panel, `app/__debug/api/manifest/route.ts` etc. for the API endpoints.
- Env var: `NEXT_PUBLIC_DEBUG_PANEL` for client checks (so it's available in the browser), plus `DEBUG_PANEL` for API routes if the user wants separate gating.
- The page is a client component (`"use client"`) so it can read localStorage.
- Hotkey: registered in `app/layout.tsx` via a small client-only component the agent adds.

### Vite + React SPA

- Route: lazy-loaded `Debug.tsx` mounted at `/__debug` via the project's router (React Router, TanStack Router, etc.).
- Env var: `VITE_DEBUG_PANEL` (Vite exposes env vars prefixed with `VITE_` to the client).
- API endpoints: only work if there's a backend. If pure-SPA, the manifest endpoint must be backed by a small dev-only Express/Fastify proxy the agent generates — or omit API endpoints and have the panel parse verification.md files at build time (static manifest).
- Hotkey: registered in the root component.

### Remix, SvelteKit, Nuxt

- Pattern matches Next.js — they all have file-based routing and server endpoints. The agent uses the framework's native conventions.

### Rails / Django / Phoenix / Laravel

- Panel page: a controller + view at `/__debug`.
- API endpoints: controllers under the same prefix.
- Env var: read from `ENV` / `os.environ`.
- Hotkey: a small JS snippet in the app's main layout, gated server-side via a conditional in the template.

In all cases the agent **does not invent a new framework** for the panel — it uses what the project already has. If the panel needs JSX, the project must already have React. If the panel needs Vue, the project must already have Vue. The agent should never propose adding a UI framework to a project that doesn't have one — it would decline the install if there's no rendering option.

## When to decline

The `debug-panel-engineer` agent declines to install if:

- The project has no HTTP routing layer (e.g., a pure library or CLI).
- The project's stack has no clean way to gate routes behind an env var.
- The project already has a `/__debug` route used for something else.
- The project doesn't have a frontend framework and the agent can't render a panel without one.
- The architect (asked first via the install command) says the stack isn't a fit.

A clean decline is better than a half-working install. The `verification.md` files still exist; the user just doesn't get the panel surface for them.
