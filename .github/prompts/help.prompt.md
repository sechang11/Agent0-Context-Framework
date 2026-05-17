---
mode: agent
description: Friendly newbie-oriented overview of the framework — agents, commands, concepts. Reads the full guide from docs/getting-started.md and surfaces the relevant section in chat. Optional --topic flag drills into one area.
---

# /help

Surface a newbie-friendly overview of Agent0-Context-Framework in chat. Pure reader. Reads `docs/getting-started.md` and emits either the goal-oriented digest (no args) or a specific section (with a topic arg).

This is the "where do I start?" command. Read it first when you adopt the framework into a new project, or whenever you've forgotten what a piece does.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/help` | The default — friendly overview: what the framework is, the five-minute tour, list of agents and commands organized by goal, link to the full guide. |
| `/help agents` | All installed agents + when to call each. |
| `/help commands` | All slash commands organized by goal, with example invocations and flags. |
| `/help concepts` | The big concepts: dual-tool layout, specs, verification, bugs, the debug surface, the update flow. |
| `/help workflow` | Greenfield vs brownfield walkthroughs. |
| `/help debugging` | Stages 1–3 of the debug surface, what each does, when to use them. |
| `/help updating` | How versioning + `/update-framework` + the bootstrap script work. |
| `/help faq` | Common questions. |

If the user passes a topic that doesn't match, suggest the closest match and ask. Don't error out.

## Phase 1 — Read the source

Read `docs/getting-started.md` from the local project (it ships in every adopted project via the manifest). If the file doesn't exist, fall back to fetching from the framework repo:

```
curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/docs/getting-started.md
```

If that also fails, print a graceful error: "Couldn't load the help guide — try `/update-framework` first, or read at github.com/sechang11/Agent0-Context-Framework/blob/main/docs/getting-started.md."

## Phase 2 — Read the local manifest (if present)

Read `.github/.framework-version` and the local `MANIFEST.json` if it exists, to know what's actually installed in this project (specifically: the version and the list of agents in `.claude/agents/`). You'll cross-reference this with the static doc when emitting.

If there are domain-expert agents beyond the standard roster — i.e., files in `.claude/agents/` that don't match the seven standard names — list them separately with a note that they're project-specific.

## Phase 3 — Emit

### No topic — the default overview

Emit something like this to chat, customized to what's installed:

```
═══ Agent0-Context-Framework — quick help ═══

What this is:
  A framework that gives AI coding assistants (Claude Code, Copilot, Cursor)
  consistent context about your codebase. Specialized agents (architect,
  software-engineer, etc.) each have a written role; specs, bugs, and
  verification checkpoints live as durable files in .github/.

Your five-minute tour:
  /version       — what's installed, what's available, what's new
  /agents        — the roster, one specialty line per agent
  /help <topic>  — drill into a topic: agents, commands, concepts,
                   workflow, debugging, updating, faq

Agents on this project ({N} installed):
  @software-engineer        @architect          @code-reviewer
  @security-reviewer        @test-engineer      @verification-engineer
  @debug-panel-engineer
  {if any domain experts:}
  Domain experts: @{domain-1}, @{domain-2}

Common workflows:
  I want to start a new feature                  → /spec
  I want to document existing code               → /cover {feature}
  I want to confirm a feature works              → /verify {feature}
  I want to file a bug                           → /report-bug "{title}"
  I want to check project progress               → /report
  I want a runtime debug panel (web only)        → /install-debug-panel
  I want to check the framework version          → /version
  I want to pull framework updates               → /update-framework

The full guide:
  docs/getting-started.md

Drill into a topic:
  /help agents       /help commands    /help concepts
  /help workflow     /help debugging   /help updating    /help faq
```

### With a topic

Extract the matching section from `docs/getting-started.md` and print it verbatim to chat. The sections in that doc map to topics like this:

| Topic | Section header in docs/getting-started.md |
|---|---|
| `agents` | `## The agents` |
| `commands` | `## The slash commands` |
| `concepts` | `## The big concepts` |
| `workflow` | (compose from `## The agents` routing table + `### "I want to start a new feature"` + `### "I want to document an existing feature"`) |
| `debugging` | `### The debug surface (Stages 1–3)` (under `## The big concepts`) |
| `updating` | `### The update flow` (under `## The big concepts`) |
| `faq` | `## Common questions` |

If a topic produces output longer than ~80 lines, summarize the section in your own words instead of pasting it verbatim, and end with "Full text in `docs/getting-started.md` under `## {section}`."

## Phase 4 — Suggest follow-up

End every `/help` invocation with one or two suggested follow-ups, picked from context:

- If the user has no `.github/specs/` directory: "Tip: run `/spec` to start your first spec, or `/cover {feature}` to document existing code."
- If they have specs but no verification.md files: "Tip: run `/verify {feature}` to translate your specs into runnable checkpoints."
- If their framework version is behind latest: "Tip: run `/update-framework` to pull what's new."
- Otherwise: "Run `/help <topic>` for deeper detail on any area."

Only pick one — don't list everything.

## Rules

- **Read-only.** No writes. No commits.
- **Newbie-friendly language.** Plain English, no jargon without explaining. When something is technical, explain it inline.
- **Adapt to what's installed.** If a project doesn't have `verification-engineer` installed yet, don't pretend it does. Use what `.claude/agents/` actually contains.
- **Always link to the full guide.** `/help` is a digest; `docs/getting-started.md` is the full source.
- **Network-tolerant.** If `docs/getting-started.md` exists locally, use it. Only fall back to GitHub if the local file is missing.
- **Don't print walls of text by default.** The no-topic version is one screen. Drill-downs are also concise — full text lives in the doc.
