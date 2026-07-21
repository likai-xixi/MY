# Request

Execute independent governance/dependency-security batch `CI-FIX-01` from base revision
`58478e509d69eb212d5808463b7efeea47bee64e`.

Reproduce and record the real `brace-expansion` advisory and dependency chain, inspect
the actual `js-beautify` usage/attack path, choose the smallest compatible upstream
dependency repair, and restore the blocking frontend audit without weakening CI.

The batch may change only the frontend dependency manifests/lockfile, focused dependency
regression coverage, this change record and dependency evidence, and generated context or
memory handoff required by repository governance. It must not change R-12A option-set/value
behavior, Java business code, migration V007, any later business module, either phase-gate
state, the R-12A review package, or begin R-12B.

Create a local commit after all local verification passes. Push is not authorized by this
request; stop at the local commit and wait for explicit push authorization before remote CI
or post-push handover work.
