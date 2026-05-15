---
mode: agent
description: Pull the latest additive files (commands, agent shims, manifest) from the public Agent0-Context-Framework repo on GitHub.
---

# /update-framework

Pull the latest **additive** framework files from the public GitHub repo into the current project. Never overwrite files that contain user-filled `PROJECT:` slots.

The canonical source is **`sechang11/Agent0-Context-Framework`** on GitHub, `main` branch. Raw base URL: `https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/`.

## Phase 1 — Preflight

1. Confirm `curl` is available on the host: `command -v curl`. If missing, stop and tell the user to install curl (or use the bootstrap script over `wget`).
2. Confirm we're at a project root that already has the framework adopted — look for **either** `CLAUDE.md` or `.github/copilot-instructions.md`. If neither exists, this isn't a framework project; ask the user to confirm before continuing.
3. Read `.github/.framework-version` if it exists. That's the manifest version this project was last synced to. Note it. If the file doesn't exist, treat as "never synced — first update."

## Phase 2 — Fetch the manifest

Download the manifest to a temp file:

```bash
curl -fsSL -o /tmp/manifest.json https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/MANIFEST.json
```

(On Windows where `/tmp` may not exist, use the system temp dir — `$env:TEMP\manifest.json` in PowerShell, or `mktemp` if available.)

Parse it. Capture:

- `version` — the remote manifest version (an ISO date).
- `raw_base` — the URL prefix for raw file fetches.
- `files[]` — each entry has `path` and `class` (`additive` or `template`).
- `commands_table[]` — the canonical slash-commands table for `CLAUDE.md`.
- `changelog[]` — show the user the entries newer than their last-synced version.

If `version` equals the local `.framework-version`, the project is up-to-date. Tell the user, offer to run `--force` (re-download everything), and stop unless they ask to continue.

## Phase 3 — Classify each file

For each entry in `files[]`, classify into one bucket:

| Local state | `class` | Bucket | Action |
|-------------|---------|--------|--------|
| missing | additive | **ADD** | download |
| missing | template | **ADD (slots)** | download — user fills slots later |
| present, content matches remote | any | **UP-TO-DATE** | skip |
| present, content differs | additive | **UPDATE** | download (framework owns this file) |
| present, content differs | template | **SKIP (customized)** | leave alone — user has filled this in |

To compare: `curl -fsSL "<raw_base><path>" -o /tmp/remote.tmp` then `diff -q /tmp/remote.tmp <local-path>`. Use `cmp` if `diff` is unavailable.

Build a plan as a structured list — one line per file with its bucket. **Print the plan to the user before executing any writes.**

## Phase 4 — Execute the plan

1. For each `ADD` / `ADD (slots)` / `UPDATE` file: download from `<raw_base><path>` directly to its local destination. Use `curl -fsSL` with `--create-dirs` so parent directories are created automatically.
2. After all downloads succeed, sync the slash-commands table in `CLAUDE.md`:
   - Read the existing table under the `## Slash commands` heading.
   - For each entry in the manifest's `commands_table`, if no row with that `command` exists in the local table, append a row. Match on the exact command string.
   - Never remove rows the user added manually. Never reorder.
3. Write the manifest version to `.github/.framework-version` (create parent dirs if needed). This is the new baseline.

If any download fails, **stop**, report which file failed, and leave the project in a partial state — the user can re-run after fixing connectivity. Do not roll back partial downloads; `/update-framework` is meant to be re-runnable.

## Phase 5 — Report

Print a structured summary:

```
/update-framework — synced to version YYYY-MM-DD

  Added:           N
  Added (slots):   N    (user must fill PROJECT slots)
  Updated:         N
  Up-to-date:      N
  Skipped (template, already customized): N

  CLAUDE.md table: M new row(s) appended
  Baseline written to .github/.framework-version

Changelog entries since your previous version:
  - …
  - …

Next steps:
  - Review the diff before committing.
  - Restart your Claude Code session so new slash commands and agent shims load.
```

If any **template** files were added, list them explicitly and remind the user to fill the `PROJECT:` slots (or re-run `/adopt-framework`).

## Rules

- **Read-only on `template` files that already exist.** This is the single most important guarantee — user-filled content must never be clobbered.
- **No commits.** The user reviews the diff and commits when ready.
- **No `git pull`, no `git fetch`, no submodules.** This command works in any project regardless of whether it's a git repo at all — it just uses HTTPS over curl.
- **Idempotent.** Re-running with no upstream changes should report "all up-to-date" and write nothing.
- **No interactive prompts during execution.** Build the full plan, print it, then execute. If the user wants a dry run, they can stop after the plan prints.
- The remote URL is hardcoded for v1. If a future version needs to point at a fork or branch, that can be parameterized later.
