# Upgrading an existing project from the stale framework

Use this when you have a project that adopted the framework **before** `/update-framework` existed (i.e. before version `2026-05-15`). You want to bring it up to date and gain the ability to pull future updates as a slash command from inside Claude Code.

You only need to do this **once per project**. After it runs, the project has `/update-framework` and never needs the curl one-liner again.

## Steps

### 1. Move into the existing project's root

```bash
cd C:/path/to/the/existing/project
```

The bootstrap requires `CLAUDE.md` or `.github/copilot-instructions.md` to exist — that's its sanity check that you're in a framework-adopted project, not a random directory.

### 2. Run the bootstrap script over curl

```bash
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
```

PowerShell version (uses `curl.exe` to bypass the `Invoke-WebRequest` alias):

```powershell
curl.exe -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
```

### 3. Watch the per-file plan

The bootstrap prints what it's doing as it goes:

```
==> fetching MANIFEST.json
    manifest version: 2026-05-15

  ADD                       .claude/commands/agents.md
  ADD                       .claude/commands/report.md
  ADD                       .claude/commands/update-framework.md
  ADD                       .github/prompts/agents.prompt.md
  ADD                       .github/prompts/report.prompt.md
  ADD                       .github/prompts/update-framework.prompt.md
  ok    (up-to-date)        .claude/commands/spec.md
  ok    (up-to-date)        .claude/commands/adopt-framework.md
  skip  (template, exists)  .github/agents/architect.agent.md
  skip  (template, exists)  .github/agents/software-engineer.agent.md
  ...

==> done
    added:           6
    updated:         0
    up-to-date:      4
    skipped (template, customized): 6

    baseline: 2026-05-15  (written to .github/.framework-version)
```

The key safety property: `skip (template, exists)` means your filled-in agent files and instruction files were **not** touched. Only the framework's additive layer (commands and shims) gets installed.

### 4. Restart your Claude Code session

The new slash commands (`/agents`, `/report`, `/update-framework`) load when the session starts. If you had the project open during the bootstrap, close and reopen it.

### 5. Review the diff and commit

```bash
git status
git diff
git add .claude .github CLAUDE.md
git commit -m "Adopt Agent0-Context-Framework update mechanism"
```

The bootstrap also appends new rows to `CLAUDE.md`'s slash-commands table — verify those look right before committing.

## Verifying it worked

In Claude Code, run:

```
/agents
```

You should see a table listing every agent in your project's `.claude/agents/` directory. If the command isn't recognized, the session didn't pick up the new shims — restart it.

Then check your baseline:

```bash
cat .github/.framework-version
```

Should print `2026-05-15` (or whatever version was current when you ran the bootstrap).

## Gotchas

- **Requires `curl` and `python` (3.x) on the host.** Both ship with Git for Windows / standard Unix. The bootstrap fails fast with a clear error if either is missing.
- **The bootstrap will overwrite agent shims in `.claude/agents/` if you've edited them.** Shims are marked `additive` in the manifest — the framework owns them. If you've customized a shim (e.g. tightened the `description` for your project's routing), that change will be lost. The framework's rule of thumb: customize the canonical `.github/agents/X.agent.md` (template, never overwritten); leave `.claude/agents/X.md` alone (shim, framework-owned).
- **Idempotent — safe to re-run.** If the network drops mid-bootstrap, just run it again. A second run with no changes will show all files as `up-to-date` or `skip`.
- **Doesn't commit anything.** All changes are left in the working tree for you to review.

## What to do next

- From now on, use `/update-framework` in Claude Code to pull further updates. See [`syncing-updates.md`](./syncing-updates.md).
- If a teammate has a stale project too, they run the same one-liner. No coordination required.
