# Project Context (Claude Code)

This project uses a dual-tool context framework. The **canonical context** lives in `.github/`. This file is Claude Code's entry point and tells you what to read and when.

## Read first

1. `.github/copilot-instructions.md` — project overview, components, hard rules. Read it now.
2. `.github/AGENTS.md` — agent routing manifest. Read it when picking an agent.

## Hard rules (also in copilot-instructions.md — restated for safety)

- Never read `.env`, `.env.*`, or any file containing secrets, credentials, tokens, or API keys.
- Never modify dependency manifests (`package.json`, `go.mod`, `requirements.txt`, etc.) without explicit user permission.
- Never run destructive commands (`rm -rf`, `git reset --hard`, `git push --force`, `DROP TABLE`, etc.) without explicit user approval.
- Never commit, push, or open PRs automatically.
- Reference credentials by environment-variable name, never hardcode.

## Manual glob → instructions map

GitHub Copilot auto-loads `.github/instructions/*.instructions.md` based on each file's `applyTo` glob frontmatter. Claude Code has no equivalent — load these manually based on what you're editing:

| When editing | Read |
|--------------|------|
| Any file | `.github/instructions/security.instructions.md` |
| Any file | `.github/instructions/git-safety.instructions.md` |
| Source code | `.github/instructions/architecture.instructions.md` (if present) |
| Source code | `.github/instructions/style.instructions.md` (the drift register — if present) |
| Test files (`*.test.*`, `*.spec.*`, `*_test.*`, `test_*.*`) | `.github/instructions/testing.instructions.md` (if present) |
| HTTP handlers, routes, API code | `.github/instructions/api-design.instructions.md` (if present) |

If a referenced file doesn't exist, proceed without it. The framework degrades gracefully.

## Memory and skills

- Per-component briefings: `.github/memory/{component}.md` — read when touching that component (if a memory file exists).
- Domain-knowledge packages: `.github/skills/{skill-name}/SKILL.md` — read when working in that area, as directed by the relevant agent or by `.github/workflow/context-routing.md` if present.

## Agents

Claude Code agent shims live in `.claude/agents/`. Each is a thin wrapper that delegates to its `.github/agents/*.agent.md` counterpart. Invoke them via the Task / Agent tool. **Pick one primary** per task; optionally one validator after. Don't stack three.

| Agent | Use for |
|-------|---------|
| `software-engineer` | Implementation, bug fixes, matching existing patterns |
| `architect` | Design review, gating cross-component changes |
| `code-reviewer` | General code review |
| `security-reviewer` | Security findings, severity-ranked |
| `test-engineer` | Coverage gaps, untested edge cases |
| `verification-engineer` | Turns spec acceptance criteria into runnable `verification.md` checkpoints; used by `/verify` |
| `debug-panel-engineer` | Installs/removes the web-debug panel; reads `.github/skills/web-debug/SKILL.md`; writes panel code into the host stack |
| `ui-ux-engineer` | Reviews UX (flow / adaptive / theme). Minimum-friction by default; opt-in engagement analysis. Manages themes via the showroom model. Used by `/theme` and `/ui-review` |

See `.github/AGENTS.md` for routing rules and ambiguous-case examples.

## Slash commands

Claude Code commands live in `.claude/commands/`. Each delegates to its `.github/prompts/*.prompt.md` counterpart.

| Command | Purpose |
|---------|---------|
| `/adopt-framework` | One-shot adoption — explore the codebase, interview, fill PROJECT slots |
| `/spec` | Generate `requirements.md` + `design.md` + `tasks.md` for non-trivial work |
| `/agents` | List the agents assigned to this project, one specialty line each |
| `/report` | Convene agents for a roundtable progress review; writes `PROGRESS_REPORT.md`. Supports `--only` / `--exclude` to filter agents |
| `/nextsteps` | Focused "what to work on next" — no ratings or gaps, just prioritized action items per agent. Writes `NEXT_STEPS.md`. Supports same filters as `/report` plus `--horizon short\|medium\|long` |
| `/update-framework` | Pull latest additive files (commands, agent shims, manifest) from the public framework repo |
| `/report-bug` | Capture a structured bug report at `.github/bugs/` — user description + auto-captured project state + routing suggestion |
| `/verify` | Bootstrap or run a `verification.md` for a spec — runnable acceptance checkpoints, pass/fail recorded inline |
| `/cover` | Generate a code-derived `verification.md` for an EXISTING feature with no spec — brownfield on-ramp |
| `/install-debug-panel` | Install the Stage 3 web-debug panel at `/__debug` (off by default, gated by env var). Routes via `@architect` and `@debug-panel-engineer` |
| `/demolish-debug` | Fully remove the web-debug panel from the host project. Two confirmation gates. Verification.md files untouched |
| `/version` | Report installed framework version, latest available upstream, the gap, available commands, and recent changelog entries. Read-only. Works offline |
| `/help` | Friendly newbie-oriented overview — agents, commands, concepts, workflows. Surfaces `docs/getting-started.md` in chat. Optional topic flag (`agents`, `commands`, `concepts`, `workflow`, `debugging`, `updating`, `faq`). Read-only |
| `/theme` | Browse, pick, save, apply, mix, or import design themes via the shopper showroom interaction. Operates on `.github/themes/`. Visual depth flags `--text` (default), `--swatch`, `--mockup1/2/full` |
| `/ui-review` | Invoke `@ui-ux-engineer` to review a feature's UX — flow, adaptive design per viewport tier, theme consistency. Optional `--engagement` flag adds engagement-hacking analysis in a separate section |
| `/mode` | Show or set framework mode. `solo` disables worktree isolation (code goes directly to main tree); `review` (default) keeps worktree isolation for code changes. Knowledge artifacts always go to main tree |
| `/feature-tree` | Regenerate `FEATURE_TREE.md` **and** `FEATURE_TREE.json` at the repo root — a table of contents of every feature (type, summary, status, file links) plus a machine-readable graph the **feature canvas** (`canvas.html`) renders: rooms, nodes, verification checkpoints, the done/doing/next board, and `dependsOn` edges. Auto-invoked by `/spec`, `/cover`, `/verify`; can also be run manually. See `docs/feature-canvas.md` |

## Specs

Non-trivial work starts with `/spec`. Output goes under `.github/specs/{feature-name}/` as three separate files (`requirements.md`, `design.md`, `tasks.md`). Never combined. Never inside a source directory.

## Why two trees?

`.github/` is the **single source of truth** — every rule, agent role, prompt, and skill lives there. `.claude/` is a thin shim layer that points at those files so Claude Code can find them through its native conventions. Edit `.github/`; never duplicate content into `.claude/`. Both tools end up reading the same rules.
