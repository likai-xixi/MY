# Verification

Status: verified [local]

## Commands

- [local] `npm run resume`
- [local] `npm run context:build -- platform`
- [local] `node --test tests/ci-coverage-hardening.test.js`
- [local] `npm run check:ci-coverage-declaration`
- [local] `npm run lint:codex`
- [local] `npm run finalize:change`
- [local] `npm run check`
- [local] `npm run close:change`
- [local] `git diff --check`
- [ci-planned] GitHub Actions `scaffold-ci` after the follow-up push

## Evidence

- [ci] Source run `29374274047` completed successfully on `c083c9cbdbdbb033c75b957a95f76df59f2b683f`, but emitted Node.js 20 action-runtime deprecation annotations and an unused governance Maven-cache path annotation.
- [local] Official release tags resolve to immutable SHAs: checkout v5.0.1 `93cb6efe18208431cddfb8368fd83d5badbf9bfd`, setup-node v5.0.0 `a0853c24544627f65ddf259abe73b1d18a591444`, and setup-java v5.5.0 `0f481fcb613427c0f801b606911222b5b6f3083a`.
- [local] Each pinned release `action.yml` declares the Node 24 action runtime.
- [local] The regression test first failed against the old workflow, then passed 43/43 after the workflow update.
- [local] `check:ci-coverage-declaration` and `lint:codex` pass; all workflow commands remain exact and every external action remains full-SHA pinned.
- [local] Governance retains JDK 17 but drops only its unused Maven cache; backend-tests retains JDK 17 and `cache: maven`.
- [local] The first full check stopped on missing required session headings; the second stopped on missing provenance in this change evidence. Both findings were repaired before the next run.
- [local] The repaired complete repository gate passes with 481/481 Node tests, including the new workflow regression.
