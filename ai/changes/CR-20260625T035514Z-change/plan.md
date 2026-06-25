# Plan

Mode: `update`
Feature: `customer`

1. Keep this batch governance/handoff-only.
2. Update README, feature brief, customer ownership registry, current context, memory, changelog, task state, and handover together.
3. Register `tests/customer-risk-gate.test.js` under customer feature ownership without changing test assertions.
4. Run `npm run scan:all`, `npm run finalize:change -- --summary "客户管理交接状态收口"`, `npm run check`, `npm test`, and `git diff --check`.
5. Audit the diff to prove no Java, XML, Vue, API client, SQL, customer fund logic, or sales-order implementation files changed.

## Summary

客户管理交接状态收口.
