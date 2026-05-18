# Skill: responsive-design

The canonical contract for multi-resolution / adaptive design strategy across web projects. Defines the viewport tiers, the four implementation approaches, and the tradeoffs of each. Used by `@ui-ux-engineer` and `@architect` jointly when picking a strategy.

This is a **framework-canonical** skill — the same contract applies in every adopted project. Per-project skills under `.github/skills/{name}/SKILL.md` would document project domain knowledge; this one documents framework-level UX/architectural knowledge.

## Why this exists

The mainstream advice ("responsive design via fluid layouts + breakpoints + mobile-first") forces the high-resolution experience to compromise for the lowest common denominator. Designers who care about both ends of the spectrum get frustrated: their wide-screen layouts look anemic because they had to accommodate phone breakpoints.

The honest framing: **responsive ≠ adaptive.**

- **Responsive** = one design, fluid via CSS breakpoints. Cheap. Compromises at the extremes.
- **Adaptive** = different presentations per viewport class, optimized for each. More expensive. Better at the extremes.

Most projects don't need adaptive. Some do. This skill helps the agents (and the user) decide which.

## Viewport tiers

Four tiers, with explicit pixel boundaries. Use these names consistently across the project.

| Tier | Pixel boundary (width) | Typical device |
|------|------------------------|----------------|
| `mobile` | < 640px | phones, narrow webview |
| `tablet` | 640–1023px | tablets in portrait, narrow laptops |
| `desktop` | 1024–1919px | most laptops and standard monitors |
| `wide` | ≥ 1920px | large monitors, ultra-wide setups, 4K |

The pixel boundaries are conventions, not absolutes — a specific project can shift them. But when a project does shift them, it shifts them once in the responsive-strategy document and uses the shifted values everywhere.

## The four implementation approaches

### Approach 1: Adaptive components (recommended for most modern web projects)

Container queries + per-component variants. Each component knows its container size and renders differently. The page layout doesn't change drastically per tier; individual components adapt.

Pros:
- One codebase, one set of routes.
- Components are independently testable.
- Browser support is now solid (Chrome 105+, Safari 16+, Firefox 110+).
- Easy to add new tiers later.

Cons:
- Limited to component-level differences. If the *page structure* fundamentally changes (sidebar appears on desktop, doesn't exist on mobile), this hits its limits.
- Container queries are newer; agents may not have deep familiarity with edge cases.

When to pick: most modern web projects, especially component-heavy SPAs.

### Approach 2: Conditional rendering (component-level branching by viewport)

Different component implementations per viewport. A `<Navigation/>` is one React component on desktop, a completely different `<MobileNav/>` on mobile, with a viewport-detection hook deciding which to render.

Pros:
- Full flexibility — each viewport can have its own implementation.
- Easier to reason about than container queries for layout-level differences.
- Works in any framework with a render gate.

Cons:
- More code to maintain (parallel implementations).
- Both implementations ship to the browser unless you split bundles.
- Easy to drift — fixes in one variant don't reach the other.

When to pick: when page layout differs by tier in substantial ways (e.g., dashboard with sidebar at desktop, drawer at mobile).

### Approach 3: Multiple builds (separate codebases per viewport)

Distinct codebases or build configurations per viewport class. `m.example.com` for mobile, `example.com` for desktop. The user gets routed to the appropriate build based on viewport detection at the edge.

Pros:
- Each build is optimized purely for its viewport. No compromises.
- Smaller bundles per user.
- Teams can work in parallel on each.

Cons:
- Highest maintenance burden — two or more codebases to keep in sync.
- Feature parity is hard.
- Routing complexity (deep links must work across builds).
- Generally only worth it for very large projects with a real reason.

When to pick: rare. Usually only at significant scale (consumer brands with millions of users) where the maintenance cost is justified by performance gains.

### Approach 4: Progressive enhancement

A baseline experience that works at every tier, with additional features layered in at larger viewports. Mobile gets the floor; desktop gets the floor plus extras (a sidebar, a preview pane, denser data tables).

Pros:
- Simplest to maintain.
- Naturally accessible (the floor is keyboard-friendly).
- Easy to test (smaller surface area at each tier).

Cons:
- High-end experiences are limited to "the basics plus more" — can't fundamentally redesign for wide screens.
- The mobile experience constrains the maximum complexity of the desktop one.

When to pick: content sites, marketing sites, simple SaaS where the desktop experience is the mobile experience plus a sidebar.

## Decision matrix

| Project type | Recommended approach |
|---|---|
| Component-heavy SPA, modern stack | Approach 1 (adaptive components) |
| App with substantially different layouts (dashboard vs. mobile drawer) | Approach 2 (conditional rendering) |
| Content site, marketing site, simple SaaS | Approach 4 (progressive enhancement) |
| Consumer brand at significant scale (B2C, millions of users) | Approach 3 (multiple builds) — and probably only at this scale |
| You don't know yet | Start with Approach 1 or 4, evolve later |

## Picking a strategy

When `@ui-ux-engineer` is invoked for the first time on a project, they collaborate with `@architect` to pick a strategy. The output is `.github/specs/_design/responsive-strategy.md` — a single file capturing:

- Which approach was chosen (one of the four above)
- The viewport tiers in use (using the standard names + any shifted boundaries)
- The rationale
- Any project-specific constraints that influenced the choice

This is a one-time decision per project. Subsequent UI work references the strategy without re-deciding.

If the strategy needs to change later (e.g., the project outgrew Approach 4 and needs Approach 2), that's a deliberate architectural change — re-invoke `@architect` and `@ui-ux-engineer` jointly to update the document.

## Per-feature UI design notes

Once a strategy exists, each significant UI-touching feature gets a small `.github/specs/{feature}/ui.md` documenting the per-tier design choices:

```markdown
---
feature: dashboard-sidebar
strategy: adaptive-components
---

# UI design: dashboard sidebar

## mobile (< 640)
- Hidden by default.
- Accessible via hamburger drawer.
- Drawer slides in from left, dismissible by tap-outside.

## tablet (640–1023)
- Hidden by default.
- Accessible via toggle in top nav.
- Inline drawer, not modal.

## desktop (1024–1919)
- Visible by default.
- 256px wide.
- Collapsible to 64px (icons only).

## wide (1920+)
- Visible by default.
- 320px wide.
- Plus secondary nav panel at 1920+ (an additional 192px column).
```

The agent generates this file when invoked on a feature with non-trivial UI. For trivial features (a single button, a static page) the file is omitted.

## Rules

- **Pick ONE approach per project.** Mixing approaches across features means no one understands the system. Decide once, document, follow.
- **Tier names are framework-canonical.** `mobile`, `tablet`, `desktop`, `wide`. Don't invent new names. Adjust the boundaries if needed; don't rename.
- **Strategy lives at `.github/specs/_design/responsive-strategy.md`.** Single source of truth. The agents read it; the user reads it; new contributors read it.
- **Don't let one tier compromise the others by default.** When a tradeoff arises, the strategy document should say which tier is primary and which adapts. Without that note, the agent treats all tiers as equal.
- **Container queries are preferred over media queries** when the implementation choice is open. Components knowing their container is more robust than components knowing the viewport.
