# Example: TypeScript Monorepo

**Status: placeholder.** This directory will eventually hold a filled-in version of the framework adapted for a pnpm/turbo TypeScript monorepo.

A TypeScript monorepo fill would demonstrate:

- A `copilot-instructions.md` with packages in the components table (apps, libs, shared types).
- `architecture.instructions.md` with invariants like "Apps depend on libs, never the other way" and "No circular package dependencies".
- A `testing.instructions.md` focused on Vitest / Jest, with separate sections for components, composables, and utilities.
- An `api-design.instructions.md` for the API package(s).
- Per-package memory files for the larger libs.
- A frontend-focused domain agent (replacing the generic code reviewer for `.vue` / `.tsx` files).

Until this is filled in, the templates in `../../.github/` are the reference. Follow `CUSTOMIZATION.md`.
