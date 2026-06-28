# Request

R-09 configurable modeling contract package.

User intent:

- Do not write sales-order runtime.
- Do not write process/material/formula/drawing runtime.
- Define configurable product, material, sales option, field library, field scheme, formula, rule, technical decomposition, part template, snapshot, permission, migration, and contract-test boundaries.
- Prevent future Codex work from hard-coding `门`, `门匾`, `栅栏`, `单开`, `对开`, `玻璃拼接`, `整拼`, `铝卡`, `型材`, `拉手`, `锁具`, or `铰链` as fixed code models.

Reconcile closeout:

- Treat `origin/master` contract filenames as the source of truth: `masterdata.*`, `rule.*`, and `tech.*`.
- Keep the f959 `r09-*` commit only as a backup/reference for missing clauses.
- Do not create `r09-*` files, merge two contract sets, force push, enter R-10, or create runtime artifacts.
