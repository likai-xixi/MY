# Plan

1. Add failing CI checker tests for explicit UI tests, accepted audit thresholds, dependency inclusion, duplicate/conflicting audit flags, and failure-masking attempts.
2. Add failing ESM governance coverage tests that bind `.mjs` to API, permission, ownership, component-import, boundary, diff-hygiene, impact, orphan, duplicate, removal, and phase-gate scanning while keeping route discovery page-only.
3. Implement the smallest governance-only scanner and CI contract changes; update the real workflow and make `verify:release` resolve the configured Maven command cross-platform without touching runtime or lockfiles.
4. Update the anti-false-green matrix and its exact verification-change binding; make repeated finalization changelog-safe and idempotent.
5. Run focused RED/GREEN tests, generated scans, UI tests/audit/build, repository tests, release verification, finalization, the complete governance gate, closeout, exact scope audit, and independent review.
