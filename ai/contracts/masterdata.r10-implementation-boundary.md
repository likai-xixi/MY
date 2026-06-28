# Masterdata R-10 Implementation Boundary

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only.

## R-10A Boundary

R-10A may create only:

- `ai/contracts/masterdata.r10-*.md`
- `ai/changes/CR-20260628-r-10a-masterdata-mvp-contract-package/*`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`

R-10A must not create Java, Vue, API client, mapper XML, SQL migration, SQL validation, permission SQL, menu SQL, package script, tool, workflow, runtime test, or production configuration changes.

## R-10B Allowed Runtime Slice

After R-10A is accepted, R-10B may open a separate runtime change for only:

- product category maintenance
- product series maintenance
- product model maintenance
- material category maintenance
- material record maintenance
- accessory category maintenance
- accessory record maintenance
- sales option category maintenance
- sales option value maintenance

## R-10B Explicit Exclusions

R-10B must not implement:

- field schemes
- option schemas beyond simple sales option category/value maintenance
- formula variables
- formula groups
- process calculation rules
- sales configuration process engine
- glass rules
- offset rules
- technical decomposition templates
- part templates
- sales order
- inventory deduction
- BOM
- production route
- scanning/reporting
- drawing tasks
- shipment
- finance
- receipt/reconciliation

## Sales-order Gate

`beforeSalesOrder` remains blocked during R-10A. R-10B master-data runtime does not unblock sales-order implementation by itself. Sales-order runtime still requires its own contracts, review decision, gate evidence, and allowed edit roots.

## Ownership Boundary

R-10B must synchronize API/UI/SQL/permission/test ownership in the same runtime change that creates those artifacts. R-10A records that obligation but does not create runtime ownership entries for artifacts that do not yet exist.

## R-10B Runtime Ownership

`CR-20260628-r-10b-masterdata-mvp-runtime` implements runtime only under the `masterdata` feature roots, with executable SQL migrations, controller/service/mapper/domain code, a Vue page, an API client, feature/module registry entries, generated scans, graphs, memory, and `tests/masterdata-runtime.test.js`.

## R-10D Code Generation Boundary

`CR-20260628-r-10d-masterdata-code-autogeneration` keeps the same nine-resource runtime slice and adds only one business-common helper root: `ruoyi-business/src/main/java/com/ruoyi/business/common/code`. This helper is a business numbering rule and must not move to `ruoyi-common`.

R-10D must not refactor customer code generation. `CustomerServiceImpl` may be read for reference only.

## R-10F Product Category Tree Boundary

`CR-20260628-r-10f-product-category-tree-table` keeps the same nine-resource runtime slice and changes only product-category hierarchy behavior inside masterdata. It may update the masterdata service, mapper contract if required, the masterdata Vue page/API client if required, focused masterdata tests, masterdata contracts, generated scans, graphs, current context, and memory.

R-10F must not modify product series, product model, material, accessory, sales option runtime behavior except where shared masterdata tests or generated scans reflect unchanged ownership. It must not create R-11, sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan, drawing, shipment, finance, or receipt runtime.
