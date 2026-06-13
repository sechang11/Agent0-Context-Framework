# The feature canvas

A clickable, visual map of every "room" in your app, the features inside each, their
verification checkpoints, and an ongoing done / doing / next board per feature. It answers,
at a glance: **what exists, what's in flight, what's next, and what depends on what.**

The canvas is not a new system you maintain by hand. It's a **read-only window** onto the
Markdown artifacts Agent0 already produces. You edit specs and run commands; the canvas
re-renders. The agent owns the data; you just look at it.

```
.github/specs/{feature}/*.md   ──/feature-tree──▶   FEATURE_TREE.json   ──▶   canvas.html
   (you + agents edit these)        (rolls up)        (generated)            (you view this)
```

---

## The two layers

### 1. `FEATURE_TREE.json` — the data

Generated at the repo root by `/feature-tree`, right next to the human-readable
`FEATURE_TREE.md`. Same walk over `.github/specs/`, `.github/bugs/`, etc. — one pass, two
projections. Markdown is for humans and agents to read; JSON is the machine-readable graph
the canvas renders. **Never hand-edit it** — change the source Markdown and re-run
`/feature-tree`.

Its shape is defined by [`.github/schemas/feature-tree.schema.json`](../.github/schemas/feature-tree.schema.json),
and [`FEATURE_TREE.example.json`](../FEATURE_TREE.example.json) is a complete worked example.

A **node** is a feature / endpoint / component / schema / integration. Each node carries:

| Field | Comes from | Meaning |
|---|---|---|
| `id` | spec dir name (or `id:` frontmatter) | Stable handle. The one thing that must not change — edges point at it. |
| `kind` | topology frontmatter (default `feature`) | feature · endpoint · component · schema · integration — the canvas's layer filter. |
| `room` | topology frontmatter | Which room (group) it belongs to. Builds the tree. |
| `summary` / `detail` | `requirements.md` 1st paragraph / `design.md` ## Approach | AI short + full version. Not spec files — a rollup. |
| `status` | derived (see below) | planned · in-progress · built · verified. |
| `verification.checkpoints` | `verification.md` `### CP-N` blocks | The verification checkpoints, with pass/fail/pending state. |
| `todo` | `tasks.md` checkbox state | done (`[x]`) · doing (`[~]`) · next (`[ ]`). |
| `surfaces` | `verification.md` ## Surfaces | Routes / endpoints / commands the feature exposes. |
| `dependsOn` | topology frontmatter | Ids this node depends on — the edges of the graph. |

### 2. `canvas.html` — the viewer

A single self-contained file at the repo root. No build step, no dependencies. Open it three ways:

- **Served over http (recommended):** from the repo root, run `python -m http.server` (or any
  static server) and open `http://localhost:8000/canvas.html`. It auto-loads `FEATURE_TREE.json`.
- **Opened directly (`file://`):** browsers block reading local JSON, so it shows a built-in
  demo. **Drag your `FEATURE_TREE.json` onto the page** to load it.
- **Anywhere:** drag-and-drop any `FEATURE_TREE.json` onto the window.

It has two views, sharing one detail panel and one set of filters (room · kind · search). Click
any node in either view → the right panel shows its summary (expandable to the full version),
verification checkpoints, the done/doing/next board, its surfaces, any **bugs pinned to it**, and
clickable `dependsOn` chips. Nodes with open bugs carry a small red count badge in both views.

- **Tree** — rooms → features, grouped by containment. Good for "what exists, where."
- **Graph** — an auto-laid-out dependency graph (a small layered/Sugiyama layout, computed in the
  browser — no layout library). Rooms become labelled **clusters** (swimlanes), so you see grouping
  and dependencies at once. Within and across clusters, foundations (schemas, integrations) settle
  at the bottom; the features built on them rise to the top; arrows point from a feature to what it
  depends on. Pan by dragging, zoom with the wheel or the +/−/fit buttons.

  **The payoff interaction:** click a node and the graph answers two questions at once —
  everything that **depends on it** (highlighted, with an "affected if changed" count) and
  everything **it needs** (its dependency subtree), dimming everything unrelated. That's the
  "what breaks if I touch Payments?" question made visual. Filtering by `kind` removes a whole
  layer (e.g. hide `schema` to see only the feature-to-feature graph); edges to hidden nodes drop out.

### 3. Put it online (auth-gated) — `canvas-server.cjs`

To view the canvas from anywhere (not just localhost), the framework ships a portable,
**password-protected** server: [`canvas-server.cjs`](../canvas-server.cjs). It's a plugin, not an
app integration — zero dependencies (Node built-ins only), and it **only ever serves `canvas.html`
and `FEATURE_TREE.json`** from an allowlist. It never imports your app and never exposes source,
specs, or secrets, even though it runs in the project directory.

> ⚠️ `FEATURE_TREE.json` is an internal map — for many projects it names endpoints, file paths, and
> security details. **Don't host it on an open public URL.** This server gates everything behind
> HTTP Basic Auth; keep it that way (or sanitize the JSON first).

Environment:

| Var | Meaning |
|---|---|
| `CANVAS_PASSWORD` | **Required.** The server refuses to start without it. |
| `CANVAS_USER` | Basic-auth username. Default `admin`. |
| `PORT` | Listen port. Default `8080`. Railway / Render / Fly set this automatically. |
| `CANVAS_ROOT` | Where `canvas.html` + `FEATURE_TREE.json` live. Default: the current directory. |

**Locally:**

```bash
CANVAS_PASSWORD=your-secret node canvas-server.cjs
# open http://localhost:8080 and log in with admin / your-secret
```

**On a host (Railway / Render / Fly / any Node host)** — deploy it as its own service so the app
stays untouched. The deployable unit is just three files together: `canvas-server.cjs`,
`canvas.html`, and the project's `FEATURE_TREE.json`.

- Start command: `node canvas-server.cjs`
- Set `CANVAS_PASSWORD` (and optionally `CANVAS_USER`) in the service's variables.
- The host provides `PORT`; the server reads it. Done.

Because it's a standalone service, the same recipe works for **every** project regardless of its own
stack (Vercel, Cloudflare, bare metal) — the canvas plugin is always the same Node server.

---

## Capturing the data: topology frontmatter

Most node fields are already inferable from your specs. The three that aren't — `room`,
`kind`, `dependsOn` — are declared in a small **topology** frontmatter block. It's canonical
in `verification.md` (both `/verify` and `/cover` produce that file), and can be declared
early in `requirements.md` (carried forward when `/verify` bootstraps the verification).

```yaml
---
spec: payments
source: spec
status: partial
# --- topology (feature canvas) ---
kind: feature              # feature | endpoint | component | schema | integration
room: checkout             # which room this belongs to (see .github/specs/_rooms.yml)
depends_on: [payments-api, cart-schema]   # ids of nodes this one needs
# id / title / summary default from the dir name + requirements.md; override here if needed
---
```

All topology fields are **optional**. Omit them and the node still appears: `kind` defaults to
`feature`, `room` to ungrouped, `depends_on` to none. The framework degrades gracefully — a
project that declares nothing still gets a flat canvas; a project that declares rooms and
dependencies gets a real map.

### Rooms registry (optional polish)

[`.github/specs/_rooms.yml`](../.github/specs/_rooms.yml) gives rooms a display title, an icon,
an order, and a one-line summary. If it's absent, rooms are auto-created from the distinct
`room` values and titleized. It only adds polish that can't be inferred.

### The todo board: `tasks.md` checkbox convention

The done/doing/next board is read straight from `tasks.md` checkbox state:

```markdown
## Tasks

- [x] **[api]** Create PaymentIntent endpoint
- [x] **[api]** Add idempotency keys
- [~] **[api]** Reconcile charges from the Stripe webhook   ← [~] means "doing"
- [ ] **[ui]** Handle declined cards
- [ ] **[ui]** Apple Pay
```

`[x]` → done · `[~]` → doing · `[ ]` → next. Order is preserved (still one PR per task).
Legacy numbered task lists still parse — every task is treated as `next`.

---

## Node status, derived

`status` is computed, not declared, in this precedence:

1. **verified** — `verification.md` status is `passing`.
2. **in-progress** — verification has been run but isn't all passing (`failing`/`partial`/`pending`),
   or `tasks.md` has any `[~]`, or there's a mix of `[x]` and `[ ]`.
3. **built** — all tasks `[x]` done but no passing verification yet, or verification is `draft`/`ready`.
4. **planned** — no implementation signal yet (scaffolded, or spec'd but not built).

---

## What else can go on the map

Everything is one graph filtered by `kind`, never separate canvases. Beyond features:

- **Schemas / entities** (`kind: schema`) — an ERD layer.
- **Endpoints** (`kind: endpoint`) — the API surface.
- **Components** (`kind: component`) — the component tree, via `room`/containment.
- **Integrations** (`kind: integration`) — external services.
- **Bugs** — pinned to a node via the `bugs[]` array (mirrors `FEATURE_TREE.md`).

Toggle a kind off in the canvas header to hide that layer.

---

## Why it stays in sync

`/feature-tree` already runs automatically at the end of `/spec`, `/cover`, and `/verify`. Since
the JSON is emitted by that same command, it refreshes whenever your specs or verification
results change — no separate step, nothing to keep in sync by hand. Run `/feature-tree` manually
after editing spec files directly.
