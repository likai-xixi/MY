# Dependency Security Root Cause

## Exact advisory

- npm advisory source: `1123896`.
- GHSA: `GHSA-3jxr-9vmj-r5cp`.
- CVE alias confirmed from the reviewed GitHub advisory API: `CVE-2026-13149`.
- Severity: npm `high`; CVSS v3.1 `5.3` (`AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L`).
- Weaknesses: `CWE-400`, `CWE-407`.
- Affected 2.x range: `>=2.0.0 <2.1.2`.
- First patched 2.x version: `2.1.2`.
- Local vulnerable version: `2.1.1`.
- `fixAvailable`: `true`; no major upgrade is required for the installed 2.x line.
- Directness: `isDirect=false`, but the package is reachable from both production and development roots.

The exact project audit JSON is preserved in `baseline-audit.json`. The reviewed advisory was queried with
`gh api /advisories/GHSA-3jxr-9vmj-r5cp`; it reports publication at `2026-07-20T20:51:09Z` and the 2.x first
patched version `2.1.2`.

## Dependency paths

The lockfile contains one deduplicated `minimatch@9.0.9` and one `brace-expansion@2.1.1`, but `npm explain`
proves three logical paths use that instance:

1. `js-beautify@1.15.4 -> editorconfig@1.0.7 -> minimatch@9.0.9 -> brace-expansion@2.1.1`.
2. `js-beautify@1.15.4 -> glob@10.5.0 -> minimatch@9.0.9 -> brace-expansion@2.1.1`.
3. `unplugin-auto-import@0.18.6 (dev) -> minimatch@9.0.9 -> brace-expansion@2.1.1`.

Therefore deleting `js-beautify` would not clear the advisory: the independent `unplugin-auto-import` path would
remain. The vulnerable package is part of the production dependency count through `js-beautify`, while the same
deduplicated node is also used by a direct development dependency.

## Real use and attack path

- `ruoyi-ui/src/views/tool/build/index.vue` imports `js-beautify` and calls `beautifier.html(...)` in
  `generateCode()` after building Vue/JavaScript/CSS text from the interactive form builder state.
- `sql/ry_20260417.sql` registers the normal `tool/build/index` 表单构建 menu route with
  `tool:build:list`; it is not an unused package.
- `ruoyi-ui/src/store/modules/permission.js` uses `import.meta.glob('./../../views/**/*.vue')`, so the page is
  included as a lazy production chunk and is not limited to a backend-only generator process.
- Ordinary authorized users of the form builder can influence labels/placeholders and generated source passed to
  `beautifier.html`. However, that call uses the formatter API, not `brace-expansion.expand()` or a glob-pattern API.
- Repository search found no direct `brace-expansion`, glob-pattern, `js_beautify`, `html_beautify`, or
  `css_beautify` call supplied with business/request data. The vulnerable brace-expansion path is used by
  dependency/configuration glob matching, not by the generated HTML string.

Current practical exploitability through the form builder is therefore not established, but the dependency is in
the production bundle dependency graph and the mandatory audit is correctly fail-closed. The patch is available,
so no exception or allowlist is justified.

## Candidate analysis

- Direct parent `js-beautify` has no newer compatible 1.x release; latest `2.0.3` is a major upgrade. Upgrading it
  would add unrelated formatter API/regression risk and still would not address the independent
  `unplugin-auto-import` path by itself.
- `unplugin-auto-import` latest is `21.0.0`, a broad major upgrade from `0.18.6`; it is not needed.
- Existing `minimatch@9.0.9` declares `brace-expansion:^2.0.2`, which already admits patched `2.1.2`.
- `brace-expansion@2.1.1` and `2.1.2` both expose `main:index.js`, depend only on
  `balanced-match:^1.0.0`, and declare no restrictive Node engine; their existing parents support Node 14+
  or Node 16+, so Node 20 remains supported.
- `npm diff --diff=brace-expansion@2.1.1 --diff=brace-expansion@2.1.2` shows the 2.x security patch defers
  expansion of `post` until needed and replaces recursive rewrite restart with a loop. The package keeps the
  existing CommonJS entry and public expansion behavior for normal inputs.

Selected strategy: normal npm resolution of the already-compatible transitive security patch
`brace-expansion@2.1.2`. No parent major upgrade and no override are needed.
