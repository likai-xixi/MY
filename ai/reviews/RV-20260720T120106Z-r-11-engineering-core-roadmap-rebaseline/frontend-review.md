# Frontend Review

## Current Findings

- Four grouped routes reuse one 899-line generic CRUD page.
- Product configuration labels `product-model` as `工艺型号`.
- The sales-option page exposes category/value rather than reusable option-set semantics.
- The shared form is driven by a union resource configuration and cannot express draft/publish/version/release lifecycles without becoming a conditional mega-page.

## Target Information Architecture

- Product catalog: category, series, and product model.
- Option catalog: option set, values, cardinality, applicability, and status.
- Field catalog: field definitions, ownership badges, schemes, version comparison, and publish history.
- Process plans: plan identity, version comparison, product applicability, referenced scheme versions, and explicit publish action.
- Technical/release workspaces are future workflow screens, not tabs added to masterdata CRUD.

## UX Rules

- Always show `产品型号`; never relabel product model as process/craft/modeling terminology.
- Display field owner visibly as `SALES`, `TECH`, or `SYSTEM`; sales screens filter by ownership instead of relabeling technical fields.
- Option sets are reusable customer-choice sources. Technical derived values are read-only technical fields, not option values.
- Published versions are read-only. Changes start from `Create new draft version`; publish and release actions require confirmation and show the source version/hash.
- Decomposition UI renders a node tree/graph and dynamic attributes. It must not assume fixed main/sub-leaf or segment columns.

## Migration UX

- Remove old product/sales-option route semantics during the same breaking cutover; do not keep hidden aliases.
- Provide a pre-cutover export/report for ambiguous `product-model` rows and option categories.
- Replace the shared generic page gradually by bounded pages in later runtime CRs, but never mix old and new write paths.

## Frontend Decision

Approve the target UX contract. R-11 creates no Vue page, router, API client, menu, permission, screenshot, or browser acceptance claim.
