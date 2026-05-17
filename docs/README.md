# Operating guide

Four workflows cover everything you do with Agent0-Context-Framework. Pick the one that matches what you're trying to do.

| Goal | Read |
|------|------|
| **New to the framework — what is this?** | [`getting-started.md`](./getting-started.md) — the newbie-friendly tour. Also surfaced via `/help` in any adopted project. |
| Adopt the framework into a brand-new project | [`setup-new-project.md`](./setup-new-project.md) |
| Bring a project that adopted before `2026-05-15` up to date | [`upgrade-existing-project.md`](./upgrade-existing-project.md) |
| Add a new slash command, agent, or instruction file to the framework itself | [`extending-the-framework.md`](./extending-the-framework.md) |
| Pull the latest framework changes into an already-adopted project | [`syncing-updates.md`](./syncing-updates.md) |

## Quick reference

| Task | Command |
|------|---------|
| Set up a new project | `git clone --depth 1` framework to temp + `cp -r .github .claude CLAUDE.md ./` + run `/adopt-framework` |
| Update a stale project (once) | `curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh \| bash` |
| Update a project that already has `/update-framework` | `/update-framework` in Claude Code |
| Add to the framework | edit files, add to `MANIFEST.json`, bump `version`, add changelog entry, `git push` |
| Where's the framework version recorded per project? | `.github/.framework-version` |
| Where's the canonical version? | `MANIFEST.json` → `version` field in the framework repo |

## How the pieces fit together

```
                    GitHub: sechang11/Agent0-Context-Framework
                              │
                  MANIFEST.json (version + file list + changelog)
                              │
              ┌───────────────┼─────────────────────────┐
              │                                          │
         /update-framework                       scripts/bootstrap.sh
         (slash command)                         (curl | bash)
              │                                          │
              └──────────────┬───────────────────────────┘
                             │
                  Adopted project on disk:
                  .claude/, .github/, CLAUDE.md,
                  .github/.framework-version (baseline)
```

The framework repo is the single source of truth. Every adopted project records the manifest version it last synced to. The slash command and the bootstrap script both implement the same diff-and-install algorithm — one runs from Claude Code (after first install), the other from a terminal (for the first install).

## Safety properties to remember

1. **`additive` files** are owned by the framework. Updates overwrite them. Don't customize files marked `additive` (slash command shims, command prompts, agent shims) — customize their canonical counterparts in `.github/` instead.
2. **`template` files** are owned by your project. Updates **never** overwrite them — only install if missing. Once you've filled the `PROJECT:` slots, they're yours.
3. **No file in the manifest ever disappears or renames.** That's the no-deletes rule. Breaking that requires a major version cut.
4. **Updates are idempotent.** Re-run any time. A no-op shows up as "all up-to-date."
