# Verification

Status: [local] verified for the P0 governance gate scope.

## Commands

- [local] `npm run resume` - passed before and after the rule-change CR was created.
- [local] `npm run rule:propose -- "p0 governance stability gates" --reason "..."`
- [local] `npm run start:change -- --mode rule-change "P0 governance stability gates"`
- [local] `node --test tests/governance-gates.test.js` - passed with 10 tests.
- [local] `npm run finalize:change -- --summary "P0 governance stability gates"` - passed and generated this change record.
- [local] `npm test` - passed with 131 Node tests.
- [local] `npm run check:current-doc-state` - passed.
- [local] `npm run check:feature-test-ownership` - passed.
- [local] `npm run check:config-safety` - passed with warnings for existing dev/default config values only.
- [local] `npm run check:verification-provenance` - passed.
- [local] `npm run check:ci-coverage-declaration` - passed with warnings that broader build workflow commands are not present.
- [local] `npm run check` - passed after the final evidence update.
- [local] `git diff --check` - passed after the final evidence update.

## Evidence

- [local] `tests/governance-gates.test.js` uses temporary fixture roots and validates real file reads for the five P0 development gates.
- [local] `node --test tests/governance-gates.test.js` - passed with 10 tests.
- [local] `npm test` - passed with 131 Node tests.
- [local] `npm run check:config-safety` warning boundary: existing `application-druid.yml` and `application.yml` development/default values are warnings, not production-profile failures.
- [local] `npm run check:ci-coverage-declaration` warning boundary: `.github/workflows` runs Node governance checks only; current docs must not claim broader workflow coverage.
- [local] `npm run check` - passed after these provenance labels were recorded.
- [local] `git diff --check` - passed after these provenance labels were recorded.
