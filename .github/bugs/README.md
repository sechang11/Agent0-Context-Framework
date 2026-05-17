# Bug reports

Structured bug reports filed via `/report-bug`. Each file captures a single bug with:

- The user's account of what went wrong (intent, expectation, observed behavior, location).
- Auto-captured project state at filing time (git diff, recent commits, active spec, environment, framework version).
- A suggested investigating agent + rationale.
- Empty sections for **Investigation notes** and **Resolution** that the agent fills in when working the bug.

## File naming

`{YYYY-MM-DD-HHMM}-{kebab-slug}.md`

Examples:

- `2026-05-15-1432-login-button-does-nothing.md`
- `2026-05-15-1610-pagination-off-by-one.md`

Sortable by timestamp, descriptive at a glance. Slugs are derived from the bug title.

## Lifecycle

1. **Open** — `/report-bug` writes the file with `Status: open`.
2. **In progress** — the investigating agent updates the file, adds findings to **Investigation notes**, and changes `Status: in-progress`.
3. **Resolved** — when fixed, the agent (or user) sets `Status: resolved` and fills in **Resolution** with a link to the commit/PR.
4. **Won't fix / can't reproduce** — set `Status: wont-fix` or `Status: cant-reproduce` with a one-paragraph rationale.

Files are never auto-deleted — the bug history is the project's institutional memory. Archive old reports to `archive/` manually if the directory gets unwieldy.

## What goes in, what doesn't

✅ Bug reports filed via `/report-bug`.
✅ Resolution notes from the investigating agent.
✅ Related discussion if it doesn't fit elsewhere.

❌ Feature requests — those belong in `.github/specs/{feature}/` after `/spec`.
❌ Open-ended design questions — discuss with `@architect` directly.
❌ Anything containing secrets, API tokens, or production user data — `/report-bug` redacts these on filing; if something slipped through, fix it before committing.

## How to dispatch

Each report ends with a routing suggestion:

```
@software-engineer investigate .github/bugs/2026-05-15-1432-login-button-does-nothing.md
```

Run that line in Claude Code to start investigation. The agent will read the report, dig in, and update the file's **Investigation notes** as they work.
