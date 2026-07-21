# Masterdata Delete Ownership Contract

Feature ID: `masterdata`

## Runtime Delete Behavior

R-10B remove APIs use logical delete by setting `del_flag = '2'`.

Deletion locks every target row first, in deterministic resource/id order, and then rejects the operation when any active (`del_flag = '0'`) owned reference exists. Disabled references still block deletion; only logically deleted references stop blocking. Batch deletion removes nulls and duplicates, sorts IDs, and does not bypass reference protection when both parent and child are selected.

The blocking matrix is:

- product category -> child product category (`parent_id`)
- product category -> product series (`category_id`)
- product category -> product model (`category_id`)
- product series -> product model (`series_id`)
- material category -> material item (`category_id`)
- accessory category -> accessory item (`category_id`)
- option set -> option value (`option_set_id`)

Create and update lock every referenced parent before writing. This serializes child writes with parent deletion: if deletion wins, the child write sees a deleted parent and fails; if the child write wins, deletion sees the committed active reference and fails.

Product-category hierarchy writes additionally lock the permanent hidden `category_id = -1` mutex row and then the complete active category tree before validation. The fixed row makes the empty-tree first create serializable; the tree lock prevents two disjoint later moves from jointly creating a fourth level. Descendant traversal tracks visited ids and rejects a pre-existing cycle instead of looping while holding those locks. Product-series category changes are rejected while an active product model references the series, preserving the model-category/series-category equality invariant.

## Future Reference Protection

When later orders, technical results, inventory, BOM, production, drawing, shipment, finance, or receipt data reference master data, physical deletion remains forbidden. Those downstream records must preserve code/name snapshots and must not depend only on mutable ids.

## Feature Removal Preconditions

A future feature removal must run deletion dry-run first and account for:

- backend controller, service, domain, mapper, and XML files
- frontend page and API client
- nine database tables, including `masterdata_option_set` and `masterdata_option_value`
- SQL migrations and validation SQL
- RuoYi menu and permission rows
- feature/module registries
- API/UI/module graphs
- generated scans
- memory and handover files
