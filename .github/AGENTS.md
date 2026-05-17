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
| Verification Engineer | `verification-engineer.agent.md` | Turns spec acceptance criteria into runnable verification.md checkpoints; used by `/verify` |

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

Two paths depending on whether the feature is greenfield or brownfield. Both converge at the verification step.

**Greenfield — new work, written before code:**

1. **Spec** — `/spec` for non-trivial work.
2. **Architect review** — `@architect` approves the design before implementation.
3. **Implementation** — match existing patterns; tests as you go.
4. **Tests** — `@test-engineer` flags coverage gaps.
5. **Reviews** — `@security-reviewer` if security-sensitive; `@code-reviewer` otherwise.
6. **Verification** — `/verify {feature}` bootstraps `verification.md` from the spec via `@verification-engineer`; re-runs it to confirm the feature works end to end. Failing checkpoints route through `/report-bug`.

**Brownfield — existing code that predates the framework:**

1. **Cover** — `/cover {feature}` with the user-supplied surfaces (routes, endpoints, files, commands). `@verification-engineer` reads the code at those surfaces and writes a code-derived `verification.md` documenting current observable behavior.
2. **Triage concerns** — the code-derived verification flags anything that looks like a bug as a concern (not as a checkpoint). File each concern through `/report-bug` or accept it as by-design.
3. **Verify** — `/verify {feature}` runs the code-derived checkpoints to capture a baseline (the regression suite).
4. **(Optional) Upgrade to spec-derived** — write `requirements.md` retroactively for desired behavior, then `/verify {feature} --bootstrap` flips the verification from snapshot to contract.

The verification.md file is the same in both paths — distinguished only by `source: spec | code` in its frontmatter. Stage 3 (web debug panel) renders both identically.

## Project-specific reminders

<!-- PROJECT: list 3-6 things that get violated often or are easy to forget. Examples: "All HTTP through the typed API client, never raw fetch from a component." "The job queue is the only async boundary." "Database writes only happen in the worker fleet." -->

- (fill in)
