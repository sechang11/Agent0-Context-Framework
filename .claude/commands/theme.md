---
description: Browse, pick, save, apply, mix, or import design themes via the shopper showroom interaction. Operates on .github/themes/*/THEME.md. Visual depth flags: --text (default), --swatch, --mockup1, --mockup2, --mockupfull.
---

The full prompt for this command is at `.github/prompts/theme.prompt.md`. Read it and follow it precisely.

Themes are managed by `@ui-ux-engineer`. The shopper-showroom interaction model: show options, ask "this or this," narrow from responses. Users don't need to know design vocabulary.

Invocation patterns:

```
/theme                                                # show adopted + list available
/theme browse                                          # catalog of available themes
/theme apply clean-modern                              # adopt a theme as default
/theme save my-brand                                   # capture current state as a theme
/theme import editorial-v2 --from-repo {url}           # import from private library
/theme mix clean-modern warm-editorial                 # blend two themes
```

Depth flags (combine with any action):

```
--text       (default) descriptions only
--swatch     visual color/typography blocks inline
--mockup1    single component rendered in the project's stack
--mockup2    small page rendered in the project's stack
--mockupfull full page screenshot via Playwright (requires Playwright installed)
```

Themes live at `.github/themes/{name}/THEME.md`. Cross-project sharing is via a separate private repo using `/theme import --from-repo` — the framework itself stays brand-neutral.
