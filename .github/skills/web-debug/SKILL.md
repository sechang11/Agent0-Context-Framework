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

## The mount model — overlay panel, NOT a separate route

**The panel is a fixed-position overlay component mounted globally in the host app's root layout.** It is NOT a separate page or route. When toggled open, it overlays (or docks alongside) whatever page the user is currently on — so the user can debug the page they're testing without navigating away from it.

This is the core insight of the design: the point of a debug panel is to observe and manipulate the page underneath it. A standalone `/__debug` page would break that — you'd lose the page's state and re-render context every time you opened the debugger.

The panel:

- **Mounts globally** via the host stack's root layout (`app/layout.tsx` in Next.js, `App.tsx` in Vite/React, the root template in Rails/Django, etc.).
- **Toggles open/closed** via a hotkey (default `Ctrl+Shift+D` / `Cmd+Shift+D`) or a small floating toggle button.
- **Docks** to the left by default (left sidebar), full height, ~360px wide. Optional dock positions: right, bottom, floating-detached.
- **Pushes content** by default (the page content gets a margin-left when the panel is open, so the page is "next to" the panel — fully visible and re-rendering as the user interacts with the panel). Optional overlay mode for cases where the user wants to test pure viewport width.
- **Reads the current route** from the host stack's pathname hook (`usePathname()` in Next.js, `useLocation()` in React Router, etc.) and re-renders its content automatically when the user navigates the underlying app.
- **Renders nothing** when the gate env var is unset.

## Required surfaces (what the agent creates)

The panel itself is a component, not a route. Only the API endpoints are HTTP surfaces.

| Surface | Type | Role |
|---------|------|------|
| `<DebugPanel />` | component | Mounted globally in the host app's root layout. Renders nothing when gate is off. When on, renders a fixed-position dockable overlay. |
| `GET /api/__debug/manifest` | endpoint | Returns JSON: every verification.md file parsed into a structured manifest (specs, surfaces, checkpoints, flags, probes). Used by the panel for content rendering. Gate-checked. |
| `POST /api/__debug/run-checkpoint` | endpoint | Runs a single automated checkpoint by id. Returns `{ status: "pass" \| "fail" \| "pending: ...", stderr: "..." }`. Updates the `Last result` field in the corresponding verification.md. Gate-checked. |
| `GET /api/__debug/probe?name=...` | endpoint | Returns the current value of a named state probe. Implemented by the user in `debug/probes.{ts,js}`. Gate-checked. |

The `/api/__debug/*` namespace is hardcoded for v1. The double underscore signals "system, not user-facing." If a project already uses `/api/__debug/*` for something else, the install command surfaces the conflict and asks the user to pick a different prefix.

## Required client-side modules

The agent generates these inside `debug/` (path adapted to the stack — `src/debug/` for Vite, `app/debug/` for Next.js):

| Module | Purpose |
|--------|---------|
| `debug/panel.{tsx,jsx,vue,svelte}` | The panel UI component. Fixed-position overlay, dockable. Reads current route via the host stack's pathname hook. Renders sections per spec whose surfaces include the current route. Mounted in the root layout. |
| `debug/state.{ts,js}` | Panel state manager — `open: boolean`, `dockPosition: 'left' \| 'right' \| 'bottom' \| 'float'`, `activeTab: 'checkpoints' \| 'flags' \| 'probes' \| 'state'`. State persisted in `localStorage` so the panel remembers its position across reloads. |
| `debug/flags.{ts,js}` | `getDebugFlag(name)` helper. Reads from `localStorage`. Returns `null` if gate is off. Host code uses this for toggleable behavior. |
| `debug/probes.{ts,js}` | Map of name → getter function. The agent generates stubs based on probe declarations in verification.md files. The user fills in the bodies. |
| `debug/hotkey.{ts,js}` | Global keyboard handler. Default: `Ctrl+Shift+D` (or `Cmd+Shift+D` on macOS). **Toggles panel open/closed via `debug/state`.** Does NOT navigate. No-op when gate is off. |
| `debug/gate.{ts,js}` | `isDebugEnabled()` — reads the gate env var. Every other module imports this and short-circuits when false. |

## How the panel chooses what to render

1. Read the current route from the host stack's pathname hook.
2. Fetch `/api/__debug/manifest` (once on first open, cached; refetched on user action).
3. For every spec in the manifest, check if `spec.surfaces` contains a glob that matches the current route. Use a permissive glob match (`/api/auth/*` matches `/api/auth/login`).
4. Render the panel as a vertical sidebar with these regions, top to bottom:
   - **Header** — current route, dock-position picker, close button.
   - **Tab switcher** — Checkpoints / Flags / Probes / Report.
   - **Checkpoints tab** — one collapsible section per matching spec, sorted by spec name. Each section shows:
     - The spec's title + source badge (`contract` for `source: spec`, `snapshot` for `source: code`).
     - Each checkpoint with its `Last result` and timestamp.
     - For automated checkpoints: a "Run now" button that POSTs to `/api/__debug/run-checkpoint` and updates the UI without reloading the page underneath.
   - **Flags tab** — every flag declared in the matching specs' `## Flags exposed` sections, each rendered as a toggle backed by localStorage. Toggling immediately affects the page underneath (which reads via `getDebugFlag`).
   - **Probes tab** — every probe declared in the matching specs' `## State to surface` sections, each rendered as a read-only value, refreshed on a 2-second interval.
   - **Report tab** — a "Copy bug report to clipboard" button + a textarea for the user to add a description before copying.

5. When the user navigates the underlying app (clicks a link, pushes state), the pathname hook fires and the panel re-renders with the new route's matching specs. Same panel, different content.

When the user clicks "Copy bug report to clipboard":
1. The panel collects: current route, all matching specs' names, current flag values, current probe values, the last failing checkpoint (if any), the user-agent string, and the user's description from the textarea.
2. Formats as Markdown matching the structure `/report-bug` produces.
3. Copies to clipboard via `navigator.clipboard.writeText`.
4. Shows a toast: "Bug context copied. Paste it into Claude Code with `/report-bug` to file the report."

## Docking model

The panel has four dock positions, picked from the panel header:

| Position | Layout |
|----------|--------|
| `left` *(default)* | Fixed left side, 100% height, ~360px wide. Page content's left margin is increased by the panel width when open. |
| `right` | Mirror of left — fixed right side, ~360px wide. Page content's right margin is increased. |
| `bottom` | Fixed bottom, full width, ~320px tall. Page content's bottom margin is increased. |
| `float` | Detached. Free-floating draggable card, ~420×600. Does NOT push content. Useful when the user wants to test the page at its natural viewport width without the panel taking space. |

The pushing behavior is the default because the user explicitly wants to see the page underneath re-render as they toggle flags and run checkpoints. `float` mode is for cases where pushing would interfere (e.g. testing how a layout behaves at exactly 1920px wide — the panel can't be eating 360px of that).

## How the panel reads verification.md at runtime

V1 uses **runtime filesystem reads** via the `/api/__debug/manifest` endpoint. The endpoint:

1. Verifies the gate env var is set. If not, returns 404 (so the route looks nonexistent to any caller without the env var).
2. Reads `.github/specs/*/verification.md` via the host stack's FS API (`fs.readFile` for Node, equivalent for others).
3. Parses each file: YAML frontmatter + structured Markdown sections.
4. Returns JSON.

**Known limitation:** if the project is built and deployed as a static artifact that doesn't include `.github/`, the panel can't read the manifest in that deployment. Document this in the install command's output. Static-export support (build-time JSON generation) is future work.

## Stack-specific implementation notes for the agent

### Next.js (app router)

- Panel mount: import `<DebugPanel />` in `app/layout.tsx` and render it after `{children}` so it's globally available.
- API endpoints: `app/api/__debug/manifest/route.ts`, `app/api/__debug/run-checkpoint/route.ts`, `app/api/__debug/probe/route.ts`. Each verifies the env var first; returns 404 if unset.
- Env var: `NEXT_PUBLIC_DEBUG_PANEL` for client-side checks (panel mount, hotkey, flags), plus `DEBUG_PANEL` for the server-side API routes if the user wants separate gating.
- The panel is a client component (`"use client"`) so it can read localStorage.
- Hotkey: registered inside the panel component's mount effect (no separate hotkey component needed since the panel is always present).

### Vite + React SPA

- Panel mount: import `<DebugPanel />` in `App.tsx` (or the root component) and render it at the top level.
- API endpoints: only work if there's a backend. If pure-SPA with no backend, the agent generates a small dev-only Express server alongside (e.g. `debug/server.mjs` started by `npm run dev:debug`) that hosts the three endpoints. Or for fully static deployments, the agent can generate a build-time JSON manifest as a fallback (no run-checkpoint or probe in that mode).
- Env var: `VITE_DEBUG_PANEL` (Vite exposes env vars prefixed with `VITE_` to the client).
- Hotkey: registered inside the panel component, same as Next.js.

### Remix, SvelteKit, Nuxt

- Same pattern as Next.js: panel mount in the root layout (`root.tsx` for Remix, `+layout.svelte` for SvelteKit, `app.vue` for Nuxt), API routes under each framework's API conventions.

### Rails / Django / Phoenix / Laravel

- Panel: a small JS snippet in the main application layout template, gated server-side via a conditional that checks the env var. The snippet imports/inlines the panel component (built separately and served as a static asset, or via a CDN of the user's choice).
- API endpoints: controllers under `/api/__debug/*`.
- Env var: read from `ENV` / `os.environ` / `Application.config`.

In all cases the agent **does not invent a new framework** for the panel — it uses what the project already has. If the panel needs JSX, the project must already have React. If the panel needs Vue, the project must already have Vue. The agent should never propose adding a UI framework to a project that doesn't have one — it would decline the install if there's no rendering option.

## When to decline

The `debug-panel-engineer` agent declines to install if:

- The project has no HTTP routing layer (e.g., a pure library or CLI). The API endpoints need somewhere to live.
- The project's stack has no clean way to gate code behind an env var.
- The project already has an `/api/__debug/*` namespace used for something else.
- The project doesn't have a frontend framework the agent can mount a component into.
- The architect (asked first via the install command) says the stack isn't a fit.

A clean decline is better than a half-working install. The `verification.md` files still exist; the user just doesn't get the panel surface for them.
