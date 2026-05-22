# Workflow guide

How to actually use Agent0-Context-Framework day-to-day. `getting-started.md` is the reference (what each thing is, where files live). This is the lifecycle: **what to do, when, in what order, and why.**

Opinionated. Skip sections you don't need.

---

## What the framework optimizes for

Two things, in tension:

1. **Durable project knowledge** — specs, verifications, bug reports, themes live in files that survive every conversation. New sessions inherit context immediately instead of starting from scratch.
2. **Minimum-friction AI work** — agents have written roles so they're consistent; commands wrap common workflows so you don't reinvent them.

When in doubt, prefer the option that **leaves a durable artifact** over the one that's faster in the moment. The artifact pays off in every future session.

---

## The five categories of work

Almost everything you'll do falls into one of these:

| Category | Commands you'll reach for |
|---|---|
| **Build new features** | `/spec`, `@architect`, `@software-engineer`, `@test-engineer`, `/verify` |
| **Verify what works** | `/verify`, `@verification-engineer`, `/cover` |
| **Track down bugs** | `/report-bug`, `@software-engineer`, `@security-reviewer` |
| **Review project state** | `/feature-tree`, `/report`, `/nextsteps`, `/agents`, `/version` |
| **Maintain the framework** | `/update-framework`, `/help`, `/mode` |

The categories aren't strict — they overlap. But knowing which category you're in tells you which command to reach for first.

---

## First 30 minutes in a new project

If you haven't adopted Agent0 into this project yet:

### Step 1 — Adopt the framework

From the project's main tree directory (NOT a worktree):

```bash
git clone --depth 1 https://github.com/sechang11/Agent0-Context-Framework.git /tmp/acf
cp -r /tmp/acf/.github .
cp -r /tmp/acf/.claude .
cp /tmp/acf/CLAUDE.md .
rm -rf /tmp/acf
```

Open the project in Claude Code, run:

```
/adopt-framework
```

It'll ask 5–6 questions. The **first one** is solo-vs-review mode. If you're working alone on this project, pick `solo`. This single choice eliminates a class of "where did Claude write that file?" confusion that bites everyone in review mode.

### Step 2 — If brownfield (existing code), discover features

```
/cover --discover
```

The agent scans your codebase, groups surfaces into proposed features, and lets you accept/edit/cancel before any file is written. This gives the framework a starting view of what exists in your project — without it, the agents treat your project as empty.

If your project is small enough that you know every feature by name, skip this and use `/cover {feature-name}` individually for each one you want to document.

### Step 3 — If web app, establish responsive strategy

```
/ui-review
```

First-time invocation in a project asks `@architect` + `@ui-ux-engineer` to pick a multi-resolution approach (adaptive components / conditional rendering / multiple builds / progressive enhancement). The decision lands at [`.github/specs/_design/responsive-strategy.md`](.github/specs/_design/responsive-strategy.md). Skip for non-web projects.

### Step 4 — Baseline report

```
/report
```

Runs every agent against the project. You get a composite rating with sub-scores, identified gaps, and top priorities. This is your "where am I?" snapshot. It also writes [PROGRESS_REPORT.md](PROGRESS_REPORT.md) which becomes the baseline for future reports' "trends since last" tables.

### Step 5 — Glance at the feature tree

```
/feature-tree
```

One-screen overview of every feature, its type (spec/cover), summary, status, and clickable file links. You now know your project's surface area.

That's 30 minutes invested. From now on, every session can start with a `/feature-tree` glance to orient.

---

## Daily rhythm

Once a project is adopted, your day looks roughly:

### Opening a session

1. **Open Claude Code from the project's main tree** (`C:\Users\Kashix\Documents\CS\Projects\YourProject\`, not from `.claude/worktrees/...`).
2. **Glance at the status line** at the bottom: `Agent0 v{version} ({mode})`. Confirms you're in the right project and on the right framework version.
3. **Run `/feature-tree`** — fastest way to see project state. Look for: any feature in `failing` or `pending` status, any concerns flagged, any feature that hasn't been verified in a while.

### Picking the next task

If you don't already have something in mind:

```
/nextsteps
```

Asks every agent for their top recommendations. Returns a cross-agent prioritized table tied to existing artifacts (verification CPs, bug ids, specs). Pick a P0 item and start there.

Or, if you have an open bug from a prior session: `ls .github/bugs/` and open whichever is still `status: open`.

### Working on a new feature

```
/spec feature-name
```

Walks through `requirements.md` → `design.md` (architect review here — they'll APPROVE / REVISE / REJECT) → `tasks.md`. Don't write implementation code during this phase. The point is to think.

After spec is complete:

```
@software-engineer implement {feature-name}
```

Or you implement manually with the agent's guidance loaded. When code is in:

```
/verify {feature-name} --bootstrap   # first time — writes verification.md
/verify {feature-name}                # run the checkpoints
```

If it's a UI feature:

```
/ui-review {feature-name}
```

Three-axis review: flow friction, adaptive design per viewport, theme consistency. The default mode is `minimum-friction`; add `--engagement` if you genuinely want engagement-hacking analysis (separate section in the output so you can take or leave it).

### Working on an existing feature

If a verification is failing, open its file directly (the link is in `/feature-tree`'s output). Read the failing checkpoint. Then:

```
@software-engineer investigate .github/specs/{feature}/verification.md
```

The agent loads the verification, the spec, and the relevant code. Fix. Re-run `/verify {feature}` to confirm.

### Investigating a bug

If you notice something wrong:

```
/report-bug "login button doesn't redirect on submit"
```

Captures a structured report with auto-captured project state (git diff, last commits, active spec, environment). It writes a file to `.github/bugs/` and suggests which agent to dispatch. Don't skip the file — it's the durable record. Then:

```
@software-engineer investigate .github/bugs/{filename}.md
```

### Ending a session

1. **`git status`** — see what changed
2. **`git diff`** — review (or use your editor's diff view)
3. **Commit** with a descriptive message
4. **`git push`** — durable backup

If you're in solo mode, all changes are in the main tree already. If you're in review mode, changes from agents are in a worktree — `git worktree list` to see where, then merge as needed.

---

## Weekly rhythm

About once a week (or whenever a project's status line shows you're behind):

### Pull framework updates

```
/update-framework
```

In each adopted project you work in regularly. Pulls the latest commands, agent shims, and skill contracts. Doesn't touch your filled-in template files.

### Health check

```
/report
```

Trends-since-last shows which dimensions improved or regressed. Composite rating across all agents tells you the overall direction.

### Refresh your next-step queue

```
/nextsteps --horizon medium
```

`--horizon medium` (1–2 months) is more strategic than the default `short` (1–2 weeks). Useful for weekly planning.

### Triage bugs

```
ls .github/bugs/ | head -20
```

Anything still `status: open` after a week deserves a decision: investigate, mark `wont-fix`, or `cant-reproduce`. Stale `open` bugs are noise.

---

## The full lifecycle of one feature

A concrete example. Let's say you want to add password-reset to a web app.

| Step | Command | Output |
|---|---|---|
| 1. Spec | `/spec password-reset` | `.github/specs/password-reset/{requirements,design,tasks}.md` |
| 2. Design review | `@architect review .github/specs/password-reset/design.md` | APPROVE / REVISE / REJECT |
| 3. Implementation | `@software-engineer implement password-reset` (or do it yourself with their guidance) | Code in `src/`, `app/`, etc. |
| 4. Test coverage | `@test-engineer review password-reset` | Coverage gaps surfaced + tests added |
| 5. Security check | `@security-reviewer review password-reset` (auth/PII feature, do this!) | Severity-ranked findings |
| 6. Verification scaffold | `/verify password-reset --bootstrap` | `.github/specs/password-reset/verification.md` with runnable checkpoints |
| 7. Run verification | `/verify password-reset` | Pass/fail/pending per CP, written inline |
| 8. UI review | `/ui-review password-reset` | Flow + viewport + theme issues |
| 9. Fix anything that failed | `@software-engineer investigate .github/specs/password-reset/verification.md` | Code fixed; re-run `/verify` |
| 10. Auto-update feature tree | (happens at the end of `/spec` and `/verify`) | [FEATURE_TREE.md](FEATURE_TREE.md) updated |
| 11. Commit + push | `git add ...; git commit; git push` | Durable backup |

If a failure during verification surfaces a real bug:

12. `/report-bug "expired tokens still allow reset"` → `.github/bugs/{ts}-expired-tokens-allow-reset.md` filed → `@software-engineer investigate` → fix → `/verify password-reset` again until green.

Don't skip steps. The artifacts are how next month's you (and future agents) understand what was done and why.

---

## Common workflows by goal

| I want to... | Run |
|---|---|
| Start a new feature with a real spec | `/spec {name}` |
| Document an existing feature that has no spec | `/cover {name}` |
| Scan a codebase for feature boundaries | `/cover --discover` |
| Confirm a feature still works | `/verify {name}` |
| File a bug structurally | `/report-bug "{title}"` |
| See every feature at a glance | `/feature-tree` |
| Get full project health snapshot | `/report` (optionally `--only architect` for focused view) |
| Get prioritized to-do list | `/nextsteps` (optionally `--horizon medium\|long`) |
| List installed agents | `/agents` |
| Check framework version + what's new | `/version` |
| Pull framework updates | `/update-framework` |
| Pick a visual theme | `/theme browse` then `/theme apply {name}` |
| Save current visuals as a reusable theme | `/theme save {name}` |
| Review UX of a feature | `/ui-review {name}` (`--engagement` opt-in) |
| Switch to solo mode (no worktree round-trip) | `/mode solo` |
| Get a newbie overview | `/help` |
| Get help on one topic | `/help {agents\|commands\|concepts\|workflow\|debugging\|updating\|faq}` |

---

## Anti-patterns to avoid

These will hurt you, in order from worst to least bad:

- **Skipping `/spec` for non-trivial work.** "I'll just have the agent code it" produces inconsistent results because no acceptance criteria were written down. Future you can't tell if it's working as intended.
- **Manually editing `verification.md`.** It's regenerated by `/verify --bootstrap`. Hand edits get overwritten. If a checkpoint is wrong, fix the spec it's derived from, then re-bootstrap.
- **Running `/report-bug` as a substitute for actually telling Claude what's wrong.** The structured capture is meant to supplement chat, not replace it. Tell Claude in chat; the file is the durable record for next session.
- **Letting `@architect` REJECT a design and proceeding anyway.** The architect's job is to say no. Override consciously, not by ignoring.
- **Stacking three agents on one task.** "@architect AND @software-engineer AND @code-reviewer please do X." Pick ONE primary. Run a second for validation after if needed. Three is noise.
- **Using `bypassPermissions` instead of the structured allow/deny.** Save yourself from the AI's worst day by keeping the deny list active. `git push --force` deserves to be refused without asking.
- **Treating `/cover`'s output as a contract.** It's a snapshot (`source: code`) — documents what the code DOES, not what it should. To upgrade: write `requirements.md` for desired behavior, then `/verify --bootstrap`.
- **Working from inside a worktree when in solo mode.** Solo mode skips worktree isolation; if you're in a worktree path anyway, you're paying for confusion you opted out of. Always open the main tree directory.

---

## Signs you're getting the most out of the framework

If most of these are true, the framework is doing its job:

- Every active feature has a `verification.md` you can re-run any time
- Bug investigations start with `/report-bug` so the next session sees the report
- `/feature-tree` is your first command in a new session — gives instant orientation
- The status line at the bottom of every chat shows the framework version of the project you're in
- Your agents' role files have project-specific invariants filled in (not just defaults)
- You run `/update-framework` weekly enough that you're never more than 5–10 versions behind
- Code reviews go through `@code-reviewer` instead of "Claude, review this please"
- Security-sensitive work runs through `@security-reviewer` reflexively, not as an afterthought
- `/report` shows trends (you have multiple progress reports over time)
- New collaborators (or new conversations) can read `.github/AGENTS.md` and `docs/getting-started.md` and figure out the conventions without you explaining

---

## What's missing — honest assessment

The framework has gaps. Some are small; some would meaningfully improve the workflow if built.

### Small gaps (easy adds)

- **`/morning` or `/start`** — A "daily startup" command that surfaces: framework version, open bugs (count + first 3 titles), last verification status, recent commits, current branch. Just enough to orient when you reopen a project after a few days.
- **`/since-last-visit`** — Diffs `FEATURE_TREE.md` against its state on your last visit. Shows what changed in the project while you weren't looking. Useful when picking up a project after a break or returning from another project.
- **Auto-routing on `/report-bug`** — Currently writes the file and stops; the user has to manually dispatch the suggested agent. An optional `--dispatch` flag would auto-invoke. (Conservative default — file-and-stop — is right; the flag is the addition.)

### Medium gaps (worth building when patterns demand)

- **`/conform` slash command (Phase B of style-drift mitigation)** — Runs the project's lint + format + typecheck pipeline, reports remaining issues with line numbers, optionally applies `--fix`. Auto-invoked at the end of `/verify` if the project has a linter. Phase A (the [drift register at `.github/instructions/style.instructions.md`](.github/instructions/style.instructions.md)) prevents drift *during* writing; Phase B catches it *after* writing, before push. Together they close the per-push-whack-a-mole loop. Build Phase B when the drift register alone isn't enough.
- **`/build-feature {name}` orchestrator** — One command that chains: `/spec` → architect approve → `@software-engineer` implement → `@test-engineer` review → `@security-reviewer` (if security-touching) → `/verify --bootstrap` → `/verify` → `/ui-review` (if UI). With user confirmations between steps. Currently the user remembers to invoke each one; this would lower the floor.
- **`/tutorial` or interactive walkthrough** — For someone who just adopted the framework, walks them through their first feature end-to-end with explanations. Newbies discover the workflow today by reading getting-started.md; an interactive tutorial would lock in the rhythm.
- **`@code-reviewer` and `@security-reviewer` get short-shrift in practice** — They exist but the daily workflow doesn't naturally invoke them. Could add to the spec → tasks.md a "review checklist" with which agents to run when. Or make `/verify` automatically suggest a code review before declaring complete.
- **Stage 3 (web debug panel) is unproven** — Designed but never installed in a real project this session. Until someone tries it end-to-end, we don't know if the implementation actually works. Highest-risk unverified piece.

### Bigger gaps (architectural)

- **No way to share themes / patterns across projects easily** — The framework supports per-project themes and a "personal themes repo" pattern for cross-project sharing, but nobody's actually set up a personal themes repo and tested the workflow. Theory looks good; practice unverified.
- **Multi-user workflows are mostly theoretical** — Solo mode is well-developed; review mode (multi-contributor) hasn't been stress-tested. Open question: what happens when two contributors run `/spec same-feature-name` at the same time?
- **The `@verification-engineer` for prereq-blocked CPs** — The `pending: needs <prereq>` state is defined; the orchestrator walks through it after subagent runs; but in practice, the prereq-resolve flow (user installs Postgres, re-runs) hasn't been tested end-to-end.
- **Updates don't propagate to `template`-class files** — If we improve the agent role template (e.g., add a section to `software-engineer.agent.md`), existing projects keep their old version because it's marked `template` (won't overwrite). Means improvements to agent thinking don't reach existing projects without re-running `/adopt-framework`. Mitigation idea: a `/refresh-agents` command that gives the user a diff-and-pick interface for template updates.

---

## Where to go for more

- [`getting-started.md`](./getting-started.md) — comprehensive reference: every agent, every command, every concept, FAQ
- [`README.md`](./README.md) — operating-guide index
- [`setup-new-project.md`](./setup-new-project.md) — first-time adoption walkthrough
- [`syncing-updates.md`](./syncing-updates.md) — pulling framework updates into adopted projects
- [`extending-the-framework.md`](./extending-the-framework.md) — for framework maintainers: how to add new commands and agents
- [`../CHANGELOG.md`](../CHANGELOG.md) — release history

In any adopted project, `/help` surfaces a digest of all of this in chat. `/help workflow` drills into the section relevant to this guide.
