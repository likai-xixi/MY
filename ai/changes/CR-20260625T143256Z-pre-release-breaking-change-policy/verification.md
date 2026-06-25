# Verification

Status: [local] verified

## Commands

- [local] `npm run resume`
- [local] `npm run rule:propose -- "pre-release breaking change policy" --reason "..."`
- [local] `npm run start:change -- --mode rule-change "pre-release breaking change policy"`
- [local] `npm run context:build -- customer`
- [local] `node --test tests/pre-release-policy.test.js`
- [local] `npm run check:pre-release-policy`
- [local] `node --test tests/boundary-lint.test.js`
- [local] `node --test tests/component-checker.test.js`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`
- [local] forbidden-path audit

## Evidence

[local] `npm run resume` passed. [local] `npm run rule:propose -- "pre-release breaking change policy" --reason "..."` created `ai/rule-proposals/2026-06-25-pre-release-breaking-change-policy.json`. [local] `npm run start:change -- --mode rule-change "pre-release breaking change policy"` created `CR-20260625T143256Z-pre-release-breaking-change-policy`. [local] `npm run context:build -- customer` regenerated the focused current context for this rule-change.

[local] `node --test tests/pre-release-policy.test.js` passed with 4 tests. [local] `npm run check:pre-release-policy` passed. [local] `node --test tests/boundary-lint.test.js` passed with 9 tests after current-CR baseline exception files. [local] `node --test tests/component-checker.test.js` passed with 8 tests after current-CR baseline exception files. [local] `npm test` passed with 178 tests. [local] first `npm run check` reached `check:verification-provenance` and failed because generated command lists lacked provenance markers; after recording those markers, [local] `npm run check` passed with 178 tests. The final gate retained existing non-blocking warnings only: development/default config-safety warnings and the customer baseline migration markdown warning in `check:high-risk-governance`.

[local] `git diff --check` and forbidden-path audit passed during final closeout after handoff edits.
