---
mode: agent
description: Generate a spec for non-trivial work — produces requirements.md, design.md, tasks.md
---

# /spec

You are producing a spec for non-trivial work. **A spec is documents, not code. Do not write any implementation code during spec creation.**

## Output

Three separate files under `.github/specs/{feature-name}/`:

1. `requirements.md`
2. `design.md`
3. `tasks.md`

Never combine them. Never put them inside a source directory. Use kebab-case for `{feature-name}`.

## Process

1. Confirm the feature name with the user if it's not obvious from the request.
2. Read the relevant context before writing:
   - `.github/copilot-instructions.md` (always)
   - `.github/memory/{component}.md` for each component in scope (if memory files exist)
   - Any cross-component / relationships file (if it exists)
   - Any relevant `.github/skills/*/SKILL.md`
3. Write `requirements.md` first.
4. Write `design.md`. Stop here and ask `@architect` to review before writing tasks.
5. Once design is approved, write `tasks.md`.

## requirements.md

```
# Requirements: {Feature Name}

## Problem
What problem does this solve? Whose? Why now?

## Goals
- bullet list, outcome-focused

## Non-goals
- explicitly out of scope

## User-visible behavior
What changes for the user / admin / contributor?

## Constraints
- domain constraints
- platform / architectural constraints (link to project invariants)
- existing-state constraints (what we can't break)

## Open questions
- things to resolve before design
```

## design.md

```
# Design: {Feature Name}

## Approach
One paragraph: the chosen approach, in plain language.

## Affected components
- component: what changes there
- component: what changes there

## Data model changes
- new tables / columns / fields
- migration path

## API surface
- new / changed endpoints with request/response shapes

## Cross-component interactions
- new calls between components (must respect project communication rules)
- if any new call breaks an invariant, justify it explicitly

## Failure modes
- what happens when each dependency is unavailable
- what happens on partial failure

## Alternatives considered
- briefly: what we rejected and why

## Open questions
- things to resolve before tasks
```

## tasks.md

```
# Tasks: {Feature Name}

Order the tasks so the system stays working at each step. Each task is small enough to be one PR.

## Tasks
1. [component] task description
2. [component] task description
3. ...

## Test plan
- unit tests covering ...
- integration tests covering ...
- manual verification steps

## Rollback plan
- how to revert if this goes wrong
```

## Hard rules

- Three files. Never combined.
- Files under `.github/specs/{feature-name}/`. Never inside a source directory.
- No code in any of the three files. Pseudocode is fine; runnable code is not.
- Always read context before writing. Don't design from assumptions.
- If the feature requires breaking any project invariant, call it out explicitly in `design.md` and route to `@architect`.

## What to ask the user before starting

- Feature name (kebab-case).
- Which components are likely involved (your guess; user will correct).
- Whether this is a behavior change that could be configuration vs a true platform change.
