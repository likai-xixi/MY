# Plan

Mode: `governance/rule-change`
Feature: `platform`

## Confirmed Context

1. Current repository is RuoYi + Vue3 + Codex Auto Dev OS.
2. `ai/project-profile.json` is locked and adapter is `ruoyi`.
3. Current active business feature context is `customer` from the registry and resume report; `resume` prints `Active feature: not declared` but lists `customer [active]`.
4. This change is `governance/rule-change`, not a customer business iteration.
5. This change forbids sales-order implementation and customer business-code edits.

## Execution Steps

1. Complete this governance change record before other edits.
2. Register a rule proposal through the existing `npm run rule:propose` mechanism.
3. Add roadmap, phase-gate, refactor-debt, and current-context artifacts for sales-order-before handoff.
4. Add real checker scripts for review, doc size, context pack, read budget, file weight, roadmap, phase gate, and refactor debt.
5. Add `context:build` and `review:feature` scripts.
6. Wire the new scripts into `package.json` and `npm run check` without removing existing gates.
7. Update `AGENTS.md`, `README.md`, memory files, and the session note with governance-only rules.
8. Add tests covering the new scripts, gates, and AGENTS wording.
9. Run required verification and record exact results in `verification.md`.
10. Confirm no forbidden customer or sales-order implementation paths changed before final reporting.

## Verification Plan

- `npm run resume`
- `npm run scan:all`
- `npm run context:build -- customer`
- `npm run finalize:change -- --summary "新增销售订单前治理接手机制"`
- `npm run check`
- `npm test`
- `git diff --check`

## Scope Guard

Allowed edits are restricted to governance docs, roadmap/context artifacts, scripts, tools, tests, change records, rule proposals, and memory handoff files. The change must not touch customer business paths, sales-order implementation paths, or database business table structure.
