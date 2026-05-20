# Extending the framework — adding agents, skills, commands

Use this when you're working in the framework repo itself (not in a downstream project) and you want to add a new slash command, a new agent persona, or a new instruction file. After you push, downstream projects pick up the change via `/update-framework`.

This is the workflow you'll run most often as the framework grows.

## Where you work

```bash
cd C:/Users/Kashix/Documents/CS/Projects/AgentsMD/context-framework
```

Everything in this guide happens inside the framework's own git repo.

## Workflow A — adding a new slash command

Example: a new `/refactor` command.

### 1. Write the canonical prompt

```bash
# Use an existing prompt as your structural reference
# e.g. .github/prompts/spec.prompt.md or .github/prompts/agents.prompt.md
$EDITOR .github/prompts/refactor.prompt.md
```

The prompt contains the full instructions Claude follows when the command runs. Structure it with `mode: agent` frontmatter, an `# /refactor` h1, and clearly labeled phases.

### 2. Write the shim

```bash
$EDITOR .claude/commands/refactor.md
```

The shim is always five lines and just points at the canonical:

```markdown
---
description: One-line description matching the canonical prompt's frontmatter.
---

The full prompt for this command is at `.github/prompts/refactor.prompt.md`. Read it and follow it precisely.
```

### 3. Update `MANIFEST.json`

Three edits:

**`files[]`** — append two entries (both `additive`):

```json
{ "path": ".github/prompts/refactor.prompt.md", "class": "additive" },
{ "path": ".claude/commands/refactor.md",       "class": "additive" }
```

**`commands_table[]`** — append:

```json
{ "command": "/refactor", "purpose": "One-line purpose for the slash-commands table" }
```

**`version`** — bump to today's date: `"version": "2026-06-12"`.

**`changelog[]`** — prepend a new entry:

```json
{
  "version": "2026-06-12",
  "notes": [
    "Added /refactor — short description of what it does."
  ]
}
```

### 4. Update `CLAUDE.md` (the framework's own copy)

Add the row to the slash-commands table so the framework's CLAUDE.md stays in sync with what gets distributed:

```
| `/refactor` | <purpose> |
```

### 5. Regenerate CHANGELOG.md

After editing `MANIFEST.json`, regenerate the human-readable `CHANGELOG.md` so it stays in sync. The framework no longer ships a Python script for this — Claude Code does the regeneration on demand.

In your Claude Code session, just say:

> Regenerate `CHANGELOG.md` from `MANIFEST.json`'s changelog array. Latest version first, all changelog entries, format each as `## {version}` followed by the notes as bulleted Markdown.

The agent reads the manifest, formats the entries, and writes the file. Takes a few seconds. Same result as a script would produce. Don't edit `CHANGELOG.md` by hand — the manifest is the source of truth and the next regen overwrites your edits.

### 6. Commit and push

```bash
git add .github/prompts/refactor.prompt.md \
        .claude/commands/refactor.md \
        MANIFEST.json \
        CHANGELOG.md \
        CLAUDE.md
git commit -m "Add /refactor slash command"
git push
```

## Workflow B — adding a new agent

Example: a `db-expert` agent for database-heavy work.

### 1. Create the canonical agent file from the template

```bash
cp .github/agents/_domain-expert-template.agent.md .github/agents/db-expert.agent.md
$EDITOR .github/agents/db-expert.agent.md   # fill the PROJECT slots
```

The canonical describes the role: responsibilities, what to read first, anti-patterns, output format. This is the file the agent actually loads at task start.

### 2. Create the shim

```bash
cp .claude/agents/_domain-expert-template.md .claude/agents/db-expert.md
$EDITOR .claude/agents/db-expert.md
```

In the shim:
- Update frontmatter: `name: db-expert`, `description: "<one-line trigger phrase>"`, `tools: <comma-separated list>`.
- Update body: replace `{domain}` references with `db-expert`.

### 3. Update `MANIFEST.json`

**`files[]`** — add two entries:

```json
{ "path": ".github/agents/db-expert.agent.md", "class": "template"  },
{ "path": ".claude/agents/db-expert.md",       "class": "additive" }
```

The canonical is `template` because it has `PROJECT:` slots the user fills per project. The shim is `additive` because the framework owns its frontmatter.

Bump `version` and add a `changelog` entry.

### 4. Update `.github/AGENTS.md`

Append a row to the agent roster table:

```
| DB Expert | `db-expert.agent.md` | Database schema design, migrations, query review |
```

### 5. Commit and push

```bash
git add .github/agents/db-expert.agent.md \
        .claude/agents/db-expert.md \
        .github/AGENTS.md \
        MANIFEST.json
git commit -m "Add db-expert agent persona"
git push
```

## Workflow C — adding a new instruction file

Example: a `.github/instructions/observability.instructions.md`.

Same pattern as above, but the `class` depends on whether it has `PROJECT:` slots:

- **Has slots** (project-specific rules): `template`. Distributed via the manifest, but never overwrites existing copies in adopted projects.
- **No slots** (pure rules, e.g. like `git-safety.instructions.md`): `additive`. Always overwrites on update — the framework owns it.

## What goes in the manifest, what doesn't

| File type | In manifest? | Class |
|---|---|---|
| New slash command prompt + shim | yes | `additive` |
| New agent shim | yes | `additive` |
| New canonical agent file | yes | `template` (has PROJECT slots) |
| New skill in `.github/skills/` | usually no — too project-specific to distribute | — |
| New instruction file with slots | yes | `template` |
| New instruction file with no slots | yes | `additive` |
| Edits to a heavyweight template body (CLAUDE.md, copilot-instructions.md) | no — these are user-owned per project, can't safely auto-update | — |
| `docs/`, `scripts/`, `README.md`, `CUSTOMIZATION.md` | no — framework-repo internals | — |

## The version field — what to write

Use the date you push: `YYYY-MM-DD`. If you push twice the same day with substantive changes, append a letter: `2026-05-15a`, `2026-05-15b`. The comparison is string equality, not semver — any change of value is "newer."

## Testing before publishing

Before pushing a new version, sanity-check it from a throwaway project:

```bash
# In any directory with at least a CLAUDE.md or .github/copilot-instructions.md
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
```

Confirm the plan output mentions your new files. Then open in Claude Code and try the new command/agent end to end.

## Gotchas

- **Don't change frontmatter shape on a shim that's already deployed.** If `name: architect` becomes `agent_name: architect`, every Claude Code session in an adopted project that has invoked `@architect` will break. Add new fields, never repurpose old ones.
- **Don't rename or delete a manifest file.** Adopted projects depend on those exact paths. To retire something: leave the file in place, mark its body as deprecated, and stop documenting it. (Real deletion = breaking change = new major version + migration notes.)
- **Don't forget the `CLAUDE.md` table edit.** It's easy to add to the manifest and forget the framework's own CLAUDE.md, which then drifts from what gets distributed.
- **Keep the canonical prompt the source of truth.** Don't paste prompt content into the `.claude/commands/` shim — it's supposed to be a five-line pointer. Two-tool maintenance is what kills frameworks.

## What to do next

- After you push, see [`syncing-updates.md`](./syncing-updates.md) for how downstream projects pull the change.
