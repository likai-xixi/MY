# Rule Change Preflight

Current change: `CR-20260627T120650Z-r-09a-1-governance-false-green-hardening`
Status: `ok`

## Checker

Blocking issues: 0
- none

## Warnings

- none

## Gate State

beforeSalesOrder: `blocked`

Required items:
- `multi-role-review`
- `current-context`
- `doc-size`
- `read-budget`
- `context-pack`
- `file-weight`
- `roadmap-check`
- `phase-gate-check`
- `refactor-debt-check`
- `snapshot-contract`
- `state-machine-contract`
- `fund-boundary-contract`

Incomplete items:
- `multi-role-review`
- `current-context`
- `doc-size`
- `read-budget`
- `context-pack`
- `file-weight`
- `roadmap-check`
- `phase-gate-check`
- `refactor-debt-check`
- `snapshot-contract`
- `state-machine-contract`
- `fund-boundary-contract`

## Rule Objects

### customer-fund-deposit-entry

- Name: Customer fund deposit entry
- Type: `fund-entry-rule`
- Owner feature: `customer`
- Lifecycle: `published`
- Version: `1.0.0`
- Blocking mode: `runtime-bound`
- Created by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`
- Updated by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`

Source contracts:
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `features/customer.md`
- `ai/registry/idempotency-registry.json`

Owned files:
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/views/customer/index.vue`

Tests:
- `tests/customer-risk-gate.test.js`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundServiceTest.java`

Immutable fields:
- `CUSTOMER_DEPOSIT only`
- `DEPOSIT_IN only`
- `PUBLIC customer fund mutation remains blocked`
- `idempotentKey required for deposit entry`

**Change policy**

```json
{
  "mode": "governance-and-runtime-review",
  "requires": [
    "rule:preflight",
    "impact expansion",
    "customer contract update",
    "runtime and idempotency test evidence"
  ]
}
```

**Delete policy**

```json
{
  "allowed": false,
  "reason": "Deposit entry is the current customer fund baseline and cannot be removed without a replacement rule object."
}
```

**Snapshot policy**

```json
{
  "strategy": "fund-flow-ledger",
  "evidence": "Every accepted mutation must write customer_fund_flow and preserve idempotency replay evidence."
}
```

Supersedes:
- none

Superseded by:
- none

Notes: R-09A registers the existing customer deposit entry rule without changing runtime behavior.
### customer-sample-rebate-generation

- Name: Customer sample rebate generation
- Type: `fund-entry-rule`
- Owner feature: `customer`
- Lifecycle: `published`
- Version: `1.0.0`
- Blocking mode: `runtime-bound`
- Created by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`
- Updated by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`

Source contracts:
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `features/customer.md`
- `ai/registry/idempotency-registry.json`

Owned files:
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/views/customer/index.vue`

Tests:
- `tests/customer-risk-gate.test.js`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerServiceTest.java`

Immutable fields:
- `SAMPLE_REBATE remains separate from CUSTOMER_DEPOSIT`
- `sample_rebate_record is created before SAMPLE_REBATE_GENERATE fund flow`
- `idempotentKey required for sample rebate generation`

**Change policy**

```json
{
  "mode": "governance-and-runtime-review",
  "requires": [
    "rule:preflight",
    "customer API and DB contract update",
    "sample rebate runtime test evidence"
  ]
}
```

**Delete policy**

```json
{
  "allowed": false,
  "reason": "Sample rebate is an active customer fund rule and needs an explicit replacement before removal."
}
```

**Snapshot policy**

```json
{
  "strategy": "rebate-record-before-flow",
  "evidence": "sample_rebate_record and customer_fund_flow must preserve the generation event."
}
```

Supersedes:
- none

Superseded by:
- none

Notes: R-09A registers the existing sample rebate rule without changing runtime behavior.
### public-customer-invariant

- Name: Public customer invariant
- Type: `data-invariant`
- Owner feature: `customer`
- Lifecycle: `published`
- Version: `1.0.0`
- Blocking mode: `blocking`
- Created by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`
- Updated by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`

Source contracts:
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `features/customer.md`
- `sql/validation/customer_runtime_validation.sql`

Owned files:
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `sql/migrations/V20260625_002_customer_seed_public_customer.sql`
- `sql/validation/customer_runtime_validation.sql`

Tests:
- `tests/customer-risk-gate.test.js`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerServiceTest.java`

Immutable fields:
- `PUBLIC customers cannot be manually created`
- `PUBLIC fixed seed rows cannot be edited, disabled, deleted, or owner-transferred`
- `public_channel uniqueness is preserved`

**Change policy**

```json
{
  "mode": "rule-change-required",
  "requires": [
    "rule:preflight",
    "runtime invariant evidence",
    "customer contract update"
  ]
}
```

**Delete policy**

```json
{
  "allowed": false,
  "reason": "Public customer invariant protects built-in channel classification and cannot be removed silently."
}
```

**Snapshot policy**

```json
{
  "strategy": "seed-and-validation-sql",
  "evidence": "Seed SQL and validation SQL must stay aligned with runtime service rules."
}
```

Supersedes:
- none

Superseded by:
- none

Notes: R-09A registers the existing PUBLIC invariant without changing customer runtime behavior.
### before-sales-order-phase-gate

- Name: Before sales-order phase gate
- Type: `phase-gate`
- Owner feature: `platform`
- Lifecycle: `published`
- Version: `1.0.0`
- Blocking mode: `blocking`
- Created by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`
- Updated by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`

Source contracts:
- `AGENTS.md`
- `ai/contracts/rule-change-governance.md`
- `ai/roadmap/phase-gates.json`
- `ai/roadmap/enhancement-backlog.json`
- `ai/roadmap/refactor-debt.json`

Owned files:
- `tools/phase-gate-checker.js`
- `ai/roadmap/phase-gates.json`
- `ai/roadmap/enhancement-backlog.json`
- `ai/roadmap/refactor-debt.json`

Tests:
- `tests/governance-sales-order-handoff-gate.test.js`
- `tests/rule-object-governance.test.js`

Immutable fields:
- `beforeSalesOrder remains blocked until required items are complete`
- `sales-order runtime paths are blocked before the gate is complete`
- `no parallel check:sales-order-gate script`

**Change policy**

```json
{
  "mode": "governance-rule-change",
  "requires": [
    "rule:preflight",
    "phase-gate checker test evidence",
    "no sales-order runtime artifact"
  ]
}
```

**Delete policy**

```json
{
  "allowed": false,
  "reason": "The sales-order pre-implementation gate is required before any sales-order runtime work."
}
```

**Snapshot policy**

```json
{
  "strategy": "gate-state-and-backlog",
  "evidence": "phase-gates, enhancement backlog, refactor debt, and current context must preserve blocked gate state."
}
```

Supersedes:
- none

Superseded by:
- none

Notes: R-09A strengthens the existing phase-gate checker and keeps beforeSalesOrder blocked.
