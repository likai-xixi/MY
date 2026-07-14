# Decision

Decision: Allow Implementation

Reason: The dependency findings, icon inventory, cache lifecycle failure modes, clean-CI dependency boundary, and scanner behavior have concrete invariants and executable verification. The implementation is approved only for the bounded platform frontend roots in `review.json`.

Constraints:

- Preserve all 90 icon identities and the existing backend/API/route/permission contracts.
- Keep helper modules out of generated route and UI graph output.
- Do not add a compatibility layer for the removed SVG virtual module.
- Do not edit governance rules, scanners, CI workflows, backend, SQL, or business modules in this change.
- Keep release, deployment, stash restoration, force push, and sales-order runtime out of scope.
- Stop if moderate audit is nonzero, the production sprite differs from the 90-icon contract, browser acceptance fails, or any repository gate fails.

Required evidence:

- Focused red/green behavior tests.
- Zero-vulnerability dependency audit and exact dependency tree.
- Full UI suite in the production-build lifecycle.
- Production sprite and browser acceptance evidence.
- Scanner stability, full repository check, closeout evidence, and independent staged review.
