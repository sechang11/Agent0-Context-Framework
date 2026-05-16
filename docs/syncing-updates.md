# Syncing framework updates into existing projects

Use this when you've pushed a new version of the framework (added a command, a new agent, a fixed prompt) and you want to pull those changes into a project that already has the framework adopted.

This is the most common workflow once everything is set up. It's a single slash command per project.

## Prerequisite

The project must already have `/update-framework` installed. If it doesn't (because it adopted before version `2026-05-15`), run the one-time upgrade first — see [`upgrade-existing-project.md`](./upgrade-existing-project.md).

## Steps

### 1. Open the project in Claude Code

Any session in the project root.

### 2. Run the slash command

```
/update-framework
```

### 3. Watch the plan, then watch it execute

Claude will:

1. Fetch `MANIFEST.json` from `github.com/sechang11/Agent0-Context-Framework`.
2. Compare the remote `version` to your local `.github/.framework-version`. If they match, it'll tell you you're up-to-date and stop unless you ask it to re-sync anyway.
3. Print a per-file plan showing what will be added, updated, left alone, or skipped.
4. Show you the changelog entries newer than your last sync.
5. Execute: download new/changed `additive` files, leave `template` files that already exist untouched, append new rows to `CLAUDE.md`'s slash-commands table, and write the new baseline to `.github/.framework-version`.
6. Remind you to restart the Claude Code session so the new commands/agents load.

### 4. Restart the Claude Code session

New slash commands and agent shims only register when the session starts. Close and reopen the project.

### 5. Review the diff and commit

```bash
git diff                              # see exactly what changed
git add .claude .github CLAUDE.md
git commit -m "Sync Agent0-Context-Framework to 2026-06-12"
```

`/update-framework` deliberately does not commit anything — review is yours.

## Updating many projects at once

If you have a dozen projects to bring up to date, scripting beats clicking through each. From a directory containing them all:

```bash
for proj in project-a project-b project-c; do
  echo "==> $proj"
  (cd "$proj" && curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash)
done
```

PowerShell equivalent:

```powershell
$projects = @("project-a", "project-b", "project-c")
foreach ($p in $projects) {
  Write-Host "==> $p"
  Push-Location $p
  curl.exe -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
  Pop-Location
}
```

The bootstrap script does the same diff-and-install work as `/update-framework`, so it's safe to use even on projects that already have the slash command — it's idempotent. Review each project's diff separately before committing.

## What if I'm not sure a project has `/update-framework` yet?

Check for the file:

```bash
ls .claude/commands/update-framework.md 2>/dev/null && echo "yes" || echo "no — run bootstrap"
```

Or just run the curl bootstrap unconditionally — it works whether or not the slash command is already present.

## Gotchas

- **`/update-framework` won't run in a non-adopted project.** It checks for `CLAUDE.md` or `.github/copilot-instructions.md` and bails if neither exists. That's intentional — it's not an adopter, it's an updater.
- **Doesn't auto-commit.** Review the diff yourself. If something looks wrong, `git checkout -- <file>` to revert and report the issue.
- **Template files in adopted projects don't get updated.** If you improve `_domain-expert-template.agent.md` in the framework, existing projects keep their existing copy (because it might be filled in with their project's content). The trade-off is safety: the framework can never clobber a user-customized file. To propagate template improvements, either tell the project owner to re-run `/adopt-framework` or hand-merge.
- **`additive` files in adopted projects DO get updated.** If you've personally edited a `.claude/agents/architect.md` shim, your edit will be overwritten on the next sync. The framework owns `additive` content. Edit `.github/agents/X.agent.md` instead (it's `template`, never overwritten).
- **Network failure mid-update is fine.** Re-run. It's idempotent — already-downloaded files show as `up-to-date`, missing ones still fetch.

## What to do next

- If a new command shows up in the slash-commands table after sync, try it out.
- If something broke after an update, check the changelog in `MANIFEST.json` for what changed, and `git revert` the sync commit if needed. File an issue on the framework repo so the next version fixes it for everyone.
