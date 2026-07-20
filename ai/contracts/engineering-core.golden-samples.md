# Engineering Core Golden Samples

Change: `R-11 engineering-core roadmap rebaseline`
Status: scenario registry only; executable fixtures and numerical approval pending.

## Shared Product Identity

Both first-wave samples use one product model identity:

- Product model code: `PM-DOOR-9CM`
- Display name: `9CM 产品型号`

They intentionally use different process-plan versions. This is the first proof that product model and process plan are not the same object.

## GS-9CM-SINGLE-001

Display name: `9CM 标准单开`

- Product: `PM-DOOR-9CM`
- Process plan: `PP-9CM-STANDARD-SINGLE`
- Sales-option intent includes a single-opening value from the approved opening-mode option set.
- Expected decomposition must contain a generic root assembly and at least one leaf node whose role is data, not a fixed field.
- Expected calculation/release evidence must trace every generated node and measurement to the frozen input and process-plan version.

## GS-9CM-DOUBLE-GRID-SPLICE-001

Display name: `9CM 对开/分格拼接`

- Product: `PM-DOOR-9CM`
- Process plan: `PP-9CM-DOUBLE-GRID-SPLICE`
- Sales-option intent includes double-opening and customer-selectable grid/splice intent only where the option is genuinely sales-owned.
- Technical grid count, segment dimensions, allowances, and generated node structure are `TECH` outputs/fields.
- Expected decomposition contains parent-child nodes for the two-leaf and grid/splice structure; no database column is named for a main leaf, secondary leaf, or segment position.

## Required Fixture Topology

Each sample must later provide an immutable fixture directory containing:

- `calculation-input.json`
- `expected-decomposition-output.json`
- `expected-diagnostics.json`
- `expected-release-manifest.json`
- `business-signoff.md`

The fixture manifests must record schema versions, process-plan version/hash, field-scheme versions, option snapshots, expected hash policy, signer, and approval date.

## Acceptance Rules

- Same product-model code across both samples.
- Different process-plan code/version across samples.
- All fields retain `SALES`, `TECH`, or `SYSTEM` ownership.
- Option values cover selectable intent only; technical calculated values are not option values.
- Decomposition compares ordered/canonical nodes and keyed measurements, not fixed product columns.
- Formula adapter changes may alter engine metadata only when canonical expected results remain approved or a new fixture version is signed.
- DXF acceptance is separate and consumes geometry requests from a released package; it is not required for the first calculation golden pass.

## Pending Business Evidence

Exact dimensions, materials, hardware, tolerances, quantities, calculation results, and drawing expectations have not been supplied in R-11. They must not be invented. Until `business-signoff.md` exists for both samples and the future runner passes, `golden-sample-baseline` and `engineering-core-ready` remain incomplete.
