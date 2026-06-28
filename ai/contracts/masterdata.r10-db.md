# Masterdata R-10 Database Contract

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. R-10A creates no SQL file and no database table.

## Purpose

R-10B must provide an executable MySQL migration for the minimum master-data tables while keeping all example business concepts as configurable rows.

## Future Table Groups

The R-10B MySQL migration may use these conceptual table groups:

- product category
- product series
- product model
- material category
- material record
- accessory category
- accessory record
- sales option category
- sales option value

The exact table names are deferred to R-10B, but names must be stable, lower-case, and owned by the masterdata feature/runtime change. R-10B must not create separate tables for `庭院门`, `入户门`, `玻璃拼接门`, `整拼门`, `铝卡门`, `型材门`, `单开`, `对开`, `子母`, `颜色`, `拉手`, `锁具`, `铰链`, `玻璃`, `表面处理`, `包装方式`, or `材料体系`.

## Required Columns

Every MVP table must include or derive:

- stable code
- display name
- status
- sort order
- remark
- created/updated audit fields compatible with the RuoYi profile

Category-like tables must include parent/hierarchy data where hierarchy is needed. Record-like tables may include category code/id, specification label, unit, and linkage fields, but R-10B must document each field in the DB contract and ownership file.

## Reference And Delete Rules

- Codes must be unique within their resource scope.
- R-10B must define a reference-check strategy before remove is implemented.
- Already referenced master data cannot be physically deleted; it can only be disabled, archived, or unpublished.
- R-10B must leave future order and technical-result snapshot requirements visible even if those downstream tables do not exist yet.

## Migration Requirement

R-10B must create a real executable MySQL migration and validation SQL or equivalent MySQL verification evidence. R-10A does not create SQL migration, validation SQL, migration registry entries, or DB scan output.

## Future Ownership Requirement

When R-10B creates database objects it must update, in the same change:

- SQL migration ownership
- migration registry if the active high-risk gate requires it
- DB generated scan
- feature registry DB ownership
- contract-test matrix
- rollback and seed-data notes
