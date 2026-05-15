<!-- PROJECT: this file tells agents which context to load for which task. Keep the structure; replace the example sections with rules specific to your project. Delete any that don't apply. -->

# Context Routing

How to decide what context to load based on the task. Auto-loaded instructions cover most cases; this file tells you what to add when the situation needs more.

When helping with a task, load only the context that's relevant. Don't dump the whole project into every conversation.

---

## <!-- PROJECT: Component / Domain Name -->

<!-- PROJECT: example slot fill — copy this block per major area of your project. -->

**Trigger when:**
- File path is in `<!-- PROJECT: src/component-x/ -->`
- Prompt mentions: <!-- PROJECT: keywords specific to this area -->

**Load:**
- `.github/memory/<!-- PROJECT: component-x -->.md`
- `.github/skills/<!-- PROJECT: relevant-skill -->/SKILL.md` (if exists)

**Key constraint:** <!-- PROJECT: the one or two architectural rules that govern this area -->

---

## <!-- PROJECT: Another Component -->

**Trigger when:**
- (...)

**Load:**
- (...)

---

## Cross-component / architecture / debugging

**Trigger when:**
- The task touches more than one component
- Prompt mentions: architecture, design, boundary, cross-component, dependency, what calls what
- Debugging an issue that crosses component lines

**Load:**
- `.github/instructions/architecture.instructions.md`
- The relevant per-component memory files
- <!-- PROJECT: relationships file if you have one -->

---

## Specs and lifecycle

**Trigger when:**
- Prompt is `/spec` or about producing specs
- Prompt mentions: requirements, design, tasks, plan

**Load:**
- `.github/workflow/ai-dev-lifecycle.md`
- `.github/prompts/spec.prompt.md`

---

## Default behavior

If the task doesn't fit any trigger:

1. Read `.github/copilot-instructions.md` (auto-loaded anyway).
2. Identify the component(s) involved.
3. Load the relevant memory file if one exists.
4. Stop. Don't preload everything "just in case".
