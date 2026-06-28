# Masterdata R-10 UI Contract

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. R-10A creates no Vue page, route, API client, component, menu, permission check, UI graph entry, or browser test.

## Purpose

R-10B UI must provide maintenance screens for the nine MVP master-data objects while avoiding hard-coded product-family workflows.

## Future UI Scope

R-10B may group screens by business ergonomics, but the UI must cover only:

- product category
- product series
- product model
- material category
- material record
- accessory category
- accessory record
- sales option category
- sales option value

Acceptable grouping examples:

- one master-data module with tabs for product, material, accessory, and sales options
- separate list pages for product, material/accessory, and sales options
- tree/list layout for category and series/model relationships

## Required UI Capabilities

Each resource must support the adapter-equivalent of:

- list/search/view
- add
- edit
- status change
- remove with reference-protection message
- export when the permission contract enables export
- publish or a visibly preserved publish boundary

## UI Field Rules

- Forms must expose stable code, display name, status, sort order, and remark.
- Product and option examples must be data rows, not conditional rendering branches.
- The UI must not contain fixed arrays for `单开`, `对开`, `子母`, `连体子母`, `颜色`, `拉手`, `锁具`, `铰链`, `玻璃`, `表面处理`, `包装方式`, or `材料体系`.
- The UI must not create field-scheme, formula, technical-template, inventory, BOM, production, drawing, sales-order, shipment, finance, or receipt flows.

## Future Ownership Requirement

When R-10B creates UI runtime it must update, in the same change:

- UI graph
- generated frontend route scan
- API client scan
- feature registry UI/frontend ownership
- permission scan
- component catalog if shared components are created
- browser or UI smoke evidence if runtime behavior is in scope

R-10A records this UI contract only.
