---
applyTo: "**/*.{ts,tsx,js,jsx,vue,svelte,py,go,rs,rb,java,kt,swift,cs}"
---

<!-- PROJECT: this file is the project's style drift register. Read it BEFORE writing any code. Add to it whenever you fix a class of lint failure that an agent drifted on. -->

# Project style — drift register

This file is the **drift register**: a concrete list of style rules that agents have drifted on in this codebase, written specifically enough that the next agent avoids the trap. Read it before writing or modifying any code.

**This file is not aspirational.** It is not "match existing patterns" or "be consistent." It is specific rules with examples. If a rule is vague, it doesn't belong here.

## How this file is different from generic style guides

- Generic style guides are exhaustive. This is targeted — only the rules agents have actually missed.
- Generic style guides explain rationale. This just says "do X, not Y" and trusts you.
- Generic style guides cover everything. This focuses on the rules your project's lint config will flag.

## How to maintain this file

When a push fails a lint rule that an agent should have known:

1. Add a row to the appropriate section below.
2. Be specific. Include: the rule name, what the agent did wrong, what to do instead, and a one-line example if it helps.
3. Optionally note how many files / agents have drifted on this — helps prioritize what to internalize.

Goal: this file becomes the project's accumulated "lessons we keep learning the hard way" — and stops being one we keep relearning.

## How to use this file when writing code

Read it before writing. Internalize the specific rules. When in doubt about a style choice, search this file first — if there's a directive, follow it. If there isn't, fall back to inspecting sibling files for the established pattern.

---

## TypeScript / JavaScript

<!-- PROJECT: examples below are placeholders. Replace with rules your codebase actually enforces. Delete this entire section if the project isn't TypeScript/JavaScript. -->

### Type-only imports — use `import type`

`@typescript-eslint/consistent-type-imports`. When importing something used only as a type, use `import type`, not bare `import`.

```ts
// ✗ drifted on:
import { Foo } from './types';
function takes(x: Foo) { ... }

// ✓ correct:
import type { Foo } from './types';
function takes(x: Foo) { ... }
```

### Nullish coalescing — `??` not `||`

`@typescript-eslint/prefer-nullish-coalescing`. When defaulting for null/undefined (not falsy), use `??`.

```ts
// ✗ drifted on:
const value = input || defaultValue;

// ✓ correct:
const value = input ?? defaultValue;
```

Use `||` only when you actually want falsy (`0`, `""`, `false`) to fall through to the default.

### Array types — `Foo[]` not `Array<Foo>`

`@typescript-eslint/array-type` with `"array"` preference. Use postfix `[]` for arrays of simple types.

```ts
// ✗ drifted on:
const items: Array<User> = [];

// ✓ correct:
const items: User[] = [];
```

### Interface vs type alias

`@typescript-eslint/consistent-type-definitions`. <!-- PROJECT: project picks one — interface OR type. Document the choice here. -->

### Template literal restrictions

`@typescript-eslint/restrict-template-expressions`. Only stringify values that are already strings, numbers, or booleans. Stringify objects explicitly.

```ts
// ✗ drifted on:
log(`user: ${user}`);  // user is an object

// ✓ correct:
log(`user: ${JSON.stringify(user)}`);
// or
log(`user: ${user.id}`);
```

### `void` in async returns

`@typescript-eslint/no-misused-promises`. Don't pass a `Promise<void>`-returning function to a handler that expects `() => void`.

```ts
// ✗ drifted on:
button.addEventListener('click', async () => { await save(); });

// ✓ correct:
button.addEventListener('click', () => { void save(); });
```

---

## Imports and module organization

<!-- PROJECT: capture rules about import order, path aliases, what's allowed to import what. -->

### Path aliases

<!-- PROJECT: e.g. "Use `@/lib/foo` not `../../../lib/foo` for cross-package imports." -->

### Banned imports

<!-- PROJECT: e.g. "Don't import directly from `lodash`. Use `lodash-es` for tree-shaking." -->

---

## React / Vue / Svelte / Angular

<!-- PROJECT: framework-specific rules. Delete sections that don't apply. -->

### React: hooks order

`react-hooks/rules-of-hooks`. Hooks must be called in the same order every render. No conditional hooks.

### React: dependency arrays

`react-hooks/exhaustive-deps`. Every variable referenced inside a `useEffect` / `useMemo` / `useCallback` body must be in the dependency array.

---

## Test-file conventions

<!-- PROJECT: rules specific to test files, if any. -->

---

## File naming and structure

<!-- PROJECT: e.g. "Components in PascalCase.tsx. Utilities in kebab-case.ts. Tests sit next to the file they test, suffixed `.test.ts`." -->

---

## Comments and documentation

<!-- PROJECT: e.g. "JSDoc for exported public functions. No comments on private helpers — let the name carry it." -->

---

## What goes in this register, what doesn't

**Goes in:**
- Rules your linter / typechecker actually enforces and that agents have drifted on
- Project-specific decisions where multiple valid answers exist (interface vs type, named vs default exports, etc.) — pick one, document it
- Anti-patterns specific to your codebase ("never write a fetch wrapper that doesn't handle 401" → document; or move to `architecture.instructions.md` if it's load-bearing)

**Doesn't go in:**
- Vague guidance like "be consistent" or "match existing style" — these are aspirational and agents will infer them anyway (badly)
- Rules your linter already enforces with auto-fix — let the tool do it, save the cognitive load
- Anything that belongs in `architecture.instructions.md` (system invariants), `testing.instructions.md` (testing standards), or `security.instructions.md` (security baseline)

This file is for the long tail of strict-mode rules that aren't quite architectural but consistently bite.
