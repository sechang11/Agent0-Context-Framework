# Memory

Per-component summary notes. **Optional layer** — only worth maintaining when the project has multiple components and you've felt the need for a stable per-component briefing that agents can load.

## When to use this

- A project with several distinct components / services / packages, where loading the full source for each is expensive.
- Agents that benefit from a high-level orientation before diving into code.
- Areas where the "what does this own?" question has a non-obvious answer.

## When not to bother

- Small projects with one or two components.
- Areas where the code itself is the best documentation.
- If you won't keep the file up to date. A stale memory file is worse than no memory file.

## Conventions

- One file per component: `.github/memory/{component}.md`.
- 30–80 lines each. The point is "what does this component do, what does it own, how does it talk to others" — not full documentation.
- Use `_template-component.md` as a starting point.
- A `relationships.md` file is optional and useful when the project has many cross-component interactions worth diagramming.
- A `full/{component}-full.md` deep-dive is optional and only worth writing for components agents work in deeply and often.

## How agents use memory

Agents are told (in their instructions) to read the relevant memory file at the start of a task. From `software-engineer.agent.md`:

> If a memory file exists for the component you're touching (`.github/memory/{component}.md`), read it.

The phrasing is conditional. Agents proceed without it if the file doesn't exist.

## Maintenance

Memory files drift. Plan to re-read each one once a quarter (or when the agent's output starts feeling stale) and either update it or delete it.
