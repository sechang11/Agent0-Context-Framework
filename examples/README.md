# Examples

This directory will hold filled-in versions of the framework for common stacks. Each subdirectory is a worked example showing what `copilot-instructions.md`, `architecture.instructions.md`, agent files, and memory files look like when adapted to a specific kind of project.

The current entries are placeholders. Filling them in is a future contribution — the framework itself is usable today without them.

## Planned examples

- **`go-microservices/`** — multi-service Go workspace, sync HTTP, layered architecture per service.
- **`typescript-monorepo/`** — pnpm workspace with frontend + backend + shared packages.
- **`python-monolith/`** — single-codebase Django or FastAPI app.

If you adapt this framework to your project and the result would make a good reference, contributions to this directory are welcome.

## How to use the existing framework without examples

The templates in `.github/` are themselves the reference. Read `CUSTOMIZATION.md` and fill in the `<!-- PROJECT: ... -->` slots for your project. The examples here would be illustrative only — they're not required to adopt the framework.
