# AI-Assisted Development Lifecycle

The spec-first workflow. Apply to non-trivial work; small fixes can skip straight to implementation.

## What counts as non-trivial

**Spec required:**
- New features.
- New endpoints.
- Schema changes.
- Cross-component changes.
- New external integrations.
- Anything that would change a hard rule or project invariant — and these almost certainly shouldn't change.

**Spec not required:**
- Bug fixes (with a regression test).
- Typo fixes, formatting, comments.
- Configuration tweaks within an existing feature.
- Adding tests to existing code.

When in doubt, write the spec. The cost of a small spec is small; the cost of a missing spec is rework.

---

## The five phases

### 1. Spec

Use `/spec`. Produces three files under `.github/specs/{feature-name}/`:

- `requirements.md` — problem, goals, non-goals, constraints.
- `design.md` — approach, affected components, API surface, failure modes, alternatives.
- `tasks.md` — ordered, PR-sized tasks, test plan, rollback.

**Hard rule:** three separate files, never combined, never in a source directory.

**Read first:** the project overview (`.github/copilot-instructions.md`), the relevant memory files, and any cross-component file if it crosses components.

**No code yet.** A spec is documents. Pseudocode is fine; runnable code is not.

### 2. Architect review

Always for cross-component changes, schema changes, new components, anything affecting hard rules.

Use `@architect`. Architect approves or rejects the design. A reluctant approval is worse than a clean rejection — the architect should be willing to say no.

Iterate on `design.md` until approved. Don't write `tasks.md` until design is approved.

### 3. Implementation

Once design is approved and `tasks.md` is written, implement task by task. One PR per task.

For each task:

1. Pick the right prompt template if one applies.
2. Use `@software-engineer` for general code; use a domain expert agent if one exists for the area.
3. Follow the relevant scoped instructions (auto-loaded by file pattern).
4. Match existing patterns in the target component.
5. Write tests as you go.

**One logical change = one commit.** Don't bundle unrelated changes.

### 4. Tests + Reviews

For each PR:

- `@test-engineer` checks coverage gaps. Blockers stop the merge.
- `@security-reviewer` if the change is security-sensitive (auth, PII, money, external integrations). Critical or High findings block.
- `@code-reviewer` for general review.

Address blockers before requesting human review.

### 5. PR readiness

PR body references:

- The spec (`.github/specs/{feature-name}/`).
- The agent(s) used in review.
- Summary of what changed and why.

Suggested format:

```
## Spec
.github/specs/{feature-name}/

## Reviews
@architect (approved design)
@security-reviewer (passed, 0 Critical/High)
@test-engineer (coverage adequate)

## Changes
[summary]
```

---

## Bug-fix workflow (no spec)

```
1. Reproduce the bug. Get the correlation/request id if it's a runtime issue.
2. Identify the failing component.
3. Add a regression test that fails before the fix.
4. Fix in the owning component only.
5. Verify test passes.
6. PR.
```

---

## Rules across all phases

- Read existing code and context before designing.
- Don't write code during spec creation.
- Match existing patterns in the target component.
- One logical change = one commit.
- Never auto-commit / auto-push / auto-PR.
- Never modify dependency versions without explicit user permission.
- Never bypass safety controls (`--no-verify`, `--force`, destructive db / git ops) without explicit user approval per command.
- Always include the correlation/request id in logs and outbound calls.

---

## Related

- `../prompts/spec.prompt.md` — the `/spec` prompt itself.
- `context-routing.md` — what context to load for which task.
- `../CHEATSHEET.md` — daily reference.
