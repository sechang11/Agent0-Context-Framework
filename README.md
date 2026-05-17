# Agent0-Context-Framework

A portable, Markdown-only framework for giving AI coding agents (Copilot, Claude, Cursor, etc.) consistent context about a codebase.

It's a set of conventions and template files — no DSL, no generator scripts, no runtime. You copy it into your repo, fill in a handful of slots, and your agents stop guessing. New commands and agent shims can be pulled into adopted projects with a single slash command (`/update-framework`) — no per-project copy-paste.

## Works with

- **GitHub Copilot** — reads `.github/` natively (auto-loaded instructions via `applyTo` globs, `@agent-name` invocation, `/command` slash commands).
- **Claude Code** — reads `CLAUDE.md` at the repo root and `.claude/` shims, which delegate to the canonical files in `.github/`.

`.github/` is the **single source of truth**. The `.claude/` directory is a thin shim layer; you don't maintain content in two places. Edit `.github/`; both tools see the change.

## Who this is for

- Teams using AI coding assistants on a non-trivial codebase.
- Anyone tired of re-explaining their architecture in every prompt.
- Projects where consistency across many tasks and contributors matters more than ad-hoc cleverness.

This was extracted from a real-world multi-service codebase. The opinions are load-bearing — keep the structure even if you delete files you don't need.

## What problem it solves

Without it, every agent conversation starts from zero. Architectural rules get violated. The agent picks a different testing style than the rest of the codebase. Security baselines depend on whether you remembered to mention them.

With it:

- The agent reads a small, predictable set of files at the start of every task.
- Hard rules (security, git, architecture) are enforced by file rather than by hope.
- Specialized agent personas exist for review, design, and implementation.
- Non-trivial work follows a spec workflow that produces durable artifacts.

## File tree

```
CLAUDE.md                           Claude Code entry point. Redirects to .github/, lists hard
                                    rules, provides a manual glob → instructions map.

MANIFEST.json                       Distribution manifest. Lists every file /update-framework
                                    will sync, with its class (additive vs template) and a
                                    versioned changelog. Bump on every release.

CHANGELOG.md                        Human-readable release history. Generated from MANIFEST.json
                                    by scripts/generate-changelog.py. Don't edit by hand.

scripts/
  bootstrap.sh                      One-shot bash installer. Run via curl | bash in projects
                                    that don't yet have /update-framework.
  generate-changelog.py             Regenerates CHANGELOG.md from MANIFEST.json's changelog
                                    array. Run after every version bump.

docs/                               Operating guide — four workflow docs covering setup,
                                    upgrade, extension, and sync.
  README.md                           Index + quick reference
  setup-new-project.md
  upgrade-existing-project.md
  extending-the-framework.md
  syncing-updates.md

.github/                            Canonical source of truth (Copilot-native).
  copilot-instructions.md           Project overview + hard rules (always loaded)
  AGENTS.md                         Agent roster + routing
  CHEATSHEET.md                     Daily-use reference (optional)

  instructions/                     Auto-loaded rules, scoped by file glob
    security.instructions.md          OWASP-aligned baseline (all files)
    git-safety.instructions.md        Destructive-command guardrails (all files)
    architecture.instructions.md      Project-specific invariants (highest leverage)
    testing.instructions.md           Test standards
    api-design.instructions.md        HTTP API conventions (optional)

  agents/                           Specialized personas, invoked as @agent-name
    architect.agent.md
    software-engineer.agent.md
    code-reviewer.agent.md
    security-reviewer.agent.md
    test-engineer.agent.md
    _domain-expert-template.agent.md

  skills/                           Domain-knowledge packages, loaded on demand
    README.md
    _template/SKILL.md

  prompts/                          Slash-command-style reusable prompts
    adopt-framework.prompt.md         One-shot adoption: explore + interview + fill slots
    spec.prompt.md
    agents.prompt.md                  Roster lookup
    report.prompt.md                  Roundtable progress review → PROGRESS_REPORT.md
    update-framework.prompt.md        Pull latest additive files from GitHub
    _template.prompt.md

  workflow/                         How the pieces fit together
    ai-dev-lifecycle.md
    context-routing.md

  memory/                           Optional per-component summary notes
    README.md
    _template-component.md

  specs/                            Output of the /spec workflow
    README.md
    _template/{requirements,design,tasks}.md

.claude/                            Claude Code shim layer. Each file delegates to the matching
                                    .github/ file; do not duplicate content here.
  agents/                           One shim per persona — frontmatter + "read .github/agents/X.agent.md"
    software-engineer.md
    architect.md
    code-reviewer.md
    security-reviewer.md
    test-engineer.md
    _domain-expert-template.md
  commands/                         Slash commands — delegate to .github/prompts/
    adopt-framework.md
    spec.md
    agents.md
    report.md
    update-framework.md

examples/                           Reference fills for common stacks (placeholders)

CUSTOMIZATION.md                    Step-by-step adoption guide
LICENSE                             MIT
```

## 30-second quick start

1. Copy `.github/`, `.claude/`, and `CLAUDE.md` into your project root (merge if any already exist).
2. Open the AI tool of your choice and run `/adopt-framework`:
   - **Copilot**: Copilot Chat in agent mode.
   - **Claude Code**: any session in the project root.

   The prompt explores your codebase, asks a few targeted questions, picks the right tier, and fills the slots in both `.github/` and `.claude/` (deleting unused files in both layers).
3. Review the diff. Commit when you're happy.

If you'd rather adopt by hand, open `CUSTOMIZATION.md` and follow **Minimum viable adoption** — fill the `<!-- PROJECT: ... -->` slots in `copilot-instructions.md`, then delete or rename agents you don't need (in both `.github/agents/` and `.claude/agents/`).

Either way, everything beyond the minimum is optional and can be added incrementally.

## Keeping adopted projects up-to-date

Once a project has adopted the framework, pulling future additions is a single slash command:

```
/update-framework
```

It reads `MANIFEST.json` from the public repo, downloads any new or changed **additive** files, and leaves your filled-in `PROJECT:`-slot files (instructions, agents, CLAUDE.md) untouched. Re-run any time. The manifest version is recorded in `.github/.framework-version` so you always know your baseline.

For projects that adopted the framework before `/update-framework` existed, bootstrap it once:

```bash
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
```

Requirements: `curl` and `python` (3.x, for JSON parsing in the bootstrap). No `gh` CLI, no auth, no submodules.

See **CUSTOMIZATION.md → Updating the framework** for the compatibility rules and changelog format. For step-by-step workflows (setting up a new project, upgrading a stale one, extending the framework, syncing updates), see [`docs/`](./docs/README.md). For release history, see [`CHANGELOG.md`](./CHANGELOG.md).

From any adopted project, `/version` reports the installed version, the latest available, the gap, and a digest of what's new.

## Philosophy

- **Three-tier files.** PORTABLE ships as-is. TEMPLATE has marked slots. OPTIONAL lives in `examples/` and is for reference only.
- **Honest about scale.** Small projects only need a subset. Don't pretend the whole framework is correct for every codebase — see CUSTOMIZATION.md.
- **Markdown + conventions, nothing else.** No build step. No DSL. No tooling to maintain.
- **Direct, opinionated voice.** A reluctant rule is a worthless rule.

## License

MIT. See [LICENSE](LICENSE).
