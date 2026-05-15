# Skills

A **skill** is a self-contained package of domain knowledge an agent can load on demand. It's not a code file — it's a Markdown explainer that an agent reads when working in a particular area.

## When to write a skill

Write a skill when:

- The same domain knowledge gets re-explained in multiple prompts.
- An area has non-obvious conventions a contributor needs to learn before being productive.
- A general-purpose agent would produce wrong-looking output without specialized context.

Examples of skills worth having:
- The structure and conventions of a config file format you author by hand.
- The rules of a domain-specific evaluator (conditions, rules, expressions).
- The shape of a complex pipeline (rating, billing, ETL stage).
- The contract for a custom DSL or template language.

## When NOT to write a skill

Don't write a skill when:

- The information already lives in the code and reading the code is fine.
- The information changes frequently — skills are for stable patterns.
- The information is best captured as a code comment or docstring next to the thing it describes.
- You haven't yet noticed the same context being re-loaded across multiple tasks. **Wait until you feel the need.**

## Structure

Each skill is a directory under `.github/skills/{skill-name}/` with at least a `SKILL.md` file. The directory may contain supporting files (sample inputs, fixtures, expected outputs) if useful.

Use `_template/SKILL.md` as a starting point.

## How agents use skills

Agents are told to read the relevant skill in their instructions or in a context-routing file. Example pattern from an agent file:

```
## Before working

1. Read `.github/skills/condition-evaluator/SKILL.md`.
```

Or from the routing file:

```
| Working with conditions / rules | Read skills/condition-evaluator/SKILL.md |
```

## Conventions

- One skill per directory.
- `SKILL.md` is the entry point; it can reference other files in the same directory.
- Keep skills tight — they get loaded into a finite context window. If a skill is more than ~300 lines, it's probably two skills.
- Update the skill when the underlying convention changes. A stale skill produces stale output.
