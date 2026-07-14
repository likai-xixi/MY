# Verification

Status: passed [local]

## Commands

- [local] `npm run resume`
- [local] `npm run context:build -- platform`
- [local] `node --test tests/ci-coverage-hardening.test.js tests/diff-checker.test.js tests/frontend-esm-scanner-governance.test.js tests/false-green-matrix-checker.test.js tests/governance-gates.test.js tests/governance-sales-order-handoff-gate.test.js tests/ownership-syncer.test.js tests/package-scripts.test.js tests/production-safety.test.js tests/release-verifier-governance.test.js tests/remove-feature.test.js`
- [local] `node --test tests/release-verifier-governance.test.js tests/production-safety.test.js tests/package-scripts.test.js tests/false-green-matrix-checker.test.js`
- [local] `npm run scan:all`
- [local] `npm run scan:all:check`
- [local] `npm run check:ci-coverage-declaration`
- [local] `npm run check:false-green-matrix`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm test`
- [local] `npm run check`
- [local] `npm run verify:release`
- [local] `git diff --check`

## Evidence

- [local] The final focused governance/scanner suite passed 234/234; its CI hardening file passed 42/42 across Maven environment weakening, frontend audit normalization, dynamic executable/subcommand/argument resolution, local run-block assignments, process-wrapper chains, and known-root controls.
- [local] Two independent adversarial CI reviews returned GO with no P0-P3 after their executable-expression, environment, wrapper, and root-boundary probes were converted into regressions.
- [local] The complete root suite and repository governance gate passed end to end with 480/480 Node tests.
- [local] Generated scans and ownership are stable; route discovery still excludes plain `.mjs` helpers, while API, permission, component-consumer, ownership, boundary, phase, impact, orphan, removal, duplicate, file-weight, and text-hygiene paths include them.
- [local] UI tests passed 7/7, the moderate full dependency audit reported zero vulnerabilities, and the production build transformed 2601 modules successfully.
- [local] Roadmap and phase-gate facts now record the real GitHub Actions coverage without opening `beforeSalesOrder`.
- [local] Portable release-orchestration and anti-false-green coverage passed 94/94; it locks the six-stage order, exact Maven reactor, runtime-policy executable resolution and validation, standard fallback, inherited environment, and every fail-fast boundary.
- [local] The pre-fix `npm run verify:release` reached the Maven boundary after 448/448 tests and production safety, then stopped on the bare-`mvn` PATH defect.
- [local] The final `npm run verify:release` passed end to end: 480/480 Node tests, production safety, 60/60 Java tests including both MySQL/Testcontainers integration tests, 7/7 UI tests, zero audit vulnerabilities across 360 dependencies, and the 2601-module production build.
