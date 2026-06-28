# Masterdata Sales Option Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

Sales options define user-selectable values for future order entry.

## Hard Rules

- `单开`, `对开`, `子母`, `连体子母`, `颜色`, `拉手`, `锁具`, `铰链`, `玻璃`, `表面处理`, `包装方式`, and `材料体系` are configurable option data.
- `玻璃拼接`, `整拼`, `铝卡`, `型材`, `庭院门`, `入户门`, `发光字`, `铁艺栅栏`, and `钣金折弯` may appear as option or process-related configuration data depending on the future scheme.
- Future order pages must not hard-code these values.
- These values must not be encoded as Java enums, Vue fixed option arrays, SQL fixed business models, product-specific routes, or scanner exceptions.
- Option values must be reusable across products, processes, and field schemes.
- A product model or field scheme may restrict which option values are selectable, but that restriction must be data-driven.

## Future Conceptual Fields

- option category code/name
- option value code/name
- binding to material/accessory when needed
- status
- sort order
- condition expression reference

## Snapshot Rule

Future orders must snapshot selected option code and display label.
