# QA Review

## R-11 Verification

- Phase-gate regression must fail before `engineering-core-ready` is added and pass after the checker, gate, backlog, and rule object agree.
- Contract audit must verify every requested object, ownership enum, calculation input/output section, version/release artifact, and destructive migration surface.
- Negative audit must prove no changed Java, Vue, SQL, API client, route, permission, graph, package, workflow, formula runtime, DXF runtime, sales-order runtime, or production runtime file.
- Review package must contain `Decision: Allow Implementation` scoped only to governance/contracts; runtime remains unapproved.
- `npm run finalize:change`, `npm run check`, `npm run close:change`, and `git diff --check` must pass.

## Golden Sample Acceptance Plan

- `GS-9CM-SINGLE-001`: one `PM-DOOR-9CM` product model with the standard single-open process-plan version.
- `GS-9CM-DOUBLE-GRID-SPLICE-001`: the same product model with the double-open/grid-splice process-plan version.
- Each future executable fixture must freeze calculation input, expected decomposition output, expected trace/diagnostics, and expected release metadata.
- Business-approved dimensions, material selections, quantities, tolerances, and expected numerical results are still required; R-11 must mark them `[not-run]`/pending rather than invent them.

## Reverse Review Checklist

- Product model is not a process plan.
- Sales option is not a technical field container.
- Generic CRUD does not own published versions or releases.
- Main leaf, secondary leaf, and segments are not fixed columns.
- Formula and DXF adapters can be added without changing order or technical-version contracts.

## Release Assessment

R-11 may be locally governance-ready after all checks pass. It is not business-runtime-ready, production-ready, or release-ready. `engineering-core-ready` and `beforeSalesOrder` remain blocked after this batch.
