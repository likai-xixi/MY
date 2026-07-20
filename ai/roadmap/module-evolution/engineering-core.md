# Engineering Core Module Evolution

## Current Role

R-11 defines architecture and governance only. The current R-10 masterdata runtime remains as-is and is not engineering-core-ready.

## Runtime Slices

| Slice | Outcome | Excludes |
| --- | --- | --- |
| R-12A | Destructive catalog/option migration | Field/process/calculation/release runtime |
| R-12B | Field definitions, ownership, schemes/versions | Formula engine |
| R-12C | Process plans/versions and product applicability | Production route |
| R-12D | Canonical calculation I/O, snapshots, golden runner | DXF generator |
| R-12E | Technical and production release artifact boundaries | Production execution |

## Completion Gate

`engineering-core-ready` becomes complete only when all `engineeringCoreReady.required` backlog items are complete and both signed golden samples pass.

## Stable Extension Points

- Formula engines implement calculation adapters.
- DXF engines consume released geometry requests.
- Neither extension changes `OrderVersion`, `TechnicalVersion`, or product model schemas.
