# Example: Go Microservices

**Status: placeholder.** This directory will eventually hold a filled-in version of the framework adapted for a multi-service Go workspace.

A Go microservices fill would demonstrate:

- A `copilot-instructions.md` with multiple services in the components table, each on its own port.
- `architecture.instructions.md` with invariants like "Service X is the only orchestrator" and "No shared library — duplicate small types".
- A `testing.instructions.md` focused on stdlib `testing`, table-driven tests, and `httptest`.
- An `api-design.instructions.md` for chi/v5 + JSON.
- Per-service memory files showing the per-component pattern.
- A domain-expert agent or two.

Until this is filled in, the templates in `../../.github/` are the reference. Follow `CUSTOMIZATION.md`.
