# Customization Guide

This framework comes with more than most projects need. Pick the tier that fits.

Slots to fill are marked in source files with `<!-- PROJECT: ... -->` HTML comments. Search for that string after copying.

## Recommended path: let an agent do it

Open the AI tool of your choice in your project root and run `/adopt-framework`:

- **Copilot**: Copilot Chat in agent mode.
- **Claude Code**: any session in the project root.

It reads the framework, explores your codebase, asks ~5 targeted questions, and fills the slots — labeling each as observed, asked, or omitted. It will not commit anything; you review the diff.

The rest of this guide is for adopting by hand or for understanding what the prompt is doing under the hood.

---

## Dual-tool layout

The framework supports both Copilot and Claude Code from one source:

- **`.github/`** — canonical content. Every rule, agent role, prompt, and skill lives here. Copilot reads it natively. **This is what you edit.**
- **`CLAUDE.md`** at the repo root — Claude Code's always-loaded entry point. Redirects to `.github/copilot-instructions.md` and lists hard rules + a manual glob → instructions map.
- **`.claude/agents/*.md`** — one shim per persona. Each is a small wrapper with the right Claude-side frontmatter (`name`, `description`, `tools`); the body says "your full role is at `.github/agents/X.agent.md` — read it and follow it."
- **`.claude/commands/*.md`** — slash-command shims that delegate to `.github/prompts/*.prompt.md`.

**Rules of the dual layout:**

1. **Edit `.github/`, not `.claude/`.** Shims point at the canonical files; don't paste content into them.
2. **Delete in pairs.** If you remove `.github/agents/architect.agent.md`, also remove `.claude/agents/architect.md`. Same for prompts ↔ commands.
3. **Add in pairs.** When creating a new domain-expert agent, copy *both* templates: `.github/agents/_domain-expert-template.agent.md` → `{domain}.agent.md`, and `.claude/agents/_domain-expert-template.md` → `{domain}.md` (then update the shim's `name` and `description`).

`/adopt-framework` handles the pairing automatically. Doing it by hand, just remember: every `.github/agents/X.agent.md` has a sibling `.claude/agents/X.md`.

---

## Tier 1: Minimum viable adoption

Good for: solo projects, small repos, prototypes, anyone trying the framework before committing.

**Keep:**
- `CLAUDE.md` (root) — Claude Code entry point
- `.github/copilot-instructions.md`
- `.github/instructions/security.instructions.md`
- `.github/instructions/git-safety.instructions.md`
- `.github/agents/software-engineer.agent.md`
- `.claude/agents/software-engineer.md` (shim for Claude Code)

**Delete the rest** — including all unused agent shims under `.claude/agents/` and any unused command shims under `.claude/commands/`.

**Fill these slots in `copilot-instructions.md`:**

1. Project name and one-paragraph description.
2. The "components" table — what the major pieces of the codebase are. Even a single-binary project usually has 2–4 logical components (api, db layer, frontend, etc.). One line each.
3. Tech stack bullet list.
4. Hard rules — the framework's defaults are good; add or remove based on your project.

**Fill these slots in `software-engineer.agent.md`:**

1. The "Project invariants" section — anything that's non-obvious and load-bearing. If you can't think of any, leave it as a single line saying "match existing patterns in the file you're editing."

Stop here. Use `@software-engineer` for everything. You can grow into more later.

---

## Tier 2: Standard adoption

Good for: production codebases, small teams, projects with at least one architectural rule worth enforcing.

**Add to Tier 1:**
- `.github/instructions/architecture.instructions.md`
- `.github/instructions/testing.instructions.md`
- `.github/agents/architect.agent.md` + `.claude/agents/architect.md`
- `.github/agents/code-reviewer.agent.md` + `.claude/agents/code-reviewer.md`
- `.github/agents/security-reviewer.agent.md` + `.claude/agents/security-reviewer.md`
- `.github/AGENTS.md`
- `.github/prompts/spec.prompt.md` + `.claude/commands/spec.md`
- `.github/specs/` (the directory and its README)
- `.github/workflow/ai-dev-lifecycle.md`

**Fill these slots in `architecture.instructions.md`:**

This is the highest-leverage file. List your **project invariants** — things you've decided that aren't obvious from the code:

- Bounded contexts and who owns what.
- Communication patterns (sync vs async, allowed call directions).
- Data ownership rules.
- Anything you've learned the hard way.

If you can't articulate any invariants, you don't need this file yet. Don't fill it with platitudes.

**Update the `applyTo` glob** at the top of each instructions file to match your project's layout. The defaults are language-neutral; tighten them.

**Fill `AGENTS.md`:**

1. The agent roster table — remove agents you're not using.
2. The routing table — adjust ambiguous-case examples to your domain.

**Update `testing.instructions.md`:**

1. Pick the language section(s) that apply, delete the rest.
2. Add framework-specific rules.

---

## Tier 3: Full adoption

Good for: multi-component codebases, teams with specialized domains, projects where consistent context across many contributors matters.

**Add to Tier 2:**
- `.github/instructions/api-design.instructions.md` (if you have HTTP APIs)
- `.github/agents/test-engineer.agent.md` + `.claude/agents/test-engineer.md`
- `.github/agents/_domain-expert-template.agent.md` + `.claude/agents/_domain-expert-template.md` → copy + rename **both** per domain (one agent + one shim per major sub-area)
- `.github/skills/` — write a SKILL.md for each significant domain concept
- `.github/memory/` — short summary file per major component
- `.github/prompts/` (+ matching `.claude/commands/` shims) — additional reusable prompts for common task shapes
- `.github/CHEATSHEET.md` — daily-use reference
- `.github/workflow/context-routing.md` — load-this-when rules

**For each domain expert agent:**

1. Copy `.github/agents/_domain-expert-template.agent.md` to `.github/agents/{domain}.agent.md`.
2. Copy `.claude/agents/_domain-expert-template.md` to `.claude/agents/{domain}.md` and update its frontmatter (`name`, `description`) plus the body's `{domain}` references.
3. Fill the slots in the `.github/` file: domain name, what it covers, key concepts, things to flag.
4. Reference the matching skill file.

**For each skill:**

1. Copy `_template/SKILL.md` to `{skill-name}/SKILL.md`.
2. Document the concepts an agent needs to be productive in that area.

**For each component memory file:**

1. Copy `_template-component.md` to `{component}.md`.
2. Keep it short — 30–80 lines. The point is "what does this component do, what does it own, how does it talk to others".

---

## What to slot, file by file

| File | Slots to fill |
|------|---------------|
| `CLAUDE.md` (root) | nothing required; trim the glob → instructions table to the rule files you keep |
| `.github/copilot-instructions.md` | project name, components table, tech stack, hard rules |
| `.github/AGENTS.md` | agent roster (remove unused), ambiguous-case routing examples |
| `.github/CHEATSHEET.md` | non-negotiables, anti-patterns, slash commands you actually use |
| `.github/instructions/architecture.instructions.md` | project invariants (THE highest-leverage slot) |
| `.github/instructions/testing.instructions.md` | language sections, frameworks |
| `.github/instructions/api-design.instructions.md` | nothing required; remove if not HTTP |
| `.github/agents/software-engineer.agent.md` | project invariants reminder |
| `.github/agents/architect.agent.md` | "core principles" list specific to your project |
| `.github/agents/_domain-expert-template.agent.md` | everything (copy + rename per domain) |
| `.claude/agents/_domain-expert-template.md` | frontmatter `name` + `description`, body `{domain}` references |
| `.github/workflow/context-routing.md` | trigger → load-this rules |
| Memory files | content (start from `_template-component.md`) |

---

## Adoption anti-patterns

- **Copying the whole tree and not filling slots.** Empty templates are worse than no templates — they lie about what the project enforces.
- **Inventing invariants to fill `architecture.instructions.md`.** If you don't have real rules, leave the file out.
- **Creating five domain agents on day one.** Add one when you notice yourself repeating the same context. Not before.
- **Writing memory files as documentation.** They're agent context, not docs. Keep them tight; they're loaded into a finite context window.
- **Maintaining the cheat sheet that nobody reads.** Delete it if you won't update it.
- **Editing content into `.claude/` shims.** They're pointers, not source. Edit `.github/`; the shims pick up your changes automatically.
- **Deleting in `.github/` but forgetting `.claude/` (or vice versa).** Orphan shims point at files that don't exist; orphan agent files don't show up in Claude Code. Delete in pairs.

---

## Updating the framework

The framework is versioned by date (the `version` field in `MANIFEST.json`, e.g. `2026-05-15`). Adopted projects can pull new framework files from the public repo without re-running adoption.

### Compatibility rules

Updates are designed to be safe for any project that has previously adopted the framework. Three rules make that true:

1. **Additive only.** New files added to the framework have no `PROJECT:` slots. They're pure framework code and can be dropped into any project unchanged.
2. **No deletes, no renames.** Files in the manifest never disappear or change path. A project that wired up `@software-engineer` in twenty places will keep working.
3. **Templates are never overwritten.** Files with `PROJECT:` slots (your `architecture.instructions.md`, your filled-in agent files) are marked `template` in the manifest. Updates only copy them if they're **missing locally**. Files you've customized stay yours.

What this means in practice: you can run `/update-framework` on a project you adopted a year ago and the worst that happens is "no new commands available." Existing slash commands and agents keep working exactly as they did.

### The /update-framework slash command

Adopted projects use the framework's own slash command:

```
/update-framework
```

It fetches `MANIFEST.json` from `github.com/sechang11/Agent0-Context-Framework`, diffs every listed file against your local copy, prints a plan, and downloads anything new or updated. Files with `PROJECT:` slots that already exist are left alone. The manifest version is recorded in `.github/.framework-version` so the next run knows the baseline.

Requirements on the host:

- `curl` (for HTTPS fetches)
- `python` (3.x, only used in the bootstrap script for JSON parsing)

No `gh` CLI, no auth, no git remote required — the framework repo is public.

### First-time install (bootstrap)

If a project doesn't yet have `/update-framework` (i.e. it adopted the framework before this command existed), run the bootstrap script once from the project root:

```bash
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
```

The bootstrap does the same diff-and-install work as `/update-framework`, in pure bash. After it finishes, the project has the update slash command and you never need the bootstrap again.

### Changelog

See the `changelog` array in `MANIFEST.json` for what's been added in each version. `/update-framework` prints entries newer than your project's last sync.

### Editing the framework itself

The above is for *consumers*. If you're editing this repo (the framework's source of truth):

- Add new commands or agents as **additive** entries in `MANIFEST.json`.
- Bump the `version` field to today's date (`YYYY-MM-DD`).
- Add a `changelog` entry describing what changed.
- Push to `main`. Adopted projects pick up the change next time they run `/update-framework`.

If you need to make a breaking change (rename, delete, schema shift), it doesn't go through `/update-framework`. Cut a new major version manually and document the migration.
