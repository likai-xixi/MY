# Decision

Decision: Allow Implementation

Reason: The five-role review approves only the smallest compatible immutable dependency-security slice: use normal npm resolution to replace vulnerable immutable 5.1.6 with a safe 5.x release accepted by the existing `sass-embedded@1.97.2` range, and extend focused dependency regression coverage. No package.json, parent dependency, override, workflow, business runtime, R-12A review/behavior, phase-gate, R-12B, push, or post-push change is authorized.

Approved edit roots:

- `ruoyi-ui/package-lock.json`
- `tests/frontend-dependency-hardening.test.js`
- `ai/changes/CR-20260721T221950Z-ci-fix-01-immutable-dependency-advisories-remedi`
- `ai/reviews/RV-20260721T222047Z-ci-fix-01-immutable-dependency-advisorie`
- current platform context and memory/handover files listed in the active impact record

Release condition: this review must be committed as the immutable implementation base. Complete local verification permits one local implementation commit only; push and remote CI remain separately authorization-gated.
