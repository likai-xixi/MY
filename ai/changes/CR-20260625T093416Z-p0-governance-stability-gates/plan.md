# Plan

Mode: `rule-change`
Feature: `platform` governance

## Steps

1. Read `AGENTS.md`, current context, handover, profile, package scripts, feature/module registries, and the current customer CR context.
2. Create a rule proposal with the existing `npm run rule:propose` script and create this independent rule-change CR with `npm run start:change -- --mode rule-change`.
3. Add reusable checker utilities plus:
   - `check:current-doc-state`
   - `check:feature-test-ownership`
   - `check:config-safety`
   - `check:verification-provenance`
   - `check:ci-coverage-declaration`
   - `check:after-push`
4. Ensure every new checker supports `--root <path>`, deterministic file/line sorted output, separated warnings/failures, and exit code `1` on blocking failures.
5. Add real temp-root Node tests in `tests/governance-gates.test.js`.
6. Register governance-test ownership exceptions for governance tests.
7. Wire the five P0 development gates into `npm run check`; keep `check:after-push` out of the main gate.
8. Rewrite current-facing handover/context/project-state/feature-brief text to avoid volatile Git/push state and to mark verification provenance.
9. Update this CR, memory, changelog, and session note with real evidence.
10. Run the required verification commands and keep customer runtime paths, sales-order roots, and business SQL DDL untouched.

## Non-Goals

- No customer runtime code.
- No sales-order implementation.
- No business database table structure change.
- No Maven/frontend CI expansion in this CR.
- No P1/P2 semantic gate expansion.
