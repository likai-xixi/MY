# Masterdata Sales Option Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

Sales options define user-selectable values for future order entry.

## Hard Rules

- `单开`, `对开`, `子母`, `连体子母`, `颜色`, `拉手`, `锁具`, `铰链`, `玻璃`, `表面处理`, `包装方式`, and `材料体系` are configurable option data.
- Future order pages must not hard-code these values.
- Option values must be reusable across products, processes, and field schemes.

## Future Conceptual Fields

- option category code/name
- option value code/name
- binding to material/accessory when needed
- status
- sort order
- condition expression reference

## Snapshot Rule

Future orders must snapshot selected option code and display label.
