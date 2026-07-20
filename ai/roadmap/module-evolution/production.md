# Production Module Evolution

## Current Role

Production is not implemented.

## Dependency

Production execution depends on:

- approved order and technical version boundaries
- immutable calculation snapshots
- a released technical package
- a production release version
- production routing/dispatch policy

## Guard

- Production cannot read mutable order drafts or current masterdata as manufacturing truth.
- Production-specific routing/dispatch data belongs to `ProductionReleaseVersion` or later production artifacts.
- A change in engineering meaning requires a new technical version/package before a new production release.
- Main leaf, secondary leaf, grid, splice, and segment remain decomposition-node data, not production header columns.
- R-11 creates no production runtime.
