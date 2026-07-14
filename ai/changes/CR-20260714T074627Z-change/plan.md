# Plan

Mode: `update`
Feature: `system`
Review: `RV-20260714T012241Z-review` (`Allow Implementation`)

1. Reproduce the stored-XSS source-to-sink path from notice storage to the shared detail renderer.
2. Add a focused failing security regression test before changing the renderer.
3. Replace parent-document HTML injection with a sandboxed rich-text document using a restrictive CSP, while preserving legitimate notice formatting.
4. Register the focused test under the `system` feature and update the feature brief.
5. Run focused security tests, the production frontend build, browser-level isolation checks, and `npm run scan:all`.
6. Run `npm run finalize:change` and `npm run check`; do not close or claim completion until all evidence is recorded.

## Allowed Edit Roots

- `features/system.md`
- `ruoyi-ui/src/layout/components/HeaderNotice`
- `ai/registry/features.json`
- `ai/changes`
- `ai/context`
- `ai/generated`
- `graph`
- `memory`
- `tests/system-notice-security.test.js`
