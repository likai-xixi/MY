# System Management

RuoYi built-in system management ownership baseline.

## Scope

- User, role, menu, department, post, config, dictionary, notice, profile, and common auth/system controllers.
- RuoYi system APIs, frontend pages, mapper XML, and SQL ownership references.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- System backend, frontend, API, permission, mapper, SQL, and component ownership are registered under `system`.
- Cross-feature imports are limited to RuoYi shared infrastructure or explicit baseline exceptions.
- Generated scans and graphs include the system module without stale platform ownership.
- Stored notice rich text never enters the authenticated parent document through `v-html` or another direct HTML sink.
- Notice rich text is rendered in an empty-permission sandbox iframe with a CSP declared before untrusted content. Scripts, connections, forms, child frames, objects, popups, and top-level navigation stay blocked.
- Notice images and media are limited to `data:`, `blob:`, and the current application origin. External video frames and link popups are intentionally unavailable inside notices.
- The isolated document follows live light/dark theme changes and preserves the Quill read-only formats produced by the shared editor, including alignment, indentation, sizes, fonts, colors, lists, and code blocks.

## Verification

- Run `node --test tests/system-notice-security.test.js`.
- Run `npm --prefix ruoyi-ui run build:prod`.
- Exercise malicious and legitimate notice content in a real Chromium browser; confirm the parent DOM, URL, cookie, and JavaScript state cannot be changed.
- Run `npm run scan:all`.
- Run `npm run finalize:change`.
- Run `npm run check`.
