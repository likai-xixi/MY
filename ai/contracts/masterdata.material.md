# Masterdata Material Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

Materials, accessories, and component references must be configurable master data used later by sales configuration, technical decomposition, part calculation, and production.

## Hard Rules

- `拉手`, `锁具`, `铰链`, `玻璃`, `门面材料`, `门框材料`, `型材`, `板材`, and packaging materials are configurable data examples.
- These names must not become fixed Java/Vue/SQL branches.
- Future technical part templates must reference material records by stable code and snapshot label.

## Future Conceptual Fields

- material/accessory category
- stable code
- display name
- specification label
- unit
- enabled status
- remark

## Non-goals In R-09

No inventory deduction, BOM runtime, stock table, production route, or material runtime page is created.

## Snapshot Rule

Future technical results must snapshot material code, name, specification label, and unit.
