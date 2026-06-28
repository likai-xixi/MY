# Request

Execute R-10D: masterdata code autogeneration and backend business code-generator closeout.

## Scope

- Masterdata only.
- Add backend-generated codes for the nine approved masterdata resources.
- The add dialog must not require or accept user-entered code.
- The edit dialog must display code as read-only.
- Direct API add must ignore caller-supplied code and generate code on the backend.
- Edit must not allow code mutation; payload code changes are ignored or rejected with test coverage.
- Do not add masterdata tables and prefer no SQL schema change.

## Code Format

`prefix + yyyyMM + 6 digit monthly sequence`

Resource prefixes:

- `product-category`: `PC`
- `product-series`: `PS`
- `product-model`: `PM`
- `material-category`: `MC`
- `material-item`: `MI`
- `accessory-category`: `AC`
- `accessory-item`: `AI`
- `sales-option-category`: `SOC`
- `sales-option-value`: `SOV`

## Hard Boundaries

- Do not create sales-order runtime.
- Do not create field-scheme runtime.
- Do not create formula runtime.
- Do not create technical-decomposition runtime.
- Do not create inventory, BOM, production, scan, drawing, shipment, finance, or receipt runtime.
- Do not modify customer runtime; customer code generation may be read as reference only.
- Do not modify idempotency runtime.
- Do not modify security configuration.
- Do not modify package.json, tools, workflow, or GitHub Actions.
- Do not force push.

## Intake Evidence

- [local] `npm run resume` passed before R-10D edits.
- [local] `git status --short --branch` returned a clean `master...origin/master` state before R-10D edits.
- [local] Plain `git fetch origin master` failed with a local HTTPS reset; one-shot proxy bypass fetch passed.
- [local] `git rev-parse HEAD origin/master FETCH_HEAD` confirmed all three refs at `bd8bbb92f640b1a04ac58cb5a52bab78eaef362c`.
- [local] `ai/roadmap/phase-gates.json` records `beforeSalesOrder.status` as `blocked`.
- [local] `npm run check:phase-gate` passed.
