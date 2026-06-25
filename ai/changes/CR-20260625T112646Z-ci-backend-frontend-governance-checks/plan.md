# Plan

## Scope

Governance/CI rule-change only. Do not edit customer runtime code, sales-order implementation paths, or business database schema.

## Steps

1. Replace the single Node-only GitHub Actions job with three real jobs:
   - `governance`: checkout, setup Java 17 for `check:runtime`, setup Node 20, root `npm install --package-lock=false`, `npm run check`.
   - `backend-compile`: checkout, setup Java 17 with Maven cache, `mvn -pl ruoyi-admin -am -DskipTests compile`.
   - `frontend-build`: checkout, setup Node 20, `npm --prefix ruoyi-ui install --package-lock=false`, `npm --prefix ruoyi-ui run build:prod`.
2. Update CI coverage declaration parsing so it recognizes only real workflow `run:` commands for Node governance, Maven compile, and ruoyi-ui production build.
3. Update verification provenance parsing so `[ci-planned]` is accepted as future CI execution intent but not as passed CI evidence.
4. Add governance tests for real command coverage, working-directory frontend build coverage, echo-only false positives, local-only Maven evidence, and `[ci-planned]`.
5. Update README, current context, project memory, task state, changelog, session note, and CR verification/handover with local evidence and CI-planned wording.
6. Run the required local verification ladder and forbidden-path audit before reporting.
