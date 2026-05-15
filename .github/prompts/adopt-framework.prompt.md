---
mode: agent
description: Customize this context framework for the current repository — explore the codebase, interview the user, and fill in the PROJECT slots.
---

# /adopt-framework

You are adopting this context framework into the current repository. The framework ships as a skeleton with `<!-- PROJECT: ... -->` slots that need to be filled with project-specific facts. Your job is to fill them honestly — observed from the code where possible, asked of the user where not.

## Phase 1 — Understand the framework

Read these first, in parallel, so you know what slots exist and what's optional:

- The top-level `README.md`
- `CUSTOMIZATION.md` (note especially the **Dual-tool layout** section)
- `CLAUDE.md` (the Claude Code entry point at the repo root)
- `.github/copilot-instructions.md`
- `.github/AGENTS.md`
- One representative agent file (e.g. `.github/agents/software-engineer.agent.md`)
- The matching Claude shim (e.g. `.claude/agents/software-engineer.md`) — see the shim pattern
- One representative instruction file (e.g. `.github/instructions/architecture.instructions.md`)

Build a mental list of every file containing `<!-- PROJECT:` markers (in `.github/`, in `.claude/`, and `CLAUDE.md`). That's your worklist.

**The dual-tool rule:** `.github/` is canonical content. `.claude/` is shims — frontmatter + a pointer at the canonical file. Don't put content into shims.

## Phase 2 — Explore the target codebase

In parallel, gather what you can observe:

- Top-level directory listing
- Package manifests: `package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml`, `pom.xml`, `*.csproj`, etc.
- Root README and any `docs/` or `design-docs/` folder
- Build/test config: `Makefile`, `justfile`, `tasks.json`, CI workflows in `.github/workflows/`
- Obvious structural signals: monorepo vs single project, presence of `services/`, `apps/`, `packages/`, `cmd/`, `internal/`

From this you should be able to infer **observed facts**: primary language(s), frameworks, build/test/lint commands, top-level components or services, rough architecture shape (single app, monorepo, microservices).

Do **not** infer:

- Architectural invariants (what must never be violated)
- Hard rules specific to this team
- Domain vocabulary or business context
- Which optional pieces of the framework the user actually wants

Those come from the interview.

## Phase 3 — Confirm scope before filling anything

Ask the user, in one round, no more than ~5 questions:

1. **Tier.** Minimum viable (`copilot-instructions` + `security` + one generalist agent), Standard (+ `architecture`, `testing`, language-specific instructions, 2–3 agents), or Full (+ skills, memory layer, spec workflow, CHEATSHEET)? Recommend the smallest tier that fits what you observed.
2. **Architectural invariants.** "What are the 1–3 things about this codebase that, if violated, would make you genuinely upset? Things a new contributor needs to internalize on day one." This is the highest-leverage slot. Don't guess it.
3. **Hard rules.** Anything off-limits (files not to read, commands not to run, dependencies not to touch, branches not to push to)? Defaults already in `security.instructions.md` cover secrets and destructive commands — ask only for project-specific additions.
4. **Personas.** Beyond `software-engineer`, do you need any specialized agents (e.g. a domain expert, a reviewer for a specific layer)? Only add what they'll actually invoke.
5. **Anything I observed wrong.** Show your inferred component list and primary language(s); ask them to correct.

If the user gives a one-word answer or "you decide," pick the conservative default (Minimum tier, no extra personas) and proceed. Don't keep asking.

## Phase 4 — Fill the slots

Walk the worklist in this order:

1. `.github/copilot-instructions.md` — workspace layout, tech stack one-liner, hard rules
2. `CLAUDE.md` (root) — trim the glob → instructions table to whatever instruction files you keep; otherwise leave it as-is
3. `.github/instructions/security.instructions.md` — append project-specific additions only; don't rewrite defaults
4. The chosen agent files in `.github/agents/` — fill responsibilities, anti-patterns, "what to read first"
5. `.github/instructions/architecture.instructions.md` (Standard+) — invariants from question 2
6. Language-specific instruction files (Standard+)
7. Optional: skills, memory templates, spec workflow, CHEATSHEET (Full tier only)

For every slot, label your source in your own working notes:

- **observed** — visible in the code
- **asked** — came from the interview
- **omitted** — left the slot empty or removed the file because nothing applies

If a slot has no honest answer, leave a one-line `<!-- PROJECT: not applicable -->` comment or delete the file. **Do not invent content to fill space.** An empty section is better than a fabricated invariant.

### Deleting opted-out files (delete in pairs)

Whenever you delete a `.github/` file, also delete its `.claude/` shim sibling so they stay in sync:

| Delete in `.github/` | Also delete in `.claude/` |
|----------------------|---------------------------|
| `agents/architect.agent.md` | `agents/architect.md` |
| `agents/code-reviewer.agent.md` | `agents/code-reviewer.md` |
| `agents/security-reviewer.agent.md` | `agents/security-reviewer.md` |
| `agents/test-engineer.agent.md` | `agents/test-engineer.md` |
| `agents/_domain-expert-template.agent.md` | `agents/_domain-expert-template.md` |
| `prompts/spec.prompt.md` | `commands/spec.md` |
| `prompts/adopt-framework.prompt.md` | `commands/adopt-framework.md` |

Other deletions to consider per tier: the `.github/skills/`, `.github/memory/`, `.github/specs/`, and `.github/workflow/` directories if the user declined Full tier; `.github/CHEATSHEET.md` if the user said they won't maintain it.

### Creating new domain-expert agents (create in pairs)

For every new domain agent the user requested:

1. Copy `.github/agents/_domain-expert-template.agent.md` → `.github/agents/{domain}.agent.md` and fill the slots.
2. Copy `.claude/agents/_domain-expert-template.md` → `.claude/agents/{domain}.md` and update the frontmatter (`name`, `description`) plus the body's `{domain}` references. **Don't paste content into the shim** — the shim still just points at the `.github/` file.

## Phase 5 — Self-check and report

Run:

```bash
grep -rn 'PROJECT:' .github/ .claude/ CLAUDE.md 2>/dev/null || true
```

Then verify shim/canonical pairing — every file in `.claude/agents/` (except `_domain-expert-template.md` if removed) should have a matching `.github/agents/X.agent.md`, and every file in `.claude/commands/` should have a matching `.github/prompts/X.prompt.md`. Flag any orphans.

Report to the user:

- Files filled (count + names)
- Files deleted (both `.github/` and `.claude/` sides)
- Any orphan shims or orphan canonical files
- Any remaining `PROJECT:` markers and *why* they're still there (deferred to user, genuinely N/A, etc.)
- Suggested next action: open one filled agent file and its shim and read both end-to-end to sanity-check the wiring

## Rules

- **Do not commit, stage, push, or run any git command.** The user reviews and commits.
- **Only modify framework files** — `.github/`, `.claude/`, `CLAUDE.md`, and the framework-level `README.md` / `CUSTOMIZATION.md` / `LICENSE`. Do not touch the project's actual source code.
- **Do not install or upgrade dependencies.**
- **Do not read `.env`, `.env.*`, or any secrets file** even if it would help inference.
- **Never paste content into `.claude/` shims.** They are pointers at canonical files in `.github/`. The only edits a shim needs are frontmatter (`name`, `description`, `tools`) and `{domain}` substitutions when copying the template.
- When in doubt between "ask" and "guess," ask. The whole point of the framework is honest, project-specific context — fabricated context is worse than missing context.
- Respect the framework's minimum-viable stance. The user should end up with a small, real, useful set of files — not a maximalist scaffold they'll resent.
