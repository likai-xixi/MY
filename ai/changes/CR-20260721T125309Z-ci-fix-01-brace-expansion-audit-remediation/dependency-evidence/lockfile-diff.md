# Lockfile Diff

`ruoyi-ui/package.json` has no diff.

`ruoyi-ui/package-lock.json` was changed only by normal npm package resolution:

- `node_modules/brace-expansion.version`: `2.1.1` -> `2.1.2`.
- Added the registry URL and SHA-512 integrity for `brace-expansion@2.1.2`.
- Added the registry URL and SHA-512 integrity for the unchanged direct dependency `js-beautify@1.15.4` while re-resolving that exact parent version.

No direct dependency, override, resolution, parent version, package-manager, audit threshold, or CI workflow changed. The installed dependency count remained 283 audited packages.

The resulting parents remain:

- `js-beautify@1.15.4`.
- `editorconfig@1.0.7`.
- `glob@10.5.0`.
- `minimatch@9.0.9`.
- `unplugin-auto-import@0.18.6`.

The only dependency version change is the patched `brace-expansion@2.1.2` node.
