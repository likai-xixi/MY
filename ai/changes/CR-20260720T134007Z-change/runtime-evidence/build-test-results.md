# R-12A Build And Test Results

- [local] `node --test tests/masterdata-runtime.test.js`: 39/39 passed after the final form-render regression assertion.
- [local] Maven reactor unit verification: 65/65 passed, including 28/28 `MasterDataServiceTest` cases.
- [runtime-local] Maven `integration-test` profile: 2/2 MySQL 8.0.36 Testcontainers tests passed, including `MasterDataReferenceMySqlIT` and the unchanged customer-fund integration test.
- [local] Maven eight-module `ruoyi-admin` package: `BUILD SUCCESS`.
- [local] `npm run build` in `ruoyi-ui`: UI tests 7/7 passed; Vite transformed 2602 modules and completed the production build.
- [local] `npm run scan:all`: backend routes, frontend routes, API clients, database, permissions, components, and ownership scans passed.

The database scanner is lexical over migration history, so `ai/generated/db-schema.json` can retain historical CREATE tokens from V005/V006 even though live MySQL and the executable validation prove that the old tables are absent. R-12A did not alter the scanner because governance-rule changes are forbidden in this business batch.
