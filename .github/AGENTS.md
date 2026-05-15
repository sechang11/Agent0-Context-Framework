<!-- PROJECT: this file is the agent routing manifest. Keep the structure; replace the slot-marked sections. -->
# Agent Instructions

You are working in <!-- PROJECT: project name and one-line description -->. See `copilot-instructions.md` for the component map.

## Hard rules (all agents)

- Never read `.env`, `.env.*`, or any file containing secrets/credentials/tokens.
- Never modify dependency manifests without explicit user permission.
- Never run destructive commands without explicit user approval.
- Never commit, push, or open PRs automatically.
- Reference credentials by environment-variable name only.
- Specs must produce exactly three files (`requirements.md`, `design.md`, `tasks.md`) under `.github/specs/{feature-name}/`. Never a single combined document.

## Context loading

Before starting work:

1. Read `.github/copilot-instructions.md` (always).
2. If a memory file exists for the component you're touching (`.github/memory/{component}.md`), read it.
3. If the change crosses components and a relationships file exists, read it.
4. Check `.github/workflow/context-routing.md` (if present) for additional context to load.

If the file you'd want to read doesn't exist, proceed without it. The framework degrades gracefully.

## Agent roster

<!-- PROJECT: remove rows for agents you don't have. Add rows for any domain-expert agents you create from `_domain-expert-template.agent.md`. -->

| Agent | File | Responsibility |
|-------|------|---------------|
| Software Engineer | `software-engineer.agent.md` | Implementation, matches existing patterns |
| Architect | `architect.agent.md` | Design review, rejects bad designs |
| Code Reviewer | `code-reviewer.agent.md` | General code review |
| Security Reviewer | `security-reviewer.agent.md` | Security findings, severity-ranked |
| Test Engineer | `test-engineer.agent.md` | Coverage gaps, untested edge cases |

Pick **one** primary agent per task. You may use a second for validation (e.g. `@security-reviewer` after `@architect`). Don't stack three.

### Ambiguous cases

<!-- PROJECT: replace these examples with situations that actually come up in your project. -->

| Situation | Use |
|-----------|-----|
| Implement something covered by an existing pattern | `@software-engineer` |
| New endpoint, new schema, new external integration | `@architect` first, then `@software-engineer` |
| Touches authentication, authorization, money, or PII | `@software-engineer`, then `@security-reviewer` |
| Bug fix with regression test | `@software-engineer` (no spec needed) |
| Anything that would change a hard rule | `@architect` (likely a no) |

## Development lifecycle

Follow `.github/workflow/ai-dev-lifecycle.md` if present:

1. **Spec** — `/spec` for non-trivial work.
2. **Architect review** — `@architect` approves the design before implementation.
3. **Implementation** — match existing patterns; tests as you go.
4. **Tests** — `@test-engineer` flags coverage gaps.
5. **Reviews** — `@security-reviewer` if security-sensitive; `@code-reviewer` otherwise.

## Project-specific reminders

<!-- PROJECT: list 3-6 things that get violated often or are easy to forget. Examples: "All HTTP through the typed API client, never raw fetch from a component." "The job queue is the only async boundary." "Database writes only happen in the worker fleet." -->

- (fill in)
