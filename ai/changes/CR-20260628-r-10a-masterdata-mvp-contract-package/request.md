# Request

Open R-10A: product/material/accessory/sales-option master-data MVP contract and pre-review package.

## User Boundary

- Contract and pre-review only.
- No runtime implementation.
- Create R-10A masterdata contracts and change record.
- Keep `beforeSalesOrder` blocked.
- Do not create sales-order runtime.
- Do not create Java, Vue, API client, SQL migration, SQL validation, package, tool, workflow, or production configuration changes.

## Intake Confirmed

- Read `AGENTS.md`.
- Read `ai/context/current-context.md`.
- Read `memory/HANDOVER.md`.
- Read the R-09 masterdata contracts listed by the user.
- Ran `npm run resume`.
- Ran `git status --short --branch`.
- Fetched `origin/master` and confirmed `HEAD` equals `origin/master`.
- Confirmed `beforeSalesOrder.status` is `blocked`.
- Confirmed this change is R-10A contract/pre-review, not R-10B runtime implementation.
