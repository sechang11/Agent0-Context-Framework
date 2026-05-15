---
# PROJECT: tighten this glob to the source directories you want this file to govern.
# Examples:
#   applyTo: "src/**/*.{ts,js}"
#   applyTo: "**/*.go"
#   applyTo: "backend/**/*.py"
applyTo: "**"
---

# Architecture principles

These principles govern how the components of this project relate to each other. The highest-leverage file in the framework — fill it in honestly or delete it.

## Project invariants

<!-- PROJECT: this is the most important section. List the rules that aren't obvious from reading the code. Each one should be specific enough that a contributor could violate it without realizing, and important enough that you'd want to catch the violation in review. -->

<!-- PROJECT: Examples of good invariants:
  - "All async work goes through the job queue. HTTP handlers must return in <500ms."
  - "The frontend never talks to the database. All data goes through the API layer."
  - "Money is integer cents. Floats for currency are a bug."
  - "Time-dependent code injects a Clock interface. Calls to `time.Now()` in tested paths are a bug."
  - "There is no shared library. If two components need the same type, duplicate it."
  - "Component X is the only writer to data store Y."
-->

<!-- PROJECT: Examples of bad invariants (delete these — they're platitudes):
  - "Code should be clean."
  - "Follow best practices."
  - "Write good tests."
-->

- (fill in)
- (fill in)

If you don't have at least 2-3 real invariants, delete this file. An empty architecture file is worse than no architecture file.

## Component boundaries

<!-- PROJECT: list each major component and what it owns. The bar is "if a contributor changed this without understanding what it owns, they'd get it wrong." -->

- **component-a** — owns X. Reads from Y. Does not write to Z.
- **component-b** — owns Z. Stateless.

## Communication rules

<!-- PROJECT: how do components talk to each other? Sync HTTP only? Job queue allowed? Event bus? Direct function calls? -->

- (fill in)

## Layered architecture (within a component)

<!-- PROJECT: if components have an internal layer structure (e.g. handler → service → repo), document it here. Otherwise delete this section. -->

- (fill in)

## What to flag

- Any change that violates a project invariant above.
- Any new cross-component dependency that doesn't follow the communication rules.
- Any introduction of a new external system (database, queue, third-party service) without an explicit decision.
- Any proposal to extract a shared library before the duplication has actually become painful.
