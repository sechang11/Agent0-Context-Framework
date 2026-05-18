# Themes

Each subdirectory is a theme — a `THEME.md` file that captures the design philosophy, machine-readable design tokens, and component examples. Themes are managed by `@ui-ux-engineer` via the `/theme` slash command.

## Structure

```
.github/themes/
  README.md                          this file
  _template/THEME.md                 copy this when creating a theme by hand
  clean-modern/THEME.md              starter theme: sans-serif, neutral, spacious
  warm-editorial/THEME.md            starter theme: serif, warm, content-focused
  bold-tech/THEME.md                 starter theme: high-contrast, mono, dense
  {your-theme}/THEME.md              your project's themes
```

The framework ships three starter themes as examples. They're not opinions about what your project should look like — they demonstrate the contract and give the showroom interaction something to compare against.

## Theme contract

Every `THEME.md` has the same shape:

1. **Frontmatter** with `name`, `version`, `source` (`created` | `imported` | `mixed`), and `parents` (for mixed themes).
2. **Philosophy section** — 2–3 sentences on what this theme is going for, in human language.
3. **When to use / When NOT to use** — bullet lists.
4. **Design tokens** — a JSON code block with the machine-readable values (colors, typography, spacing, radii, shadows).
5. **Component examples** — code blocks showing how core components look under this theme.

See `_template/THEME.md` for the full schema.

## Lifecycle

| Action | Command |
|--------|---------|
| List available themes | `/theme` (default) or `/theme browse` |
| Apply a theme to the project | `/theme apply {name}` |
| Save the current state as a new theme | `/theme save {name}` |
| Import from a remote (e.g. your private themes repo) | `/theme import {name} --from-repo {url}` |
| Mix two themes into a new one | `/theme mix {theme-a} {theme-b}` |

`/theme` defaults to text-only descriptions. Add `--swatch` for color/typography visual blocks, or `--mockup1` / `--mockup2` / `--mockupfull` for rendered previews (requires the project's dev stack to be set up).

## Personal libraries vs project themes

Themes live **per project** by default — they're in this directory. Two reasons:

1. Themes carry brand identity. Distributing them framework-wide via `/update-framework` would mean themes leak across unrelated projects.
2. Project teams want their own designs without inheriting framework defaults.

**For cross-project reuse** (e.g., your own portfolio of themes), maintain a **separate private repo** and reference it via `/theme import --from-repo`:

```bash
# Set the default theme remote (per user, not per project):
echo 'theme_repo=git@github.com:<you>/agent0-themes-private.git' > ~/.agent0/config

# Import a theme from there:
/theme import warm-editorial --from-repo git@github.com:<you>/agent0-themes-private.git
```

Your personal themes stay private. Adopters of Agent0 see this README and the three starter themes — nothing of yours unless you explicitly share.

## What does NOT belong here

- **Project-specific component code.** Implementation lives in `src/`, `app/`, etc. — not in theme files. Theme files capture intent (tokens + examples); the implementation references the tokens.
- **Dependency-manifest changes.** Themes describe; they don't install fonts or CSS frameworks. If a theme needs a specific font (`Inter`, `JetBrains Mono`), the theme file references it by name but doesn't add it to `package.json`. The user installs it themselves.
- **Sensitive content.** Themes are public by default (they live in the same repo as the rest of the framework adoption). Don't put logos, brand-identity files, or anything proprietary in a theme that lives in a public repo. Use the private-themes-repo pattern for proprietary work.
