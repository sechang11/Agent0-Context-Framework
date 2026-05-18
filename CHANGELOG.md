# Changelog

All notable changes to **Agent0-Context-Framework** are documented here.

This file is **generated from `MANIFEST.json`** by `scripts/generate-changelog.py`.
Don't edit it by hand — edit the `changelog` array in `MANIFEST.json`, then re-run
the script. The manifest is the source of truth; this file is for humans reading
the repo on GitHub.

Versions are dated (`YYYY-MM-DD`). Multiple releases on the same day get a letter
suffix (`2026-05-15a`, `2026-05-15b`).


## 2026-05-18c

- Web-debug panel is now a global overlay COMPONENT, not a separate page route. The previous design (panel at GET /__debug) defeated its own purpose — navigating to a debug page meant leaving the page you wanted to debug, losing state and re-render context. The new model mounts <DebugPanel/> globally in the host app's root layout. It toggles open/closed via the hotkey (Ctrl+Shift+D / Cmd+Shift+D) and renders as a fixed-position sidebar over (or alongside) the running page.

- Default dock position: left, full height, ~360px wide. Page content's left margin is increased when the panel opens, so the page is fully visible next to the panel and re-renders responsively as the user interacts with checkpoints, flags, and probes. Alternative dock positions: right, bottom, float (detached, doesn't push content — useful for testing pure viewport width).

- Panel content is route-aware via the host stack's pathname hook (`usePathname()` in Next.js, `useLocation()` in React Router, etc.). When the user navigates the underlying app, the panel re-renders with content for the new route — same panel, different specs.

- API namespace moved from /__debug/api/* to /api/__debug/* — the panel is no longer at a route, so the API endpoints stand alone under the project's standard /api/ prefix with the __debug subnamespace for clear gating and easy demolition.

- Added debug/state.{ts,js} as a new required client module — manages panel open/dock/tab state, persisted to localStorage so the panel remembers its position across reloads. Hotkey now toggles this state instead of navigating.

- Updated SKILL.md, debug-panel-engineer role, /install-debug-panel plan structure, and /demolish-debug inventory to reflect the new model. Demolish also looks for legacy v1 panel-as-page artifacts (app/__debug/, etc.) so projects that installed under v1 can clean up cleanly.

- Stack-specific notes updated: Next.js mounts in app/layout.tsx after {children}; Vite/React in App.tsx at the top level; Rails/Django/Phoenix inject the panel via a layout-template conditional. Same model everywhere — global mount, not a route.


## 2026-05-18b

- Surfaced and fixed a systemic flaw in several slash-command prompts: they instructed subagents to 'ask the user' inline, but subagents in Claude Code run in their own isolated context and cannot prompt interactively. Real-world test runs caught the contradiction and applied sensible workarounds; this update bakes the right pattern in.

- Added a HARD RULE to .github/AGENTS.md: subagents never prompt the user directly. All interactive flow lives in the orchestrator (the main session running the slash command). Subagents accept structured input, do their work, and return structured output. When a workflow needs user input mid-task, the subagent returns a needs-input signal; the orchestrator asks the user; the orchestrator re-dispatches the subagent with the answers included.

- Rewrote /verify Phase 3b (run mode) as a two-step split: subagent runs the automated portion only, marking manual/mixed CPs as `pending: needs walk-through` and prereq-blocked CPs as `pending: needs <prereq>` (e.g. `pending: needs postgres`); orchestrator then walks the user through the walk-through pendings interactively in the main session.

- Enriched the verification.md `Last result` schema: added `pending: needs walk-through`, `pending: needs <prereq>`, and `pending: review` as first-class result states alongside pass/fail/skip. Distinguishes 'feature is broken' (fail) from 'environment is missing' (pending: needs prereq) — the latter is no longer recorded as a failure.

- Added `pending` as a frontmatter `status` value for verifications that have pendings but no fails — distinguishes 'don't know yet' from 'have problems.'

- Rewrote /install-debug-panel Phase 3 as propose → orchestrator confirms → execute. Subagent proposes file layout + env-var + probe stubs; orchestrator shows plan to user with y/n/edit; subagent re-dispatched with confirmed plan to actually write files. No more subagent-side confirmation prompts.

- Rewrote /theme actions apply/save/mix to move user Q&A into the orchestrator. For apply: subagent proposes plan, orchestrator confirms, subagent executes. For save: orchestrator collects mood/best-for/not-for metadata first, then dispatches subagent. For mix: orchestrator collects all blend choices (color base, headings, body, spacing, motion) up front, dispatches subagent to synthesize, then loops on optional refinements.

- Rewrote /ui-review Phase 4 (responsive-strategy establishment) with the same pattern. Subagent recommends an approach; orchestrator confirms with user; @architect gate-checks; orchestrator writes the strategy file.

- Updated verification-engineer, debug-panel-engineer, and ui-ux-engineer role files with explicit 'you never prompt the user directly' rules referencing the AGENTS.md hard rule.

- Run summary in /verify now categorizes pendings separately from skips, includes 'to unblock: ...' hints for prereq-blocked CPs, and surfaces walk-through pendings with the action that resolved them.


## 2026-05-18a

- Updated /cover --discover final summary (Phase D6) to inline each feature's verification.md path with the feature name, using an indented arrow notation (`→ .github/specs/{feature}/verification.md`) on the line below each entry. Previously the path list lived in a separate 'Files written' section at the bottom, requiring users to cross-reference feature names to paths. Now they're co-located so the user can scan the list and jump straight to any file.


## 2026-05-18

- Added @ui-ux-engineer agent (canonical + shim). Reviews user experience across three axes: flow friction (minimum-friction default), adaptive design per viewport tier (collaborates with @architect on strategy), and theme consistency. Engagement-hacking analysis is opt-in via --engagement flag and always lives in a SEPARATE output section so users can take or leave it per site type. Dark patterns (forced continuity, manipulative urgency, confirmshaming, hidden costs) are explicitly out of scope even with --engagement. Operates via the shopper showroom model for theme work — shows options, asks 'this or this,' narrows from responses; never makes users describe styling in design vocabulary.

- Added /theme command — browse, apply, save, import (--from-repo), or mix design themes. Themes live at .github/themes/{name}/THEME.md as design tokens (JSON: colors, typography, spacing, radii, shadows, motion) + philosophy + component examples. Visual depth flags: --text (default), --swatch (inline color/typography blocks), --mockup1 (single component), --mockup2 (small page), --mockupfull (Playwright screenshot — degrades gracefully if Playwright not installed).

- Added /ui-review command — three-axis feature audit. Default minimum-friction. Opt-in --engagement adds findings in a separate section. Optional --viewport tier focus, --axis drill-down (flow|adaptive|theme). First invocation on a project also establishes .github/specs/_design/responsive-strategy.md jointly with @architect.

- Added .github/skills/responsive-design/SKILL.md — the canonical contract for adaptive design. Defines four approaches (adaptive components, conditional rendering, multiple builds, progressive enhancement) with explicit tradeoffs and a decision matrix. Establishes viewport-tier vocabulary: mobile (< 640), tablet (640–1023), desktop (1024–1919), wide (≥ 1920). The user's high-resolution experience never has to compromise for mobile by default — projects pick the approach that fits their needs.

- Added .github/themes/ directory with README, template, and three starter themes (clean-modern, warm-editorial, bold-tech) demonstrating the contract. Starter themes are examples of the format, not opinions about what projects should look like. Per-project themes are user-owned; cross-project sharing happens via the user's own private themes repo (referenced by /theme import --from-repo {url}), never via the framework manifest. The framework itself stays brand-neutral.

- Updated AGENTS.md roster with @ui-ux-engineer; updated greenfield lifecycle with step 7 (UI/UX review). Updated CLAUDE.md tables. Updated docs/getting-started.md with the new agent, two new commands, themes and responsive-design concepts, and FAQ entries on shopper-showroom theme selection and minimum-friction vs engagement-hacking distinction.

- /help inherits all changes automatically — it reads from docs/getting-started.md, so /help agents, /help commands, /help concepts, /help faq all surface the new content without a separate prompt edit.


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
