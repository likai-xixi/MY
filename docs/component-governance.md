# Component Governance

The scaffold prevents Codex from scattering duplicate UI controls across feature modules.

## Shared catalog

Generic projects use:

```text
frontend/src/components/catalog.json
```

RuoYi projects use:

```text
ruoyi-ui/src/components/catalog.json
```

Each shared component entry must include ID, name, export/path, owner, purpose, category, status, and usage list.

## Feature-local components

Feature-local components are allowed only when they are specific to that feature and not reusable controls. Generic names such as `Button`, `Table`, `Form`, `Modal`, `Dialog`, `Select`, `Upload`, `Pagination`, and `Toolbar` are blocked inside feature module component folders.

## Verification

Run:

```bash
npm run check:components
npm run check:component-similarity
```

The first command validates catalog coverage. The second command detects likely duplicate shared component names and descriptions.
