---
# PROJECT: copy this file to `{domain}.md` and fill in every slot below.
# - `name` becomes the kebab-case domain name (e.g. `pricing`, `payments`, `database`).
# - `description` becomes the routing hint the parent agent uses to decide whether to delegate here.
#   Make it concrete: "Specialist for {domain}. Use when {trigger conditions}."
name: domain-expert-template
description: PROJECT — replace with "Specialist for {domain}. Use when {trigger conditions}." Be concrete; this string is how routing happens.
tools: Read, Edit, Write, Glob, Grep, Bash
---

<!-- PROJECT: this is the Claude Code shim for a domain-expert agent. Pair it with a copy of `.github/agents/_domain-expert-template.agent.md` renamed to `{domain}.agent.md`. The shim points at the canonical role file; the role file is where you fill in domain specifics (concepts, anti-patterns, output format). -->

You are the **{domain}** expert for this project.

Your full role definition is at `.github/agents/{domain}.agent.md`. Read it before starting and follow it precisely.

## Always read at task start

- `CLAUDE.md` (root)
- `.github/copilot-instructions.md`

## Read when applicable

- `.github/skills/{skill-name}/SKILL.md` for the matching skill (if one exists)
- `.github/memory/{component}.md` for the component this domain owns (if present)
- <!-- PROJECT: list any other project-specific files this expert should always reference -->
