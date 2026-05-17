---
mode: agent
description: Report the installed framework version, the latest available, the gap, the available slash commands, and recent changelog entries. Read-only — does not modify any file. Works offline.
---

# /version

Print a one-screen status of Agent0-Context-Framework for this project: what's installed, what's available upstream, what's new since you last synced, and what slash commands you have. Pure reader — no writes, no destructive operations.

This is the read-only sibling of `/update-framework`. Use it to check status; use `/update-framework` to actually pull updates.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/version` | Full status — local + remote + gap + commands + recent changelog |
| `/version --offline` | Skip the remote check. Shows local version + commands. Useful when offline. |
| `/version --changelog` | Print the **full** changelog history, not just entries since last sync. |

## Phase 1 — Read local state

1. Read `.github/.framework-version` if it exists. That's the installed version.
   - If the file doesn't exist, this project hasn't been bootstrapped or `/update-framework`'d yet. Note this in the output as `Installed: (not yet synced)`.
2. Read the local `MANIFEST.json` if present at the repo root. (Most adopted projects won't have this — the manifest only lives in the framework repo. If it's present, it means this IS the framework repo. Use it as both local and remote source if so.)
3. Read the local `CHANGELOG.md` if present at the repo root. Use it as the offline fallback for changelog data.

## Phase 2 — Fetch remote state (skipped with `--offline`)

Fetch the latest manifest from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/MANIFEST.json -o /tmp/manifest-check.json
```

Use system temp if `/tmp` isn't available. If the fetch fails (no network, GitHub down, repo private, whatever), don't error — just note `Latest: (could not reach remote)` and proceed with whatever local data is available.

Parse the fetched manifest. Capture:
- `version` — the latest available
- `commands_table` — the canonical command list as of the latest version
- `changelog` — the full changelog array

## Phase 3 — Compute the gap

Compare installed version to latest:

| Local | Remote | Gap |
|---|---|---|
| missing | any | **(not yet synced)** — suggest bootstrap |
| `2026-05-15e` | `2026-05-15e` | **up to date** |
| `2026-05-15c` | `2026-05-15e` | **N versions behind** (count entries in `changelog` newer than local) |
| `2026-05-15g` | `2026-05-15e` | **ahead of remote** (rare — local is dev fork or remote rolled back) |

## Phase 4 — Print the one-screen status

Use this structure:

```
═══ Agent0-Context-Framework ═══

Installed:  {local version, or "(not yet synced)"}
Latest:     {remote version, or "(could not reach remote)"}
Status:     {up to date / N versions behind / ahead of remote / not yet synced}

{if behind:}
To update:  /update-framework

Available commands ({N}):
  /adopt-framework       — {one-line purpose}
  /spec                  — {…}
  /agents                — {…}
  …

{if behind:}
What's new since {installed version}:
  {next-version}   {first changelog note, truncated to ~70 chars}
  {next-version}   {…}

Run /update-framework to pull these.
```

The command list comes from the **local** state when available — that's what's actually wired up in this project. If local is missing (not yet synced), use the remote `commands_table` and note that none are installed yet.

The "what's new" section uses changelog entries with versions strictly greater than the local installed version, sorted ascending. Each entry's first note is truncated to ~70 chars and shown after the version. If there's no clear single-line summary in a note, show "(see CHANGELOG.md)".

## Phase 5 — Full-changelog mode (`--changelog`)

If `--changelog` was passed, after the one-screen status, also print the full changelog. Format:

```
═══ Full changelog ═══

{for each entry, newest first:}
## {version}
  - {note 1}
  - {note 2}
  - …
```

Source from local `CHANGELOG.md` if present, else from the remote manifest, else from the local `MANIFEST.json`. Whichever's available first.

## Rules

- **Read-only.** No writes. No new files. No deletes.
- **Network-tolerant.** Remote fetch failure must not error. Always degrade to whatever data is available.
- **Idempotent.** Running `/version` ten times produces the same output ten times (until the local version or remote version changes).
- **No commits.** Same as every read-only command.
- **Don't invoke other agents.** This is a pure status query.
- **Single-screen output** unless `--changelog` is passed. Don't fill the user's terminal with the full history by default.
