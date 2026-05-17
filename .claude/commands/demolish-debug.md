---
description: Fully remove the web-debug panel from the host project. Deletes /__debug routes, the debug/ helper directory, env-var lines, and reports any remaining references in host code for manual cleanup. Two confirmation gates before anything is deleted. Verification.md files are untouched.
---

The full prompt for this command is at `.github/prompts/demolish-debug.prompt.md`. Read it and follow it precisely.

This is a **destructive** operation. The command requires two explicit confirmations — one for intent, one for the specific deletion plan — before anything is removed.

Your `.github/specs/*/verification.md` files stay intact. Re-install later with `/install-debug-panel` without losing any verification work.
