---
mode: agent
description: Browse, pick, save, apply, mix, or import design themes via the shopper showroom interaction. Operates on .github/themes/*/THEME.md. Default visual depth is --text; --swatch shows palettes inline; --mockup1/2/full render in the project's stack.
---

# /theme

Manage design themes for this project. Each theme is a `THEME.md` file at `.github/themes/{theme-name}/THEME.md` capturing design tokens (JSON) + philosophy (prose) + component examples (code). Themes are managed by `@ui-ux-engineer` using the **shopper showroom interaction model**: show options, ask "this or this," narrow from responses.

The user doesn't need to know design vocabulary. They need to see options and pick.

## Invocation patterns

| Pattern | What it does |
|---|---|
| `/theme` | Default — show the project's adopted theme (if any) and list available themes. |
| `/theme browse` | Showroom of available themes, both local (`.github/themes/`) and the three framework starters. |
| `/theme apply {name}` | Apply a theme to the project as the adopted default. Records the choice in `.github/themes/.adopted` (a single-line file). |
| `/theme save {name}` | Save the project's current state as a new theme (collects design tokens from existing CSS/Tailwind config). |
| `/theme import {name} --from-repo {url}` | Import a theme from a remote git repo (typically your personal private themes library). |
| `/theme mix {theme-a} {theme-b}` | Create a new theme by blending two existing themes. |
| `/theme {action} --text` | (default depth) Text descriptions only. |
| `/theme {action} --swatch` | Add color/typography visual blocks rendered inline as Markdown/HTML. |
| `/theme {action} --mockup1` | Render a single component using this theme in the project's stack. Requires the project to have a render pipeline. |
| `/theme {action} --mockup2` | Render a small page (e.g., a sign-up form) using this theme. |
| `/theme {action} --mockupfull` | Render a full-page mockup screenshot via Playwright. Requires Playwright installed in the project. |

`{name}` is kebab-case. Theme directories live at `.github/themes/{name}/`.

## Phase 1 — Determine the action

Parse the invocation. Map to one of: `default`, `browse`, `apply`, `save`, `import`, `mix`. If no action was given, default to `default` (show status + list available themes).

Also parse depth flags. Default is `--text`.

## Phase 2 — Route to `@ui-ux-engineer`

Every action invokes `@ui-ux-engineer` via the Task tool with a structured brief specific to the action. The agent reads its role file, the responsive-design SKILL.md, and any relevant theme files before responding.

### Action: default / browse

> Show the user the project's current theme adoption status and list all available themes (local and framework starters). For each theme, print:
>
> - Name + mood
> - 1-line philosophy
> - "Best for: ..." line from frontmatter
>
> If a depth flag was passed (`--swatch`, etc.), include the visual representation for each theme. Default `--text` is just the prose.
>
> Don't propose a choice unless the user asks. This is a catalog browse.

### Action: apply (two passes — propose, then execute)

Subagents can't prompt the user. So `apply` runs in two passes: the orchestrator dispatches `@ui-ux-engineer` to propose a plan, shows it to the user, then re-dispatches with `confirmed=true` to execute.

**Pass 1 — Propose:**

> **Propose-only pass.** Do NOT write any files yet.
>
> The user wants to adopt theme `{name}`. Verify it exists at `.github/themes/{name}/THEME.md`. If not, return `decision=NOT_FOUND` with the closest matching theme names.
>
> If it exists:
>
> 1. Read the theme's design tokens.
> 2. Detect the project's styling stack (Tailwind config? CSS variables file? Theme provider component?).
> 3. Return a structured plan: `files_to_modify` (list with one-line description of each change), `tokens_summary` (a brief description of what the theme is), and `external_deps_needed` (e.g., font packages the theme references that aren't already installed — list with install commands the user would run).

**Orchestrator action:** show the plan to the user, prompt `y / n / edit`. If `external_deps_needed` is non-empty, surface those clearly — the user runs the install commands themselves; the framework never installs dependencies.

**Pass 2 — Execute (only after user confirms):**

> **Execute the approved plan** for theme `{name}`. The user has confirmed the following: {confirmed plan}.
>
> Apply the changes:
>
> - Update the stack-specific files per the plan.
> - Record the adoption at `.github/themes/.adopted` (single-line file containing the theme name).
>
> Return: list of files actually written/modified.

### Action: save (orchestrator asks the metadata questions, subagent writes)

Since subagents can't prompt, the orchestrator collects the metadata first, then dispatches the subagent to write the file.

**Orchestrator action:** ask the user three short questions in one batch (use `AskUserQuestion` if available):

1. What's the mood of this theme in 3–5 words?
2. What's it best for? (one line)
3. When should someone NOT use it? (one line)

Then dispatch `@ui-ux-engineer`:

> Capture the project's current visual state as a new theme `{name}`. The user-supplied metadata is:
>
> - Mood: {user answer}
> - Best for: {user answer}
> - Not for: {user answer}
>
> 1. Read existing styling sources: `tailwind.config.{js,ts}`, CSS variable definitions, theme provider files, design-token modules.
> 2. Extract the values (colors, typography, spacing, radii, shadows, motion).
> 3. Generate `.github/themes/{name}/THEME.md` matching the contract in `.github/themes/_template/THEME.md`. Use the supplied metadata in the frontmatter and philosophy section.
> 4. Generate sensible component examples by transposing the project's actual button / input / card styling into the template's format.
>
> Return: the path of the file written, and a brief summary of the extracted tokens.

### Action: import

> The user wants to import theme `{name}` from a remote repository `--from-repo {url}`.
>
> 1. Clone the remote to a temp directory: `git clone --depth 1 {url} /tmp/agent0-theme-import`
> 2. Verify `.github/themes/{name}/THEME.md` exists in the cloned repo. If not, list themes that DO exist there and ask which the user wants.
> 3. Copy the theme directory to `.github/themes/{name}/` in this project.
> 4. Clean up the temp clone.
> 5. Print a summary including the theme's mood and "best for" line.
>
> Do NOT auto-apply the imported theme. Importing makes it available; applying is a separate explicit action.

### Action: mix (orchestrator asks the blend questions, subagent writes; refinement loops in the orchestrator)

Mixing requires several user choices. The orchestrator handles them all; the subagent just synthesizes the resulting theme.

**Orchestrator action — collect blend choices:**

Ask the user, in one batch where possible (use `AskUserQuestion` for the multi-choice questions):

1. **New theme name?** (kebab-case)
2. **Color base?** A or B (the chosen one's palette dominates; accents come from the other)
3. **Headings from?** A or B
4. **Body type from?** A or B
5. **Spacing & radii scale?** A or B or "average"
6. **Motion timing?** A or B or "average"

Then dispatch `@ui-ux-engineer`:

> Generate a mixed theme `{new-name}` from `{theme-a}` + `{theme-b}` with the following user-confirmed choices:
>
> - Color base: {A | B}
> - Headings: {A | B}
> - Body type: {A | B}
> - Spacing & radii: {A | B | average}
> - Motion: {A | B | average}
>
> 1. Read both source themes' design tokens.
> 2. Apply the user's choices to build a new token set. For color: use the chosen base's full palette, then swap in the OTHER theme's accent and accent_hover. For typography: use the chosen heading + body fonts; mono can come from either. For "average" scales: take the element-wise mean of corresponding values (rounded to nearest integer for pixel values).
> 3. Generate `.github/themes/{new-name}/THEME.md` with `source: mixed` and `parents: [{theme-a}, {theme-b}]`.
> 4. Synthesize a NEW philosophy paragraph reflecting the blend — don't paste both. Be specific about which feel comes from where.
>
> Return: path of the file written + a 2-line summary of the resulting blend.

**Orchestrator action — offer refinement:**

After the subagent returns, show the result and ask: "Save as is, or refine?" Refinement options: warmer / cooler / more contrast / less contrast / different accent. If the user picks a refinement, dispatch the subagent again with a tweak instruction. Loop until the user says "save."

## Phase 3 — Depth-specific rendering

After the agent's response, apply the depth flag:

### `--text` (default)

Just the prose. No visual additions.

### `--swatch`

Render visual blocks inline using HTML/Markdown. Example for a color palette:

```markdown
**Palette:**

<div style="display:flex;gap:4px">
  <div style="background:#0f172a;color:#fff;padding:8px;width:80px">primary</div>
  <div style="background:#3b82f6;color:#fff;padding:8px;width:80px">accent</div>
  ...
</div>
```

For typography, show a sample heading + body paragraph in the theme's fonts. Markdown viewers that render HTML (GitHub, most IDEs) will show the swatches inline. Plain text terminals see the HTML source — degrades gracefully.

### `--mockup1` (single component)

Generate a small component file in the project's stack and place it at `.github/themes/{name}/preview/{Component}.{tsx|jsx|vue|svelte|html}`. Tell the user the path and instruct them to import or open it.

Detect the stack from package.json or framework manifests. If the stack isn't detectable or supported, print a warning and degrade to `--swatch`.

### `--mockup2` (small page)

Same as `--mockup1` but generate a small page rendering several components together (form, header, card). Place at `.github/themes/{name}/preview/SignUpExample.{tsx|...}`.

### `--mockupfull` (full page screenshot via Playwright)

1. Verify Playwright is installed (`grep -q playwright package.json`). If not, print install instructions and stop.
2. Generate a full-page mockup file using the theme.
3. Spin up a temp Playwright script that loads the mockup and takes a screenshot.
4. Save the screenshot to `.github/themes/{name}/preview/screenshot.png`.
5. Print the path and instruct the user to open it.

If any step fails (Playwright not installed, dev server not running, page errors), degrade gracefully — fall back to `--mockup2`, then `--mockup1`, then `--swatch`, then `--text`. Tell the user which level was achieved and why.

## Phase 4 — Console summary

After every action, print a concise summary:

```
═══ /theme {action} ═══

  Action:     {action}
  Theme(s):   {name(s)}
  Depth:      {text | swatch | mockup1 | mockup2 | full}
  Adopted:    {current theme, or "(none)"}
  Files written: {N}

{action-specific summary, see below}
```

For `apply`: "Adopted theme: `{name}`. Next: review the changes to {files}, then restart dev server."

For `save`: "Saved theme: `{name}` → `.github/themes/{name}/THEME.md`."

For `import`: "Imported `{name}` from `{url}`. Apply it with `/theme apply {name}`."

For `mix`: "Created `{new-name}` from `{a}` + `{b}`. Review at `.github/themes/{new-name}/THEME.md`, then apply or refine."

## Rules

- **No new dependencies.** If a theme references fonts the project doesn't have, the agent prints the install command and asks the user to run it. Never runs it themselves.
- **Apply requires explicit confirmation.** Always show the plan, get the user's `y`, then write.
- **Don't commit.** User reviews and commits theme changes themselves.
- **Shopper model.** Never ask the user to describe styling in design vocabulary. Show options, ask "this or this," narrow.
- **Brand-neutral framework.** The framework's three starter themes are examples of the contract, not opinions about what the user's project should look like. Treat them as reference, not as canonical choices.
- **Cross-project sharing is via the user's own private repo**, not via the framework manifest. Themes in `.github/themes/` of the framework repo are examples only.
- **Mix output is a starting point**, not a final theme. Always ask the user to refine after a mix.
