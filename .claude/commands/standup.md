---
description: Print an instant project digest in the terminal — In progress, Ready to pick up, Needs attention, Keystones, Dependency cycles, Coverage — read straight from FEATURE_TREE.json. The in-chat twin of the canvas "Project pulse". Read-only. Works offline.
---

The full prompt for this command is at `.github/prompts/standup.prompt.md`. Read it and follow it precisely.

Invocation patterns:

```
/standup                  # full project digest — one screen, read from FEATURE_TREE.json
/standup {room}           # scope the digest to one room (by id or title)
/standup --full           # don't truncate any list
```

The terminal-native twin of the canvas "Project pulse" button. Deterministic and structural — pure counting and graph traversal, no AI judgment. For AI-judged priorities with rationale, use `/nextsteps`. If there's no `FEATURE_TREE.json` yet, run `/feature-tree` first.
