---
# PROJECT: tighten globs to the test files in your project.
# Examples:
#   applyTo: "**/*.test.ts, **/*.spec.ts"
#   applyTo: "**/*_test.go"
#   applyTo: "tests/**/*.py"
applyTo: "**/*.test.*, **/*.spec.*, **/*_test.*, **/test_*.*"
---

# Test standards

<!-- PROJECT: keep the language section(s) you use. Delete the rest. Adapt rules to your test framework. -->

## General principles

- Tests fail with a clear message ("expected X, got Y" — not just "false != true").
- No reliance on test execution order.
- No package-level mutable state shared between tests.
- No real network calls in unit tests; mock at the typed-client interface.
- No tests that verify log output (logging is incidental; behavior is what matters).
- No snapshot tests of arbitrary HTML / JSON — only stable, intentional outputs.
- Bug fixes include a regression test that fails before the fix and passes after.

## Coverage expectations

- Every new exported function in the business layer has a test.
- Every new HTTP handler has at least: happy path, one validation failure, one not-found / conflict / state-error case.
- Every new branch in a conditional has a test that exercises it.

## Time-dependent code

<!-- PROJECT: if your project deals with time, document the convention here. -->

Inject a `Clock` interface anywhere code reads the current time. Tests provide a fake clock that returns whatever time the test wants and can be advanced manually.

## Language: <!-- PROJECT: e.g. TypeScript --> 

<!-- PROJECT: example slot fill -->
- Test framework: <!-- e.g. Vitest, Jest, Vue Test Utils -->
- File naming: <!-- e.g. `*.test.ts` next to the code it tests -->
- Test composables/utilities in isolation; component tests verify rendered output and emitted events, not internal implementation details.
- Mock the API client at the boundary, not individual `fetch` calls.

## Language: <!-- PROJECT: e.g. Go -->

<!-- PROJECT: example slot fill -->
- Standard library `testing` only. No DSL frameworks (Ginkgo, Gomega, Testify-suite).
- Table-driven tests. Each test case is a struct; iterate with `t.Run(tc.name, ...)`.
- Use `package foo_test` (external) when you want to test only the public API.
- HTTP handler tests: `httptest.NewRecorder` + `httptest.NewRequest` with a fake service.
- Repo layer tests can use a real in-memory database; service layer tests use fakes for the interfaces it depends on.

## Language: <!-- PROJECT: e.g. Python -->

<!-- PROJECT: example slot fill -->
- Test framework: pytest.
- Fixtures over inheritance. Parametrize over multiple cases.
- Mock at the boundary; use `unittest.mock` or `pytest-mock`.

## What not to do

- Don't use real wall-clock time in tested code paths.
- Don't share state between tests via module-level variables.
- Don't mock what you don't own (third-party libraries) — wrap them in your own interface and mock that.
- Don't introduce a new test framework without asking.
- Don't lower the bar because a change is small. Coverage is coverage.
