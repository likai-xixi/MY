# Session: System Notice Rich-Text Isolation

## Task

`TASK-0002` - remediate and verify the repository-wide system-notice stored-XSS finding under `CR-20260714T074627Z-change`.

## Status

`verified`

## Goal

Prevent stored system-notice HTML from executing in the authenticated parent application while preserving legitimate rich-text rendering.

## Changed Files

- HeaderNotice detail rendering, isolated document builder, focused Node security test, system feature ownership/brief, reproducible browser evidence, change/context records, and handoff memory.
- The exact list is synchronized by `ai/changes/CR-20260714T074627Z-change/changed-files.json`.

## Commands

- `[local] npm run resume`
- `[local] npm run ai:do -- "功能迭代：系统管理"`
- `[local] npm run context:build -- system`
- `[local] node --test tests/system-notice-security.test.js`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] npm run check:feature-test-ownership`
- `[local] npm run check:review`
- `[local] npm run check:context-pack`
- `[local] npm run check:diff`
- `[local] npm run scan:all`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`

## Verification

- [local] The focused test first failed 0/4, passed 4/4 after initial isolation, and expanded to 5/5 after independent review added dark-theme and Quill-format coverage.
- [local] The production frontend build passed with 2557 transformed modules.
- [local] Real Chrome loaded script, event-handler, JavaScript-link, top-target form, external-image, and nested-frame payloads beside legitimate and Quill-formatted content using separately reachable main and attacker servers.
- [local] Child-local execution markers stayed absent; the parent stayed safe; the allowed same-origin image was requested once; reachable attacker image/frame/form endpoints received zero requests; and computed styles confirmed dark contrast plus Quill alignment, indentation, size, font, and code blocks.
- [local] Review, context, impact-scope, test-ownership, scanner, and diff checks pass.
- [local] The complete repository gate passed with 386/386 Node tests after review hardening, and `npm run close:change` passed for the exact finalized record.

## Risks

- The browser harness is committed as reproducible evidence but is not wired into CI because the repository does not pin or provision a browser runner.
- Notice scripts, forms, child frames, external media, video frames, and link popups are intentionally unavailable. Images/media are limited to `data:`, `blob:`, and the current application origin.
- The security boundary depends on keeping `sandbox=""` and never adding `allow-scripts`, `allow-same-origin`, `allow-forms`, popups, or top-navigation.
- This task does not release, deploy, change production configuration, migrate dependencies, or open `beforeSalesOrder`.

## Next Entry Point

Stage/read back the exact 21-file batch, independently review, and commit it. Then continue the separate production-profile and dependency-remediation records before the final push.
