# Setting up a new project

Use this when you're adopting Agent0-Context-Framework into a project that has never had it before.

The framework distributes its **additive** layer (commands, agent shims) via a manifest, but the heavyweight **template** files (`CLAUDE.md`, `.github/copilot-instructions.md`, agent canonicals, instructions files) have `PROJECT:` slots that need to be filled per project. Cleanest first-time adoption is therefore: clone-and-copy the structure, then run `/adopt-framework` to fill the slots.

## Steps

### 1. Move into your project's root

```bash
cd C:/path/to/my-new-project
```

### 2. Clone the framework into a temp directory

```bash
git clone --depth 1 https://github.com/sechang11/Agent0-Context-Framework.git /tmp/acf
```

`--depth 1` skips history — you only need the current files.

### 3. Copy the framework structure into your project

```bash
cp -r /tmp/acf/.github ./
cp -r /tmp/acf/.claude ./
cp /tmp/acf/CLAUDE.md ./
```

This brings over the canonical agents, instructions, prompts, the Claude shims, and the entry-point `CLAUDE.md`. It deliberately omits `MANIFEST.json`, `scripts/`, `docs/`, `README.md`, and `CUSTOMIZATION.md` — those are framework-repo internals, not project content.

### 4. Record which framework version you adopted

```bash
python -c "import json; print(json.load(open('/tmp/acf/MANIFEST.json'))['version'])" > .github/.framework-version
```

This baseline tells `/update-framework` what's already in your project so it knows what's new on future syncs.

### 5. Clean up the temp clone

```bash
rm -rf /tmp/acf
```

### 6. Fill the `PROJECT:` slots with `/adopt-framework`

Open the project in Claude Code and run:

```
/adopt-framework
```

It will explore your codebase, ask ~5 targeted questions (project name, components, architectural invariants, tier, personas), and fill in the slots. It labels each filled slot as `observed`, `asked`, or `omitted`. It will not commit anything — you review the diff and commit when satisfied.

## PowerShell equivalent

If you prefer PowerShell over Git Bash:

```powershell
cd C:\path\to\my-new-project
git clone --depth 1 https://github.com/sechang11/Agent0-Context-Framework.git "$env:TEMP\acf"
Copy-Item -Recurse "$env:TEMP\acf\.github" .
Copy-Item -Recurse "$env:TEMP\acf\.claude" .
Copy-Item "$env:TEMP\acf\CLAUDE.md" .
python -c "import json; print(json.load(open(r'$env:TEMP\acf\MANIFEST.json'))['version'])" `
  | Out-File -Encoding utf8 .github\.framework-version
Remove-Item -Recurse -Force "$env:TEMP\acf"
```

## Gotchas

- **Existing `.github/` directory.** If your project already has `.github/workflows/` for CI, the framework's `.github/agents/`, `.github/prompts/`, etc. merge in cleanly — no path collisions in practice. Existing files keep their content.
- **Don't run the bootstrap script for new-project setup.** `scripts/bootstrap.sh` only pulls files listed in the manifest (commands + shims). The heavyweight template files aren't in the manifest by design — they're best handled by `/adopt-framework`'s interview flow.
- **Don't skip `/adopt-framework`.** The slots are filled with placeholders like `<!-- PROJECT: project name -->` that look fine but make the agents less effective. The interview is short.

## What to do next

- `/update-framework` — once you've adopted, this is how you pull future framework additions. See [`syncing-updates.md`](./syncing-updates.md).
