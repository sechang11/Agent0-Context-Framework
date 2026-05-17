---
description: Install the web-debug panel into the host project. Routes via @architect (stack-fit check) and @debug-panel-engineer (implementation). Off by default — DEBUG_PANEL=1 required to activate. Mounts at /__debug. Renders verification.md content joined to the current route.
---

The full prompt for this command is at `.github/prompts/install-debug-panel.prompt.md`. Read it and follow it precisely.

Prerequisites:

- Host project must be a web app with an HTTP routing layer and a frontend framework (React, Vue, Svelte, etc.).
- At least one `.github/specs/{feature}/verification.md` should exist — produced by `/verify --bootstrap` (greenfield) or `/cover` (brownfield). The panel installs without verification files but renders empty.

After install, the panel is OFF until you set the env var (`NEXT_PUBLIC_DEBUG_PANEL=1` for Next.js, `VITE_DEBUG_PANEL=1` for Vite, etc.). To remove completely later: `/demolish-debug`.
