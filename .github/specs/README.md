# Specs

Specs live here. The `/spec` workflow produces three files per spec:

```
.github/specs/{feature-name}/
  requirements.md
  design.md
  tasks.md
```

## Conventions

- `{feature-name}` is kebab-case.
- Always three files. Never combined into one document.
- Specs are documents, not code. No runnable code lives in them; pseudocode is fine.
- A spec stays in this directory after the feature ships — it's the historical record of why the design is what it is.

## Lifecycle

1. `/spec` produces `requirements.md` and `design.md`.
2. `@architect` reviews `design.md`. Iterate until approved.
3. Once design is approved, `/spec` produces `tasks.md`.
4. Implementation follows `tasks.md`, one PR per task.
5. PR bodies reference the spec directory.

See `.github/workflow/ai-dev-lifecycle.md` for the full lifecycle.

## When to write a spec

**Required:**
- New features.
- New endpoints, schema changes, cross-component changes.
- New external integrations.
- Anything that would change a project invariant.

**Not required:**
- Bug fixes (with regression test).
- Typos, formatting, comments.
- Adding tests to existing code.

## Template

`_template/` contains starter files. Copy the directory:

```
cp -r .github/specs/_template .github/specs/{feature-name}
```

Then fill in. The `/spec` prompt does this for you.

## Naming

Use a name that's still meaningful in six months. `add-grace-period` is better than `billing-fix`. `migrate-to-postgres` is better than `db-work`.
