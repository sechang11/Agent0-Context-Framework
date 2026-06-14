---
mode: agent
description: Regenerate FEATURE_TREE.md AND FEATURE_TREE.json at the repo root — a comprehensive table-of-contents of every knowledge artifact in the project (features, bugs, themes, latest reports), plus a machine-readable graph projection that the feature canvas (canvas.html) renders. One walk, two projections. Agent-driven; no script.
---

# /feature-tree

Regenerate two files at the **main tree's** repo root (resolve via `git rev-parse --path-format=absolute --git-common-dir | xargs dirname` — see `.github/AGENTS.md` → "Knowledge artifacts and worktrees"):

- **`FEATURE_TREE.md`** — the human/agent-readable index (below).
- **`FEATURE_TREE.json`** — a machine-readable graph projection of the same data, rendered by the feature canvas (`canvas.html`). Conforms to `.github/schemas/feature-tree.schema.json`. See `docs/feature-canvas.md`.

Both are produced from a **single walk** over the project. The Markdown is for reading; the JSON is for rendering. Compose them together so they never drift.

The Markdown index covers:

- **Features** — every directory under `.github/specs/` with type (spec/cover), 1–2 sentence summary, verification status, and clickable file links.
- **Bugs** — every report under `.github/bugs/` grouped by status (open / in-progress / resolved).
- **Themes** — every theme under `.github/themes/` with mood + adoption status.
- **Latest reports** — pointers to `PROGRESS_REPORT.md` and `NEXT_STEPS.md` with their freshness timestamps.
- **Framework state** — installed version + mode.

Single-file TOC for everything the framework knows about the project.

This is one of two ways the file gets updated:

1. **Implicit**: `/spec`, `/cover`, and `/verify` each include a "regenerate FEATURE_TREE.md" step at the end. Most updates happen automatically.
2. **Explicit**: this command. Run when you want to force a refresh — after manual file edits, after deleting a feature directory, or when something looks stale.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/feature-tree` | Regenerate `FEATURE_TREE.md`, print a short summary to chat with a link to the file. |
| `/feature-tree --check` | Dry run — describe what would change without writing. Useful for sanity-checking before a destructive edit. |
| `/feature-tree --verbose` | After writing, also print the full content to chat. |

## Phase 1 — Resolve paths

1. Resolve the main tree path:
   ```bash
   MAIN_TREE=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```
2. The target files are `${MAIN_TREE}/FEATURE_TREE.md` and `${MAIN_TREE}/FEATURE_TREE.json`.
3. The specs directory is `${MAIN_TREE}/.github/specs/`.
4. The rooms registry (optional) is `${MAIN_TREE}/.github/specs/_rooms.yml`. Read it if present — it enriches rooms with title/icon/order/summary. If absent, rooms are derived from the distinct `room` values across features.

If `${MAIN_TREE}/.github/specs/` doesn't exist (project has no features yet), write minimal placeholder files for both (see Phase 4) and exit cleanly.

## Phase 2 — Walk every feature directory

For each directory under `${MAIN_TREE}/.github/specs/` (excluding `_template/`, `_design/`, and any directory starting with `_`):

1. The feature name is the directory name.
2. Check which files exist:
   - `requirements.md` — present means there's a spec (contract)
   - `verification.md` — present means there's a verification
   - `design.md`, `tasks.md`, `ui.md` — optional, list them if present
3. Read frontmatter from `verification.md` (if present):
   - `source: spec` → type is **spec** (contract — describes desired behavior)
   - `source: code` → type is **cover** (snapshot — describes current behavior)
   - `status: passing | failing | pending | partial | draft | ready` → status of last run
   - `last_verified` → timestamp
4. Read the first paragraph of `requirements.md` (if present) OR the philosophy section / first paragraph of `verification.md` to extract a 1–2 sentence summary. Stop at the first blank line. Strip Markdown formatting for the summary.
5. If neither file exists, the directory is incomplete — note as "scaffolded but no content yet" and move on.

### Phase 2a — gather the extra fields the JSON needs

The Markdown index only needs steps 1–5. The JSON graph (Phase 3b) needs a bit more per feature. Gather it in the same pass — it's all cheap frontmatter/section reads:

- **Topology** — read the topology frontmatter from `verification.md` first, then `requirements.md` as a fallback (verification.md wins on conflict; merge missing keys from requirements.md). Keys: `id` (default: dir name), `kind` (default: `feature`; one of `page`/`component` = frontend · `endpoint`/`service` = backend · `schema` = data · `integration` = external · `feature` = a vertical slice — the **room is the domain, the kind is the layer**), `room` (default: null/ungrouped), `depends_on` (default: `[]`), `title` (default: titleized id), `summary` (default: the step-4 summary).
- **Detail** (the "full version") — first paragraph of `design.md` `## Approach`. If no `design.md`, fall back to the first paragraph of `verification.md`'s body (after any caveat block), else reuse the summary.
- **Checkpoints** — from `verification.md` `## Checkpoints`, each `### CP-N: {label}` block. Capture `Type`, `Surface`, and normalize `Last result` to a state: `pass` / `fail` / `skip` / `not-run` (from "not yet run") / `pending` (collapse "pending: needs X", keep the X as `pendingReason`). Count `passing` (state == pass) and `total`.
- **Todo board** — two sources, merged into the `done` / `doing` / `next` columns (dedupe identical labels):
  1. **Formal tasks** — from `tasks.md`, the checkbox state per task line: `- [x]` → `done`, `- [~]` → `doing`, `- [ ]` → `next`. Strip the `**[component]**` prefix. Legacy numbered tasks (`1. ...`, no checkbox) all count as `next`.
  2. **User-added items** — plain bullets under a `## Done`, `## Doing`, or `## Next` heading in ANY of the feature's `.md` files (tasks.md, requirements.md, …). Add each to the matching column. These are the user's free-form queue, not PR-sized tasks. Skip placeholder/comment bullets (e.g. `<!-- ... -->` or empty `- `).
  Empty/absent → empty board.
- **Surfaces** — the bullet list under `verification.md` `## Surfaces`, verbatim (one string per bullet).
- **Invariants** — the bullet list under `requirements.md` `## Constraints` (plus any hard rules stated in `design.md`), one short line each. These are the rules that must not break; the canvas shows them in the detail panel.
- **Node status** (derived, see "Node status" below).

Process in alphabetical order by feature name.

### Node status

Derive each node's `status` (used by the canvas) with this precedence — stop at the first match:

1. **verified** — verification.md `status: passing`.
2. **in-progress** — verification.md status is `failing` / `partial` / `pending`, OR `tasks.md` has any `- [~]`, OR tasks.md has a mix of `[x]` and `[ ]`.
3. **built** — all tasks are `- [x]` done (and at least one exists) with no passing verification yet, OR verification.md status is `draft` / `ready`.
4. **planned** — none of the above (scaffolded, or spec'd but not built).

## Phase 2b — Walk bugs, themes, reports

After collecting features, gather the other artifact categories. Skip silently if a directory is missing or empty.

### Bugs (`${MAIN_TREE}/.github/bugs/`)

For each `*.md` file (excluding `README.md`):

1. Read the frontmatter / first lines to extract:
   - The bug ID (filename without extension)
   - The title (first H1 or the `Title:` field)
   - The status (`open` / `in-progress` / `resolved` / `wont-fix` / `cant-reproduce` — from the file's status field)
   - The filed-date (from the timestamp prefix of the filename or the `Filed:` field)
2. Group by status. Display order: open → in-progress → resolved → wont-fix / cant-reproduce (collapsed).

### Themes (`${MAIN_TREE}/.github/themes/`)

For each subdirectory (excluding `_template`):

1. Read `THEME.md` frontmatter for `mood` and `source` (`created` / `imported` / `mixed`).
2. Check `${MAIN_TREE}/.github/themes/.adopted` to see if any is currently adopted; mark with a ★.

### Latest reports

Check existence and `Generated:` timestamp of:

- `${MAIN_TREE}/PROGRESS_REPORT.md`
- `${MAIN_TREE}/NEXT_STEPS.md`

### Framework state

- Read `${MAIN_TREE}/.github/.framework-version` for installed version
- Read `${MAIN_TREE}/.github/.agent0-mode` for mode (defaults to `review` if absent)

## Phase 3 — Compose the content

Write `FEATURE_TREE.md` with this structure:

```markdown
# Project Index

Auto-generated by Agent0. Last updated: {YYYY-MM-DD HH:MM}.

Don't edit by hand — this file is regenerated by `/feature-tree` and by `/spec`, `/cover`, `/verify` after they write their own files. To change a summary, edit the source file and re-run `/feature-tree`.

**Framework:** Agent0 v{installed_version} ({mode})
**Features:** {N} ({S} specs · {C} covers · {I} scaffolded)
**Open bugs:** {B}
**Themes:** {T} (★ {adopted-name})
**Last report:** {PROGRESS_REPORT timestamp or "—"}
**Last next-steps:** {NEXT_STEPS timestamp or "—"}

---

## Features

### {feature-name-1}

- **Type:** spec (contract) | cover (snapshot) | scaffolded
- **Summary:** {1–2 sentence summary from requirements.md or verification.md}
- **Status:** {passing 4/4 | failing 1/4 with 3 pendings | pending 2/4 | not yet run | draft}{ · last run {timestamp}}
- **Files:** {Markdown-link list of all present files for this feature, comma-separated}

### {feature-name-2}

- …

---

## Bugs

### Open ({N_open})

- [{bug-id}]({absolute path}) — {title} · filed {date}
- …

### In-progress ({N_inprog})

- …

### Resolved ({N_resolved}) — collapsed

<details>
<summary>Show {N_resolved} resolved</summary>

- [{bug-id}]({path}) — {title} · resolved {date}
- …

</details>

(Omit the entire **Bugs** section if `.github/bugs/` is empty or absent.)

---

## Themes

- ★ **{adopted-theme-name}** ({mood}) — currently adopted — [THEME.md]({absolute path})
- **{other-theme-name}** ({mood}) — [THEME.md]({absolute path})
- …

(Omit the entire **Themes** section if `.github/themes/` is empty or absent.)

---

## Latest reports

- [PROGRESS_REPORT.md]({absolute path}) — generated {timestamp}  *(or "_Not yet generated. Run `/report` for a full health check._" if missing)*
- [NEXT_STEPS.md]({absolute path}) — generated {timestamp}  *(or "_Not yet generated. Run `/nextsteps` for prioritized recommendations._" if missing)*

---

_File generated from `.github/specs/`, `.github/bugs/`, `.github/themes/`, and the repo root. To add or remove items, create or delete the corresponding files and re-run `/feature-tree` (or any command that auto-regenerates it: `/spec`, `/cover`, `/verify`)._
```

The header section shows aggregate stats. Each section appears only if it has content (no empty sections cluttering the file).

For features that are scaffolded but have no content: still list them, with `**Type:** scaffolded` and summary "_No content yet. Create requirements.md (and run `/verify --bootstrap`) or run `/cover` to populate._"

## Phase 3b — Compose and write `FEATURE_TREE.json`

From the **same** gathered data (Phase 2 + 2a), compose the graph JSON and write it to `${MAIN_TREE}/FEATURE_TREE.json`. It must conform to `.github/schemas/feature-tree.schema.json`. `FEATURE_TREE.example.json` at the repo root is a complete worked example — match its shape exactly.

Top-level keys:

- `version`: `"1"`.
- `generated`: the same `{YYYY-MM-DD HH:MM}` timestamp as the Markdown.
- `framework`: `{ "version": {installed_version}, "mode": {mode} }`.
- `rooms`: one entry per room. Start from `_rooms.yml` (if present) for title/icon/order/summary. Then ensure every distinct `room` value referenced by a feature exists — auto-create missing ones with `title` = titleized id and no icon. Don't emit a room that has no features and isn't in `_rooms.yml`.
- `nodes`: one entry per feature directory (Phase 2/2a). Map fields straight across: `id`, `kind`, `room` (null if ungrouped), `title`, `summary`, `detail`, `status`, `surfaces`, `invariants`, `dependsOn` (from `depends_on`), `todo`, and `artifacts`.
  - `verification`: `null` if no `verification.md`. Otherwise `{ source, statusRaw, lastVerified, passing, total, checkpoints[] }` where each checkpoint is `{ id, label, type, surface, state, pendingReason? }`.
  - `artifacts`: `{ "spec": "{ABS path to .github/specs/{id}/}", "files": { role: "{ABS path}" } }` — include only files that exist, keyed by role (`requirements`, `design`, `tasks`, `verification`, `ui`). Use absolute paths under `${MAIN_TREE}` (same rule as Markdown links — so Claude Code and the canvas can open them).
- `edges`: flatten every node's `dependsOn` into `{ "from": node.id, "to": dep, "type": "depends-on" }`. Skip edges whose `to` isn't a known node id, but keep the id in the node's `dependsOn` (a dangling dependency is still information).
- `bugs`: the open/in-progress bugs from Phase 2b as `{ id, title, status, node }`. Set `node` only if a bug clearly references a feature (e.g. its title or a `feature:` field names one); otherwise `null`. Omit resolved bugs.
- `stats`: `{ features, rooms, verified, inProgress, openBugs }` computed from the nodes/bugs.

Emit **valid JSON** — double-quoted keys, no trailing commas, no comments. Escape strings properly. Keep summaries/details to one line each (collapse newlines to spaces). When in doubt about a field's shape, copy the example.

Like the Markdown, this file is **regenerated, not edited** — always overwrite. `--check` describes the JSON diff without writing; `--verbose` may print the node count but not the full JSON (it's large).

## Phase 4 — Edge cases

### Empty project (no `.github/specs/` directory)

Write:

```markdown
# Project Index

Auto-generated by Agent0. Last updated: {YYYY-MM-DD HH:MM}.

**Framework:** Agent0 v{version} ({mode})

This project has no features yet. Get started:

- `/spec {feature-name}` to write a new feature with a contract.
- `/cover {feature-name}` to document an existing feature already in the code.
- `/cover --discover` to scan the codebase and propose feature boundaries.
```

Also write a minimal `FEATURE_TREE.json`: `{ "version": "1", "generated": "{timestamp}", "framework": { "version": "{version}", "mode": "{mode}" }, "rooms": [], "nodes": [], "edges": [], "bugs": [], "stats": { "features": 0, "rooms": 0, "verified": 0, "inProgress": 0, "openBugs": 0 } }`. The canvas renders an empty state from it.

If bugs / themes / reports exist but features don't, still emit those sections in the Markdown (they're independent of features). The JSON still has `nodes: []` but can carry `bugs`.

### Only the `_design/` or `_template/` directories present

Treat as empty for feature counting purposes. List nothing.

### A feature directory has unexpected files

If a feature directory contains files Agent0 doesn't recognize (e.g. a `notes.md` the user added), don't list them. The Files row covers Agent0-managed files only. Don't error.

## Phase 5 — Print the summary

After writing the file:

```
═══ /feature-tree regenerated — {YYYY-MM-DD HH:MM} ═══

  Framework:  Agent0 v{version} ({mode})

  Features:   {N} ({S} specs · {C} covers · {I} scaffolded)
    Verification: {P} passing · {F} failing · {Pend} pending · {NR} not yet run

  Bugs:       {N_bugs_total} ({N_open} open · {N_inprog} in-progress · {N_resolved} resolved)
  Themes:     {T} (★ {adopted-name, or "(none adopted)"})
  Reports:    PROGRESS_REPORT {existence + age} · NEXT_STEPS {existence + age}

  {Changes since last regen (if detectable):}
    + added:    feature-name (new directory)
    - removed:  feature-name (directory deleted)
    ~ updated:  feature-name (verification status or summary changed)
    + bug:      bug-id (new)
    ~ bug:      bug-id (status changed)
    ({Otherwise: "No structural changes."})
```

**Written to:** [FEATURE_TREE.md]({absolute path to FEATURE_TREE.md}) · `FEATURE_TREE.json` ({node count} nodes — view with `canvas.html`)

## Rules

- **Both files are knowledge artifacts** — `FEATURE_TREE.md` and `FEATURE_TREE.json` are always written to the main tree path resolved from `git rev-parse`, never to a worktree. Per `.github/AGENTS.md` → "Knowledge artifacts and worktrees."
- **Keep the two in sync.** They're composed from the same walk in one run. Never write one without the other (except `--check`, which writes neither).
- **The files are regenerated, not edited.** Always overwrite. The previous content is discarded. Don't try to preserve user edits — there shouldn't be any.
- **The JSON must be valid and schema-conformant.** No comments, no trailing commas, double-quoted keys. When unsure of a field's shape, copy `FEATURE_TREE.example.json`. A malformed JSON breaks the canvas — if you can't produce valid JSON for a feature, omit that node rather than emitting broken JSON, and note it in the summary.
- **`--check` writes nothing.** Compose what would be written, diff against the existing files, report the diff for both. No writes.
- **Don't fail if a feature is malformed.** Missing frontmatter, unreadable file, weird Markdown — note as "(malformed)" in the Markdown summary, give the JSON node sensible defaults (kind feature, ungrouped, planned), and continue with the rest.
- **Read-only on `.github/specs/`.** Never modify a feature's files. This command only reads and emits the index.
- **Don't commit.** Same as every other slash command.
- **Be fast.** This command runs frequently (after `/spec`, `/cover`, `/verify`). The extra JSON fields are all cheap frontmatter/section reads in the same pass — don't deep-read source code. It's an index, not a review.
