# Example: Python Monolith

**Status: placeholder.** This directory will eventually hold a filled-in version of the framework adapted for a single-codebase Python application (Django, FastAPI, or similar).

A Python monolith fill would demonstrate:

- A `copilot-instructions.md` with logical components (api, models, tasks, admin) rather than separate services.
- `architecture.instructions.md` with invariants like "Business logic lives in services, not views" and "Models don't import from views".
- A `testing.instructions.md` focused on pytest with fixtures and parametrize.
- An `api-design.instructions.md` for DRF or FastAPI conventions.
- Per-app memory files (one per Django app or FastAPI router).
- Possibly a domain agent for a model-heavy area (billing, content, auth).

Until this is filled in, the templates in `../../.github/` are the reference. Follow `CUSTOMIZATION.md`.
