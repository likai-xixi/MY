# Product Review

CI-FIX-01 restores the repository's required dependency-security baseline so the already-published R-12A source can obtain complete CI evidence. The user value is release confidence, not new UI capability.

## Approved Slice

- Resolve `GHSA-3jxr-9vmj-r5cp` / `CVE-2026-13149` with the smallest compatible lockfile change.
- Preserve the fail-closed moderate audit, frontend tests, and production build.
- Add focused regression coverage preventing the affected version ranges from returning.

## Non-goals

- No R-12A business, review-decision, migration, or runtime behavior change.
- No broad framework/dependency migration, CI weakening, security exception, R-12B, or later business-module work.

## Success Criteria

Local clean install, audit, UI tests/build, focused masterdata regression, backend unit/integration verification, and repository gates pass. Remote CI and post-push closure remain separate until push is explicitly authorized.
