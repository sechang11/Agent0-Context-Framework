<!-- PROJECT: optional file. Delete it if you won't keep it up to date. A stale cheat sheet is worse than none. -->
# Cheat Sheet

Daily reference. Optional — delete if your team won't maintain it.

---

## Non-negotiables

<!-- PROJECT: list 3-6 rules contributors break most often. -->

1. Non-trivial work starts with `/spec`.
2. Match existing patterns in the file you're editing.
3. One logical change = one commit.
4. (fill in your own)

---

## Anti-patterns (do not do)

<!-- PROJECT: list things you've seen contributors do that you want to prevent. Be specific. -->

- Implementing without `/spec` for non-trivial work
- Skipping tests "because the change is small"
- Hardcoding values that should come from config
- Bypassing the layered architecture (e.g. business logic in HTTP handlers)
- (fill in your own)

---

## Agents (invoke in chat as `@agent-name`)

<!-- PROJECT: prune to the agents you have. -->

```
@software-engineer   -- implement features, fix bugs
@architect           -- approve/reject design decisions
@code-reviewer       -- general code review
@security-reviewer   -- pass/fail with severity-ranked findings
@test-engineer       -- coverage gaps as blockers
```

Pick one primary per task. Optionally one validator after.

---

## Slash commands

<!-- PROJECT: list the prompts in `.github/prompts/` that you actually use. -->

```
/spec                  -- generate requirements + design + tasks
```

---

## Common workflows

### Bug fix

```
1. Reproduce the bug.
2. Add a regression test that fails before the fix.
3. Fix.
4. Verify test passes.
5. PR.
```

### New feature (non-trivial)

```
1. /spec
2. @architect reviews design
3. Implement task by task per tasks.md
4. @test-engineer
5. @security-reviewer if security-sensitive
6. PR referencing the spec
```

<!-- PROJECT: add workflows specific to your project. -->

---

## When to escalate to `@architect`

- Adding a new component
- Cross-component changes
- Schema changes to shared concepts
- New external integrations
- Anything that would change a hard rule

If unsure, escalate.

---

## Quick answers

<!-- PROJECT: fill in answers to questions contributors actually ask. Example: "Where does X live?" "What's the canonical example of Y?" -->

**"Which agent?"**
- Implement code → `@software-engineer`
- Design decision → `@architect`
- Tests → `@test-engineer`
- Security concern → `@security-reviewer`

**"Do I need a spec?"**
- Bug fix, typo, doc change: no.
- Anything else: yes. `/spec` first.
