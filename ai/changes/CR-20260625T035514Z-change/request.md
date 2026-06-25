# Request

功能迭代：客户管理

Scope: first-batch customer handoff status closeout.

Goal: reconcile GitHub master state, customer feature brief, README, current context, memory handover/project state, changelog, task memory, and customer feature ownership after `d103b0d fix(customer): restrict deposit endpoint to customer deposit`.

Non-goals:

- Do not modify customer runtime Java, XML, Vue, API client, SQL, or customer fund business logic.
- Do not create sales-order Java, XML, Vue, API, SQL, permission, menu, or documentation implementation files.
- Do not change `tests/customer-risk-gate.test.js` assertion logic; only register its feature ownership.
