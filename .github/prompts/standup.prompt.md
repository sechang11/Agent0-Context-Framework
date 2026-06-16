---
mode: agent
description: Print an instant, deterministic project digest in the terminal — In progress, Ready to pick up, Needs attention, Keystones, Dependency cycles, Coverage — read straight from FEATURE_TREE.json. The in-chat twin of the canvas "Project pulse". Read-only. Works offline.
---

# /standup

Open the session with a one-screen read of where the whole project stands — computed straight from `FEATURE_TREE.json`, printed in chat, no browser. What's in flight, what's unblocked and ready to pick up, what's on fire, which nodes are load-bearing, and where the dependency graph is tangled.

This is the **terminal-native twin of the canvas "Project pulse" button** (`canvas.html`): the exact same structural read, but in the terminal where you're already working, so the command-center isn't a separate website you have to go visit. Make it the first thing you run each session.

Everything here is **deterministic and structural** — pure counting and graph traversal over the JSON, no AI judgment. For AI-judged, rationale-backed priorities, run `/nextsteps` (it writes `NEXT_STEPS.md`). `/standup` answers "where do things stand right now?"; `/nextsteps` answers "what's the smartest thing to do next, and why?".

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/standup` | Full project digest — every section, lists truncated to fit one screen. |
| `/standup {room}` | Scope the digest to one room (match by room id or title, case-insensitive). Keystones/cycles still computed over the full graph so cross-room blast radius stays accurate; sections then filtered to that room's nodes. |
| `/standup --full` | Don't truncate any list — show every in-progress node, every ready item, every flagged item. |

## Phase 1 — Locate and load the map

1. Resolve the main tree's repo root (the map lives there, not in a worktree):
   ```bash
   MAIN_TREE=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```
   If that fails (not a git repo), use the current working directory.
2. Read `${MAIN_TREE}/FEATURE_TREE.json`.
   - If it doesn't exist, this project hasn't generated a map yet. Print exactly:
     `No FEATURE_TREE.json yet — run /feature-tree to generate the map, then /standup.` and stop. Don't error.
   - If it exists but won't parse, say so plainly (`FEATURE_TREE.json is present but didn't parse — it may be mid-write; try /feature-tree to regenerate.`) and stop.
3. Parse it. The fields you'll use: `nodes[]` (each with `id`, `title`, `status`, `room`, `dependsOn[]`, `verification`, `todo.{doing,next}`, `artifacts`), `bugs[]` (`title`, `status`, `node`), and optionally `rooms[]`, `stats`, `generated`.

**Field realities** (so the digest stays correct on real data — most nodes are lightweight stubs):
- `status` ∈ `planned | in-progress | built | verified`. **`built` ≠ `verified`** — built means shipped without a verification contract.
- `verification` is usually `null` (a node only carries an object once it's `/cover`-ed or `/spec`+`/verify`-ed). When present it has `{ source, statusRaw, lastVerified, passing, total, checkpoints[] }`. **`passing`/`total` are the authoritative aggregate counts** — the inline `checkpoints[]` array is a truncated subset, so never recompute pass counts by iterating it.
- `todo` is always present with `{ done, doing, next }`, but the arrays are frequently empty on stubs.
- `dependsOn` is the edge layer; absent/empty on many nodes. `room` is normally set; treat `null` as "ungrouped".

## Phase 2 — Compute the digest (port of the canvas pulse, exactly)

Let `N` = `nodes[]`, and `by` = a map from `id` → node.

**Helpers (compute once):**

- **Reverse adjacency `rev`:** for every node `n`, for every `d` in `n.dependsOn`, append `n.id` to `rev[d]`. So `rev[x]` = the ids that directly depend on `x`.
- **`blast(id)` — transitive dependents (blast radius):** flood `rev` outward from `id`, collecting every reachable id into a set; then remove `id` itself from the set (cycle-safe); return the set's size. This is "how many other nodes would be affected if this one broke."
- **`verOrBuilt(id)`:** true iff `by[id]` exists **and** its `status` is `verified` or `built`. (A dangling id — not in `by` — is false, i.e. blocking.)
- **`active` set:** `N` filtered to nodes where `verification` is present **OR** `status` is `planned` **OR** `status` is `in-progress`. This pool feeds In-progress, Ready-to-pick-up, and the Next items.

**Sections (compute each; preserve original JSON node order unless a sort is stated):**

1. **In progress** — `inProg` = `active` where `status === 'in-progress'`. Header count = `inProg.length`. The list is `inProg` (cap 6) followed by **doing todos gathered over ALL nodes** `N` (not just active): for every node, each string in `todo.doing` becomes an item `"{doing string} — {that node's title}"` (cap 5).
2. **Ready to pick up** — `unblocked` = `active` where: `status !== 'verified'` **AND** `dependsOn` is non-empty **AND** every id in `dependsOn` passes `verOrBuilt`. (A node with no deps is *not* listed here — it has nothing that just unblocked it.) Header count = `unblocked.length`. List is `unblocked` (cap 6), each shown as `"{title} ({status})"`, followed by **next todos gathered over the `active` set**: each string in `todo.next` becomes `"{next string} — {node title}"` (cap 5). Caption: *Active features whose dependencies are all built or verified — nothing's blocking them.*
3. **Needs attention** — concatenate, in this order: (a) open bugs = `bugs` where `status === 'open'`, then (b) failing nodes = `N` where `verification` is present AND (any checkpoint has `state === 'fail'` OR `verification.statusRaw` is `failing` or `partial`). Header count = the full combined length; **show the first 8**. Bug item: `"Bug · {bug.title}"`, and if `bug.node` is set, append `" — {node title} · {blast(bug.node)} depend on it"`. Failing item: `"Failing checks · {title} ({blast(id)} depend on it)"`.
4. **Keystones (most depended-on)** — for every node compute `blast(id)`, keep those with `blast > 0`, **sort by blast descending**, take the top 6. Each item: `"{title} — {blast} depend on it · "` then, if the node has `verification`, `"{passing}/{total} checks"`; otherwise the warning `"no verification"`. Caption: *The load-bearing nodes — a break here radiates widest. Unverified ones are the riskiest.* (A keystone with no verification is a single point of failure — call it out.)
5. **Dependency cycles** — run Tarjan's strongly-connected-components over the directed graph whose edges are `dependsOn` (only edges whose target exists in `N`). Keep every SCC of **size > 1** (drop singletons/self-loops). **Omit this whole section if there are none.** Each cycle = its member titles joined by `" ↔ "`. Header count = number of cycles. Caption: *Mutually-entangled — no clean build/verify order; a change to one can ripple to all. Worth breaking.*
6. **Coverage** — `specd` = count of nodes with `verification`; `stubs` = count without; `total` = `N.length` (`specd + stubs === total`). A short line, mirroring the canvas wording: *{specd} of {total} nodes are spec'd or covered (have verification); {stubs} are stubs / unspec'd — the spec'd ones are your real, pinned work, the stubs are charted but uncontracted.*

**Edge cases:** empty section → show `—`. Header count can exceed the shown list (that's intended — it's the true total; the list is capped). `blast` and Tarjan must be cycle-safe (visited set). `--full` removes every cap. Room scope (`/standup {room}`): compute `blast`/Tarjan over the **full** graph, then filter the candidate nodes of sections 1–4 and the Coverage counts to nodes whose `room` matches; cycles are filtered to those touching the room.

## Phase 3 — Print the digest

Render as **Markdown** (not a fenced ASCII block) so node titles can be **clickable links** to their spec/source — that's the in-terminal analog of the canvas's click-to-frame. Link a node's title to `artifacts.spec` when present, else to a path in `artifacts.files` (prefer `requirements`/`source`), else leave it plain text. Keep the whole thing to roughly one screen (that's what the caps are for).

Use this shape:

```
═══ Project pulse — {repo/project name} ═══
{generated} · {total} nodes · {room count} rooms{ · scoped to {room} if room mode}

▶ In progress ({inProg count})
  • {node title}
  • {doing todo} — {node title}
  ( — if none)

▶ Ready to pick up ({unblocked count})
  Active features whose deps are all built or verified — nothing's blocking them.
  • {node title} ({status})
  • {next todo} — {node title}

▶ Needs attention ({att count})
  • Bug · {title} — {node title} · {blast} depend on it
  • Failing checks · {title} ({blast} depend on it)

▶ Keystones (most depended-on)
  The load-bearing nodes — a break here radiates widest.
  • {node title} — {blast} depend on it · {passing/total checks | no verification}

▶ Dependency cycles ({n})        ← omit entirely if none
  Mutually-entangled — no clean build/verify order. Worth breaking.
  • {A ↔ B ↔ C}

▶ Coverage
  {specd} of {total} nodes are spec'd or covered; {stubs} are stubs.
```

(The `▶` headers and `═══` banner mirror the framework's other report commands. `{generated}` is the JSON's `generated` string; show it verbatim. Render section headers as bold and titles as links where you can.)

End with a single pointer line: `Run /nextsteps for AI-judged priorities, or open canvas.html for the visual map.`

## Rules

- **Read-only.** No writes. No new files. No deletes. `/standup` never modifies `FEATURE_TREE.json` or anything else — if the map looks stale, tell the user to run `/feature-tree`.
- **No commits.** Same as every read-only command.
- **Don't invoke other agents.** This is a pure structural query over one JSON file.
- **Deterministic & idempotent.** Same `FEATURE_TREE.json` → same digest every time. No AI ranking, no guessing — every number comes from the rules above. Point at `/nextsteps` for judgment.
- **Degrade gracefully.** Missing file → the one-line "run /feature-tree" note. Malformed JSON → say so, don't crash. A node missing a field → treat per the Field realities above; never let one bad node abort the digest.
- **Single-screen by default.** Respect the caps unless `--full` is passed. Don't fill the terminal.
