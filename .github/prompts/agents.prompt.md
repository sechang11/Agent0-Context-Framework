---
mode: agent
description: List the agents assigned to this project, one specialty line per agent.
---

# /agents

Print a clean, scannable list of the agents currently assigned to this project. One row per agent, one specialty line each. This is a roster lookup — it does not invoke any agent.

## What to do

1. List `.claude/agents/*.md`. **Exclude any file whose name starts with `_`** (those are templates, not real agents).
2. For each remaining file, read the YAML frontmatter and extract:
   - `name` — the invocation handle (e.g. `architect`)
   - `description` — the role's purpose
3. If the description is more than one sentence, keep only the first sentence as the specialty line. Trim trailing whitespace.
4. Output as a Markdown table, sorted alphabetically by agent name:

   ```
   | Agent | Specialty |
   |-------|-----------|
   | `@architect` | Reviews and gates designs. |
   | `@software-engineer` | Implements features, fixes bugs, refactors. |
   | ... | ... |
   ```

5. End with a single-line footer:

   > **Total:** N agent(s) on this project.

## Rules

- Do not include template files (anything beginning with `_`).
- Do not read the canonical role files in `.github/agents/` — the shim frontmatter is the source of truth for the roster view.
- Do not invoke any agent. This is a list, not a roundtable. Use `/report` for that.
- Output only — do not modify any file.
