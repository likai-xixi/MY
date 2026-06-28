# Masterdata Product Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only. This CR creates no runtime code, SQL migration, sales-order artifact, customer runtime change, idempotency runtime change, security config change, package script change, or tool change.

## Purpose

Product identity must be configurable. The system is not a fixed door-only ERP.

## Hard Rules

- Product category, product series, and product model are user-maintained master data.
- Product category, product series, and product model are all configured by users. They must not be represented by one Java class, Java enum, Vue fixed branch, SQL table, or scanner rule per product family.
- `门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, and `工程定制` are sample configurable data, not fixed system models.
- `庭院门`, `入户门`, `玻璃拼接门`, `整拼门`, `铝卡门`, and `型材门` are sample series/model data, not hard-coded enum branches.
- Preset categories, series, and models may be delivered later as seed/configuration data, but they remain editable configuration data rather than compiled product models.
- Future order entry and technical review must read product definitions from configuration.

## Future Conceptual Fields

- stable code
- display name
- hierarchy parent
- category / series / model level
- status
- sort order
- remark

## Snapshot Rule

Future orders and technical results must preserve product category, series, and model code/name snapshots so history does not change when master data is renamed.
