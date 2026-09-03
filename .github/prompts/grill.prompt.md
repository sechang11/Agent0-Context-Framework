---
mode: agent
description: Interrogate an idea before it becomes a spec — one grounded question at a time, each with a recommended answer, until every branch is resolved. Writes a decision record (grill.md) that /spec then builds from. No code, no spec, just decisions and the reasons behind them.
---

# /grill

Stress-test a plan by arguing with it. This command asks you questions — **one at a time, each carrying a recommended answer** — until the decision tree is resolved, then writes down what you decided *and why*.

It exists because the expensive mistakes are made before any code is written: a schema that can't be migrated, an API shape that leaks, a refactor whose blast radius nobody measured. Twenty questions is cheaper than a wrong assumption that ships.

*(The interrogation pattern is adapted from Matt Pocock's `grill-me` skill. What's different here: this one reads `FEATURE_TREE.json` first, so it interrogates you about **your actual codebase** — real nodes, real dependents, real invariants — instead of asking in the abstract. And its output is a durable file the rest of the framework consumes.)*

**Reach for it when** the cost of a wrong assumption exceeds the cost of the questions: before a schema, before an API contract freezes, before a refactor that touches many files, before writing a spec you'll live with, or any time you're about to tell an agent to "just continue" on something you can't fully describe.

**Don't reach for it** for small reversible work. Grilling a button colour is the friction, not the cure.

## Invocation patterns

| Pattern | Behavior |
|---|---|
| `/grill {topic}` | Full interrogation. Runs until every branch is resolved. |
| `/grill {topic} --quick` | The highest-leverage questions only (roughly 8–12): scope, invariants, blast radius, the cheaper alternative. |
| `/grill {feature} --resume` | Continue from an existing `grill.md`, skipping what's already decided. |
| `/grill {feature} --spec` | Interrogate, then run `/spec {feature}` straight afterwards. |

`{topic}` becomes the kebab-case feature name if the session leads to a spec. Confirm it with the user if it isn't obvious.

## Phase 1 — Ground yourself first (do not skip)

An ungrounded interrogation asks generic questions and wastes the user's patience. Before the first question, read:

1. `.github/copilot-instructions.md` — the project's hard rules.
2. `.github/instructions/architecture.instructions.md` if present — the invariants you must not let the user casually break.
3. `FEATURE_TREE.json` at the main tree root, if present. From it work out:
   - Which **existing nodes** this topic plausibly touches.
   - For each, its **transitive dependents** (its blast radius) and whether it carries a `verification` object.
   - Any **invariants** already recorded on those nodes.
   - Whether the area has **open bugs**.
4. The `requirements.md` of any spec that already covers adjacent ground — so you don't re-litigate a decision that's already been made.
5. Any relevant `.github/skills/*/SKILL.md`.

Open with a two-or-three-line orientation of what you found, then start. For example:

> This looks like it lands in the **trading** room, next to `trading-engine-rework` (48 dependents, 48/48 checks) and `phase-audit-flow`. `trading-engine-rework` carries the invariant *"all money writes stay inside trading-engine.js"*, and it has 2 open bugs. Three of its neighbours have no verification at all.
>
> First question:

## Phase 2 — The interrogation

**One question per message. Never a numbered list.** A batch of ten questions gets one lazy answer; a single question gets a real one.

Every question carries three parts:

```
**Q{n}. {the question}**

*Recommended:* {your recommended answer} — {one line on why you'd pick it}

*Why this matters:* {what breaks, or what becomes expensive, if this is wrong}
```

The recommended answer is not optional. It's what makes a thirty-question session survivable — the user can say "yes, next" to the ones they don't care about and spend their attention on the ones they do. Make it a real recommendation, not a hedge.

Then **wait**. Take the answer, follow its branch, and let it change the questions that follow. If an answer closes off a whole line of enquiry, say so and skip it.

### The ladder

Work down this ladder, skipping anything already settled by Phase 1 or by an earlier answer. Stop when the branches are resolved — never pad to a number.

1. **Scope.** What problem, whose, why now. What is explicitly *not* this. What happens if you do nothing.
2. **The cheaper thing.** Is there a configuration change, a smaller version, or an existing node that already does most of this? Ask it early; it's the question most likely to save the whole effort.
3. **The seam.** Which existing nodes does this touch — by name, with their dependent counts. Does it write, or only read? Does anything depend on the behaviour you're about to change?
4. **Invariants.** What must never break. Push here: these become the node's invariants and the rules Claude will treat as law. Get the *reason* for each, not just the rule.
5. **Data & contracts.** Schema shape, migration and backfill, API shape, what's authoritative, what's advisory.
6. **Failure modes.** What happens when it half-works, when it races, when the input is hostile, when a dependency is down. Who finds out, and how.
7. **Verification.** How would you know this works? What's the observable signal? (Answers here become checkpoints later.)
8. **Sequencing.** What ships first so the system stays working at every step. What's the rollback.

### Rules of engagement

- **Ground every question in the real repo.** "Should this be secure?" is worthless. "`platform-token-wallet` owns balance writes and has 24 dependents — does this write balances, or ask it to?" is the point.
- **Push back once.** If an answer is hand-wavy, contradicts a recorded invariant, or contradicts an earlier answer, say so plainly and ask again. Then accept whatever the user says and record it — including that you disagreed. It's their call.
- **Capture the why.** Every decision gets a reason. A rule without its reason gets argued away three weeks later by an agent that doesn't know what it cost to learn.
- **Let them stop.** "Enough" / "skip the rest" / "just write it" ends the interrogation immediately and moves to Phase 3 with whatever's resolved.
- **No code. No spec.** This command produces decisions, not implementation and not `requirements.md`. If the user asks you to start building mid-session, finish the record first.

## Phase 3 — Write the decision record

Write `.github/specs/{feature-name}/grill.md` (create the directory if needed — a spec directory holding only a `grill.md` is a valid, useful thing: it means "we thought about this and haven't built it yet").

```markdown
# Grill: {feature-name}

*{date} · {N} questions · status: resolved | partial*

## The shape of it

{Three or four sentences describing what was decided, in plain language.
Someone reading only this paragraph should know what is being built and why.}

## Decisions

### {short decision title}
**Decided:** {what was chosen}
**Why:** {the reason — this is the half that has to survive}
{if you recommended otherwise: **Noted:** I recommended {x}; going with {y} per the user.}

### {…}

## Invariants this establishes
- {rule} — *{why}*

## Explicitly not doing
- {non-goal} — *{why}*

## Still open
- {question} — *{why it was deferred, and what would settle it}*
```

Keep `## Invariants this establishes` tight and real — it lands verbatim in `requirements.md` → `## Constraints`, which is what the Scaffold shows in red and what Claude treats as law.

## Phase 4 — Console summary

```
═══ Grilled — {feature-name} ═══

  Questions:   {N} asked, {M} resolved
  Invariants:  {N} established
  Non-goals:   {N}
  Still open:  {N}
```

**Written to:** [.github/specs/{feature-name}/grill.md](.github/specs/{feature-name}/grill.md)

**Next:**

- `/spec {feature-name}` — it reads `grill.md` and builds the spec from these decisions instead of asking from scratch.
- Or stop here. A `grill.md` with no spec is a perfectly good outcome: you now know what you'd be building, and "not yet" is a decision.

## Rules

- **One question at a time.** The single most important rule. Batching defeats the purpose.
- **Always attach a recommended answer.** With a real recommendation and a real reason.
- **Ground it in the map.** Read `FEATURE_TREE.json` first; name real nodes and real numbers.
- **Never write code, and never write the spec.** `/grill` produces decisions; `/spec` produces documents.
- **Record the why for every decision**, and record your disagreement when you had one.
- **Don't pad.** Stop when the branches are resolved, not when you hit a question count.
- **Don't commit.** Same as every other slash command.
