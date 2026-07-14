# Verification

Status: verified [local]

## Commands

- `[local] npm run resume`
- `[local] npm run rule:preflight -- before-sales-order-phase-gate`
- `[local] npm run scan:all:check`
- `[local] npm test`
- `[local] npm run check:legacy-baseline`
- `[local] npm run check:review`
- `[local] npm run check:context-pack`
- `[local] npm run check:feature-test-ownership`
- `[local] npm run check:ci-coverage-declaration`
- `[local] npm run check:false-green-matrix`
- `[local] npm run check:rule-lock`
- `[local] npm ci`
- `[local] npm --prefix ruoyi-ui ci`
- `[local] npm --prefix ruoyi-ui audit --audit-level=high`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] mvn -pl ruoyi-business -am -Pintegration-test verify`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local] git diff --check`

## Evidence

- [local] The refreshed all-up `npm run check` passed end to end with 377/377 Node tests after the original independent-review bypasses plus staged/index cancellation, index/worktree legacy divergence, invalid UTF-8 evidence, contradictory non-success provenance, canonical/unique changed-file evidence, CommonMark-indented duplicate sections, structured top-level status parsing, root/module Java test discovery, executable checker binding, and false-green matrix deletion/forgery were repaired.
- [local] Focused legacy/Git-evidence and consumers passed 97/97, evidence/handoff/finalizer passed 69/69, ownership/matrix/review passed 78/78, standalone matrix tests passed 13/13, and CI plus governance hardening passed 49/49 at their recorded checkpoints.
- [local] Review/context focused tests passed 34/34 after requiring a complete committed pre-review package, an exact `Allow Implementation` decision, broad RuoYi runtime detection, real must-read files, approved context overrides, canonical approval roots, and Windows absolute-path rejection.
- [local] Handover focused tests passed 34/34; both active and memory handovers must now list every exact changed path bidirectionally, with no summaries, truncation, duplicates, omissions, or overclaims.
- [local] Ownership regressions cover registered backend roots, compact Java package names including nested generated-looking segments, rule-change-only exceptions, registered owners, independently matched cross-feature paths, and rejection of governance/shared disguises for business-feature tests.
- [local] Root and UI clean installs passed; the UI high-severity audit exited 0; the production build completed 2556 modules.
- [local] Maven verification passed 37 unit tests and 1 MySQL/Testcontainers integration test.
- [local] `scan:all:check`, review, context, phase gate, feature-test ownership, CI coverage, legacy baseline, false-green matrix, and rule-lock checks passed at the recorded checkpoints; workflow evidence is parsed from YAML AST and counts only unconditional, failure-propagating executable steps.
- [local] Finalization records 63 paths and matches the 63-path actual Git set; the forbidden business-path audit reports zero hits.
- [local] `check:change`, `close:change`, and `git diff --check` passed after the finalizer preservation regression was added.
- [local] The dependency audit still reports four moderate findings; they require a separate breaking ECharts 6 and SVG build-chain migration and are not misreported as zero.

## Remaining Work

- [not-run] Stage the exact 63-file set, perform the final staged-scope review, and commit only if the review reports no P0-P2 findings.
