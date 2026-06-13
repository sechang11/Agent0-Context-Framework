<!-- PROJECT: the frontmatter below is the OPTIONAL topology block for the feature canvas.
     It declares how this feature sits in the map. All fields are optional — delete the block
     entirely and the feature still appears (kind defaults to feature, ungrouped, no deps).
     /verify carries these fields into verification.md, which is where they become canonical.
     See docs/feature-canvas.md. -->
---
kind: feature                 # feature | endpoint | component | schema | integration
room:                         # which room this belongs to (an id from .github/specs/_rooms.yml)
depends_on: []                # ids of other features/schemas this one needs, e.g. [auth-schema]
# id:                         # defaults to the spec directory name; override only if needed
# title:                      # defaults to the titleized id
# summary:                    # defaults to the first paragraph of this file
---

# Requirements: <!-- PROJECT: Feature Name -->

## Problem

<!-- PROJECT: what problem does this solve? Whose? Why now? -->

## Goals

<!-- PROJECT: outcome-focused bullets. -->

- (...)
- (...)

## Non-goals

<!-- PROJECT: explicitly out of scope. -->

- (...)

## User-visible behavior

<!-- PROJECT: what changes for the user / admin / contributor? -->

## Constraints

<!-- PROJECT: domain constraints, platform / architectural constraints, existing-state constraints (what we can't break). -->

- (...)
- (...)

## Open questions

<!-- PROJECT: things to resolve before design. -->

- (...)
