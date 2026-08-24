# Skill: scaffolding

The contract for the **Scaffold** — an in-app, dev-only spec overlay. It's the framework's version of browser devtools, but for *intent* instead of runtime state: open it on any page of the running app and see that page's node from the map, its spec at a glance, and an editor for the two halves of every spec — **Invariants** (the non-negotiables) and **Flair** (the choices Claude made that nobody asked for). Like real construction scaffolding, it goes up around the building while you work and comes down cleanly when you're done (`/demolish-scaffold`). The specs — the building — remain.

This is a **framework-canonical** skill — the contract is the same in every adopted project. The `@debug-panel-engineer` agent implements the host wiring per stack, exactly as it does for the web-debug panel.

## Purpose

The canvas (`canvas.html`) is the external map — you go visit it. The Scaffold is the opposite: the map comes to you, embedded in the page you're already looking at. It's aimed at the person who *builds by vibe*: the spec is their source code, so it should read like code (monospace, syntax-colored, in an IDE-dark panel) but in plain language a non-engineer can edit.

The core conceptual split it teaches:

- **Invariants — the non-negotiables.** Rules this page must never break. Sourced from `requirements.md → ## Constraints`. Claude treats these as law.
- **Flair — Claude's choices.** Decisions Claude made that were never specified — styling calls, defaults, copy, structure — plus any other spec detail that isn't a hard rule. All of it is fair game to change. Sourced from `design.md → ## Flair` (created on first save; also emitted into `FEATURE_TREE.json` as `node.flair[]`).

Everything not an invariant is flair. That's the whole taxonomy, on purpose.

## Safety properties — non-negotiable

1. **OFF by default.** Every surface is gated by `SCAFFOLD_PANEL=1` (stack-appropriate variant allowed, e.g. `VITE_SCAFFOLD_PANEL` / `NEXT_PUBLIC_SCAFFOLD_PANEL` for the client flag — but the *server routes* must check a server-side env var). Gate unset or `NODE_ENV === 'production'` → routes return 404, no script injection, nothing renders. Specs can describe security behavior; they must never be served in production.
2. **No AI calls. Ever.** The Scaffold never invokes a model, an API, or the network beyond its own same-origin `/__scaffold/*` routes. Buttons that *look* like actions ("Cover this page") only append a request to a queue file that Claude reads at the next session. This is a hard property, not a default.
3. **Reversible.** `/demolish-scaffold` removes all wiring. `grep -rn 'SCAFFOLD_PANEL\|/__scaffold' .` (excluding `.github/`) must come back empty afterward.
4. **Bounded writes.** The save route may write to exactly three places, nothing else, no arbitrary paths:
   - `.github/specs/{feature}/requirements.md` — only the text between `## Constraints` and the next `## ` heading,
   - `.github/specs/{feature}/design.md` — only the text between `## Flair` and the next `## ` heading (append the section if absent),
   - `.github/scaffolding/requests.json` — append/remove entries.
   Reject node ids that don't match `^[a-z0-9-]+$`, cap request bodies at 64 KB, and never follow `..` path segments.
5. **No secrets.** The data route serves `FEATURE_TREE.json` and spec markdown — never env values, never files outside `.github/` + the tree.

## The mount model — overlay, not a route

Same insight as the web-debug panel: the point is to see the spec of *the page you're on*, so the Scaffold is a globally-mounted overlay, not a separate page. The overlay UI itself ships **prebuilt with the framework as `scaffold.js`** (repo root, next to `canvas.html`) — self-contained vanilla JS, Shadow-DOM isolated so host CSS can't bleed in or out. The host never implements UI; it only serves the file and three JSON routes.

`scaffold.js` behavior (already implemented — listed here so the engineer knows what the wiring must feed):

- Renders a small fixed pill (bottom-right, "⌂ Scaffold" + status dot + queued-request badge). Click → right-hand drawer (~400px). `Esc` closes. Collapsed/open state and active tab persist in `localStorage`.
- Matches the current route to a node: exact match from `routes.json` first, then heuristics (id/title-slug vs path segments, `surfaces[]` mentions, source-file basename). SPA navigation is tracked (`pushState`/`popstate` hooks) and the panel re-matches on route change. "Change" lets the user pick manually from the All-specs list.
- **This page** tab, reading mode: node card (status, room, kind, verification X/Y, todo counts, depends-on chips) → action row (Cover / Verify / Spec — each queues a request) → **Edit spec** / **Copy** → collapsible **Invariants** and **Flair** sections.
- **This page** tab, editing mode: the whole spec as **one Markdown document** in a syntax-highlighted editor — a `<pre>` highlighter sitting exactly under a transparent-text `<textarea>`, so typing stays fully native (no caret tricks, no lost undo history); every font/padding/line-height metric matches between the two layers or the colours drift off the text. Two headings carry all the meaning: `## MUST NEVER CHANGE` → invariants, `## CAN CHANGE` → flair, one bullet per item. Toolbar: **S/M/L/XL** type size (persisted), **copy** (the whole document to the clipboard — the panel is a reading-and-editing surface, and pasting the spec into a Claude session is a first-class exit), **cancel**, **save** (also ⌘/Ctrl-S). Dirty edits are guarded on tab change, node change, close, Esc, and page unload. The drawer widens while editing.
- **All specs** tab: every node grouped by room, searchable — features and specs at a glance.
- **Requests** tab: the queue, with remove, plus a free-text "note to Claude".
- IDE color-coding throughout: MUST/NEVER/ALWAYS-style keywords highlighted like keywords, `code` spans, file paths and quoted strings like strings, numbers like numerals; statuses use the framework's planned/in-progress/built/verified colors.
- Copy is ELI5: "Rules this page must never break — Claude treats these as law" / "Choices Claude made that you never asked for — edit freely."
- Degrades gracefully: data route unreachable → the pill still renders and the drawer explains the wiring/gate fix.

## Required surfaces (what the engineer wires per stack)

| Surface | Type | Contract |
|---|---|---|
| script injection | dev-only | Inject `<script defer src="/__scaffold/scaffold.js"></script>` into served HTML **only when the gate is on and not production** — via the root layout/template conditional, or dev-server HTML middleware. |
| `GET /__scaffold/scaffold.js` | route | Serve the framework's `scaffold.js` from the repo root. Gate-checked. |
| `GET /__scaffold/data` | route | `{ tree, routes, requests, editable }` — `tree` = parsed `FEATURE_TREE.json` (repo root by default; path configurable in the wiring if the project keeps it elsewhere), `routes` = parsed `.github/scaffolding/routes.json` (`{}` if absent), `requests` = parsed `.github/scaffolding/requests.json` (`[]` if absent), `editable: true` when the server can write (set `false` for read-only mounts). Gate-checked. |
| `POST /__scaffold/save` | route | Body `{ node, invariants?: string[], flair?: string[] }` — the panel edits both halves as one document and sends whichever it parsed (the older `{ node, section, items }` form stays accepted). If the node has a spec dir (`.github/specs/{node}/`): surgically rewrite each supplied section (bullet list, one `- item` per line) per safety property 4 — `invariants` → `requirements.md` `## Constraints`, `flair` → `design.md` `## Flair` — append one `{ action: "spec-edited", node }` entry to the queue so Claude reviews the change next session, respond `{ ok, mode: "saved" }`. If it's a stub (no spec dir): append a `{ action: "note", node, note: <items joined> }` request instead and respond `{ ok, mode: "queued" }`. **The server never parses Markdown** — `scaffold.js` owns the document grammar and sends plain arrays, which keeps the bounded-writes property simple to audit. |
| `POST /__scaffold/request` | route | Body `{ action: "cover"\|"verify"\|"spec"\|"note", node, route, note }` → append `{ id, ts, action, node, route, note }` to `.github/scaffolding/requests.json` and respond `{ ok, requests }` (the updated queue). Body `{ remove: id }` → drop that entry, same response. Gate-checked. |

The `/__scaffold` prefix is hardcoded for v1 (double underscore = system, not user-facing). Conflict → surface it and ask, same as the debug panel.

## The request queue — how flags reach Claude

`.github/scaffolding/requests.json` is an append-only-ish JSON array. It is the *entire* AI integration: no API call happens at click time. The loop closes at the next session — `/standup` prints a **Scaffold requests** section listing the queue, and the user (or Claude, on their say-so) acts on the entries (`/cover {node}`, `/verify {node}`, `/spec`), then clears them. Entries carry `id` (timestamp-random slug), `ts` (ISO), `action`, `node` (nullable — a request can target an unmapped route), `route`, `note`.

`.github/scaffolding/routes.json` is an optional manual route→node map (`{ "/admin/accounts": "admin-accounts" }`) for pages the heuristic matcher gets wrong. Both files are created by `/install-scaffold`, live in the repo, and are **not** framework-managed (never overwritten by `/update-framework`).

## Stack-specific wiring notes

- **Express / Node servers:** a single dev-only middleware module (e.g. `server/scaffold-dev.js`) mounted before routes: serves the script, the three JSON routes, and (if the server renders/serves HTML) injects the script tag. ~60 lines.
- **Vite / CRA SPAs:** a Vite dev-server plugin (`configureServer`) provides the routes + `transformIndexHtml` injects the tag. Client gate via `import.meta.env.VITE_SCAFFOLD_PANEL` only controls injection; the plugin checks the server env.
- **Next.js:** route handlers under `app/__scaffold/` (or `pages/api/__scaffold/`) + conditional `<Script>` in the root layout, both dev-gated.
- **Rails / Django / Laravel:** a dev-only controller/blueprint + template conditional in the base layout.
- **Split client/server deployments** (client on Vercel, API elsewhere): wire the Scaffold into the **local dev server only**. It has no production story by design.

## When to decline

Decline to install when: there's no `FEATURE_TREE.json` and the user won't run `/feature-tree` first (the Scaffold with no map is an empty drawer); the project has no dev server that serves HTML (pure API — point them at the canvas instead); or the only way to mount would inject into production bundles.
