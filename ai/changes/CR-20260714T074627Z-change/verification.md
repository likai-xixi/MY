# Verification

Status: verified [local]

## Commands

- `[local] npm run resume`
- `[local] npm run ai:do -- "功能迭代：系统管理"`
- `[local] npm run context:build -- system`
- `[local] node --test tests/system-notice-security.test.js` (RED)
- `[local] node --test tests/system-notice-security.test.js` (GREEN)
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

## Evidence

- [local] The source-to-sink trace is exploitable at P1: default ordinary-role seed permissions can add/edit notices, `/system/notice` is intentionally excluded from the generic XSS request filter, notice content is stored and returned as rich HTML, and the shared authenticated header detail view previously inserted it into the parent document with `v-html`, where the JavaScript-readable frontend token was reachable.
- [local] The focused regression first failed 0/4 against the direct parent sink, missing isolated document builder, and absent feature test ownership. It passed 4/4 after the initial isolation, then expanded to 5/5 after independent review added dark-theme and Quill-format coverage.
- [local] `DetailView.vue` no longer contains `v-html`. It binds the stored body to iframe `srcdoc` with `sandbox=""`, `referrerpolicy="no-referrer"`, no `allow-*` capability, and an accessible title.
- [local] The generated document places CSP before untrusted content and explicitly denies default, script, connection, object, frame, child-frame, base, and form-action sources. Inline styles remain available for rich-text formatting; images/media are limited to `data:`, `blob:`, and the normalized current HTTP(S) application origin.
- [local] The production frontend build passed with 2557 transformed modules.
- [local-browser] Google Chrome 150 used the committed harness and production document builder against a main server on `127.0.0.1:4174` and a separately reachable attacker server on `127.0.0.1:4175`. The payload included `<script>`, an event-handler image, a `javascript:` link, a top-target form, an external image, and a nested iframe.
- [local-browser] Child-local script, event, and JavaScript-link markers stayed absent before and after clicks; the child origin was `null`; the parent URL, attack flag, DOM marker, and `safe` state were unchanged. The allowed same-origin image reached the main server once, while the reachable attacker server received zero image, frame, or form requests.
- [local-browser] Computed styles confirmed the dark palette plus Quill center alignment, level-two indentation, large size, serif font, and code-block presentation; legitimate heading, strong text, and table content remained readable.
- [local] `runtime-evidence/notice-isolation-browser-result.json` records the exact browser readback and security-console summary. Both temporary servers and Chrome were stopped after verification.
- [local] Scanners, system test ownership, approved review binding, context-pack integrity, impact diff scope, and `git diff --check` pass.
- [local] Component scan completed with no contract changes: the registered HeaderNotice component identity, API paths, routes, permissions, UI graph nodes, and shared-component ownership remain unchanged; only its internal rich-text rendering boundary changed.
- [local] The complete `npm run check` passed end to end with 386/386 Node tests after review hardening, and `npm run close:change` passed against the exact finalized change record.

## Residual Risk

- The browser harness is reproducible local evidence but is not wired into CI because this repository does not pin or provision a browser runner. The committed Node security suite is the automated regression gate.
- External video frames, arbitrary remote images/media, link popups, forms, child frames, and scripts are intentionally unavailable inside notices. Same-origin uploaded images plus `data:` and `blob:` remain supported.
- The security boundary requires the iframe to retain an empty sandbox. Adding `allow-scripts`, `allow-same-origin`, `allow-forms`, popups, or top-navigation would reopen risk and is locked by the focused test.
- This batch does not release, deploy, alter production configuration or dependencies, change backend notice storage/API semantics, or open `beforeSalesOrder`.
