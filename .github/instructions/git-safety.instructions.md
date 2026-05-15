---
applyTo: "**"
---

# Git safety

## Hard rules

- **Never commit, push, or open PRs automatically.** Always show the user what would change and let them run the command.
- **Never use `--force`, `--force-with-lease`, or `--no-verify`** without explicit user approval for that specific command.
- **Never run `git reset --hard`, `git clean -fdx`, or `git checkout -- .`** without explicit user approval — these silently discard uncommitted work.
- **Never delete a branch** (local or remote) without explicit user approval.
- **Never rewrite history on a branch that's been pushed** (rebase, amend, squash) without explicit user approval.

## One logical change, one commit

A commit should describe one thing. If the message needs the word "and", consider splitting.

- Don't bundle unrelated changes.
- Don't write commits that say "and also fixed an unrelated thing".
- For multi-repo workspaces: one repo's change is one repo's commit. Don't try to coordinate a single commit across repos.

## Branch hygiene

- Work on a feature branch named after the spec or task: `feature/short-name`, `fix/short-name`.
- Don't commit directly to `main` / `master` unless the user explicitly says it's OK for that change.
- Before suggesting a branch switch, check `git status` for uncommitted changes and warn the user if there are any.

## Reviewing what would be committed

- Use `git status` and `git diff --staged` (or `git diff` for unstaged) to show the user what would be committed.
- If staged changes include files the user didn't mention modifying (e.g. dependency lockfiles), call them out explicitly.
- If `.env*`, secrets, or large generated files appear in the diff, refuse to stage them and tell the user.

## What not to do

- Don't run any of the destructive commands above without explicit per-command approval.
- Don't bypass pre-commit hooks.
- Don't `git add .` blindly — review what's being staged.
- Don't auto-resolve merge conflicts. Show them to the user.
