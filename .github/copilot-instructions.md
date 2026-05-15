<!-- PROJECT: replace "Project Name" and the description below with your own. -->
# Project Name — Copilot Instructions

<!-- PROJECT: one paragraph. What is this project? What does it do? What's distinctive about it? Example: "Acme is a TypeScript monorepo for the Acme analytics platform — an ingestion API, a worker fleet, and a Next.js dashboard. The architectural choice that matters most is that the worker fleet is the only writer to the warehouse." -->
A short, honest description of the project. State the architectural choice that matters most.

## Workspace layout

<!-- PROJECT: replace this tree with your project's layout. One line per major component. Keep it under ~20 entries; group small things. -->

```
project-root/
  .github/         this framework
  src/
    api/           HTTP handlers
    core/          domain logic
    db/            persistence
  web/             frontend
  tests/
```

## Component responsibilities (one line each)

<!-- PROJECT: list your major components and what each one owns. Even a single-binary project has logical components. The bar is "if a contributor changed this without understanding what it owns, they'd get it wrong." -->

- **api** — HTTP entry point. Parses requests, calls into core, formats responses. No business logic.
- **core** — domain rules and orchestration. Pure functions where possible.
- **db** — persistence. The only layer that knows about the storage engine.
- **web** — frontend. Talks to api over HTTP only.

## Cross-component patterns

<!-- PROJECT: list the architectural rules that aren't obvious from the code. If you don't have any, delete this section. Examples: "All async work goes through the job queue, never inline in HTTP handlers." "The frontend never talks to the database directly." -->

- Communication between components is explicit and one-directional where possible.
- No component reaches around another to read its private state.

## Tech stack

<!-- PROJECT: list the languages, frameworks, and tools that contributors should match. -->

- Language(s) and version
- Framework(s)
- Database
- Test framework
- Build tooling

## Hard rules

These rules are non-negotiable. Violations should be treated as bugs.

- Never read `.env`, `.env.*`, or any file containing secrets, credentials, tokens, or API keys.
- Never modify dependency manifests (`package.json`, `go.mod`, `requirements.txt`, etc.) without explicit user permission.
- Never run destructive commands (`rm -rf`, `git reset --hard`, `git push --force`, `DROP TABLE`, etc.) without explicit user approval.
- Never commit, push, or open PRs automatically.
- Always reference credentials by environment-variable name, never hardcode.
- Read existing code patterns before writing new code.
- One logical change = one commit. Don't bundle unrelated changes.

<!-- PROJECT: add project-specific hard rules here. Examples: "Money is always integer cents." "Time-dependent code injects a Clock interface." "All public API responses use the unified error envelope." -->

## Detailed instructions

Topic-specific rules live in `.github/instructions/` and load automatically based on the file you're editing:

| File | Scope |
|------|-------|
| `security.instructions.md` | Security baseline (all files) |
| `git-safety.instructions.md` | Git safety (all files) |
| `architecture.instructions.md` | Component-design principles |
| `testing.instructions.md` | Test standards |
| `api-design.instructions.md` | HTTP API conventions |

## Agents

Custom agents live in `.github/agents/` and are invoked in chat as `@agent-name`:

<!-- PROJECT: prune this list to the agents you actually have. -->

| Agent | Purpose |
|-------|---------|
| `software-engineer` | Implement features, fix bugs, match existing patterns |
| `architect` | Design review, reject bad designs, enforce invariants |
| `code-reviewer` | General code review |
| `security-reviewer` | Security gate, severity-ranked findings |
| `test-engineer` | Coverage analysis |

See `AGENTS.md` for routing rules.

## Spec rules

Non-trivial work starts with `/spec`. Specs produce three files (`requirements.md`, `design.md`, `tasks.md`) under `.github/specs/{feature-name}/`. Specs are documents, not implementations — do not write code during spec creation.
