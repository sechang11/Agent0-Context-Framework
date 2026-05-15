---
description: Customize this dual-tool context framework for the current repository — explore the codebase, interview the user, and fill in PROJECT slots in both .github/ and .claude/.
---

The full prompt for this command is at `.github/prompts/adopt-framework.prompt.md`. Read it and follow it precisely.

## Dual-tool note

The canonical files live in `.github/`. The `.claude/` shims point at them and don't usually contain content to fill — but they do contain a few `PROJECT:` slots (notably in `.claude/agents/_domain-expert-template.md`).

**Whenever the adoption prompt deletes a `.github/` file, also delete the matching `.claude/` shim:**

| Deleting in `.github/` | Also delete |
|------------------------|-------------|
| `.github/agents/X.agent.md` | `.claude/agents/X.md` |
| `.github/prompts/X.prompt.md` | `.claude/commands/X.md` |
| `.github/agents/_domain-expert-template.agent.md` | `.claude/agents/_domain-expert-template.md` |

**When creating a new domain-expert agent**, create both:

1. Copy `.github/agents/_domain-expert-template.agent.md` → `.github/agents/{domain}.agent.md` and fill it in.
2. Copy `.claude/agents/_domain-expert-template.md` → `.claude/agents/{domain}.md` and update its frontmatter (`name`, `description`) plus the body's `{domain}` references.

## Self-check

After Phase 5, also run:

```bash
grep -rn 'PROJECT:' .claude/ CLAUDE.md 2>/dev/null || true
```

Report any remaining `PROJECT:` markers in the Claude shim layer alongside the `.github/` ones.
