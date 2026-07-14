# Handover

## Summary

Current change `CR-20260714T074627Z-change` fixes the validated P1 stored-XSS path in system-notice rich-text details. The project remains unreleased; this batch does not publish or deploy.

## Impact

The change is based on `395685a31b39552f17f4fe0a6784c6796c9d9429` and approved by `RV-20260714T012241Z-review`. It changes only the shared HeaderNotice renderer/document builder, one focused system security test, the system feature brief/registry, reproducible browser evidence, and required change/context/memory artifacts. System backend, SQL, production configuration, dependencies, customer/masterdata/sales-order runtime, governance tools, release, and deployment remain outside this record.

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
- `[local] node --test tests/system-notice-security.test.js` (RED then GREEN)
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] npm run check:feature-test-ownership`
- `[local] npm run check:review`
- `[local] npm run check:context-pack`
- `[local] npm run check:diff`
- `[local] git diff --check`
- `[local] npm run scan:all`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local-browser] Chromium notice isolation harness`

## Verification

- [local] Focused security tests moved from 0/4 RED to 4/4 GREEN, then expanded to 5/5 after independent review added dark-theme and Quill-format coverage; the suite is registered in both `system.tests` and `system.ownership.tests`.
- [local] The direct `v-html` sink was replaced by empty-sandbox `srcdoc`; the CSP precedes untrusted HTML and permits no script, connection, form, object, child frame, arbitrary remote resource, popup, same-origin privilege, or top-navigation capability.
- [local] The production frontend build passed with 2557 transformed modules.
- [local-browser] Real Chrome reported opaque child origin `null`, absent child-local execution markers, unchanged parent URL/DOM/state, one allowed same-origin image request, and zero requests to reachable attacker image/frame/form endpoints. Computed styles confirmed dark-theme contrast and Quill formatting.
- [local] Scan, review, context, ownership, impact-scope, and diff checks pass. Exact browser evidence is under this change record.
- [local] Component scan completed with no contract changes; component identity, routes, API paths, permissions, graphs, and ownership remain stable.
- [local] The complete repository gate passed with 386/386 Node tests after review hardening, and the active change passed `npm run close:change`.

## Risks

- The browser evidence is not a CI-wired gate because browser provisioning is not pinned in this repository; do not misstate it as automatic CI coverage.
- External videos, link popups, forms, and arbitrary remote media in notice bodies are deliberately blocked; same-origin uploaded images and `data:`/`blob:` remain available.
- Never add sandbox allowances without a new security review and browser evidence.
- The separate UI dependency audit still reports four moderate findings until the later dependency migration batch.

## Next Actions

- Stage exactly the recorded 21 files, obtain independent staged review, and commit this system batch.
- Continue separate production-profile/checker and dependency-migration records, then run the repository-wide final review.
- Push the reviewed commit series and confirm GitHub Actions only after every local batch passes. Do not release or deploy.
