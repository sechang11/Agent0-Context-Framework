# Changelog

All notable changes to **Agent0-Context-Framework** are documented here.

This file is **generated from `MANIFEST.json`** by `scripts/generate-changelog.py`.
Don't edit it by hand — edit the `changelog` array in `MANIFEST.json`, then re-run
the script. The manifest is the source of truth; this file is for humans reading
the repo on GitHub.

Versions are dated (`YYYY-MM-DD`). Multiple releases on the same day get a letter
suffix (`2026-05-15a`, `2026-05-15b`).


## 2026-05-15h

- Added /cover --discover mode. Scans the codebase, groups surfaces into proposed features (using path-prefix, directory, naming-similarity, and adjacent-surface heuristics), and presents a structured proposal to the user. The user accepts (y), edits (e — walks each feature with rename/split/merge/drop/claim-unclaimed options), or cancels (n) before ANY file is written. After confirmation, batch-runs /cover for each feature in sequence with a one-line progress marker. Final summary lists checkpoints + concerns per feature and reminds the user that all output is code-derived (snapshots, not contracts).

- Added 'What counts as a feature?' section to the /cover prompt — defines the feature-vs-surface distinction (one feature = one verification.md = many surfaces; two features can share a surface) and gives heuristics for picking boundaries.

- Updated /cover shim with the new invocation patterns and a feature-vs-endpoint clarification.

- Updated docs/getting-started.md /cover section with the same feature-vs-surface model and --discover usage. Added FAQ entry 'How do I pick feature boundaries for /cover?' so /help drills into this when users ask.

- /help inherits the changes automatically — it reads from getting-started.md, so the new FAQ entry and /cover guidance surface via /help faq and /help commands without a separate prompt edit.


## 2026-05-15g

- Added /help — the newbie on-ramp. Friendly overview command that emits a goal-oriented digest (no args) or drills into a specific topic (agents, commands, concepts, workflow, debugging, updating, faq). Reads from docs/getting-started.md locally; falls back to GitHub if the local file is missing. Adapts to what's actually installed in the project (e.g. lists domain-expert agents alongside the standard roster).

- Added docs/getting-started.md — the long-form newbie-friendly guide. Covers what the framework is, the five-minute tour, every agent and when to call them, every slash command organized by user goal, the big concepts (dual-tool layout, specs, verification, bugs, debug surface, update flow), and a FAQ. Plain language, no jargon without explaining. This is the comprehensive document /help draws from.

- docs/getting-started.md is in the manifest as additive — adopted projects get a local copy via /update-framework, so /help works offline and developers don't have to go to GitHub to read it. The other docs/ files (workflow guides for framework maintainers) remain repo-internal.


## 2026-05-15f

- Added /version — read-only sibling of /update-framework. Reports installed version (.github/.framework-version), latest available upstream (MANIFEST.json), the gap between them, the full list of available slash commands, and a 'what's new since your last sync' digest. Network-tolerant — degrades to local-only when offline. Supports --offline (skip remote check) and --changelog (print full history).

- Added CHANGELOG.md at the repo root — generated from MANIFEST.json's `changelog` array by scripts/generate-changelog.py. GitHub-renders nicely when browsing the repo. Adopted projects pull a copy via /update-framework so they can read history locally without going to GitHub. Don't edit by hand — edit MANIFEST.json's changelog array, then re-run the script.

- Added scripts/generate-changelog.py — Python script that regenerates CHANGELOG.md from MANIFEST.json. Framework-maintainer tooling (not in the distributed manifest). Run after every version bump.


## 2026-05-15e

- Stage 3 of the spec-bound debug surface: the web-debug panel. Opt-in module for web projects whose architect approves the stack fit. Mounts at /__debug, gated by an env var (DEBUG_PANEL=1 / NEXT_PUBLIC_DEBUG_PANEL=1 / VITE_DEBUG_PANEL=1 depending on stack). OFF by default — panel route returns 404 when env var is unset; this is the load-bearing safety property and is non-negotiable. Renders verification.md content joined to the current route: per-checkpoint status with re-run buttons for automated ones, feature-flag toggles (localStorage-backed), state probes (user-implemented), and a 'copy bug report to clipboard' button that emits Markdown matching /report-bug's format.

- Added /install-debug-panel — confirms intent + safety posture with user, routes to @architect for stack-fit review (APPROVE/REVISE/REJECT), then routes to @debug-panel-engineer for assessment + implementation in the host project's stack. Generates probe stubs from verification.md ## State to surface declarations. Refuses to generate probes whose names indicate secret-reading.

- Added /demolish-debug — fully removes the panel from the host project. Two confirmation gates (intent + specific deletion plan). Deletes /__debug routes and the debug/ helper directory; surgically removes hotkey mount from root layout and DEBUG_PANEL line from .env.example; REPORTS (does not auto-fix) host-code files that import debug helpers. Verification.md files are deliberately untouched — they're independent of the panel and survive re-install.

- Added @debug-panel-engineer agent (canonical + shim). Stack-specific implementer. Reads .github/skills/web-debug/SKILL.md as its contract. Declines cleanly when the stack isn't a fit (no HTTP routing, no frontend framework, no env-var gating, /__debug already taken). Never adds new dependencies. Never injects code into host components — only reads files, localStorage, and user-implemented probes.

- Added .github/skills/web-debug/SKILL.md — the canonical contract for what the panel must do regardless of stack. Defines required surfaces (/__debug page, /__debug/api/manifest, run-checkpoint, probe endpoints), required client modules (panel, flags, probes, hotkey, gate), how the panel chooses what to render (matches current route against verification.md Surfaces sections), how flags work (localStorage with getDebugFlag helper), how the report-bug button works (clipboard handoff to /report-bug), and the four non-negotiable safety properties: off by default, reversible, no code injection, no secrets in probes.

- Updated AGENTS.md roster and CLAUDE.md tables to include debug-panel-engineer and the two new commands.

- Known limitation in v1: panel reads .github/specs/*/verification.md via runtime filesystem reads. If the host project is built and deployed as a static artifact that doesn't include .github/, the panel's manifest endpoint will return empty. Static-export support (build-time JSON generation) is future work.


## 2026-05-15d

- Added /cover — generates a code-derived verification.md for an existing feature that has no spec. The brownfield on-ramp: most real projects adopt Agent0 after they have code, and /spec → /verify only covers greenfield work. /cover takes a feature name and user-supplied surfaces (routes, endpoints, files, commands), reads the code at those surfaces via @verification-engineer, and writes .github/specs/{feature}/verification.md with `source: code` in frontmatter. Each checkpoint uses 'Currently:' prefix language to distinguish snapshot from contract. Suspected bugs go in a separate ## Concerns section, not as checkpoints, so the agent never silently 'fixes' current behavior to describe ideal behavior.

- Updated verification.md schema: new mandatory `source: spec | code` frontmatter field. Spec-derived files document desired behavior (contract). Code-derived files document current observable behavior (snapshot). A code-derived verification can be upgraded later by writing requirements.md retroactively and running /verify {feature} --bootstrap — the source flips to spec.

- Updated verification-engineer role with the two-mode distinction: spec-derived (read .github/specs/) and code-derived (read user-supplied surfaces). Code-derived mode has extra rules: cite source files for every checkpoint, never infer surfaces beyond what the user gave, never silently fix buggy current behavior, flag concerns separately from checkpoints.

- Updated AGENTS.md lifecycle with two paths — greenfield (spec → architect → implementation → tests → reviews → verify) and brownfield (cover → triage concerns → verify → optionally upgrade to spec-derived). Both paths converge on verification.md; Stage 3 (web debug panel) renders both identically.

- Stage 2.5 of the spec-bound debug surface. Stage 3 (web debug panel) is next.


## 2026-05-15c

- Added /verify — bootstraps or runs a verification.md for a spec. Bootstrap mode reads requirements.md/design.md/tasks.md and writes .github/specs/{feature}/verification.md with structured checkpoints (Type: automated|manual|mixed, Steps, Pass/Fail criteria, Automation command, Last result). Run mode executes the automated checkpoints via Bash, walks the user through manual ones, and records pass/fail with timestamps inline. Failing checkpoints suggest a /report-bug dispatch — closes the loop with Stage 1. Supports --bootstrap (force regenerate) and --dry-run (lint the verification.md without executing).

- Added verification-engineer agent (canonical + shim). Translates spec acceptance criteria into checkpoints; picks stack-appropriate automation tooling from what the project already uses; never installs new dependencies or writes production code. Listed in AGENTS.md roster and CLAUDE.md agents table.

- Updated lifecycle in AGENTS.md to add step 6: Verification via /verify {feature}.

- This is Stage 2 of the spec-bound debug surface. Stage 3 (web debug panel) will surface verification.md content joined to current route.


## 2026-05-15b

- Added /report-bug — captures a structured bug report at .github/bugs/{timestamp}-{slug}.md. Bundles the user's description (intent / expected / actual / where) with auto-captured project state (git diff, recent commits, active spec, environment, framework version) and suggests a routing agent based on what the bug touches. Writes the file and stops — does NOT auto-invoke the agent; user controls dispatch. This is Stage 1 of the spec-bound debug surface: the structured hand-back channel that replaces 'paste console, screenshot, describe what I clicked.' Stage 2 (verification artifacts) and Stage 3 (web debug panel) will build on top.

- Added .github/bugs/ directory with README documenting the bug-report lifecycle (open → in-progress → resolved / wont-fix / cant-reproduce).


## 2026-05-15a

- Overhauled /report prompt. Agents now break their rating into five sub-dimensions (1–10 each) with a one-line justification per dimension; composite is the mean. 'Build next' is now a priority/action/why/effort table with P0/P1/P2 levels and S/M/L effort tags. Output file gains a composite scorecard, top-priorities table, and trends-since-last-report table. Phase 5 console summary is now substantial (scorecard, top 3 priorities, notable observations) rather than a one-liner — addresses the 'no response shown' problem.

- Agents who return thin output get one retry; if they still won't expand, they're flagged in the scorecard.


## 2026-05-15

- Added /agents — roster lookup, one specialty line per agent.

- Added /report — roundtable progress review, writes timestamped PROGRESS_REPORT.md.

- Added /update-framework — pull additive updates from GitHub via curl.

- First versioned manifest. Prior to this, the framework was distributed by copy-paste.
