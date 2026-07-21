# Frontend Review

`ruoyi-ui/src/views/tool/build/index.vue` genuinely imports `js-beautify` and formats generated Vue source. The dynamic `import.meta.glob('./../../views/**/*.vue')` router includes this page in the production bundle, and the menu uses `tool/build/index`.

Ordinary authorized form-builder input reaches `beautifier.html`, but no project code passes that input to `brace-expansion`, `minimatch`, or glob patterns. Practical exploitation through the page is not established; removal of `js-beautify` is nevertheless invalid because it is used and would not remove the separate `unplugin-auto-import` path.

Approved frontend changes are only `ruoyi-ui/package-lock.json` and the existing platform-owned dependency hardening test. The test must reject every affected GHSA range and pin the expected current 2.x patch. UI 7/7 and `build:prod` are required.
