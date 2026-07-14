# Handover

## Summary

Active change `CR-20260714T074627Z-change` fixes the validated P1 stored-XSS path in system-notice rich-text details on base `395685a31b39552f17f4fe0a6784c6796c9d9429`. It is approved by `RV-20260714T012241Z-review`, remains unreleased, and does not publish or deploy.

## Impact

Stored notice HTML no longer enters the authenticated parent document. The shared detail renderer uses an empty-permission sandbox iframe and a CSP-first isolated document while retaining ordinary rich-text layout and same-origin uploaded images. Scope remains HeaderNotice, the exact system test/docs/registry, and required evidence/context/memory. Backend notice APIs/storage, production configuration, dependency migration, governance rules, and sales-order remain separate; `beforeSalesOrder` stays blocked.

## Changed Files

- `ai/changes/CR-20260714T074627Z-change/changed-files.json`
- `ai/changes/CR-20260714T074627Z-change/handover.md`
- `ai/changes/CR-20260714T074627Z-change/impact.json`
- `ai/changes/CR-20260714T074627Z-change/plan.md`
- `ai/changes/CR-20260714T074627Z-change/request.md`
- `ai/changes/CR-20260714T074627Z-change/runtime-evidence/notice-isolation-browser-result.json`
- `ai/changes/CR-20260714T074627Z-change/runtime-evidence/notice-isolation-browser.html`
- `ai/changes/CR-20260714T074627Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/registry/features.json`
- `features/system.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-14-system-notice-xss.md`
- `ruoyi-ui/src/layout/components/HeaderNotice/DetailView.vue`
- `ruoyi-ui/src/layout/components/HeaderNotice/notice-rich-text.mjs`
- `tests/system-notice-security.test.js`

## Commands

- `[local] npm run resume`
- `[local] npm run ai:do -- "功能迭代：系统管理"`
- `[local] npm run context:build -- system`
- `[local] node --test tests/system-notice-security.test.js`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] npm run scan:all`
- `[local] npm run check:feature-test-ownership`
- `[local] npm run check:review`
- `[local] npm run check:context-pack`
- `[local] npm run check:diff`
- `[local] git diff --check`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local-browser] Chromium notice isolation harness`

## Verification

- [local] Focused tests moved from 0/4 RED to 4/4 GREEN, then expanded to 5/5 for dark-theme and Quill-format regression coverage; the frontend production build passed with 2557 transformed modules.
- [local-browser] Child-local execution markers stayed absent and parent URL/DOM/state stayed safe. A same-origin image reached the main server once while a separately reachable attacker server received zero image/frame/form requests; computed styles confirmed dark contrast and Quill formatting.
- [local] `npm run check:feature-test-ownership`, `npm run check:review`, `npm run check:context-pack`, `npm run check:diff`, scanner checks, and `git diff --check` pass. Exact browser readback and its CI boundary are recorded under the active change.
- [local] The complete repository gate passed with 386/386 Node tests after review hardening, and `npm run close:change` passed for the exact finalized record.

## Risks

- The real-browser harness is reproducible local evidence, not a pinned CI job.
- Notice external video, arbitrary remote media, popups, forms, and child frames are intentionally blocked. The empty sandbox must not be relaxed.
- Four moderate UI dependency findings remain for the separate dependency migration batch.

## Next Actions

- Stage the exact 21-file system batch, complete independent review, and commit it.
- Complete the separate production profile/checker and dependency alignment/migration batches.
- Run final all-project review, push `master`, and confirm GitHub Actions. Do not release or deploy.
