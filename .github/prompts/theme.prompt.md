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

### Action: apply

> The user wants to adopt theme `{name}` as the project's default. Verify the theme exists at `.github/themes/{name}/THEME.md`. If it doesn't, suggest the closest match and stop.
>
> If it exists:
>
> 1. Read the theme's design tokens.
> 2. Check the project's stack (Tailwind config? CSS variables file? Theme provider component?).
> 3. Print a plan showing what files would change (e.g., "would update tailwind.config.js, add :root CSS variables to globals.css, update theme provider").
> 4. Ask the user to confirm before writing any files.
> 5. On confirmation, apply: update the relevant stack-specific config + record the adoption in `.github/themes/.adopted` (single-line file containing the theme name).

The agent must NOT install new dependencies. If applying the theme would require adding a font package, the agent prints the install command and asks the user to run it — but doesn't run it themselves.

### Action: save

> The user wants to capture the project's current visual state as a new theme `{name}`.
>
> 1. Read existing styling sources: `tailwind.config.{js,ts}`, CSS variable definitions, theme provider files, design-token modules.
> 2. Extract the values (colors, typography, spacing, radii, shadows).
> 3. Ask the user 2-3 targeted questions to fill in metadata:
>    - "What's the mood of this theme in 3-5 words?"
>    - "What's it best for?"
>    - "When should someone NOT use this?"
> 4. Generate `.github/themes/{name}/THEME.md` matching the contract in `.github/themes/_template/THEME.md`.
> 5. Generate sensible component examples by transposing the project's actual button/input/card styling into the template's format.

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

### Action: mix

> The user wants to create a new theme by blending `{theme-a}` and `{theme-b}`.
>
> 1. Read both themes' design tokens.
> 2. For each token category (colors, typography, spacing, radii, shadows, motion):
>    - **Colors:** ask the user "Pick the base palette: A or B? The accents will come from the other." Then interpolate any tokens you can sensibly average.
>    - **Typography:** ask "Headings from A or B? Body from A or B?" Combine.
>    - **Spacing & radii & motion:** ask "Use A's scale or B's, or average?" Don't auto-pick; this materially affects feel.
>    - **Shadows:** typically follow the color base — copy from whichever base palette was chosen.
> 3. Generate `.github/themes/{new-name}/THEME.md` with `source: mixed` and `parents: [theme-a, theme-b]`.
> 4. Synthesize a NEW philosophy paragraph reflecting the blend; don't just paste both.
> 5. Show the user the result and ask if they want to refine before saving.

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
