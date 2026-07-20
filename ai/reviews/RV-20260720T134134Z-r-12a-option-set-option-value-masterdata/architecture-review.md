# Architecture Review

## Decision

Architecture recommends conditional `Allow Implementation`. Business implementation is still NO-GO until the approved review exists in a user-authorized committed base revision and the implementation change binds this review id.

## Context Boundaries

- Product catalog owns `product-category`, `product-series`, and `product-model`; product-model is a sellable/configurable product identity only.
- Option catalog owns reusable `option-set` and `option-value` value domains only.
- Material and accessory catalogs remain unchanged.
- Field definitions/schemas, process plans/versions, applicability bindings, calculation/release, sales-order, production, formula, DXF, and customer-fund runtime remain forbidden.

## Generic CRUD Decision

The existing `/business/masterdata/{resource}` Controller/Service/Mapper family may remain as catalog CRUD infrastructure because table and column identifiers come only from the `MasterDataResource` enum allowlist.

Conditions:

- Allow exactly the seven retained product/material/accessory keys plus `option-set` and `option-value`.
- Reject both old sales-option keys; no alias, redirect, compatibility DTO, fallback reader, or dual write.
- Use explicit `selectionMode` and `optionSetId`; reusing `categoryId` for option ownership is forbidden.
- Never add field/process versioning, publish/approve, calculation, release, supersede, or revoke behavior to generic CRUD.
- Reconcile the current R-11 plan text that forecast retirement of the generic route with this narrower approved R-12A runtime decision.

## Exact Cutover

| Surface | Current | Target |
| --- | --- | --- |
| Resource | `sales-option-category` | `option-set` |
| Resource | `sales-option-value` | `option-value` |
| Table | `masterdata_sales_option_category` | `masterdata_option_set` |
| Table | `masterdata_sales_option_value` | `masterdata_option_value` |
| Relation | `category_id` | `option_set_id` |
| UI path | `/masterdata/sales-option-config` | `/masterdata/option-config` |
| Component | `masterdata/sales-option-config` | `masterdata/option-config` |
| Route name | `MasterdataSalesOptionConfig` | `MasterdataOptionConfig` |
| Labels | 销售选项分类 / 销售选项值 | 选项集 / 选项值 |
| Product label | 工艺型号 | 产品型号 |

Keep generic permission codes because they contain no sales-option vocabulary. `business:masterdata:publish` stays reserved and has no R-12A action. Update the existing option menu row in place where possible to preserve role-menu assignments, while proving no old name/path/component/route/remark survives.

## Option Invariants

- `selectionMode` is mandatory and restricted to `SINGLE | MULTIPLE`; no bounded-count or ownership fields.
- Deterministic Strategy A maps all four old categories to `SINGLE` explicitly because the source has no cardinality field.
- Every value has a non-null `optionSetId` pointing to an existing, non-deleted set.
- Option-set deletion locks the target and rejects every non-deleted child, including disabled values.
- Value create/update locks its set so parent delete cannot race into an orphan.
- Disabling a set does not cascade or rewrite child status. New-business option endpoints must omit values whose set is disabled.
- Codes remain backend-generated and immutable. New prefixes are `OS` and `OV`; preserved legacy row codes are data, not aliases.
- Deterministic ordering is `sortOrder` then stable id/code.

## Migration And Rollback

Use Strategy A in one offline window:

1. Stop writers and record the code SHA.
2. Record the live inventory: four old sets, two old values, two product-model rows.
3. Classify both product-model rows as development product identities, not process plans; one is deleted R-10C evidence and one active row is named `测试`.
4. Take a checksum-backed complete database backup including menus and role relations.
5. Create and populate target tables, preserving ids, fields, audit data, status, and logical-delete state.
6. Apply the explicit `SINGLE` transform to all four migrated sets.
7. Reconcile `4 -> 4`, `2 -> 2`, and field equality before dropping child then parent old tables.
8. Cut Java/API/UI/menu to the new keys in the same offline window and start only the new path.

MySQL DDL auto-commits. Rollback restores the entire backup and the matching prior code; partial table rollback or mixed versions are forbidden.

Historical V005/V006 migrations are immutable evidence. R-12A adds V007 and registers it.

## Regression And Scope Conditions

- Preserve category mutex/tree locking, depth/cycle checks, series/model reference locks, deterministic resource/id lock ordering, logical delete, and exact affected-row checks.
- Adding/reordering enum values can change ordinal lock order; tests must prove the final order is safe.
- Real MySQL must test value-create/set-delete concurrency.
- Tests must stop treating the old nine-resource vocabulary as permanent; assert the explicit current allowlist and old-key absence.
- Keep broad implementation out of customer, field/process, order, calculation, production, and DXF roots.
- `engineeringCoreReady` and `beforeSalesOrder` remain blocked.

## Go Conditions

- User-authorized review-only commit, refreshed implementation base, bound review id, and passing review check.
- Focused unit/MySQL tests, migration/validation with exact counts, Maven compile/tests, Vue build, API and browser acceptance, old-surface negative checks, rollback drill, reverse audit, scans, full check, close and diff gates.

Final architecture verdict: the design is viable, but runtime remains NO-GO until the committed-review base requirement is satisfied.
