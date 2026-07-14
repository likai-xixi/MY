# Verification

Status: passed [local]

## Commands

- [local] `node --test tests/frontend-dependency-hardening.test.js`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [runtime-local] `browser acceptance on login menu icons and cache charts`
- [local] `npm run scan:all`
- [local] `npm test`
- [local] `npm run check`
- [local] `npm run close:change`

## Evidence

[local] Focused UI tests, zero-vulnerability audit, production build, browser acceptance, scanners, 431/431 root tests, the complete npm run check, and close:change passed.
