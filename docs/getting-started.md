# Getting started

Welcome to **Agent0-Context-Framework**. This is the friendly tour. Read top to bottom for the full picture, or jump to whichever section answers your question. Run `/help` from any project that's adopted the framework to surface this in chat.

---

## What this is

Agent0-Context-Framework is a set of conventions and template files that help AI coding assistants (Claude Code, GitHub Copilot, Cursor) work consistently on your codebase. Instead of re-explaining your architecture and rules in every prompt, you write them down once — in `.github/` — and every agent reads them automatically.

**The big idea:** Specialized "agents" (architect, software-engineer, security-reviewer, etc.) each have a written role. You invoke them by name (`@software-engineer`) and they follow their role. Specs, bug reports, and verification checkpoints are durable files in your repo — they don't disappear when the chat ends.

The framework is **Markdown only**. No DSL, no build step, no runtime. Just files.

---

## The five-minute tour

After adopting the framework, run these in order to see what's available:

```
/version       # what's installed, what's available, what's new
/agents        # who's on the project — one line per agent
/help          # this guide, summarized
```

That's it. From there, work the way you normally would — call agents by name (`@software-engineer fix the login redirect`), and use slash commands when you want a specific workflow.

---

## The agents

Agents are AI personas with written roles. Each one is a specialist. You invoke them by name — type `@architect` (or whichever) at the start of a message — and they read their role file before answering.

**Pick ONE primary agent per task.** You can chain a second for validation (e.g. `@software-engineer` to write, then `@code-reviewer` to review). Don't stack three; they'll talk over each other.

| Agent | Use when |
|---|---|
| `@software-engineer` | The default. Implementing features, fixing bugs, refactoring. Reads existing code first, matches the patterns already there. |
| `@architect` | Designing something new, especially if it crosses components, changes a schema, or adds an external integration. Will reject bad designs — that's the job. |
| `@code-reviewer` | General code review. Looks at clarity, modularity, consistency with the rest of the codebase. |
| `@security-reviewer` | Anything touching auth, money, PII, secrets, external integrations. Returns pass/fail with severity-ranked findings. |
| `@test-engineer` | Coverage gaps. Untested edge cases. Will write tests to fill gaps if asked. |
| `@verification-engineer` | Translating spec acceptance criteria into runnable checkpoints. Invoked by `/verify` and `/cover`. Doesn't write production code. |
| `@debug-panel-engineer` | Installing or removing the web-debug panel (Stage 3). Stack-specific implementer. Invoked by `/install-debug-panel` and `/demolish-debug`. |
| `@ui-ux-engineer` | Reviews user experience — flow friction, adaptive design per viewport, theme consistency. Manages themes via shopper-showroom interaction. Default minimum-friction; opt-in engagement analysis. Invoked by `/theme` and `/ui-review`. |

### Routing — which agent to call

| Situation | Use |
|---|---|
| Implement something that matches an existing pattern | `@software-engineer` |
| Brand new feature with a schema change or new endpoint | `@architect` first (will reject or approve the design), then `@software-engineer` |
| Touches auth, money, PII | `@software-engineer`, then `@security-reviewer` |
| Bug fix with a regression test | `@software-engineer` (no spec needed) |
| You want a second opinion on code that's already written | `@code-reviewer` |
| "Are we tested enough here?" | `@test-engineer` |

### Domain experts

If your project has a specialty the standard roster doesn't cover (databases, ML, a specific framework), you can create a domain-expert agent via `/adopt-framework`. Once created, they appear in `/agents` and you call them by name like any other agent.

---

## The slash commands

Slash commands run pre-written workflows. Type them at the start of a message. Most of them produce a file (a spec, a verification, a bug report) and stop — you review the output and decide what to do next.

Organized by goal:

### "I want to start a new feature"

```
/spec
```

Walks you through creating a spec for non-trivial work. Produces three files under `.github/specs/{feature-name}/`:
- `requirements.md` — what the feature must do
- `design.md` — how it'll work, the surfaces it touches
- `tasks.md` — implementation breakdown

After spec is written, `@architect` reviews `design.md` before you start coding.

### "I want to document an existing feature"

```
/cover {feature-name}                                  # surfaces interactively confirmed
/cover {feature-name} --surfaces "/login,/api/auth/*"  # surfaces given explicitly
/cover --discover                                       # scan codebase, propose features, confirm before writing
```

You have code that works but no spec. `/cover` reads the code at surfaces you point it at (routes, endpoints, files) and writes a **verification.md** documenting current observable behavior. This is the on-ramp for projects that adopted Agent0 after they had code.

**Feature, not endpoint.** A feature is a coherent logical concern someone would name in a product meeting — "login," "checkout," "user signup." A surface is where it manifests in code (a route, an endpoint, a file). One feature → one verification.md → many surfaces. Two features can share a surface (e.g. `POST /api/auth/login` might be touched by both "password login" and "magic-link login") — both verification.md files list it in their `Surfaces` section. See the FAQ for picking feature boundaries.

**If you don't know the codebase well enough to enumerate features by hand**, run `/cover --discover`. The agent scans the codebase, proposes a breakdown (`auth-flow`, `dashboard`, `checkout`, etc., with the surfaces grouped under each), and waits for your confirmation. You can accept (`y`), edit groupings (`e` — walk each proposed feature with rename / split / merge / drop options), or cancel (`n`). **No files are written until you confirm the final plan.** Then it batch-runs `/cover` for each confirmed feature in sequence.

The output is marked `source: code` — important distinction. It documents what the code *does*, not what it *should* do. If the code has a bug today, the checkpoint will say "currently: the code does the buggy thing." Suspicious behavior gets flagged as a separate `## Concerns` section, not as a checkpoint.

To upgrade to a real contract later: write `requirements.md` for what the code *should* do, then run `/verify {feature} --bootstrap`. The source flips to `spec`.

### "I want to confirm a feature actually works"

```
/verify                              # list all specs + status
/verify {feature}                     # run the verification (or bootstrap if missing)
/verify {feature} --bootstrap         # force re-generate from current spec
/verify {feature} --dry-run           # lint the verification.md without running it
```

Runs the checkpoints in `.github/specs/{feature}/verification.md`. Automated ones execute via Bash. Manual ones walk you through the steps. Results get recorded inline in the file with timestamps.

Failures suggest a `/report-bug` dispatch line so you don't have to retype the context.

### "I want to file a bug"

```
/report-bug                            # interactive — asks for title
/report-bug login button doesn't redirect    # one-line title given
```

Captures a structured bug report at `.github/bugs/{timestamp}-{slug}.md`. Bundles your description with auto-captured project state — git diff, last commits, active spec, environment info, framework version. Suggests which agent to investigate.

Writes the file and stops. Doesn't auto-invoke the agent — you copy the suggested dispatch line and run it yourself.

### "I want to check progress"

```
/report                                          # full roundtable — every agent
/report --only architect                          # one agent's view only
/report --only architect,security-reviewer       # subset of agents
/report --exclude test-engineer                   # everyone except one
```

Convenes agents from the roster, has each analyze the project from their specialty (with sub-score breakdown out of 10), and writes a `PROGRESS_REPORT.md` at the repo root. Prints a substantial summary to chat: scorecard, top priorities, notable observations.

`--only` and `--exclude` are mutually exclusive. Single-agent invocations work — the scorecard becomes one row and the "Top priorities" come straight from that agent without cross-agent synthesis. Useful when you want focused feedback (e.g. just the architect's view on a system design) without convening the whole roster.

Re-running overwrites the previous report with a fresh timestamp.

### "I want recommendations on what to work on next"

```
/nextsteps                          # every agent — prioritized action items
/nextsteps --only architect          # just one agent's recommendations
/nextsteps --exclude test-engineer   # all except one
/nextsteps --horizon medium          # focus on 1-2 months out (default: short, 1-2 weeks)
/nextsteps --horizon long            # focus on next quarter+
```

Lighter sibling of `/report`. Skips ratings, gaps analysis, and concerns inventory — just asks each agent "what should we work on next?" Writes a `NEXT_STEPS.md` at the repo root with a cross-agent prioritized table (priority / action / why / raised-by / effort / tied to). Each recommendation is tied to a concrete artifact when possible (a verification checkpoint, a bug id, a spec name).

Use `/report` when you want a full health check. Use `/nextsteps` when you already know where the project stands and you just need an actionable list.

### "I want to pick a visual style"

```
/theme                                     # show adopted theme + list available
/theme browse                              # catalog with descriptions
/theme apply clean-modern                  # adopt a theme as project default
/theme save my-brand                       # save current state as a new theme
/theme mix clean-modern warm-editorial     # blend two themes into a new one
/theme import editorial-v2 --from-repo {url}  # import from your private themes repo
```

Themes are managed by `@ui-ux-engineer` using the **shopper showroom** model — you don't need to know design vocabulary. The agent shows options, asks "this or this," and narrows from your responses. Each theme is a `THEME.md` file with design tokens (colors, typography, spacing, radii, shadows) + philosophy + component examples.

Visual depth flags (combine with any action):

- `--text` *(default)* — descriptions only.
- `--swatch` — visual color and typography blocks rendered inline.
- `--mockup1` — single component rendered in your stack.
- `--mockup2` — small page rendered in your stack.
- `--mockupfull` — full page screenshot via Playwright (requires Playwright installed).

Themes live per-project in `.github/themes/`. For cross-project sharing of your personal themes, maintain a separate private repo and reference it via `/theme import --from-repo {url}` — your private themes don't leak into other adopters' projects.

The framework ships three starter themes (`clean-modern`, `warm-editorial`, `bold-tech`) as examples of the contract, not as opinions about what your project should look like.

### "I want to review the user experience of a feature"

```
/ui-review {feature}                          # full review across three axes
/ui-review {feature} --engagement             # add engagement-hacking analysis (separate section)
/ui-review {feature} --viewport mobile        # focus on one tier
/ui-review {feature} --axis flow              # drill into one axis: flow|adaptive|theme
```

Three axes are reviewed by default:

- **Flow friction** — how many steps to complete the goal; which could be eliminated by defaults, deferral, or inference.
- **Adaptive design** — how the feature presents at `mobile` (< 640), `tablet` (640–1023), `desktop` (1024–1919), `wide` (≥ 1920).
- **Theme consistency** — does the feature follow the adopted theme's tokens, or break from them?

The first `/ui-review` on a project also establishes `.github/specs/_design/responsive-strategy.md` — the project's adopted multi-resolution approach (adaptive components / conditional rendering / multiple builds / progressive enhancement). The `@ui-ux-engineer` and `@architect` jointly decide.

**Engagement analysis is opt-in.** Without `--engagement`, the review focuses on minimum-friction only (universally good). With `--engagement`, the agent also evaluates engagement-hacking opportunities in a SEPARATE `## Engagement opportunities` section — clearly labeled so you can take or leave them per site. Dark patterns (forced continuity, manipulative urgency, confirmshaming) are out of scope even with `--engagement`.

### "I want a runtime debug surface" (web apps only)

```
/install-debug-panel    # mount the panel at /__debug
/demolish-debug         # remove it completely
```

Installs a debug panel into your web project that renders verification.md content joined to the current route. Shows checkpoint pass/fail with "re-run" buttons, feature-flag toggles, state probes, and a "copy bug report to clipboard" button.

**OFF by default.** Requires `DEBUG_PANEL=1` (or stack-equivalent — `NEXT_PUBLIC_DEBUG_PANEL`, `VITE_DEBUG_PANEL`, etc.) to activate. Production deployments without the env var get a 404 on `/__debug`. This is a non-negotiable safety property.

The architect reviews stack-fit first; if your project isn't a web app or has no frontend framework, the install declines cleanly.

### "I want to check status"

```
/agents                # roster + one-line specialty per agent
/version               # installed version, latest, gap, what's new
/version --offline     # skip the remote check
/version --changelog   # full release history
```

### "I want to update the framework"

```
/update-framework      # pull additive files (commands, agent shims) from GitHub
```

Reads the latest `MANIFEST.json` from GitHub, downloads anything new or changed, leaves your filled-in `PROJECT:`-slot files untouched. Re-run any time. The full update workflow is in [`syncing-updates.md`](./syncing-updates.md).

### "I want help"

```
/help                  # this guide, summarized
/help agents           # drill into agent details
/help commands         # drill into command details
/help workflow         # the greenfield + brownfield walkthroughs
/help debugging        # the debug-surface layers (Stages 1, 2, 2.5, 3)
/help updating         # how versions and updates work
```

---

## The big concepts

### Dual-tool layout

The framework lives in two parallel directories:

- **`.github/`** — the **canonical source**. Every rule, agent role, prompt, and skill lives here. GitHub Copilot reads it natively.
- **`.claude/`** — **shims** that point at `.github/` files. Each is small frontmatter (`name`, `description`, `tools`) + "read this canonical file." Claude Code uses these to find agents and commands.

You only edit `.github/`. The shims are pointers.

When you delete or rename in `.github/`, delete or rename the matching shim in `.claude/`. Same for adding domain experts — create both halves.

### Specs

Non-trivial work starts with a spec. A spec is **three files** under `.github/specs/{feature-name}/`:

1. `requirements.md` — what must be true when this feature ships
2. `design.md` — how the feature is structured (the seams, the surfaces, the data flow)
3. `tasks.md` — the implementation breakdown

Specs are documents, not code. The `/spec` command writes them. The `@architect` agent reviews `design.md` before you start coding.

Specs are durable. They live in git. Future contributors read them to understand what was intended.

### Verification

A spec's acceptance criteria become **checkpoints** in `.github/specs/{feature}/verification.md`. Each checkpoint has a Type (automated / manual / mixed), Steps, Pass/Fail criteria, an Automation command, and a Last result.

Two ways verification.md gets created:

- `/verify {feature} --bootstrap` — **spec-derived.** Reads `requirements.md` and translates acceptance criteria into checkpoints. `source: spec` in frontmatter. Checkpoints document **desired** behavior. This is a *contract.*
- `/cover {feature}` — **code-derived.** Reads existing code at surfaces you specify. `source: code` in frontmatter. Checkpoints document **current** behavior. This is a *snapshot.*

`/verify {feature}` runs whichever exists.

### Bugs

`/report-bug` writes a structured report to `.github/bugs/{timestamp}-{slug}.md`. The directory's `README.md` documents the lifecycle: `open` → `in-progress` → `resolved` / `wont-fix` / `cant-reproduce`.

Bug reports are kept indefinitely — the bug history is the project's institutional memory. Archive old ones to `archive/` manually if the directory grows large.

### Themes

A theme is a `THEME.md` file at `.github/themes/{name}/THEME.md`. It captures three things:

- **Philosophy** — 2–3 sentences in plain language describing the feeling and intent.
- **Design tokens** — machine-readable JSON: colors, typography, spacing, radii, shadows, motion timing. The implementation references these.
- **Component examples** — code blocks showing how core components (button, card, input) look under this theme.

Themes are picked through a **shopper showroom** interaction with `@ui-ux-engineer` via `/theme`. The agent shows options, asks "this or this," and narrows. You don't need to describe what you want in design vocabulary — that's the point.

**One adopted theme per project at a time.** Recorded in `.github/themes/.adopted`. Specific components can break from the theme intentionally, but the default is consistency.

**Cross-project sharing** is via a separate private repo, not the framework. Your personal themes don't leak into other adopters' projects; their themes don't appear in yours.

### Responsive vs adaptive design

Most "responsive" sites compromise their high-resolution experience to accommodate mobile. The framework offers four approaches, formalized in `.github/skills/responsive-design/SKILL.md`:

1. **Adaptive components** (container queries + per-component variants) — most modern projects.
2. **Conditional rendering** (different components per viewport) — when layout differs substantially per tier.
3. **Multiple builds** (separate codebases per viewport) — rare, only at significant scale.
4. **Progressive enhancement** (mobile baseline + extras at larger viewports) — simplest, fits content sites.

The project picks ONE approach via the first `/ui-review` invocation (or by writing `.github/specs/_design/responsive-strategy.md` directly). `@architect` and `@ui-ux-engineer` jointly approve. Subsequent UI work references the strategy.

Viewport tiers are named consistently: `mobile` (< 640), `tablet` (640–1023), `desktop` (1024–1919), `wide` (≥ 1920). Adjust the boundaries per project if needed; don't rename the tiers.

### The debug surface (Stages 1–3)

A connected pipeline for catching, verifying, and reporting feature behavior:

- **Stage 1 — `/report-bug`** captures bugs structurally with auto-captured project state. Replaces the lossy "paste console, describe what I clicked" loop.
- **Stage 2 — `/verify`** turns spec acceptance criteria into runnable checkpoints. Auto-execution where possible; manual walkthroughs otherwise.
- **Stage 2.5 — `/cover`** does Stage 2 for existing code that has no spec. The brownfield on-ramp.
- **Stage 3 — `/install-debug-panel`** mounts a route-keyed debug panel at `/__debug` (web apps only, off by default, env-var gated). Renders verification.md content live. Feature-flag toggles, state probes, "copy bug report to clipboard" button.

You don't have to use all three. Stage 1 alone is useful immediately. Stage 2 once you have specs (greenfield) or surfaces (brownfield). Stage 3 only if you're on a web app and want a runtime surface.

### The update flow

The framework is versioned by date (`MANIFEST.json` → `version` field). Adopted projects record their local version in `.github/.framework-version`.

To update an adopted project:

```
/update-framework
```

Pulls the latest manifest from GitHub, downloads new or changed **additive** files (commands, shims, contracts), leaves your **template** files (filled-in agent roles, instructions, the project's CLAUDE.md) untouched. Safe to re-run.

Project that doesn't yet have `/update-framework` (adopted before that command existed)? One-time bootstrap:

```bash
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
```

After that runs once, `/update-framework` is installed and the project never needs the curl line again.

---

## Common questions

### What's the difference between `@software-engineer` and `/spec`?

`@software-engineer` is an **agent** — a persona you talk to. It writes code.

`/spec` is a **command** — a pre-written workflow. It produces three files (requirements, design, tasks) and routes to `@architect` for design review.

You'd use `/spec` first (for non-trivial work), then `@software-engineer` to implement against the spec.

### How do I pick feature boundaries for `/cover`?

A **feature** is something a PM or designer would name — "login," "password reset," "user signup," "checkout." A **surface** is where it manifests in code — a route, an endpoint, a file, a CLI command.

The relationship is many-to-many:

- One feature can touch multiple surfaces. "User signup" touches `/signup`, `POST /api/users`, `POST /api/auth/login`, and the welcome-email worker.
- Multiple features can share a surface. `POST /api/auth/login` might handle password login, magic-link login, and 2FA verification — three features sharing one endpoint.

Each feature gets one `verification.md`. Two features that share a surface get two files, both listing that surface in their `Surfaces` section.

Heuristics:

- **A feature is something a PM would name.** "Login flow" yes; "the third branch of the login handler" no.
- **One paragraph of requirements worth of scope.** If you need a multi-level outline to describe it, it's probably more than one feature.
- **Coherent behavior.** Two checkpoints that always pass-or-fail together belong to one feature; two whose pass/fail are independent are probably different features.
- **When in doubt, split smaller.** Easier to merge two verification.md files later than to disentangle a bundled one.

If you can't decide, run `/cover --discover` — the agent scans your codebase and proposes feature boundaries, and you confirm or edit them before any files are written.

### I clicked a file link in chat and got "File could not be read. It may have been deleted or moved, or it lives outside the session folder."

You're in a worktree session, and the link's path resolves to a file inside the worktree — but the file actually lives in the main tree (knowledge artifacts always do). Claude Code's preview is scoped to the session folder, so it can't reach the file.

Two fixes, in order of preference:

1. **Switch to solo mode.** `/mode solo`. The session and the files now share one tree — links preview cleanly. Recommended for solo projects.
2. **Make the orchestrator emit absolute paths.** The framework's "Link MD files in chat output" rule (`.github/AGENTS.md`) requires links to use absolute paths resolved from the main tree, so they preview regardless of session cwd. If you're seeing relative paths in chat that fail to preview, that's a rule violation — the orchestrator should be using `git rev-parse --git-common-dir | xargs dirname` to compute the main tree's absolute path and using THAT in the link target. Mentioning the error to Claude usually prompts it to re-emit with absolute paths.

The link's display label can stay readable (e.g. `[.github/specs/auth/verification.md]`) — only the URL target needs to be absolute.

### Where do my files actually land — main tree or worktree?

Honest answer: this depends on your mode.

**In `solo` mode** (recommended for solo projects — set via `/mode solo` or chosen at adoption time): **everything goes to the main tree.** Specs, verifications, bug reports, themes, progress reports, AND code changes. No worktree round-trip. When Claude says "writing to `.github/specs/auth-flow/verification.md`," that file appears in your actual project directory, not inside `.claude/worktrees/`. You don't have to tell Claude "make changes to the real files" — there's only one set of files.

**In `review` mode** (default — for multi-contributor projects): **knowledge artifacts** (specs, verifications, bug reports, themes, `PROGRESS_REPORT.md`, `NEXT_STEPS.md`, `FEATURE_TREE.md`) still go directly to the main tree, because every conversation needs to see them. **Code changes** go to a worktree at `.claude/worktrees/{task-id}/` so you can review the diff before merging into main.

If you've been telling Claude "write to the real files" in every conversation, you probably want `solo` mode. Switch via `/mode solo`. Confirm via `/mode`.

The "main tree" or "repo root" the orchestrator writes to is your actual project directory, resolved via `git rev-parse --git-common-dir | xargs dirname` — not the worktree's `pwd`. So even in `review` mode, knowledge-artifact paths like `.github/specs/auth-flow/verification.md` always refer to the file in your actual project.

### Can I skip the worktree review step for solo projects?

Yes — Agent0 supports a per-project `solo` mode. Switch via:

```
/mode solo
```

In solo mode, code-writing subagents skip worktree isolation and write directly to the main tree alongside knowledge artifacts. No review checkpoint between subagent output and your main branch. The tradeoff: you trust git/GitHub as your safety net — commit and push regularly so you have rollback points if something goes wrong.

To switch back to the default (`review` mode with worktree isolation for code changes):

```
/mode review
```

To check the current mode:

```
/mode
```

The mode is stored at `.github/.agent0-mode` (a single-line file containing `solo` or `review`; absent means `review`). If you don't want collaborators inheriting your mode, add the file to `.gitignore`.

**Knowledge artifacts always go to the main tree regardless of mode** — `solo` only affects code-change routing.

### Does Agent0 work with git worktrees? Where do generated files land?

Yes, and the design accounts for it explicitly. Agent0 distinguishes two categories of files:

- **Knowledge artifacts** — specs, verification.md files, bug reports, progress reports, themes, ui review notes, the framework-version baseline. These are project-level knowledge that every conversation needs to see.
- **Code changes** — implementation files, tests, panel code generated by `/install-debug-panel`. These are review-and-merge changes.

**Knowledge artifacts always land in the main tree, not the worktree.** When Agent0 is invoked inside a worktree, it computes the main tree path via `git rev-parse --git-common-dir` and writes the file there. So:

- You run `/spec auth-flow` in worktree A → the spec files appear in the main tree.
- A new conversation in worktree B sees the spec immediately, no merge needed.
- A new conversation directly in the main tree also sees the spec.

**Code changes stay in the worktree.** When `/install-debug-panel` writes panel code to `src/debug/` or `@software-engineer` implements a feature, those files go to the worktree as normal — they need review and merge before landing in main.

The full list of artifact categories lives in `.github/AGENTS.md` → "Knowledge artifacts and worktrees." If you need a worktree-scoped version of a knowledge artifact (e.g., drafting a spec you're not ready to share), copy the file into the worktree manually.

### How does theme selection actually work — I'm not a designer?

That's the whole point of the **shopper showroom** model. You don't need to describe what you want — you just look at options and react.

A typical session:

```
You:    /theme browse --swatch
Agent:  [shows 3 themes with color/typography swatches inline]
You:    I like the second one's colors but the third one's typography
Agent:  Let me show you a mix...
        [generates a candidate]
        Stay here, or do you want it warmer? cooler?
You:    Warmer.
Agent:  [adjusts colors, shows again]
You:    Yes, save it.
Agent:  Saved as `my-theme` at .github/themes/my-theme/THEME.md.
        Apply it? (y/n)
You:    y
```

You're a shopper looking at a catalog. The agent's a clerk asking which you prefer. You don't need to know what "muted desaturated terracotta" means — you just need to recognize whether you like the look.

### What's the difference between minimum-friction and engagement-hacking?

**Minimum-friction** = reducing the steps, fields, and decisions required of the user. Universally good. Smart defaults, progressive disclosure, optimistic UI. Every site benefits.

**Engagement-hacking** = mechanics that increase how often or how long users come back: streaks, variable rewards, hooks, FOMO triggers. Appropriate for some sites (games, consumer apps where engagement is the product); inappropriate for others (banking, healthcare, productivity tools — engagement-hacking those is exploitative).

`/ui-review` defaults to minimum-friction only. Engagement analysis is opt-in via `--engagement`, and findings live in a separate section so you can take or leave them per site. Dark patterns (forced continuity, manipulative urgency, confirmshaming) are out of scope even with `--engagement`.

### What's the difference between `@verification-engineer` and `@test-engineer`?

`@test-engineer` writes production tests — `*_test.go`, `*.spec.ts`, etc. The kind of tests that run in CI and verify implementation details.

`@verification-engineer` writes **verification.md** files — acceptance-level checkpoints that walk through whether a feature meets its spec. Higher-level than unit tests. Often re-runs the actual feature end to end (Playwright clicks, curl calls).

Both can coexist. Tests prove the code is correct; verification proves the feature is correct.

### What if I don't want a slash command to do everything for me?

You don't have to use any of them. The agents work fine without commands — call `@software-engineer` directly. The framework's structure (the `.github/` files, the agent routing, the hard rules) does its job whether you invoke commands or not.

Commands are convenience for common workflows. Skip them when you'd rather drive manually.

### How do I customize an agent for my project?

Edit `.github/agents/{agent-name}.agent.md`. Add project-specific invariants, anti-patterns, or "what to read first" instructions. The framework's `template`-class manifest entries mean updates won't overwrite your customizations.

**Don't** edit `.claude/agents/*.md` — those are shims. The framework owns them and updates will overwrite. Customize in `.github/`.

### How do I add a new agent?

```
/adopt-framework
```

…can walk you through creating a domain-expert agent. Or do it manually:

1. Copy `.github/agents/_domain-expert-template.agent.md` → `.github/agents/{domain}.agent.md` and fill in the slots.
2. Copy `.claude/agents/_domain-expert-template.md` → `.claude/agents/{domain}.md` and update the frontmatter (`name`, `description`, `tools`).
3. Add a row to `.github/AGENTS.md`.

The new agent shows up in `/agents` immediately.

### My update broke something — how do I roll back?

`/update-framework` doesn't auto-commit. Look at `git status` after running it; revert any file you don't want with `git checkout -- {file}`. The local manifest version is recorded in `.github/.framework-version` — manually edit that file back to your previous version if you want `/update-framework` to think you're on the old one.

For a full reset: `git reset --hard HEAD` removes all uncommitted changes from the update.

### I see `PROJECT:` markers in some files. What are those?

Slots the adoption process fills with project-specific facts (project name, components, invariants, etc.). They're written as `<!-- PROJECT: description of what to put here -->` so they don't render in Markdown but are easy to grep.

If you see one that's not filled, run `/adopt-framework` to walk through filling them, or edit the file directly and replace the marker.

### Does the framework cost anything?

No. MIT license. The slash commands and agents use whatever AI tool you've already got (Claude Code, Copilot, Cursor). The framework itself is just Markdown files.

---

## Where to read more

| Document | What's in it |
|---|---|
| [`../README.md`](../README.md) | Top-level overview of the framework |
| [`../CUSTOMIZATION.md`](../CUSTOMIZATION.md) | Tier-by-tier adoption (Minimum / Standard / Full) — what to keep, what to delete |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Release history |
| [`README.md`](./README.md) | Operating-guide index — links to the four workflow docs |
| [`setup-new-project.md`](./setup-new-project.md) | Clone-and-copy + `/adopt-framework` for greenfield projects |
| [`upgrade-existing-project.md`](./upgrade-existing-project.md) | One-time bootstrap for projects that adopted before `/update-framework` existed |
| [`extending-the-framework.md`](./extending-the-framework.md) | Adding new agents, skills, commands to the framework itself (maintainer workflow) |
| [`syncing-updates.md`](./syncing-updates.md) | `/update-framework` flow for pulling updates into adopted projects |

Inside a project, the canonical agent roster + routing rules live at `.github/AGENTS.md`. The Claude-Code-facing entry point is `CLAUDE.md` at the project root. The machine-readable manifest of everything-the-framework-distributes is `MANIFEST.json`.

---

## What good usage looks like

After a week or two of working with the framework, a healthy project looks like:

- A handful of specs under `.github/specs/` — one per significant feature, each with `requirements.md`, `design.md`, `tasks.md`, and `verification.md`.
- A `.github/bugs/` directory with a few resolved reports and maybe one or two open ones.
- A `PROGRESS_REPORT.md` from the last `/report` invocation showing where the project stands.
- `.github/.framework-version` matching the latest published version (or one or two behind, which is fine).
- Agents called by name in chat, with clear handoffs (`@architect` approves a design → `@software-engineer` implements → `@security-reviewer` validates).

If your project doesn't look like this yet, work toward it incrementally. Run `/cover` on the most important existing feature first. File one bug through `/report-bug` instead of just typing the description. Try `/report` once a week. The structure compounds.

---

If anything in this guide is unclear, run `/help <topic>` for a focused drill-down, or ask any agent directly — they all have access to this document.
