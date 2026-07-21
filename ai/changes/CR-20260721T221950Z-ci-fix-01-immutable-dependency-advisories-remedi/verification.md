# Verification

Status: verified [local]

## Commands

- [local] `npm run resume`, impact analysis, phase-gate preflight, context build, and the independent five-role immutable review passed.
- [local] Review-only commit/base `4ac76926239e3300196c6a548024686ee8440e3d` contains the approved immutable review and no lockfile, regression-test, business, or runtime implementation.
- [local] Baseline `npm ci` installed 282 packages and audited 283; exact include-dev audit commands exited 1 with one high-severity package entry covering npm advisories `1124007` and `1124017`.
- [local] Baseline tree/explain evidence records `sass-embedded@1.97.2 -> immutable@5.1.6`; `sass-embedded` declares `immutable:^5.0.2`.
- [local] Focused regression was red before the lock fix: 4/5 passed and the new assertion rejected advisory-affected `immutable@5.1.6`.
- [local] Normal npm package-lock-only install/uninstall resolution left no direct dependency and resolved the single transitive node to first-safe `immutable@5.1.8`.
- [local] Direct recursive deletion of the verified `D:\Project\MY\ruoyi-ui\node_modules` target was denied by execution policy; no bypass was used. The next `npm ci` used npm clean-install removal/rebuild semantics and passed.
- [local] Post-fix `npm audit --audit-level=moderate --include=dev` and `npm audit --json` exited 0 with 0 vulnerabilities; tree/explain shows one `immutable@5.1.8` node under unchanged `sass-embedded@1.97.2`.
- [local] `node --test tests/frontend-dependency-hardening.test.js` passed 5/5; UI tests passed 7/7; production build passed with 2602 modules.
- [local] Focused R-12A Node regression passed 39/39.
- [local] Configured Maven 3.9.9 `-pl ruoyi-business -am verify` passed 65/65 including masterdata 28/28; `-Pintegration-test verify` passed the same unit set plus MySQL/Testcontainers 2/2.
- [local] `npm run scan:all`, `npm run check:review`, `npm run check:phase-gate`, `npm run check:ci-coverage-declaration`, and `git diff --check` passed.
- [local] The first complete `npm run check` attempt stopped only because `memory/HANDOVER.md` did not state the pending full-check status inside its Verification section; this evidence-format defect was corrected without code, dependency, or rule changes.
- [local] Later complete-check attempts exposed and corrected only provenance wording and a duplicate zero-vulnerability audit artifact; the actual post-fix audit command, exit code, and totals remain recorded without fabricating a distinct raw JSON payload.
- [local] `npm run finalize:change` and refreshed platform context passed.
- [local] Final complete `npm run check` passed every governance gate and 491/491 root Node tests; its embedded `npm run close:change` passed.
- [local] Scope audit reports immutable review diff=0, brace review diff=0, R-12A review diff=0, forbidden business/runtime diff=0, package manifest diff=0, no R-12B path, and both phase gates blocked.
- [local] Explicit close, final scope/staging audit, and the enclosing local implementation commit complete this verified tree.
- [not-run] Push, GitHub Actions, after-push verification, post-push handover, and R-12B are outside authorization.

## Evidence

- Advisories: npm `1124007` / `CVE-2026-59879` / `GHSA-v56q-mh7h-f735`; npm `1124017` / `CVE-2026-59880` / `GHSA-xvcm-6775-5m9r`; high; affected 5.x `>=5.0.0-beta.1 <5.1.8`; first patched `5.1.8`; `fixAvailable=true`.
- Original chain: direct development dependency `sass-embedded@1.97.2` resolves transitive `immutable@5.1.6`; a deduplicated extraneous `sass@1.97.2` also points to that same installed node.
- Project source has no direct `immutable` import. `sass-embedded` is used by the real SCSS production build path, so this is a build-time dependency-security finding rather than application runtime use of Immutable APIs.
- `ruoyi-ui/package.json` has no diff. No parent version, override, workflow, audit threshold, package manager, or unrelated dependency changed.
- The lockfile's only dependency version delta is `immutable 5.1.6 -> 5.1.8`, with the resolved registry URL and integrity added for that node.
- The platform-owned regression rejects affected Immutable 5.x releases and retains explicit safe boundaries for supported 4.x/5.x/future-major lines.
- `engineeringCoreReady=blocked`; `beforeSalesOrder=blocked`; no R-12B implementation exists.
