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

See `.github/AGENTS.md` for routing rules and ambiguous-case examples.

## Slash commands

Claude Code commands live in `.claude/commands/`. Each delegates to its `.github/prompts/*.prompt.md` counterpart.

| Command | Purpose |
|---------|---------|
| `/adopt-framework` | One-shot adoption — explore the codebase, interview, fill PROJECT slots |
| `/spec` | Generate `requirements.md` + `design.md` + `tasks.md` for non-trivial work |
| `/agents` | List the agents assigned to this project, one specialty line each |
| `/report` | Convene every agent for a roundtable progress review; writes `PROGRESS_REPORT.md` |
| `/update-framework` | Pull latest additive files (commands, agent shims, manifest) from the public framework repo |
| `/report-bug` | Capture a structured bug report at `.github/bugs/` — user description + auto-captured project state + routing suggestion |
| `/verify` | Bootstrap or run a `verification.md` for a spec — runnable acceptance checkpoints, pass/fail recorded inline |

## Specs

Non-trivial work starts with `/spec`. Output goes under `.github/specs/{feature-name}/` as three separate files (`requirements.md`, `design.md`, `tasks.md`). Never combined. Never inside a source directory.

## Why two trees?

`.github/` is the **single source of truth** — every rule, agent role, prompt, and skill lives there. `.claude/` is a thin shim layer that points at those files so Claude Code can find them through its native conventions. Edit `.github/`; never duplicate content into `.claude/`. Both tools end up reading the same rules.
